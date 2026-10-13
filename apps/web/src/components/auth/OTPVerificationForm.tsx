"use client";

import { Button } from "@evaluna/ui/components/button";
import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowLeft,
	Clock,
	KeyRound,
	Loader2,
	RotateCw,
	ShieldCheck,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface OTPVerificationFormProps {
	email: string;
	title?: string;
	subtitle?: string;
	type?: "2fa" | "sign-in";
	onVerify: (
		otp: string,
	) => Promise<{ success: boolean; error?: string; message?: string }>;
	onResend: () => Promise<{ success: boolean; error?: string }>;
	onBack: () => void;
	isPending?: boolean;
}

export function OTPVerificationForm({
	email,
	title = "Two-Factor Verification",
	subtitle = "Enter the 6-digit security code sent to your email.",
	type = "2fa",
	onVerify,
	onResend,
	onBack,
	isPending = false,
}: OTPVerificationFormProps) {
	const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(60);
	const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes
	const [resendSuccess, setResendSuccess] = useState(false);

	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Mask email: e.g. j***e@domain.com
	function maskEmail(val: string) {
		if (!val || !val.includes("@")) return val;
		const [userPart, domain] = val.split("@");
		if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
		return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
	}

	// 5-minute expiry countdown
	useEffect(() => {
		if (expirySeconds <= 0) return;
		const timer = setInterval(() => {
			setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [expirySeconds]);

	// 60-second resend cooldown
	useEffect(() => {
		if (resendCooldown <= 0) return;
		const timer = setInterval(() => {
			setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [resendCooldown]);

	// Auto-focus first input on mount
	useEffect(() => {
		inputRefs.current[0]?.focus();
	}, []);

	// Handle digit input change
	function handleChange(index: number, value: string) {
		if (error) setError(null);
		setResendSuccess(false);

		// Handle paste of full 6 digits
		if (value.length > 1) {
			const digits = value.replace(/\D/g, "").slice(0, 6).split("");
			if (digits.length > 0) {
				const nextOtp = [...otp];
				digits.forEach((d, i) => {
					if (i < 6) nextOtp[i] = d;
				});
				setOtp(nextOtp);
				const nextFocus = Math.min(digits.length, 5);
				inputRefs.current[nextFocus]?.focus();
				if (digits.length === 6) {
					submitCode(nextOtp.join(""));
				}
				return;
			}
		}

		// Single character entry
		const cleanChar = value.replace(/\D/g, "").slice(-1);
		const nextOtp = [...otp];
		nextOtp[index] = cleanChar;
		setOtp(nextOtp);

		if (cleanChar && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}

		// Auto-submit when all 6 digits are entered
		if (cleanChar && index === 5) {
			const fullCode = nextOtp.join("");
			if (fullCode.length === 6) {
				submitCode(fullCode);
			}
		}
	}

	// Handle backspace navigation
	function handleKeyDown(
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) {
		if (e.key === "Backspace") {
			if (!otp[index] && index > 0) {
				inputRefs.current[index - 1]?.focus();
			}
		}
	}

	// Paste handler on any input box
	function handlePaste(e: React.ClipboardEvent) {
		e.preventDefault();
		const pasteData = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, 6);
		if (!pasteData) return;

		const nextOtp = ["", "", "", "", "", ""];
		pasteData.split("").forEach((d, i) => {
			if (i < 6) nextOtp[i] = d;
		});
		setOtp(nextOtp);
		const nextFocus = Math.min(pasteData.length, 5);
		inputRefs.current[nextFocus]?.focus();

		if (pasteData.length === 6) {
			submitCode(pasteData);
		}
	}

	async function submitCode(code: string) {
		if (code.length !== 6 || isSubmitting || isPending) return;
		setIsSubmitting(true);
		setError(null);

		try {
			const res = await onVerify(code);
			if (!res.success) {
				setError(res.message || "Invalid or expired verification code.");
				setIsSubmitting(false);
			}
		} catch (err: any) {
			setError(err?.message || "An unexpected error occurred.");
			setIsSubmitting(false);
		}
	}

	async function handleResend() {
		if (resendCooldown > 0 || isResending) return;
		setIsResending(true);
		setError(null);
		setResendSuccess(false);

		try {
			const res = await onResend();
			if (res.success) {
				setResendSuccess(true);
				setResendCooldown(60);
				setExpirySeconds(300); // Reset expiry to 5 min
				setOtp(["", "", "", "", "", ""]);
				inputRefs.current[0]?.focus();
			} else {
				setError(res.error || "Failed to resend verification code.");
			}
		} catch (err: any) {
			setError(err?.message || "Failed to dispatch email.");
		} finally {
			setIsResending(false);
		}
	}

	const formatExpiry = (sec: number) => {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${s < 10 ? "0" : ""}${s}`;
	};

	const isComplete = otp.every((d) => d !== "");

	return (
		<div className="space-y-5">
			<div className="flex flex-col items-center space-y-2 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
					{type === "2fa" ? (
						<ShieldCheck className="h-6 w-6" />
					) : (
						<KeyRound className="h-6 w-6" />
					)}
				</div>
				<h3 className="font-bold text-foreground text-xl tracking-tight">
					{title}
				</h3>
				<p className="max-w-xs text-muted-foreground text-xs sm:text-sm">
					{subtitle}
				</p>
				<span className="inline-flex items-center rounded-full border border-border/80 bg-muted/50 px-3 py-1 font-medium font-mono text-foreground text-xs">
					{maskEmail(email)}
				</span>
			</div>

			{error && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-500 text-xs sm:text-sm"
				>
					<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
					<p>{error}</p>
				</motion.div>
			)}

			{resendSuccess && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-600 text-xs sm:text-sm dark:text-emerald-400"
				>
					<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
					<p>New 6-digit code dispatched to your email!</p>
				</motion.div>
			)}

			{/* 6-digit inputs */}
			<div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
				{otp.map((digit, idx) => (
					<input
						key={idx}
						ref={(el) => {
							inputRefs.current[idx] = el;
						}}
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={1}
						value={digit}
						onChange={(e) => handleChange(idx, e.target.value)}
						onKeyDown={(e) => handleKeyDown(idx, e)}
						disabled={isSubmitting || isPending}
						aria-label={`Digit ${idx + 1}`}
						className="h-12 w-10 rounded-xl border border-border/80 bg-background text-center font-bold font-mono text-foreground text-lg shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-14 sm:w-12 sm:text-xl dark:border-border dark:bg-card/60"
					/>
				))}
			</div>

			{/* Expiry info */}
			<div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
				<Clock className="h-3.5 w-3.5" />
				<span>
					{expirySeconds > 0 ? (
						<>
							Code expires in{" "}
							<strong className="font-mono text-foreground">
								{formatExpiry(expirySeconds)}
							</strong>
						</>
					) : (
						<span className="font-semibold text-red-500">
							Code has expired. Request a new one.
						</span>
					)}
				</span>
			</div>

			{/* Submit button */}
			<Button
				type="button"
				onClick={() => submitCode(otp.join(""))}
				disabled={
					!isComplete || isSubmitting || isPending || expirySeconds <= 0
				}
				className="w-full text-xs shadow-sm sm:text-sm"
			>
				{isSubmitting || isPending ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Verifying Code...
					</>
				) : (
					"Verify & Continue"
				)}
			</Button>

			{/* Resend and Back buttons */}
			<div className="flex items-center justify-between border-border/40 border-t pt-4 text-xs sm:text-sm">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					<span>Back</span>
				</button>

				<button
					type="button"
					onClick={handleResend}
					disabled={resendCooldown > 0 || isResending}
					className="flex items-center gap-1.5 font-medium text-primary underline underline-offset-4 transition-opacity disabled:no-underline disabled:opacity-50"
				>
					<RotateCw
						className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`}
					/>
					<span>
						{resendCooldown > 0
							? `Resend in ${resendCooldown}s`
							: "Resend Code"}
					</span>
				</button>
			</div>
		</div>
	);
}
