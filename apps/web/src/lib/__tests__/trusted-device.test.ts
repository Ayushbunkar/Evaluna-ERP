import { describe, expect, it } from "bun:test";
import {
	create2FAToken,
	createTrustedDeviceToken,
	shouldSecureCookie,
	TRUST_DURATION_DAYS,
	TRUST_DURATION_SECONDS,
	TRUSTED_DEVICE_COOKIE_NAME,
	verify2FAToken,
	verifyTrustedDeviceToken,
} from "../trusted-device";

describe("Trusted Device Token System", () => {
	const userId = "usr_evaluna_test_12345";

	it("exports 3-day duration constants correctly", () => {
		expect(TRUST_DURATION_DAYS).toBe(3);
		expect(TRUST_DURATION_SECONDS).toBe(3 * 24 * 60 * 60);
		expect(TRUSTED_DEVICE_COOKIE_NAME).toBe("evaluna_trusted_device");
	});

	it("creates a signed token with default 3-day expiry", () => {
		const token = createTrustedDeviceToken(userId);
		expect(typeof token).toBe("string");

		const parts = token.split(":");
		expect(parts.length).toBe(3);
		expect(parts[0]).toBe(userId);

		const expiry = Number(parts[1]);
		const expectedMinExpiry = Date.now() + 3 * 24 * 60 * 60 * 1000 - 5000;
		const expectedMaxExpiry = Date.now() + 3 * 24 * 60 * 60 * 1000 + 5000;

		expect(expiry).toBeGreaterThan(expectedMinExpiry);
		expect(expiry).toBeLessThan(expectedMaxExpiry);
	});

	it("verifies a valid token successfully", () => {
		const token = createTrustedDeviceToken(userId);
		expect(verifyTrustedDeviceToken(token, userId)).toBe(true);
	});

	it("rejects token if userId does not match", () => {
		const token = createTrustedDeviceToken(userId);
		expect(verifyTrustedDeviceToken(token, "different_user_id")).toBe(false);
	});

	it("rejects expired token", () => {
		// Create a token expired 1 day ago (-1 day)
		const expiredToken = createTrustedDeviceToken(userId, -1);
		expect(verifyTrustedDeviceToken(expiredToken, userId)).toBe(false);
	});

	it("rejects tampered token signature", () => {
		const token = createTrustedDeviceToken(userId);
		const parts = token.split(":");
		const tamperedToken = `${parts[0]}:${parts[1]}:bad_tampered_signature_123`;
		expect(verifyTrustedDeviceToken(tamperedToken, userId)).toBe(false);
	});

	it("rejects malformed or undefined token gracefully", () => {
		expect(verifyTrustedDeviceToken(undefined, userId)).toBe(false);
		expect(verifyTrustedDeviceToken("", userId)).toBe(false);
		expect(verifyTrustedDeviceToken("invalid:token", userId)).toBe(false);
		expect(verifyTrustedDeviceToken("invalid:notanumber:sig", userId)).toBe(
			false,
		);
	});
});

describe("2FA Session Token System", () => {
	const userId = "usr_evaluna_test_67890";

	it("creates a cryptographically signed 2FA token prefixed with 2fa:", () => {
		const token = create2FAToken(userId);
		expect(typeof token).toBe("string");
		expect(token.startsWith(`2fa:${userId}:`)).toBe(true);
		const parts = token.split(":");
		expect(parts.length).toBe(4);
	});

	it("verifies a valid 2FA token successfully", () => {
		const token = create2FAToken(userId);
		expect(verify2FAToken(token, userId)).toBe(true);
	});

	it("rejects 2FA token when userId does not match", () => {
		const token = create2FAToken(userId);
		expect(verify2FAToken(token, "other_user_id")).toBe(false);
	});

	it("rejects tampered 2FA token", () => {
		const token = create2FAToken(userId);
		const parts = token.split(":");
		const tampered = `2fa:${parts[1]}:${parts[2]}:forgedsignature`;
		expect(verify2FAToken(tampered, userId)).toBe(false);
	});

	it("rejects legacy or raw string tokens like 'true'", () => {
		expect(verify2FAToken("true", userId)).toBe(false);
		expect(verify2FAToken(undefined, userId)).toBe(false);
		expect(verify2FAToken("", userId)).toBe(false);
	});
});

describe("shouldSecureCookie", () => {
	it("returns false for localhost and 127.0.0.1", () => {
		const localHeaders = new Headers({ host: "localhost:3000" });
		expect(shouldSecureCookie(localHeaders)).toBe(false);

		const ipHeaders = new Headers({ host: "127.0.0.1:3000" });
		expect(shouldSecureCookie(ipHeaders)).toBe(false);
	});

	it("returns true for https requests", () => {
		const httpsHeaders = new Headers({
			host: "evalunaerp.vercel.app",
			"x-forwarded-proto": "https",
		});
		expect(shouldSecureCookie(httpsHeaders)).toBe(true);
	});
});

