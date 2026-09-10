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

	const t = {
		title: locale === "hi" ? "भुगतान और स्टोर क्रेडिट" : "Payments & Store Credit",
		subtitle:
			locale === "hi"
				? "अपना वॉलेट बैलेंस, सक्रिय स्टोर क्रेडिट और पुष्टीकृत भुगतान रसीदें देखें।"
				: "View your wallet balance, active store credit, and confirmed payment receipts.",
		walletTitle:
			locale === "hi"
				? "वॉलेट बैलेंस (स्टोर क्रेडिट)"
				: "Wallet Balance (Store Credit)",
		walletDesc:
			locale === "hi"
				? "भविष्य के ऑर्डर समायोजन के लिए उपलब्ध स्टोर क्रेडिट।"
				: "Available store credit for future order adjustments.",
		loyaltyTitle:
			locale === "hi" ? "लॉयल्टी रिवार्ड्स टियर" : "Loyalty Rewards Tier",
		loyaltyDesc:
			locale === "hi"
				? (points: number) => `अंक: ${points}`
				: (points: number) => `Points: ${points}`,
		receiptsTitle:
			locale === "hi" ? "पुष्टीकृत भुगतान रसीदें" : "Confirmed Payment Receipts",
		receiptsDesc:
			locale === "hi"
				? "बिक्री टीम द्वारा अंतिम रूप दिए गए पुष्टीकृत व्यावसायिक ऑर्डरों का रिकॉर्ड।"
				: "Record of confirmed commercial orders finalized by the sales team.",
		loadingPayments:
			locale === "hi" ? "भुगतान लोड हो रहे हैं..." : "Loading payments...",
		noPayments:
			locale === "hi"
				? "कोई पुष्टीकृत भुगतान रिकॉर्ड उपलब्ध नहीं है।"
				: "No confirmed payment records available.",
		receiptId: locale === "hi" ? "रसीद आईडी" : "Receipt ID",
		orderRef: locale === "hi" ? "ऑर्डर संदर्भ" : "Order Ref",
		date: locale === "hi" ? "तारीख" : "Date",
		status: locale === "hi" ? "स्थिति" : "Status",
		amount: locale === "hi" ? "राशि" : "Amount",
	};

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
					{t.title}
				</h1>
				<p className="text-muted-foreground text-xs sm:text-sm">{t.subtitle}</p>
			</div>

			{/* Wallet Balance Card */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							{t.walletTitle}
						</CardTitle>
						<WalletIcon className="h-5 w-5 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-emerald-600">
							{formatCurrency(stats?.walletBalance || 0, locale)}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">{t.walletDesc}</p>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							{t.loyaltyTitle}
						</CardTitle>
						<CreditCardIcon className="h-5 w-5 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600 capitalize">
							{stats?.loyaltyTier || "Bronze"}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							{t.loyaltyDesc(stats?.loyaltyPoints || 0)}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Confirmed Payments Table */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-base">{t.receiptsTitle}</CardTitle>
					<CardDescription className="text-xs">
						{t.receiptsDesc}
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex h-[150px] items-center justify-center text-muted-foreground text-xs">
							{t.loadingPayments}
						</div>
					) : (payments ?? []).length === 0 ? (
						<div className="flex h-[150px] items-center justify-center text-muted-foreground text-xs">
							{t.noPayments}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t.receiptId}</TableHead>
									<TableHead>{t.orderRef}</TableHead>
									<TableHead>{t.date}</TableHead>
									<TableHead>{t.status}</TableHead>
									<TableHead className="text-right">{t.amount}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(payments ?? []).map((p) => (
									<TableRow key={p.id}>
										<TableCell className="font-semibold">
											{p.paymentRef}
										</TableCell>
										<TableCell className="font-mono text-xs">
											{p.orderRef}
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{p.date ? new Date(p.date).toLocaleDateString() : "—"}
										</TableCell>
										<TableCell>
											<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs">
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
