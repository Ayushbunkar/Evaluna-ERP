import nodemailer from "nodemailer";

export interface SendVerificationEmailParams {
	to: string;
	name?: string;
	url: string;
	token: string;
}

export interface SendOTPEmailParams {
	to: string;
	otp: string;
	type?: "sign-in" | "two-factor" | "email-verification" | string;
	name?: string;
}

export interface SendBrevoEmailParams {
	to: string;
	name?: string;
	subject: string;
	html: string;
	text?: string;
	priority?: "high" | "normal" | "low";
	senderName?: string;
	senderEmail?: string;
}

/**
 * Cached nodemailer transporter for Brevo SMTP.
 */
let cachedTransporter: nodemailer.Transporter | null = null;

function getSmtpTransporter(): nodemailer.Transporter | null {
	if (cachedTransporter) return cachedTransporter;

	const host =
		process.env.BREVO_SMTP_HOST ||
		process.env.SMTP_HOST ||
		"smtp-relay.brevo.com";
	const port = Number(
		process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587,
	);
	const user =
		process.env.BREVO_SMTP_USER ||
		process.env.SMTP_USER ||
		"be16e8001@smtp-brevo.com";
	const pass =
		process.env.BREVO_SMTP_KEY ||
		process.env.BREVO_SMTP_PASS ||
		process.env.SMTP_PASS ||
		process.env.SMTP_PASSWORD ||
		(process.env.BREVO_API_KEY?.startsWith("xsmtpsib-")
			? process.env.BREVO_API_KEY
			: undefined);

	if (!pass) return null;

	cachedTransporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: {
			user,
			pass,
		},
	});

	return cachedTransporter;
}

/**
 * Parses email sender strings like:
 * - "Evaluna <rahul.singh151893@gmail.com>"
 * - "rahul.singh151893@gmail.com"
 * Falls back to BREVO_SENDER_NAME / BREVO_SENDER_EMAIL or verified defaults.
 */
export function parseEmailSender(fromStr?: string): {
	name: string;
	email: string;
} {
	const fallbackEmail =
		process.env.BREVO_SENDER_EMAIL || "rahul.singh151893@gmail.com";
	const fallbackName = process.env.BREVO_SENDER_NAME || "Evaluna";

	if (!fromStr?.trim()) {
		return { name: fallbackName, email: fallbackEmail };
	}

	const trimmed = fromStr.trim();
	const angleMatch = trimmed.match(/^(.*?)\s*<([^>]+)>\s*$/);
	if (angleMatch) {
		const rawName = angleMatch[1]?.replace(/^["']|["']$/g, "").trim();
		const rawEmail = angleMatch[2]?.trim();
		return {
			name: rawName || fallbackName,
			email: rawEmail || fallbackEmail,
		};
	}

	return {
		name: fallbackName,
		email: trimmed.replace(/^["']|["']$/g, "").trim(),
	};
}

/**
 * Dispatches an email via Brevo SMTP Relay (Nodemailer) or Brevo v3 Transactional REST API.
 * High deliverability, supports Brevo SMTP relay (smtp-relay.brevo.com:587) and REST API.
 */
export async function sendBrevoEmail({
	to,
	name,
	subject,
	html,
	text,
	priority = "high",
	senderName,
	senderEmail,
}: SendBrevoEmailParams): Promise<{
	success: boolean;
	messageId?: string;
	error?: string;
}> {
	const defaultSender = parseEmailSender(process.env.EMAIL_FROM);
	const sender = {
		name: senderName || defaultSender.name,
		email: senderEmail || defaultSender.email,
	};
	const normalizedTo = to.toLowerCase().trim();
	const plainText =
		text ||
		html
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim();

	// 1. Try Brevo SMTP Relay (Nodemailer) if SMTP credentials or xsmtpsib- key present
	const transporter = getSmtpTransporter();
	if (transporter) {
		try {
			const info = await transporter.sendMail({
				from: `"${sender.name}" <${sender.email}>`,
				to: name ? `"${name}" <${normalizedTo}>` : normalizedTo,
				subject,
				text: plainText,
				html,
				priority: priority === "high" ? "high" : "normal",
				headers: {
					"X-Priority": priority === "high" ? "1 (Highest)" : "3 (Normal)",
					"X-MSMail-Priority": priority === "high" ? "High" : "Normal",
					Importance: priority === "high" ? "High" : "Normal",
					Priority: priority === "high" ? "urgent" : "normal",
					"X-Entity-Ref-ID": `evaluna-auth-${Date.now()}`,
				},
			});
			console.log(
				`[Brevo SMTP Service] Email dispatched to ${normalizedTo} (messageId: ${info.messageId || "ok"})`,
			);
			return { success: true, messageId: info.messageId };
		} catch (smtpErr: unknown) {
			const msg =
				smtpErr instanceof Error ? smtpErr.message : "SMTP send failed";
			console.error("[Brevo SMTP Service] Send error:", msg, smtpErr);
			// If SMTP fails, fall through to REST API if an API key is available
		}
	}

	// 2. Try Brevo REST API v3 (for xkeysib- API keys)
	const apiKey = process.env.BREVO_API_KEY;
	if (apiKey?.startsWith("xkeysib-")) {
		try {
			const res = await fetch("https://api.brevo.com/v3/smtp/email", {
				method: "POST",
				headers: {
					accept: "application/json",
					"api-key": apiKey,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					sender,
					to: [
						{
							email: normalizedTo,
							name: name || undefined,
						},
					],
					subject,
					htmlContent: html,
					textContent: plainText,
					headers: {
						"X-Priority": priority === "high" ? "1" : "3",
						"X-MSMail-Priority": priority === "high" ? "High" : "Normal",
						Importance: priority === "high" ? "High" : "Normal",
					},
				}),
			});

			if (res.ok) {
				const data = (await res.json().catch(() => ({}))) as {
					messageId?: string;
				};
				console.log(
					`[Brevo API Service] Email dispatched to ${normalizedTo} (messageId: ${data?.messageId || "ok"})`,
				);
				return { success: true, messageId: data?.messageId };
			}

			const errText = await res.text();
			console.error(
				`[Brevo API Service] API error (${res.status}): ${errText}`,
			);
			return { success: false, error: errText };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Unknown error";
			console.error("[Brevo API Service] Dispatch exception:", err);
			return { success: false, error: message };
		}
	}

	if (!transporter && !apiKey) {
		return { success: false, error: "BREVO_CREDENTIALS_NOT_CONFIGURED" };
	}

	return { success: false, error: "Failed to dispatch email via Brevo" };
}

/**
 * Sends an email verification link to a user.
 */
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

	const html = `
		<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
			<div style="text-align: center; margin-bottom: 24px;">
				<h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Evaluna</h1>
				<p style="font-size: 13px; color: #64748b; margin-top: 4px;">Enterprise Resource Planning</p>
			</div>
			<h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 24px;">Verify your email address</h2>
			<p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello ${recipientName},</p>
			<p style="font-size: 14px; line-height: 1.6; color: #334155;">Thank you for registering with Evaluna. To secure your account and access the platform, please verify your email address by clicking the button below:</p>
			<div style="text-align: center; margin: 28px 0;">
				<a href="${url}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Verify Email Address</a>
			</div>
			<p style="font-size: 13px; line-height: 1.5; color: #64748b;">Or paste this link into your browser:<br/><a href="${url}" style="color: #2563eb; word-break: break-all;">${url}</a></p>
			<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
				<p style="margin: 0;">This verification link will expire in 24 hours. If you did not create an account, you can safely disregard this email.</p>
			</div>
		</div>
	`;

	const plainText = `Hello ${recipientName},\n\nThank you for registering with Evaluna.\nPlease verify your email address by visiting this link:\n${url}\n\nThis verification link expires in 24 hours.\n\nEvaluna`;

	const isConfigured = Boolean(
		process.env.BREVO_SMTP_KEY ||
			process.env.BREVO_SMTP_PASS ||
			process.env.BREVO_API_KEY ||
			process.env.SMTP_PASS ||
			process.env.SMTP_PASSWORD,
	);

	// 1. If Brevo credentials are configured, dispatch genuine email
	if (isConfigured) {
		const result = await sendBrevoEmail({
			to: normalizedEmail,
			name: recipientName,
			subject: "Verify your email address - Evaluna",
			html,
			text: plainText,
			priority: "high",
		});

		if (result.success) {
			console.log(
				`[Email Service] Verification email dispatched to ${normalizedEmail} via Brevo.`,
			);
			return { success: true, provider: "brevo" };
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
		"Note: Set BREVO_SMTP_KEY or BREVO_API_KEY in environment to dispatch real external emails via Brevo.",
	);
	console.log(
		"===============================================================================",
	);

	return { success: true, provider: "logger", url };
}

/**
 * Sends a one-time passcode (OTP) email for 2FA, passwordless login, or email verification.
 */
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
		? `${otp} is your two-factor verification code - Evaluna`
		: isSignIn
			? `${otp} is your one-time login code - Evaluna`
			: `${otp} is your verification code - Evaluna`;

	const purposeLabel = is2FA
		? "Two-Factor Authentication (2FA)"
		: isSignIn
			? "Passwordless Email Login"
			: "Email Verification";

	const html = `
		<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
			<div style="text-align: center; margin-bottom: 24px;">
				<h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Evaluna</h1>
				<p style="font-size: 13px; color: #64748b; margin-top: 4px;">Security System</p>
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
	`;

	const plainText = `Your Evaluna security code is: ${otp}\n\nUse this one-time code to complete your ${purposeLabel} request. This code will expire in 5 minutes.\n\nEvaluna Security`;

	const isConfigured = Boolean(
		process.env.BREVO_SMTP_KEY ||
			process.env.BREVO_SMTP_PASS ||
			process.env.BREVO_API_KEY ||
			process.env.SMTP_PASS ||
			process.env.SMTP_PASSWORD,
	);

	// 1. If Brevo credentials are configured, dispatch genuine email
	if (isConfigured) {
		const result = await sendBrevoEmail({
			to: normalizedEmail,
			name: recipientName,
			subject,
			html,
			text: plainText,
			priority: "high",
		});

		if (result.success) {
			console.log(
				`[Email Service] ${purposeLabel} OTP dispatched to ${normalizedEmail} via Brevo.`,
			);
			return { success: true, provider: "brevo" };
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
		"Note: Set BREVO_SMTP_KEY or BREVO_API_KEY in environment to dispatch real external emails via Brevo.",
	);
	console.log(
		"===============================================================================",
	);

	return { success: true, provider: "logger" };
}
