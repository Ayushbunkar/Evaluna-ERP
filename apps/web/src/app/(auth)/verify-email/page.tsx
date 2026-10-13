"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardFooter } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Loader2,
	Mail,
	Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { authClient } from "@/lib/auth-client";
import { resendVerificationEmailAction } from "../login/actions";

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryEmail = searchParams.get("email") || "";
	const token = searchParams.get("token");
	const isVerifiedParam = searchParams.get("verified") === "true";
	const isSentParam = searchParams.get("sent") === "true";

	const [email, setEmail] = useState(queryEmail);
	const [isVerifyingToken, setIsVerifyingToken] = useState(false);
	const [tokenVerificationSuccess, setTokenVerificationSuccess] =
		useState(isVerifiedParam);
	const [tokenVerificationError, setTokenVerificationError] = useState<
		string | null
	>(null);

	const [isResending, setIsResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(isSentParam);
	const [resendError, setResendError] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(0);

	// Cooldown timer
	useEffect(() => {
		if (cooldown <= 0) return;
		const interval = setInterval(() => {
			setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(interval);
	}, [cooldown]);

	// Auto-verify if token is provided in URL
	useEffect(() => {
		if (!token || tokenVerificationSuccess) return;

		let isMounted = true;
		async function verifyToken() {
			setIsVerifyingToken(true);
			setTokenVerificationError(null);

			try {
				const result = await authClient.verifyEmail({
					query: {
						token: token as string,
					},
				});

				if (isMounted) {
					if (result.error) {
						setTokenVerificationError(
							result.error.message ||
								"This verification link is invalid or has expired.",
						);
					} else {
						setTokenVerificationSuccess(true);
						// After 2 seconds, redirect to customer dashboard
						setTimeout(() => {
							router.push("/customer");
						}, 2000);
					}
				}
			} catch (err: any) {
				if (isMounted) {
					setTokenVerificationError(
						err?.message ||
							"Failed to verify email token. The link may have expired.",
					);
				}
			} finally {
				if (isMounted) {
					setIsVerifyingToken(false);
				}
			}
		}

		verifyToken();
		return () => {
			isMounted = false;
		};
	}, [token, tokenVerificationSuccess, router]);

	async function handleResendEmail(e?: React.FormEvent) {
		if (e) e.preventDefault();
		if (cooldown > 0 || isResending) return;

		const targetEmail = email.trim();
		if (!targetEmail || !targetEmail.includes("@")) {
			setResendError("Please enter a valid email address.");
			return;
		}

		setIsResending(true);
		setResendError(null);
		setResendSuccess(false);

		try {
			const res = await resendVerificationEmailAction(targetEmail);
			if (res.success) {
				setResendSuccess(true);
				setCooldown(60); // 60 seconds cooldown
			} else {
				setResendError(res.error || "Failed to send verification email.");
			}
		} catch (err: any) {
			setResendError(err?.message || "An unexpected error occurred.");
		} finally {
			setIsResending(false);
		}
	}

	return (
		<Card className="border-border/50 bg-card/80 shadow-xl backdrop-blur-xl">
			<CardContent className="space-y-5 pt-8">
				{/* Token Verification Progress */}
				{isVerifyingToken && (
					<div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
						<Loader2 className="h-10 w-10 animate-spin text-primary" />
						<h3 className="font-semibold text-foreground text-lg">
							Verifying Your Email...
						</h3>
						<p className="text-muted-foreground text-xs sm:text-sm">
							Please wait while we confirm your verification link.
						</p>
					</div>
				)}

				{/* Token Verification Error */}
				{tokenVerificationError && !isVerifyingToken && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500 text-sm"
					>
						<AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
						<div>
							<h4 className="font-semibold">Verification Failed</h4>
							<p className="mt-1 text-xs sm:text-sm">
								{tokenVerificationError}
							</p>
						</div>
					</motion.div>
				)}

				{/* Verification Success State */}
				{tokenVerificationSuccess && !isVerifyingToken && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="space-y-4 py-4 text-center"
					>
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
							<CheckCircle2 className="h-8 w-8" />
						</div>
						<div className="space-y-1">
							<h3 className="font-bold text-foreground text-xl">
								Email Verified Successfully!
							</h3>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Your account is now activated. You can now access your ERP
								workspace.
							</p>
						</div>
						<div className="pt-2">
							<Button
								asChild
								className="w-full bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-700"
							>
								<Link href="/login">Proceed to Sign In</Link>
							</Button>
						</div>
					</motion.div>
				)}

				{/* Pending Verification Instructions */}
				{!tokenVerificationSuccess && !isVerifyingToken && (
					<>
						<div className="flex flex-col items-center space-y-2 text-center">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<Mail className="h-6 w-6" />
							</div>
							<h3 className="font-bold text-foreground text-xl">
								Verify your email address
							</h3>
							<p className="text-muted-foreground text-xs sm:text-sm">
								We have sent an authentication link to your email. Click the
								link in that email to activate your account.
							</p>
						</div>

						{/* Resend Success Banner */}
						{resendSuccess && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-600 text-xs sm:text-sm dark:text-emerald-400"
							>
								<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
								<span>
									A new verification link has been sent to{" "}
									<strong className="underline">{email}</strong>. Please check
									your inbox or spam folder.
								</span>
							</motion.div>
						)}

						{/* Resend Error Banner */}
						{resendError && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-500 text-xs sm:text-sm"
							>
								<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
								<span>{resendError}</span>
							</motion.div>
						)}

						<form onSubmit={handleResendEmail} className="space-y-3 pt-2">
							<div className="space-y-1.5">
								<Label
									htmlFor="verify-email-input"
									className="text-xs sm:text-sm"
								>
									Email address
								</Label>
								<Input
									id="verify-email-input"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="name@example.com"
									required
									className="text-xs sm:text-sm"
								/>
							</div>

							<Button
								type="submit"
								variant="default"
								disabled={isResending || cooldown > 0 || !email}
								className="w-full text-xs shadow-sm sm:text-sm"
							>
								{isResending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending link...
									</>
								) : cooldown > 0 ? (
									<>
										<Clock className="mr-2 h-4 w-4" />
										Resend available in {cooldown}s
									</>
								) : (
									<>
										<Send className="mr-2 h-4 w-4" />
										Resend Verification Email
									</>
								)}
							</Button>
						</form>
					</>
				)}
			</CardContent>

			<CardFooter className="flex flex-col items-center border-border/40 border-t py-4">
				<Link
					href="/login"
					className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground sm:text-sm"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					<span>Back to Log in</span>
				</Link>
			</CardFooter>
		</Card>
	);
}

export default function VerifyEmailPage() {
	return (
		<div
			suppressHydrationWarning
			className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20"
		>
			<PublicHeader />

			<div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden bg-background py-12 selection:bg-primary/20">
				<div className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-full overflow-hidden">
					<div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
					<div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="mx-auto w-full max-w-md space-y-6 px-4"
				>
					<div className="flex flex-col items-center space-y-2 text-center">
						<img
							src="/logo.jpg"
							alt="Evaluna ERP"
							className="h-14 w-14 rounded-2xl object-cover shadow-md ring-1 ring-border"
						/>
					</div>

					<Suspense
						fallback={
							<div className="flex justify-center p-12">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						}
					>
						<VerifyEmailContent />
					</Suspense>
				</motion.div>
			</div>
		</div>
	);
}
