"use client";

import { Button } from "@evaluna/ui/components/button";
import { ArrowLeftIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@evaluna/ui/components/input";

export default function OTPPage() {
	const t = useTranslations("nav");

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

				<h2 className="mb-2 text-2xl font-bold tracking-tight">Enter Delivery OTP</h2>
				<p className="mb-8 text-muted-foreground">
					Ask the customer for the 4-digit PIN sent to their registered mobile number.
				</p>

				<div className="mb-8 flex gap-3">
					{[1, 2, 3, 4].map((i) => (
						<Input
							key={i}
							type="text"
							maxLength={1}
							className="h-16 w-14 text-center text-2xl font-bold rounded-xl border-2 focus-visible:ring-primary focus-visible:ring-offset-2"
							placeholder="•"
						/>
					))}
				</div>

				<Button className="w-full h-14 rounded-xl text-lg font-medium" asChild>
					<Link href="/driver/cash">
						Verify & Complete Delivery
					</Link>
				</Button>

				<div className="mt-6">
					<Button variant="link" className="text-muted-foreground">
						Resend OTP to Customer
					</Button>
				</div>
			</main>
		</div>
	);
}
