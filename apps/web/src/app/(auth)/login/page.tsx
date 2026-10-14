"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardFooter } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowLeft,
	KeyRound,
	Loader2,
	Mail,
	WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OTPVerificationForm } from "@/components/auth/OTPVerificationForm";
import { PublicHeader } from "@/components/layout/PublicHeader";
import {
	login,
	requestEmailOTPAction,
	sendTwoFactorOTPAction,
	verifyEmailOTPAction,
	verifyTwoFactorOTPAction,
} from "./actions";

function LoginForm() {
	const emailRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("login");
	const searchParams = useSearchParams();
	const expired = searchParams.get("expired");
	const suspended = searchParams.get("suspended");
	const verified = searchParams.get("verified") === "true";
	const unverified = searchParams.get("unverified") === "true";
	const initialStep = searchParams.get("step");
	const initialEmail = searchParams.get("email") || "";

	const [authMode, setAuthMode] = useState<
		"password" | "otp-request" | "otp-verify" | "2fa"
	>(initialStep === "2fa" ? "2fa" : "password");
	const [emailForOtp, setEmailForOtp] = useState<string>(initialEmail);

	const [isPending, setIsPending] = useState(false);
	const [localError, setLocalError] = useState<string | null>(
		unverified ? "email-not-verified" : searchParams.get("error"),
	);
	const [unverifiedEmail, setUnverifiedEmail] = useState<string>(initialEmail);
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		if (initialStep === "2fa" && initialEmail) {
			sendTwoFactorOTPAction(initialEmail).catch(() => {});
		}
	}, [initialStep, initialEmail]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setIsOffline(!window.navigator.onLine);
		}
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsPending(true);
		setLocalError(null);
		const formData = new FormData(e.currentTarget);
		const emailVal = formData.get("email") as string;
		const res = await login(formData);
		if (res && !res.success) {
			setLocalError(res.error || "invalid-credentials");
			if (res.error === "email-not-verified") {
				setUnverifiedEmail(res.email || emailVal || "");
			}
			setIsPending(false);
		} else if (res && (res as any).requires2FA) {
			setEmailForOtp((res as any).email || emailVal || "");
			setAuthMode("2fa");
			setIsPending(false);
		} else if (res && res.success && res.redirectUrl) {
			const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
			let target = res.redirectUrl;
			if (basePath && target.startsWith("/") && !target.startsWith(basePath)) {
				target = basePath + target;
			}
			window.location.href = target;
		}
	}

	async function handleRequestOtp(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const cleanEmail = emailForOtp.toLowerCase().trim();
		if (!cleanEmail || !cleanEmail.includes("@")) {
			setLocalError("Please enter a valid email address.");
			return;
		}

		setIsPending(true);
		setLocalError(null);
		try {
			const res = await requestEmailOTPAction(cleanEmail);
			if (res.success) {
				setAuthMode("otp-verify");
			} else {
				setLocalError(res.error || "Failed to send verification code.");
			}
		} catch {
			setLocalError("An unexpected error occurred. Please try again.");
		} finally {
			setIsPending(false);
		}
	}

	if (authMode === "2fa") {
		return (
			<CardContent className="pt-6 pb-6">
				<OTPVerificationForm
					email={emailForOtp}
					title="Two-Factor Authentication"
					subtitle="Enter the 6-digit verification code sent to your email to verify your identity."
					type="2fa"
					onVerify={async (code) => {
						const res = await verifyTwoFactorOTPAction(emailForOtp, code);
						if (res.success && res.redirectUrl) {
							const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
							let target = res.redirectUrl;
							if (
								basePath &&
								target.startsWith("/") &&
								!target.startsWith(basePath)
							) {
								target = basePath + target;
							}
							window.location.href = target;
						}
						return res;
					}}
					onResend={async () => {
						return sendTwoFactorOTPAction(emailForOtp);
					}}
					onBack={() => {
						setAuthMode("password");
						setLocalError(null);
					}}
				/>
			</CardContent>
		);
	}

	if (authMode === "otp-verify") {
		return (
			<CardContent className="pt-6 pb-6">
				<OTPVerificationForm
					email={emailForOtp}
					title="Passwordless Email Login"
					subtitle="Enter the 6-digit sign-in code sent to your email."
					type="sign-in"
					onVerify={async (code) => {
						const res = await verifyEmailOTPAction(emailForOtp, code);
						if (res.success && res.redirectUrl) {
							const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
							let target = res.redirectUrl;
							if (
								basePath &&
								target.startsWith("/") &&
								!target.startsWith(basePath)
							) {
								target = basePath + target;
							}
							window.location.href = target;
						}
						return res;
					}}
					onResend={async () => {
						return requestEmailOTPAction(emailForOtp);
					}}
					onBack={() => {
						setAuthMode("otp-request");
						setLocalError(null);
					}}
				/>
			</CardContent>
		);
	}

	if (authMode === "otp-request") {
		return (
			<form onSubmit={handleRequestOtp}>
				<CardContent className="space-y-4 pt-6">
					<div className="mb-2 flex flex-col items-center space-y-1.5 text-center">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Mail className="h-5 w-5" />
						</div>
						<h3 className="font-bold text-foreground text-lg">
							Sign in with Email OTP
						</h3>
						<p className="max-w-xs text-muted-foreground text-xs">
							Enter your registered email. We will send a 6-digit one-time
							security code.
						</p>
					</div>

					{localError && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-red-500 text-xs"
						>
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
							<p>{localError}</p>
						</motion.div>
					)}

					<div className="grid gap-1 sm:gap-2">
						<Label htmlFor="otp-email-input" className="text-xs sm:text-sm">
							{t("email")}
						</Label>
						<Input
							id="otp-email-input"
							type="email"
							value={emailForOtp}
							onChange={(e) => setEmailForOtp(e.target.value)}
							placeholder={t("emailPlaceholder")}
							required
							autoFocus
							className="text-xs transition-all focus-visible:ring-primary sm:text-sm"
						/>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col gap-3 pb-4 sm:gap-4 sm:pb-6">
					<Button
						className="w-full text-xs shadow-sm sm:text-sm"
						type="submit"
						disabled={isPending}
					>
						{isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Mail className="mr-2 h-4 w-4" />
						)}
						{isPending ? "Sending code..." : "Send Sign-in Code"}
					</Button>

					<div className="relative my-0.5 flex w-full items-center justify-center">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-border border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 font-medium text-[11px] text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<GoogleSignInButton
						disabled={isPending}
						onError={(err) => setLocalError(err)}
					/>

					<button
						type="button"
						onClick={() => {
							setLocalError(null);
							setAuthMode("password");
						}}
						className="mt-1 text-center font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
					>
						← Back to password login
					</button>
				</CardFooter>
			</form>
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<CardContent className="space-y-4 pt-6">
				{isOffline && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 text-xs sm:p-4 sm:text-sm dark:text-amber-400"
					>
						<div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
							<WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
							<span>Offline Mode Active</span>
						</div>
						<p className="text-muted-foreground text-xs">
							Internet disconnected. If you were logged in previously, you can
							launch your offline workspace tabs directly:
						</p>
						<div className="space-y-1.5 pt-1 font-medium">
							<Link
								href="/driver"
								className="flex items-center justify-between rounded-lg bg-amber-500/20 px-3 py-2 text-amber-900 transition-colors hover:bg-amber-500/30 dark:text-amber-100"
							>
								<span>🚚 Driver Delivery Tab</span>
								<span>→</span>
							</Link>
							<Link
								href="/sales"
								className="flex items-center justify-between rounded-lg bg-amber-500/20 px-3 py-2 text-amber-900 transition-colors hover:bg-amber-500/30 dark:text-amber-100"
							>
								<span>🛒 Sales & POS Dashboard</span>
								<span>→</span>
							</Link>
							<Link
								href="/dashboard"
								className="flex items-center justify-between rounded-lg bg-amber-500/20 px-3 py-2 text-amber-900 transition-colors hover:bg-amber-500/30 dark:text-amber-100"
							>
								<span>📊 Main Owner ERP</span>
								<span>→</span>
							</Link>
						</div>
					</motion.div>
				)}
				{verified && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-600 text-xs sm:p-3 sm:text-sm dark:text-emerald-400"
					>
						<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
						<p>
							Email verified successfully! You can now sign in to your account.
						</p>
					</motion.div>
				)}
				{localError === "email-not-verified" && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 text-xs sm:p-3.5 sm:text-sm dark:text-amber-300"
					>
						<div className="flex items-start gap-2">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
							<div>
								<span className="font-semibold">
									Please verify your email address before signing in.
								</span>
								<p className="mt-1 text-muted-foreground text-xs">
									A verification link was sent to your email. Please check your
									inbox or spam folder.
								</p>
							</div>
						</div>
						<div className="pt-1">
							<Link
								href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
								className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 hover:opacity-80"
							>
								<span>Resend verification email →</span>
							</Link>
						</div>
					</motion.div>
				)}
				{localError && localError !== "email-not-verified" && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-500 text-xs sm:p-3 sm:text-sm"
					>
						<AlertCircle className="mt-0.5 h-4 w-4" />
						<p>
							{localError === "locked"
								? "Account locked due to too many failed attempts. Try again later."
								: localError === "suspended"
									? "Your account has been suspended."
									: localError === "invalid"
										? "Invalid email or password."
										: localError}
						</p>
					</motion.div>
				)}
				{expired && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500 text-xs sm:p-3 sm:text-sm"
					>
						<AlertCircle className="mt-0.5 h-4 w-4" />
						<p>Your session has expired. Please log in again.</p>
					</motion.div>
				)}
				{suspended && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-500 text-xs sm:p-3 sm:text-sm"
					>
						<AlertCircle className="mt-0.5 h-4 w-4" />
						<p>
							Your account is currently suspended. Contact your administrator.
						</p>
					</motion.div>
				)}

				<div className="grid gap-1 sm:gap-2">
					<Label htmlFor="email" className="text-xs sm:text-sm">
						{t("email")}
					</Label>
					<Input
						ref={emailRef}
						id="email"
						name="email"
						type="email"
						placeholder={t("emailPlaceholder")}
						required
						autoComplete="email"
						className="text-xs transition-all focus-visible:ring-primary sm:text-sm"
					/>
				</div>
				<div className="grid gap-1 sm:gap-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password" className="text-xs sm:text-sm">
							{t("password")}
						</Label>
						<Link
							href="/forgot-password"
							className="text-muted-foreground text-xs transition-colors hover:text-foreground"
						>
							Forgot password?
						</Link>
					</div>
					<Input
						ref={passwordRef}
						id="password"
						name="password"
						type="password"
						required
						autoComplete="current-password"
						className="text-xs transition-all focus-visible:ring-primary sm:text-sm"
					/>
				</div>
				<div className="mt-1 flex items-center gap-1 sm:gap-2">
					<input
						type="checkbox"
						id="rememberMe"
						name="rememberMe"
						suppressHydrationWarning={true}
						className="h-4 w-4 rounded border-border bg-background accent-primary transition-all"
					/>
					<Label
						htmlFor="rememberMe"
						className="cursor-pointer font-normal text-muted-foreground text-xs transition-colors hover:text-foreground sm:text-sm"
					>
						Remember me for 30 days
					</Label>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col gap-3 pb-4 sm:gap-4 sm:pb-6">
				<Button
					className="w-full text-xs shadow-sm sm:text-sm"
					type="submit"
					disabled={isPending}
				>
					{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					{isPending ? "Logging in..." : t("submit")}
				</Button>

				<div className="relative my-0.5 flex w-full items-center justify-center">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-border border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-card px-2 font-medium text-[11px] text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>

				<GoogleSignInButton
					disabled={isPending}
					onError={(err) => setLocalError(err)}
				/>

				<div className="pt-0.5 text-center">
					<button
						type="button"
						onClick={() => {
							setLocalError(null);
							setEmailForOtp(emailRef.current?.value || "");
							setAuthMode("otp-request");
						}}
						className="inline-flex items-center gap-1.5 font-medium text-primary text-xs transition-opacity hover:opacity-80"
					>
						<Mail className="h-3.5 w-3.5" />
						Sign in with Email OTP instead
					</button>
				</div>

				<p className="mt-1 text-center text-muted-foreground text-xs sm:mt-2 sm:text-sm">
					{t("noAccount")}{" "}
					<Link
						href="/signup"
						className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
					>
						{t("signUp")}
					</Link>
				</p>
			</CardFooter>
		</form>
	);
}

export default function LoginPage() {
	const t = useTranslations("login");

	return (
		<div
			suppressHydrationWarning
			className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20"
		>
			{/* Synchronized Homepage Navigation */}
			<PublicHeader />

			<div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden bg-background py-12 selection:bg-primary/20">
				{/* Background gradients for premium feel */}
				<div className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-full overflow-hidden">
					<div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
					<div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="mx-auto w-full max-w-md space-y-8 px-4"
				>
					<div className="flex flex-col items-center space-y-2 text-center sm:space-y-3">
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.1, duration: 0.5 }}
							className="mb-2"
						>
							<img
								src="/logo.jpg"
								alt="Evaluna ERP"
								className="h-14 w-14 rounded-2xl object-cover shadow-md ring-1 ring-border"
							/>
						</motion.div>
						<h2 className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
							{t("title")}
						</h2>
						<p className="max-w-sm text-muted-foreground text-xs sm:text-base">
							{t("subtitle")}
						</p>
					</div>

					<Card className="border-border/50 bg-card/80 shadow-xl backdrop-blur-xl">
						<Suspense
							fallback={
								<div className="flex justify-center p-10">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							}
						>
							<LoginForm />
						</Suspense>
					</Card>
				</motion.div>
			</div>
		</div>
	);
}
