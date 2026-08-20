"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { ArrowLeftIcon, ShieldCheckIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@evaluna/ui/components/input";

export default function OTPPage() {
	const t = useTranslations("nav");
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId");
	const customerName = searchParams.get("customerName") ?? "Customer";

	const [customerPhone, setCustomerPhone] = useState(
		searchParams.get("phone") ?? "",
	);
	const [sessionInfo, setSessionInfo] = useState<string | null>(null);
	const [otpSent, setOtpSent] = useState(false);
	const [otp, setOtp] = useState(["", "", "", ""]);
	const [isSending, setIsSending] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const cleanPhone = useMemo(
		() => customerPhone.replace(/\D/g, "").slice(0, 10),
		[customerPhone],
	);
	const canSendOtp = cleanPhone.length >= 10 && !isSending && !otpSent;
	const canVerify = otpSent && otp.every((digit) => digit.length === 1) && !isVerifying;

	const handleSendOtp = async () => {
		if (!canSendOtp) return;

		setIsSending(true);
		setError("");
		setMessage("");

		try {
			const response = await fetch("/api/otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "send",
					phone: `+91${cleanPhone}`,
					orderId,
					customerName,
				}),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || "Unable to send OTP");
			}

			setSessionInfo(result.sessionInfo ?? null);
			setOtpSent(true);
			setOtp(["", "", "", ""]);
			setMessage(`OTP sent to ${customerName}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to send OTP");
		} finally {
			setIsSending(false);
		}
	};

	const handleOtpChange = (index: number, value: string) => {
		const nextValue = value.replace(/\D/g, "").slice(-1);
		const nextOtp = [...otp];
		nextOtp[index] = nextValue;
		setOtp(nextOtp);

		if (nextValue && index < 3) {
			const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
			nextInput?.focus();
		}
	};

	const handleVerifyOtp = async () => {
		if (!sessionInfo || !otp.every(Boolean) || isVerifying) return;
		setIsVerifying(true);
		setError("");
		setMessage("");

		try {
			const response = await fetch("/api/otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "verify",
					code: otp.join(""),
					sessionInfo,
					phone: `+91${cleanPhone}`,
					orderId,
				}),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || "Invalid OTP");
			}

			setMessage("OTP verified. Proceeding to cash collection.");
			window.location.href = "/driver/cash";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Invalid OTP");
		} finally {
			setIsVerifying(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-muted/30 pb-20">
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 shadow-sm">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/driver/scan">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">{t("otpVerification")}</h1>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
				<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
					<ShieldCheckIcon className="h-12 w-12 text-primary" />
				</div>

				<h2 className="mb-6 text-2xl font-bold tracking-tight">Verify Delivery OTP</h2>

				{message ? <p className="mb-4 text-sm text-green-600">{message}</p> : null}
				{error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

				<div className="mb-6 w-full max-w-md text-left">
					<label className="mb-2 block text-sm font-medium text-foreground">
						Customer number required before OTP
					</label>
					<Input
						type="tel"
						value={customerPhone}
						onChange={(e) => setCustomerPhone(e.target.value)}
						placeholder="Enter customer mobile number"
						className="h-12 rounded-xl"
					/>
					<p className="mt-2 text-xs text-muted-foreground">
						Enter the customer’s phone number first. The OTP is sent only after this value is valid.
					</p>
					<Button
						type="button"
						variant={otpSent ? "outline" : "default"}
						onClick={handleSendOtp}
						disabled={!canSendOtp}
						className="mt-3 w-full h-11 rounded-xl"
					>
						{isSending ? "Sending..." : otpSent ? "OTP Sent to Customer" : "Send OTP to Customer"}
					</Button>
					{otpSent && (
						<p className="mt-2 text-sm text-muted-foreground">
							OTP sent to {customerName} on +91 {cleanPhone.slice(0, 5)} {cleanPhone.slice(5)}
						</p>
					)}
				</div>

				<p className="mb-8 text-muted-foreground">
					Ask the customer for the 4-digit PIN received on their mobile number.
				</p>

				<div className="mb-8 flex gap-3">
					{[0, 1, 2, 3].map((index) => (
						<Input
							key={index}
							id={`otp-${index}`}
							type="text"
							inputMode="numeric"
							maxLength={1}
							value={otp[index]}
							onChange={(e) => handleOtpChange(index, e.target.value)}
							className="h-16 w-14 rounded-xl border-2 text-center text-2xl font-bold focus-visible:ring-primary focus-visible:ring-offset-2"
							placeholder="•"
						/>
					))}
				</div>

				<Button
					className="w-full h-14 rounded-xl text-lg font-medium"
					disabled={!canVerify}
					onClick={handleVerifyOtp}
				>
					{isVerifying ? "Verifying..." : "Verify & Complete Delivery"}
				</Button>

				<div className="mt-6">
					<Button
						variant="link"
						className="text-muted-foreground"
						onClick={handleSendOtp}
						disabled={!canSendOtp}
					>
						Resend OTP to Customer
					</Button>
				</div>
			</main>
		</div>
	);
}
