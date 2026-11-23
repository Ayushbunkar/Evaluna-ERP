import crypto from "node:crypto";

const TRUSTED_DEVICE_SECRET =
	process.env.BETTER_AUTH_SECRET || "evaluna_trusted_device_signing_secret";

export const TRUSTED_DEVICE_COOKIE_NAME = "evaluna_trusted_device";
export const TRUST_DURATION_DAYS = 3; // 3 Days trust duration
export const TRUST_DURATION_SECONDS = 3 * 24 * 60 * 60; // 259,200 seconds

/**
 * Creates a cryptographically signed device trust token.
 * Defaults to 3 days (72 hours).
 */
export function createTrustedDeviceToken(
	userId: string,
	days: number = TRUST_DURATION_DAYS,
): string {
	const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
	const payload = `${userId}:${expiresAt}`;
	const signature = crypto
		.createHmac("sha256", TRUSTED_DEVICE_SECRET)
		.update(payload)
		.digest("hex");
	return `${payload}:${signature}`;
}

/**
 * Verifies that the provided device token is authentic, untampered, and unexpired.
 */
export function verifyTrustedDeviceToken(
	token: string | undefined,
	userId: string,
): boolean {
	if (!token) return false;
	const parts = token.split(":");
	if (parts.length !== 3) return false;
	const [tokenUserId, tokenExpiryStr, signature] = parts;
	if (tokenUserId !== userId) return false;
	const expiry = Number(tokenExpiryStr);
	if (Number.isNaN(expiry) || Date.now() > expiry) return false;
	const expected = crypto
		.createHmac("sha256", TRUSTED_DEVICE_SECRET)
		.update(`${tokenUserId}:${tokenExpiryStr}`)
		.digest("hex");
	return signature === expected;
}

/**
 * Creates a cryptographically signed 2FA session token bound strictly to this user.
 */
export function create2FAToken(userId: string): string {
	const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
	const payload = `2fa:${userId}:${expiresAt}`;
	const signature = crypto
		.createHmac("sha256", TRUSTED_DEVICE_SECRET)
		.update(payload)
		.digest("hex");
	return `${payload}:${signature}`;
}

/**
 * Verifies that a 2FA verified token belongs to the given user and is untampered.
 */
export function verify2FAToken(
	token: string | undefined,
	userId: string,
): boolean {
	if (!token) return false;
	const parts = token.split(":");
	if (parts.length !== 4 || parts[0] !== "2fa") return false;
	const [, tokenUserId, tokenExpiryStr, signature] = parts;
	if (tokenUserId !== userId) return false;
	const expiry = Number(tokenExpiryStr);
	if (Number.isNaN(expiry) || Date.now() > expiry) return false;
	const expected = crypto
		.createHmac("sha256", TRUSTED_DEVICE_SECRET)
		.update(`2fa:${tokenUserId}:${tokenExpiryStr}`)
		.digest("hex");
	return signature === expected;
}

/**
 * Determines whether cookies should have the Secure flag.
 * Ensures cookies are NOT marked Secure on localhost / HTTP where browsers drop them.
 */
export function shouldSecureCookie(headersList?: Headers | null): boolean {
	if (!headersList) {
		return process.env.NODE_ENV === "production";
	}
	const host = headersList.get("host") || "";
	const proto = headersList.get("x-forwarded-proto") || "";
	if (host.includes("localhost") || host.includes("127.0.0.1")) {
		return false;
	}
	return proto === "https" || (process.env.NODE_ENV === "production" && !host.includes(":"));
}

