"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { CheckCircle2Icon, CreditCardIcon, WalletIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function CustomerPaymentsPage() {
	const trpc = useTRPC();
	const locale = useLocale();

	const { data: stats } = trpc.customer.getPortalStats.useQuery();
	const { data: payments, isLoading } = trpc.customer.getPayments.useQuery();

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
					Payments & Store Credit
				</h1>
				<p className="text-muted-foreground text-xs sm:text-sm">
					View your wallet balance, active store credit, and confirmed payment receipts.
				</p>
			</div>

			{/* Wallet Balance Card */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Wallet Balance (Store Credit)
						</CardTitle>
						<WalletIcon className="h-5 w-5 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-emerald-600">
							{formatCurrency(stats?.walletBalance || 0, locale)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Available store credit for future order adjustments.
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Loyalty Rewards Tier
						</CardTitle>
						<CreditCardIcon className="h-5 w-5 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600 capitalize">
							{stats?.loyaltyTier || "Bronze"}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Points: {stats?.loyaltyPoints || 0}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Confirmed Payments Table */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-base">Confirmed Payment Receipts</CardTitle>
					<CardDescription className="text-xs">
						Record of confirmed commercial orders finalized by the sales team.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex h-[150px] items-center justify-center text-xs text-muted-foreground">
							Loading payments...
						</div>
					) : (payments ?? []).length === 0 ? (
						<div className="flex h-[150px] items-center justify-center text-xs text-muted-foreground">
							No confirmed payment records available.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Receipt ID</TableHead>
									<TableHead>Order Ref</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(payments ?? []).map((p) => (
									<TableRow key={p.id}>
										<TableCell className="font-semibold">{p.paymentRef}</TableCell>
										<TableCell className="text-xs font-mono">{p.orderRef}</TableCell>
										<TableCell className="text-xs text-muted-foreground">
											{p.date ? new Date(p.date).toLocaleDateString() : "—"}
										</TableCell>
										<TableCell>
											<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
												<CheckCircle2Icon className="h-3 w-3" /> {p.status}
											</span>
										</TableCell>
										<TableCell className="text-right font-bold text-foreground">
											{formatCurrency(p.amount, locale)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
