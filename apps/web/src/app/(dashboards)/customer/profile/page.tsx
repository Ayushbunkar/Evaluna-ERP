"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	AwardIcon,
	CreditCardIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function CustomerProfilePage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: profile,
		isLoading,
		error,
	} = trpc.customer.getMyProfile.useQuery();

	if (isLoading) {
		return (
			<div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
				Loading customer profile...
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="flex h-[300px] items-center justify-center text-destructive text-sm">
				{error?.message ?? "Profile not found."}
			</div>
		);
	}

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div>
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Customer Profile
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Your registered customer account information and store credit status.
					</p>
				</div>
				<Button asChild variant="outline" className="text-xs">
					<Link href="/customer">
						<UserIcon className="mr-1.5 h-4 w-4" /> Back to Dashboard
					</Link>
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Account Information */}
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="text-base">Account Information</CardTitle>
						<CardDescription className="text-xs">
							Personal and contact details linked to your account.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-xs font-medium text-muted-foreground">Full Name</p>
								<p className="font-semibold text-foreground">{profile.name}</p>
							</div>
							<div>
								<p className="text-xs font-medium text-muted-foreground">Customer Code</p>
								<p className="font-mono text-xs font-semibold text-foreground">
									{profile.customer_code}
								</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 border-border/40 border-t pt-3">
							<div className="flex items-center gap-2">
								<MailIcon className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-[11px] font-medium text-muted-foreground">Email</p>
									<p className="font-medium text-xs text-foreground">{profile.email}</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<PhoneIcon className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-[11px] font-medium text-muted-foreground">Phone</p>
									<p className="font-medium text-xs text-foreground">
										{profile.phone || "Not provided"}
									</p>
								</div>
							</div>
						</div>

						<div className="border-border/40 border-t pt-3">
							<div className="flex items-start gap-2">
								<MapPinIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
								<div>
									<p className="text-[11px] font-medium text-muted-foreground">Address</p>
									<p className="font-medium text-xs text-foreground">
										{profile.address || "No address on file."}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Loyalty & Store Credit */}
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="text-base">Rewards & Store Credit</CardTitle>
						<CardDescription className="text-xs">
							Active tier status and store credit balance.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div className="grid grid-cols-2 gap-4">
							<div className="rounded-lg border border-border/40 bg-muted/20 p-3">
								<div className="flex items-center gap-2">
									<AwardIcon className="h-4 w-4 text-amber-500" />
									<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Loyalty Tier
									</span>
								</div>
								<p className="mt-1 font-bold text-lg text-amber-600 capitalize">
									{profile.loyalty_tier || "Bronze"}
								</p>
								<p className="text-[11px] text-muted-foreground">
									Points: {profile.loyalty_points || 0}
								</p>
							</div>

							<div className="rounded-lg border border-border/40 bg-muted/20 p-3">
								<div className="flex items-center gap-2">
									<CreditCardIcon className="h-4 w-4 text-emerald-500" />
									<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Store Credit
									</span>
								</div>
								<p className="mt-1 font-bold text-lg text-emerald-600">
									{formatCurrency(profile.store_credit || 0, locale)}
								</p>
								<p className="text-[11px] text-muted-foreground">Active wallet credit</p>
							</div>
						</div>

						<div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
							<p className="font-medium text-foreground">Account Scoping & Roles</p>
							<p className="mt-1 text-[11px]">
								Account status: <span className="font-semibold text-emerald-600">Active Customer</span>. To update sensitive administrative fields or address changes, please contact support.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
