import { describe, expect, it } from "bun:test";
import {
	createTrustedDeviceToken,
	TRUST_DURATION_DAYS,
	TRUST_DURATION_SECONDS,
	TRUSTED_DEVICE_COOKIE_NAME,
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
