"use client";

import { Button } from "@evaluna/ui/components/button";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	CheckCircle2,
	ExternalLink,
	Loader2,
	Mail,
	RefreshCw,
	Sparkles,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resendVerificationEmailAction } from "@/app/(auth)/signup/actions";

interface WaitingForVerificationModalProps {
	isOpen: boolean;
	email: string;
	onClose: () => void;
	onVerified?: () => void;
}

export function WaitingForVerificationModal({
	isOpen,
	email,
	onClose,
	onVerified,
}: WaitingForVerificationModalProps) {
	const router = useRouter();
	const [isVerified, setIsVerified] = useState(false);
	const [cooldown, setCooldown] = useState(60);
	const [isResending, setIsResending] = useState(false);
	const [resendStatus, setResendStatus] = useState<string | null>(null);
	const [resendError, setResendError] = useState<string | null>(null);

	// Cooldown countdown
	useEffect(() => {
		if (!isOpen || cooldown <= 0) return;
		const timer = setInterval(() => {
			setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [isOpen, cooldown]);

	// Live polling for verification
	useEffect(() => {
		if (!isOpen || isVerified || !email) return;

		let isMounted = true;
		const checkStatus = async () => {
			try {
				const res = await fetch(
					`/api/auth/check-verification?email=${encodeURIComponent(email)}`,
				);
				if (!res.ok) return;
				const data = await res.json();

				if (isMounted && data?.verified) {
					setIsVerified(true);
					setTimeout(() => {
						if (onVerified) {
							onVerified();
						} else {
							router.push("/customer");
						}
					}, 1500);
				}
			} catch {
				// Ignore transient network errors during background polling
			}
		};

		// Initial immediate check
		checkStatus();

		// Poll every 2.5 seconds
		const pollInterval = setInterval(checkStatus, 2500);
		return () => {
			isMounted = false;
			clearInterval(pollInterval);
		};
	}, [isOpen, isVerified, email, onVerified, router]);

	const handleResend = async () => {
		if (cooldown > 0 || isResending) return;
		setIsResending(true);
		setResendStatus(null);
		setResendError(null);

		try {
			const res = await resendVerificationEmailAction(email);
			if (res.success) {
				setResendStatus("New verification link dispatched to your inbox!");
				setCooldown(60);
			} else {
				setResendError(res.error || "Failed to resend link. Please try again.");
			}
		} catch {
			setResendError("An unexpected error occurred while resending.");
		} finally {
			setIsResending(false);
		}
	};

	const getWebmailUrl = () => {
		const lower = email.toLowerCase();
		if (lower.includes("@gmail.com")) return "https://mail.google.com";
		if (
			lower.includes("@outlook.com") ||
			lower.includes("@hotmail.com") ||
			lower.includes("@live.com")
		)
			return "https://outlook.live.com";
		if (lower.includes("@yahoo.com")) return "https://mail.yahoo.com";
		return null;
	};

	const webmailUrl = getWebmailUrl();

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				{/* Backdrop */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black/75 backdrop-blur-md"
					onClick={() => !isVerified && onClose()}
				/>

				{/* Modal Container */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 15 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 15 }}
					transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
					className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 text-card-foreground shadow-2xl sm:p-8"
				>
					{/* Close Button */}
					{!isVerified && (
						<button
							type="button"
							onClick={onClose}
							className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Close modal"
						>
							<X className="h-4 w-4" />
						</button>
					)}

					{/* Modal Content */}
					<div className="flex flex-col items-center text-center">
						{/* Animated Icon Header */}
						<div className="relative mb-5 flex h-20 w-20 items-center justify-center">
							{isVerified ? (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: "spring", stiffness: 300, damping: 20 }}
									className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-8 ring-emerald-500/10"
								>
									<CheckCircle2 className="h-10 w-10 text-emerald-500" />
								</motion.div>
							) : (
								<>
									{/* Subtle pulsing background rings */}
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20 opacity-75" />
									<div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/15">
										<Mail className="h-9 w-9 text-primary" />
									</div>
								</>
							)}
						</div>

						{/* Title & Status */}
						{isVerified ? (
							<>
								<h3 className="font-semibold text-2xl text-foreground tracking-tight">
									Email Verified! 🎉
								</h3>
								<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
									Your email has been confirmed. Preparing your customer dashboard...
								</p>
								<div className="mt-6 flex items-center justify-center gap-2 font-medium text-emerald-500 text-sm">
									<Loader2 className="h-4 w-4 animate-spin" />
									Redirecting now...
								</div>
							</>
						) : (
							<>
								<div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-medium text-[11px] text-primary">
									<Sparkles className="h-3 w-3" /> Waiting for Verification
								</div>

								<h3 className="mt-3 font-semibold text-2xl text-foreground tracking-tight">
									Check your email inbox
								</h3>

								<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
									We sent a verification link to:
								</p>

								{/* Recipient Email Chip */}
								<div className="mt-2 inline-flex max-w-full items-center justify-center rounded-xl border border-border/80 bg-muted/50 px-3.5 py-1.5 font-medium text-foreground text-xs sm:text-sm">
									<span className="truncate">{email}</span>
								</div>

								{/* Instructions Box */}
								<div className="mt-5 w-full space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-left text-xs leading-relaxed text-muted-foreground">
									<div className="flex items-start gap-2">
										<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-[10px] text-primary">
											1
										</span>
										<span>Open the email sent from <strong>Evaluna</strong>.</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-[10px] text-primary">
											2
										</span>
										<span>Click the <strong>Verify Email Address</strong> button.</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-[10px] text-primary">
											3
										</span>
										<span>This screen will auto-detect your click and log you in!</span>
									</div>
								</div>

								{/* Live Listening Indicator */}
								<div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-xs">
									<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
									<span>Listening for email verification...</span>
								</div>

								{/* Status or error feedback */}
								{resendStatus && (
									<motion.div
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-500 text-xs"
									>
										{resendStatus}
									</motion.div>
								)}
								{resendError && (
									<motion.div
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-left text-red-500 text-xs"
									>
										<AlertCircle className="h-4 w-4 shrink-0" />
										<span>{resendError}</span>
									</motion.div>
								)}

								{/* Primary Action Button */}
								<div className="mt-6 flex w-full flex-col gap-2">
									{webmailUrl && (
										<Button
											type="button"
											className="w-full shadow-sm"
											onClick={() => window.open(webmailUrl, "_blank")}
										>
											<ExternalLink className="mr-2 h-4 w-4" />
											Open {webmailUrl.includes("google") ? "Gmail" : "Outlook"}
										</Button>
									)}

									<Button
										type="button"
										variant="outline"
										disabled={cooldown > 0 || isResending}
										onClick={handleResend}
										className="w-full text-xs"
									>
										{isResending ? (
											<>
												<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
												Sending link...
											</>
										) : cooldown > 0 ? (
											`Resend verification link in ${cooldown}s`
										) : (
											<>
												<RefreshCw className="mr-2 h-3.5 w-3.5" />
												Resend verification link
											</>
										)}
									</Button>
								</div>

								{/* Footer helper */}
								<p className="mt-4 text-[11px] text-muted-foreground">
									Didn&apos;t get it? Check your Spam or Promotions folder.{" "}
									<button
										type="button"
										onClick={onClose}
										className="font-medium text-primary hover:underline"
									>
										Change email
									</button>
								</p>
							</>
						)}
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
