import crypto from "node:crypto";

const TRUSTED_DEVICE_SECRET =
	process.env.BETTER_AUTH_SECRET || "evaluna_trusted_device_signing_secret";

/**
 * Creates a cryptographically signed 24-hour device trust token.
 */
export function createTrustedDeviceToken(userId: string): string {
	const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
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
