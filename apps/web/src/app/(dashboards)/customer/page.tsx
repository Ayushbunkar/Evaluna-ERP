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
	ActivityIcon,
	ArrowRightIcon,
	CheckCircle2Icon,
	ClockIcon,
	CoinsIcon,
	DollarSignIcon,
	LayoutDashboardIcon,
	PackageIcon,
	ShoppingBagIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion, PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function CustomerDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();

	// Fetch custom, client-isolated Customer Portal Stats
	const {
		data: stats,
		isLoading,
		error,
	} = trpc.customer.getPortalStats.useQuery(undefined, {
		suspense: false,
	});

	// Translations Dictionary
	const t = {
		title: locale === "hi" ? "ग्राहक सेवा पोर्टल" : "Customer Portal",
		subtitle: locale === "hi" ? "ऑर्डर ट्रैक करें, वॉलेट बैलेंस प्रबंधित करें और लॉयल्टी पॉइंट्स देखें।" : "Track your orders, manage wallet balances, and view your loyalty points.",
		
		walletTitle: locale === "hi" ? "वॉलेट बैलेंस (Store Credit)" : "Wallet Balance",
		walletDesc: locale === "hi" ? "खरीदारी के लिए सक्रिय स्टोर क्रेडिट" : "Active store credit",
		
		loyaltyTitle: locale === "hi" ? "लॉयल्टी पॉइंट्स और टियर" : "Loyalty Points & Tier",
		loyaltyDesc: locale === "hi" ? "सक्रिय इनाम स्तर" : "Active reward level",
		
		pendingTitle: locale === "hi" ? "समीक्षा के अधीन आदेश" : "Pending Review Orders",
		pendingDesc: locale === "hi" ? "मंजूरी और मूल्य निर्धारण की प्रतीक्षा में" : "Awaiting approval and pricing",
		
		totalTitle: locale === "hi" ? "कुल रखे गए आदेश" : "Total Orders Placed",
		totalDesc: locale === "hi" ? "संपूर्ण ऑर्डर इतिहास" : "All placed orders",
		
		quickActions: locale === "hi" ? "त्वरित लिंक और शॉर्टकट्स" : "Quick Links & Actions",
		quickDesc: locale === "hi" ? "पोर्टल का उपयोग करके अपने ऑर्डर और विवरण प्रबंधित करें।" : "Manage your orders and profile details using the portal.",
		
		placeOrder: locale === "hi" ? "नया ऑर्डर सबमिट करें" : "Submit New Order",
		placeOrderDesc: locale === "hi" ? "खरीदारी सूची भरें और ऑर्डर भेजें" : "Submit a new cart list for review",
		
		viewOrders: locale === "hi" ? "ऑर्डर इतिहास देखें" : "View Order History",
		viewOrdersDesc: locale === "hi" ? "अपनी सभी पिछली रसीदें और स्थिति ट्रैक करें" : "Track statuses and invoices",
		
		myProfile: locale === "hi" ? "मेरा प्रोफ़ाइल विवरण" : "My Profile & Details",
		myProfileDesc: locale === "hi" ? "अपनी संपर्क जानकारी और पता अपडेट करें" : "View your billing and registry details",
	};

	if (isLoading) {
		return (
			<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 p-6 sm:gap-6">
				<div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">
					Loading customer portal dashboard...
				</div>
			</PageTransition>
		);
	}

	if (error) {
		return (
			<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 p-6 sm:gap-6">
				<div className="flex h-[400px] items-center justify-center text-destructive text-sm">
					Error loading customer portal: {error.message}
				</div>
			</PageTransition>
		);
	}

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 p-6 sm:gap-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						{t.title}
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t.subtitle}
					</p>
				</div>
			</div>

			{/* Stats Grid */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{/* Wallet Balance */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
									<DollarSignIcon className="h-6 w-6 text-emerald-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.walletTitle}
								</h3>
								<p className="font-bold text-2xl text-emerald-600">
									{formatCurrency(stats?.walletBalance || 0, locale)}
								</p>
								<span className="text-muted-foreground text-[10px]">{t.walletDesc}</span>
							</div>
						</CardContent>
					</Card>

					{/* Loyalty points */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
									<CoinsIcon className="h-6 w-6 text-yellow-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.loyaltyTitle}
								</h3>
								<p className="font-bold text-2xl text-yellow-600">
									{stats?.loyaltyPoints || 0}
								</p>
								<span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-yellow-700 dark:text-yellow-400">
									{stats?.loyaltyTier || "bronze"}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Pending orders */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
									<ClockIcon className="h-6 w-6 text-amber-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.pendingTitle}
								</h3>
								<p className="font-bold text-2xl text-amber-600">
									{stats?.pendingOrders || 0}
								</p>
								<span className="text-muted-foreground text-[10px]">{t.pendingDesc}</span>
							</div>
						</CardContent>
					</Card>

					{/* Total Orders */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
									<ShoppingBagIcon className="h-6 w-6 text-blue-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.totalTitle}
								</h3>
								<p className="font-bold text-2xl text-blue-600">
									{stats?.totalOrders || 0}
								</p>
								<span className="text-muted-foreground text-[10px]">{t.totalDesc}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</motion.div>

			{/* Quick Actions Panel */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
			>
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg">{t.quickActions}</CardTitle>
						<CardDescription>{t.quickDesc}</CardDescription>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="grid gap-4 md:grid-cols-3">
							{/* New Order */}
							<Card className="hover:border-green-500/40 cursor-pointer transition-colors hover:shadow">
								<CardContent className="p-5 flex flex-col items-start gap-3" onClick={() => window.location.href = "/customer/products"}>
									<div className="p-2.5 bg-green-500/10 rounded-full">
										<PackageIcon className="h-5 w-5 text-green-500" />
									</div>
									<div>
										<h4 className="font-bold text-sm">{t.placeOrder}</h4>
										<p className="text-muted-foreground text-xs mt-1">{t.placeOrderDesc}</p>
									</div>
								</CardContent>
							</Card>

							{/* History */}
							<Card className="hover:border-blue-500/40 cursor-pointer transition-colors hover:shadow">
								<CardContent className="p-5 flex flex-col items-start gap-3" onClick={() => window.location.href = "/customer/orders"}>
									<div className="p-2.5 bg-blue-500/10 rounded-full">
										<LayoutDashboardIcon className="h-5 w-5 text-blue-500" />
									</div>
									<div>
										<h4 className="font-bold text-sm">{t.viewOrders}</h4>
										<p className="text-muted-foreground text-xs mt-1">{t.viewOrdersDesc}</p>
									</div>
								</CardContent>
							</Card>

							{/* Profile */}
							<Card className="hover:border-purple-500/40 cursor-pointer transition-colors hover:shadow">
								<CardContent className="p-5 flex flex-col items-start gap-3" onClick={() => window.location.href = "/customer/profile"}>
									<div className="p-2.5 bg-purple-500/10 rounded-full">
										<UserIcon className="h-5 w-5 text-purple-500" />
									</div>
									<div>
										<h4 className="font-bold text-sm">{t.myProfile}</h4>
										<p className="text-muted-foreground text-xs mt-1">{t.myProfileDesc}</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
