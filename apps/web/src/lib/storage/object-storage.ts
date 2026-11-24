import { createHash, createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageUploadResult {
	storagePath: string;
	publicUrl: string;
	size: number;
	mimeType: string;
	driver: "s3_r2" | "local_disk";
}

export interface StorageConfig {
	bucketName?: string;
	endpoint?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	region?: string;
	publicBaseUrl?: string;
}

function getS3Config(): StorageConfig | null {
	const bucket =
		process.env.R2_BUCKET_NAME ||
		process.env.S3_BUCKET_NAME ||
		process.env.S3_BUCKET;
	const endpoint =
		process.env.R2_ENDPOINT ||
		process.env.S3_ENDPOINT;
	const accessKeyId =
		process.env.R2_ACCESS_KEY_ID ||
		process.env.S3_ACCESS_KEY_ID ||
		process.env.AWS_ACCESS_KEY_ID;
	const secretAccessKey =
		process.env.R2_SECRET_ACCESS_KEY ||
		process.env.S3_SECRET_ACCESS_KEY ||
		process.env.AWS_SECRET_ACCESS_KEY;
	const publicBaseUrl =
		process.env.R2_PUBLIC_URL ||
		process.env.S3_PUBLIC_URL ||
		process.env.NEXT_PUBLIC_CDN_URL;

	if (bucket && accessKeyId && secretAccessKey) {
		return {
			bucketName: bucket,
			endpoint: endpoint || `https://${bucket}.s3.amazonaws.com`,
			accessKeyId,
			secretAccessKey,
			region: process.env.AWS_REGION || "auto",
			publicBaseUrl: publicBaseUrl?.replace(/\/$/, ""),
		};
	}
	return null;
}

/**
 * Standard AWS Signature Version 4 signer for S3 / Cloudflare R2 REST PUT.
 * Requires 0 external npm dependencies, works natively in Node.js and Bun.
 */
function signAwsV4(
	method: string,
	url: URL,
	headers: Record<string, string>,
	payloadHash: string,
	cfg: StorageConfig,
	dateIso: string,
	dateStamp: string,
): string {
	const region = cfg.region || "auto";
	const service = "s3";

	// 1. Canonical Headers
	const sortedHeaderKeys = Object.keys(headers)
		.map((k) => k.toLowerCase())
		.sort();
	const canonicalHeaders =
		sortedHeaderKeys
			.map((k) => `${k}:${headers[k].trim()}\n`)
			.join("");
	const signedHeaders = sortedHeaderKeys.join(";");

	// 2. Canonical Request
	const canonicalRequest = [
		method,
		url.pathname,
		url.search ? url.search.slice(1) : "",
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join("\n");

	// 3. String to Sign
	const algorithm = "AWS4-HMAC-SHA256";
	const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
	const hashedCanonicalRequest = createHash("sha256")
		.update(canonicalRequest, "utf8")
		.digest("hex");
	const stringToSign = [
		algorithm,
		dateIso,
		credentialScope,
		hashedCanonicalRequest,
	].join("\n");

	// 4. Calculate Signature
	function hmac(key: Buffer | string, data: string): Buffer {
		return createHmac("sha256", key).update(data, "utf8").digest();
	}

	const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp);
	const kRegion = hmac(kDate, region);
	const kService = hmac(kRegion, service);
	const kSigning = hmac(kService, "aws4_request");
	const signature = createHmac("sha256", kSigning)
		.update(stringToSign, "utf8")
		.digest("hex");

	return `${algorithm} Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

/**
 * Uploads a binary buffer to Cloudflare R2 / AWS S3 using REST API.
 */
async function uploadToS3(
	key: string,
	buffer: Buffer,
	mimeType: string,
	cfg: StorageConfig,
): Promise<StorageUploadResult> {
	const rawEndpoint = cfg.endpoint?.replace(/\/$/, "") || `https://${cfg.bucketName}.s3.amazonaws.com`;
	const endpointUrl = new URL(rawEndpoint);

	// In Cloudflare R2, path format is: https://<account_id>.r2.cloudflarestorage.com/<bucket>/<key>
	let fullPath = `/${cfg.bucketName}/${key.replace(/^\//, "")}`;
	if (endpointUrl.hostname.includes(cfg.bucketName || "")) {
		fullPath = `/${key.replace(/^\//, "")}`;
	}

	const uploadUrl = new URL(fullPath, endpointUrl.origin);
	const now = new Date();
	const dateIso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
	const dateStamp = dateIso.slice(0, 8);
	const payloadHash = createHash("sha256").update(buffer).digest("hex");

	const headers: Record<string, string> = {
		host: uploadUrl.host,
		"content-type": mimeType,
		"content-length": String(buffer.length),
		"x-amz-date": dateIso,
		"x-amz-content-sha256": payloadHash,
		"cache-control": "public, max-age=31536000, immutable",
	};

	const authorization = signAwsV4("PUT", uploadUrl, headers, payloadHash, cfg, dateIso, dateStamp);
	headers.authorization = authorization;

	const res = await fetch(uploadUrl.toString(), {
		method: "PUT",
		headers,
		body: buffer,
	});

	if (!res.ok) {
		const errText = await res.text().catch(() => "");
		throw new Error(`S3/R2 upload failed (${res.status}): ${errText.slice(0, 200)}`);
	}

	const publicUrl = cfg.publicBaseUrl
		? `${cfg.publicBaseUrl}/${key.replace(/^\//, "")}`
		: uploadUrl.toString();

	return {
		storagePath: key,
		publicUrl,
		size: buffer.length,
		mimeType,
		driver: "s3_r2",
	};
}

/**
 * Universal Object Storage Handler:
 * 1. Checks if Cloudflare R2 / AWS S3 credentials are provided in .env -> uploads to S3/R2 directly.
 * 2. If not, safely writes to local disk under the designated root directory.
 */
export async function storeImageBinary(
	key: string,
	buffer: Buffer,
	mimeType: string,
	localRoot: string,
): Promise<StorageUploadResult> {
	const s3Config = getS3Config();

	// Priority 1: Object Storage (R2 / S3 / Supabase)
	if (s3Config) {
		try {
			return await uploadToS3(key, buffer, mimeType, s3Config);
		} catch (s3Err) {
			console.warn("[storage] S3/R2 upload error, falling back to local disk:", s3Err);
		}
	}

	// Priority 2: Local Disk
	const absDir = path.dirname(path.join(localRoot, key));
	await mkdir(absDir, { recursive: true });
	const absFile = path.join(localRoot, key);
	await writeFile(absFile, buffer);

	return {
		storagePath: key,
		publicUrl: `/api/products/images/${encodeURIComponent(key)}`,
		size: buffer.length,
		mimeType,
		driver: "local_disk",
	};
}
