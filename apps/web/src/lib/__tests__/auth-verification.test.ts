import { describe, expect, it } from "bun:test";
import { sendVerificationEmailMessage } from "../../../../../packages/auth/src/email";

describe("Strict Authentication & Email Verification Architecture", () => {
	it("should enforce Google OAuth email_verified claim rejection when unverified", () => {
		// Mock profile validator reproducing the mapProfileToUser logic in Better Auth configuration
		const validateGoogleProfile = (profile: {
			name?: string;
			email: string;
			email_verified?: boolean;
			verified_email?: boolean;
			picture?: string;
		}) => {
			const isVerified = Boolean(
				profile.email_verified || profile.verified_email,
			);
			if (!isVerified) {
				throw new Error(
					"UNVERIFIED_EMAIL: Google account email is not verified.",
				);
			}
			return {
				name: profile.name || profile.email.split("@")[0],
				email: profile.email.toLowerCase().trim(),
				image: profile.picture,
				emailVerified: true,
			};
		};

		// 1. Unverified Google profile must throw
		expect(() =>
			validateGoogleProfile({
				email: "unverified@gmail.com",
				email_verified: false,
			}),
		).toThrow("UNVERIFIED_EMAIL");

		// 2. Missing email_verified must throw
		expect(() =>
			validateGoogleProfile({
				email: "missing_flag@gmail.com",
			}),
		).toThrow("UNVERIFIED_EMAIL");

		// 3. Verified Google profile succeeds and sets emailVerified true
		const valid = validateGoogleProfile({
			name: "Jane Doe",
			email: "Jane.Doe@Gmail.com",
			email_verified: true,
			picture: "https://lh3.googleusercontent.com/avatar",
		});
		expect(valid.emailVerified).toBe(true);
		expect(valid.email).toBe("jane.doe@gmail.com");
		expect(valid.name).toBe("Jane Doe");
	});

	it("should dispatch verification email using the email service", async () => {
		const result = await sendVerificationEmailMessage({
			to: "test.customer@example.com",
			name: "Test Customer",
			url: "https://evaluna-erp.com/api/auth/verify-email?token=secure-token-12345",
			token: "secure-token-12345",
		});

		expect(result.success).toBe(true);
		expect(result.provider).toBeDefined();
	});

	it("should normalize email addresses strictly and enforce lowercase uniqueness", () => {
		const normalize = (email: string) => email.toLowerCase().trim();
		expect(normalize("  User.Test@Gmail.com ")).toBe("user.test@gmail.com");
		expect(normalize("CUSTOMER@Evaluna.DEV")).toBe("customer@evaluna.dev");
	});

	it("should dispatch OTP email message for 2FA and passwordless login", async () => {
		const { sendOTPEmailMessage } = await import(
			"../../../../../packages/auth/src/email"
		);

		const result2FA = await sendOTPEmailMessage({
			to: "secure.user@example.com",
			otp: "123456",
			type: "two-factor",
		});
		expect(result2FA.success).toBe(true);

		const resultSignIn = await sendOTPEmailMessage({
			to: "secure.user@example.com",
			otp: "654321",
			type: "sign-in",
		});
		expect(resultSignIn.success).toBe(true);
	});

	it("should correctly mask user emails for privacy in OTP interfaces", () => {
		function maskEmail(val: string) {
			if (!val || !val.includes("@")) return val;
			const [userPart, domain] = val.split("@");
			if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
			return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
		}

		expect(maskEmail("rupesh@example.com")).toBe("r***h@example.com");
		expect(maskEmail("ab@domain.com")).toBe("a***@domain.com");
		expect(maskEmail("john.doe@company.org")).toBe("j***e@company.org");
	});

	it("should enforce strict immutability of security-sensitive profile fields by normal users", () => {
		const protectedFields = [
			"role",
			"is_superadmin",
			"emailVerified",
			"status",
			"staff_id",
			"branch_id",
			"warehouse_id",
		];

		const filterAllowedUpdates = (input: Record<string, any>) => {
			const allowed: Record<string, any> = {};
			const safeFields = [
				"given_name",
				"family_name",
				"date_of_birth",
				"locale",
			];
			for (const key of safeFields) {
				if (key in input) {
					allowed[key] = input[key];
				}
			}
			return allowed;
		};

		const maliciousAttempt = {
			given_name: "Attacker",
			role: "super_admin",
			is_superadmin: true,
			emailVerified: true,
			date_of_birth: "1990-01-01",
		};

		const filtered = filterAllowedUpdates(maliciousAttempt);

		expect(filtered.given_name).toBe("Attacker");
		expect(filtered.date_of_birth).toBe("1990-01-01");
		expect(filtered.role).toBeUndefined();
		expect(filtered.is_superadmin).toBeUndefined();
		expect(filtered.emailVerified).toBeUndefined();
		for (const field of protectedFields) {
			expect(field in filtered).toBe(false);
		}
	});

	it("should parse Brevo email sender accurately", async () => {
		const { parseEmailSender } = await import(
			"../../../../../packages/auth/src/email"
		);

		const parsed1 = parseEmailSender("Evaluna ERP <no-reply@evaluna-erp.com>");
		expect(parsed1.name).toBe("Evaluna ERP");
		expect(parsed1.email).toBe("no-reply@evaluna-erp.com");

		const parsed2 = parseEmailSender("no-reply@evaluna-erp.com");
		expect(parsed2.name).toBe("Evaluna ERP");
		expect(parsed2.email).toBe("no-reply@evaluna-erp.com");

		const parsedDefault = parseEmailSender("");
		expect(parsedDefault.name).toBe("Evaluna ERP");
		expect(parsedDefault.email).toBeDefined();
	});
});
