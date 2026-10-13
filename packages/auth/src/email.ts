export interface SendVerificationEmailParams {
	to: string;
	name?: string;
	url: string;
	token: string;
}

export async function sendVerificationEmailMessage({
	to,
	name,
	url,
	token,
}: SendVerificationEmailParams): Promise<{
	success: boolean;
	provider: string;
	url?: string;
}> {
	const recipientName = name || "Valued User";
	const normalizedEmail = to.toLowerCase().trim();

	// 1. If RESEND_API_KEY is configured, dispatch genuine email
	if (process.env.RESEND_API_KEY) {
		try {
			const res = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from: process.env.EMAIL_FROM || "Evaluna ERP <auth@evaluna-erp.com>",
					to: [normalizedEmail],
					subject: "Verify your email address - Evaluna ERP",
					html: `
						<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
							<div style="text-align: center; margin-bottom: 24px;">
								<h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Evaluna ERP</h1>
								<p style="font-size: 13px; color: #64748b; margin-top: 4px;">Enterprise Resource Planning</p>
							</div>
							<h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 24px;">Verify your email address</h2>
							<p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello ${recipientName},</p>
							<p style="font-size: 14px; line-height: 1.6; color: #334155;">Thank you for registering with Evaluna ERP. To secure your account and access the platform, please verify your email address by clicking the button below:</p>
							<div style="text-align: center; margin: 28px 0;">
								<a href="${url}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Verify Email Address</a>
							</div>
							<p style="font-size: 13px; line-height: 1.5; color: #64748b;">Or paste this link into your browser:<br/><a href="${url}" style="color: #2563eb; word-break: break-all;">${url}</a></p>
							<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
								<p style="margin: 0;">This verification link will expire in 24 hours. If you did not create an account, you can safely disregard this email.</p>
							</div>
						</div>
					`,
				}),
			});

			if (res.ok) {
				console.log(
					`[Email Service] Verification email dispatched to ${normalizedEmail} via Resend.`,
				);
				return { success: true, provider: "resend" };
			}
			const errText = await res.text();
			console.warn(
				`[Email Service] Resend API responded with error: ${errText}`,
			);
		} catch (err) {
			console.error("[Email Service] Resend dispatch exception:", err);
		}
	}

	// 2. Safe development / fallback logging
	console.log(
		"===============================================================================",
	);
	console.log("[EVALUNA AUTH] VERIFICATION EMAIL GENERATED");
	console.log("Recipient:", normalizedEmail);
	console.log("Recipient Name:", recipientName);
	console.log("Verification Link:", url);
	console.log("Token:", token);
	console.log("Expires: 24 Hours");
	console.log(
		"Note: Set RESEND_API_KEY in environment to dispatch real external emails.",
	);
	console.log(
		"===============================================================================",
	);

	return { success: true, provider: "logger", url };
}

export interface SendOTPEmailParams {
	to: string;
	otp: string;
	type?: "sign-in" | "two-factor" | "email-verification" | string;
	name?: string;
}

export async function sendOTPEmailMessage({
	to,
	otp,
	type = "sign-in",
	name,
}: SendOTPEmailParams): Promise<{
	success: boolean;
	provider: string;
}> {
	const recipientName = name || "Valued User";
	const normalizedEmail = to.toLowerCase().trim();

	const is2FA = type === "two-factor";
	const isSignIn = type === "sign-in";
	const subject = is2FA
		? `${otp} is your two-factor verification code - Evaluna ERP`
		: isSignIn
			? `${otp} is your one-time login code - Evaluna ERP`
			: `${otp} is your verification code - Evaluna ERP`;

	const purposeLabel = is2FA
		? "Two-Factor Authentication (2FA)"
		: isSignIn
			? "Passwordless Email Login"
			: "Email Verification";

	// 1. If RESEND_API_KEY is configured, dispatch genuine email
	if (process.env.RESEND_API_KEY) {
		try {
			const res = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from: process.env.EMAIL_FROM || "Evaluna ERP <auth@evaluna-erp.com>",
					to: [normalizedEmail],
					subject,
					html: `
						<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
							<div style="text-align: center; margin-bottom: 24px;">
								<h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Evaluna ERP</h1>
								<p style="font-size: 13px; color: #64748b; margin-top: 4px;">Enterprise Security System</p>
							</div>
							<h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 24px;">${purposeLabel}</h2>
							<p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello ${recipientName},</p>
							<p style="font-size: 14px; line-height: 1.6; color: #334155;">Use the one-time code below to complete your authentication request:</p>
							<div style="text-align: center; margin: 28px 0;">
								<div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 16px 36px;">
									<span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${otp}</span>
								</div>
							</div>
							<p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">This code will expire in <strong>5 minutes</strong>. It is single-use only.</p>
							<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
								<p style="margin: 0;">If you did not initiate this request, someone may be attempting to access your account. Please change your password and notify your system administrator immediately.</p>
							</div>
						</div>
					`,
				}),
			});

			if (res.ok) {
				console.log(
					`[Email Service] ${purposeLabel} OTP dispatched to ${normalizedEmail} via Resend.`,
				);
				return { success: true, provider: "resend" };
			}
			const errText = await res.text();
			console.warn(
				`[Email Service] Resend API responded with error: ${errText}`,
			);
		} catch (err) {
			console.error("[Email Service] Resend OTP dispatch exception:", err);
		}
	}

	// 2. Safe development / fallback logging
	console.log(
		"===============================================================================",
	);
	console.log(`[EVALUNA AUTH] ${purposeLabel.toUpperCase()} OTP GENERATED`);
	console.log("Recipient:", normalizedEmail);
	console.log("Recipient Name:", recipientName);
	console.log("One-Time Password (OTP):", otp);
	console.log("Purpose:", purposeLabel);
	console.log("Expires: 5 Minutes (300 seconds)");
	console.log(
		"Note: Set RESEND_API_KEY in environment to dispatch real external emails.",
	);
	console.log(
		"===============================================================================",
	);

	return { success: true, provider: "logger" };
}
