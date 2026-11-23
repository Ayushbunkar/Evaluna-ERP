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
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	FlameIcon,
	LayoutDashboardIcon,
	PackageIcon,
	ShoppingBagIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRealtimeStock } from "@/hooks/use-realtime-stock";
import { motion, PageTransition } from "@/lib/animations";
import { getOfferCountdown } from "@/lib/pricing/slab-pricing";
import { useTRPC } from "@/lib/trpc/client";

export default function CustomerDashboard() {
	useRealtimeStock();
	const trpc = useTRPC();
	const locale = useLocale();

	// Fetch custom, client-isolated Customer Portal Stats
	const {
		data: stats,
		isLoading,
		error,
	} = trpc.customer.getPortalStats.useQuery(undefined, {
		suspense: false,
		refetchInterval: 10000,
	});

	// Fetch top products for quick catalog pricing preview
	const { data: products } = trpc.customer.browseProducts.useQuery(
		{},
		{
			suspense: false,
			refetchInterval: 5000,
		},
	);

	// Translations Dictionary
	const t = {
		title: locale === "hi" ? "ग्राहक सेवा पोर्टल" : "Customer Portal",
		subtitle:
			locale === "hi"
				? "ऑर्डर ट्रैक करें, वॉलेट बैलेंस प्रबंधित करें और लॉयल्टी पॉइंट्स देखें।"
				: "Track your orders, manage wallet balances, and view your loyalty points.",

		walletTitle: locale === "hi" ? "वॉलेट बैलेंस (Store Credit)" : "Wallet Balance",
		walletDesc:
			locale === "hi"
				? "खरीदारी के लिए सक्रिय स्टोर क्रेडिट"
				: "Active store credit",

		loyaltyTitle:
			locale === "hi" ? "लॉयल्टी पॉइंट्स और टियर" : "Loyalty Points & Tier",
		loyaltyDesc: locale === "hi" ? "सक्रिय इनाम स्तर" : "Active reward level",

		pendingTitle:
			locale === "hi" ? "समीक्षा के अधीन आदेश" : "Pending Review Orders",
		pendingDesc:
			locale === "hi"
				? "मंजूरी और मूल्य निर्धारण की प्रतीक्षा में"
				: "Awaiting approval and pricing",

		totalTitle: locale === "hi" ? "कुल रखे गए आदेश" : "Total Orders Placed",
		totalDesc: locale === "hi" ? "संपूर्ण ऑर्डर इतिहास" : "All placed orders",

		quickActions:
			locale === "hi" ? "त्वरित लिंक और शॉर्टकट्स" : "Quick Links & Actions",
		quickDesc:
			locale === "hi"
				? "पोर्टल का उपयोग करके अपने ऑर्डर और विवरण प्रबंधित करें।"
				: "Manage your orders and profile details using the portal.",

		placeOrder: locale === "hi" ? "नया ऑर्डर सबमिट करें" : "Submit New Order",
		placeOrderDesc:
			locale === "hi"
				? "खरीदारी सूची भरें और ऑर्डर भेजें"
				: "Submit a new cart list for review",

		viewOrders: locale === "hi" ? "ऑर्डर इतिहास देखें" : "View Order History",
		viewOrdersDesc:
			locale === "hi"
				? "अपनी सभी पिछली रसीदें और स्थिति ट्रैक करें"
				: "Track statuses and invoices",

		myProfile: locale === "hi" ? "मेरा प्रोफ़ाइल विवरण" : "My Profile & Details",
		myProfileDesc:
			locale === "hi"
				? "अपनी संपर्क जानकारी और पता अपडेट करें"
				: "View your billing and registry details",

		activeOrdersTitle: locale === "hi" ? "सक्रिय ऑर्डर" : "Active Orders",
		activeOrdersDesc: locale === "hi" ? "प्रगति में ऑर्डर" : "Orders in progress",

		pendingConfTitle: locale === "hi" ? "पुष्टि लंबित" : "Pending Confirmation",
		pendingConfDesc:
			locale === "hi" ? "बिक्री समीक्षा की प्रतीक्षा" : "Awaiting sales review",

		confirmedOrdersTitle:
			locale === "hi" ? "पुष्टि किए गए ऑर्डर" : "Confirmed Orders",
		confirmedOrdersDesc:
			locale === "hi" ? "बिक्री द्वारा पुष्टि" : "Confirmed by sales",

		completedOrdersTitle: locale === "hi" ? "पूर्ण ऑर्डर" : "Completed Orders",
		completedOrdersDesc:
			locale === "hi" ? "पूरे किए गए ऑर्डर" : "Fulfilled orders",

		productsPriceCatalog:
			locale === "hi"
				? "उपलब्ध उत्पाद और मूल्य कैटलॉग"
				: "Available Products & Price Catalog",
		productsPriceCatalogDesc:
			locale === "hi"
				? "वेयरहाउस द्वारा प्रबंधित नवीनतम उत्पाद और उनकी कीमतें।"
				: "Latest warehouse-managed products and their current prices.",
		viewFullCatalog: locale === "hi" ? "पूर्ण कैटलॉग देखें" : "View Full Catalog",
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
					{/* Active Orders */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
									<ShoppingBagIcon className="h-6 w-6 text-blue-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.activeOrdersTitle}
								</h3>
								<p className="font-bold text-2xl text-blue-600">
									{(stats?.pendingOrders || 0) + (stats?.confirmedOrders || 0)}
								</p>
								<span className="text-[10px] text-muted-foreground">
									{t.activeOrdersDesc}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Pending Confirmation */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
									<ClockIcon className="h-6 w-6 text-amber-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.pendingConfTitle}
								</h3>
								<p className="font-bold text-2xl text-amber-600">
									{stats?.pendingOrders || 0}
								</p>
								<span className="text-[10px] text-muted-foreground">
									{t.pendingConfDesc}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Confirmed Orders */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
									<CheckCircle2Icon className="h-6 w-6 text-emerald-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.confirmedOrdersTitle}
								</h3>
								<p className="font-bold text-2xl text-emerald-600">
									{stats?.confirmedOrders || 0}
								</p>
								<span className="text-[10px] text-muted-foreground">
									{t.confirmedOrdersDesc}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Completed Orders */}
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardContent className="p-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
									<ActivityIcon className="h-6 w-6 text-purple-500" />
								</div>
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{t.completedOrdersTitle}
								</h3>
								<p className="font-bold text-2xl text-purple-600">
									{stats?.completedOrders || 0}
								</p>
								<span className="text-[10px] text-muted-foreground">
									{t.completedOrdersDesc}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</motion.div>

			{/* Products & Price Catalog Showcase */}
			{products && products.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.25 }}
				>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-3">
							<div>
								<CardTitle className="text-lg">
									{t.productsPriceCatalog}
								</CardTitle>
								<CardDescription>{t.productsPriceCatalogDesc}</CardDescription>
							</div>
							<Button asChild variant="outline" size="sm" className="text-xs">
								<Link href="/customer/products">
									{t.viewFullCatalog}{" "}
									<ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="p-6 pt-0">
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
								{products.slice(0, 4).map((prod) => {
									const hasOffer = Boolean(prod.hasActiveOffer);
									const offerCountdown = getOfferCountdown(
										(prod as any).slabEndDate || (prod as any).offerEndDate,
										locale,
									);
									const prodImg = (prod as any).imageUrl || (prod as any).image;
									return (
										<div
											key={prod.id}
											className={`flex flex-col justify-between rounded-xl border p-3.5 shadow-sm transition-all ${
												hasOffer
													? "border-amber-400 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/20"
													: "border-border/60 bg-card hover:border-emerald-500/40"
											}`}
										>
											<div>
												<div className="flex flex-wrap items-center justify-between gap-1.5">
													<div className="flex items-center gap-1.5">
														<span
															className={`rounded-full p-1.5 ${
																hasOffer
																	? "bg-amber-500/20 text-red-500"
																	: "bg-blue-500/10 text-blue-500"
															}`}
														>
															{hasOffer ? (
																<FlameIcon className="h-4 w-4 animate-bounce" />
															) : (
																<PackageIcon className="h-4 w-4" />
															)}
														</span>
														{hasOffer ? (
															<span className="inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r from-amber-500 to-red-600 px-1.5 py-0.5 font-extrabold text-[9px] text-white shadow-sm transition-all hover:brightness-110">
																<FlameIcon className="h-2.5 w-2.5" />
																{prod.discountPercent}% OFF
															</span>
														) : (prod as any).stockStatus === "out_of_stock" ? (
															<span className="rounded-full border border-red-300/60 bg-red-500/15 px-2 py-0.5 font-bold text-[10px] text-red-600 dark:border-red-800 dark:text-red-400">
																{locale === "hi"
																	? "आउट ऑफ स्टॉक"
																	: "OUT OF STOCK"}
															</span>
														) : (prod as any).stockStatus ===
															"almost_sold_out" ? (
															<span className="rounded-full border border-red-300/60 bg-red-500/15 px-2 py-0.5 font-bold text-[10px] text-red-600 dark:border-red-800 dark:text-red-400">
																{locale === "hi"
																	? "लगभग समाप्त"
																	: "ALMOST SOLD OUT"}
															</span>
														) : (prod as any).stockStatus === "selling_fast" ? (
															<span className="rounded-full border border-amber-300/60 bg-amber-500/15 px-2 py-0.5 font-bold text-[10px] text-amber-700 dark:border-amber-800 dark:text-amber-400">
																{locale === "hi"
																	? "तेज़ी से बिक रहा"
																	: "SELLING FAST"}
															</span>
														) : (prod as any).stockStatus === "few_left" ? (
															<span className="rounded-full border border-amber-300/60 bg-amber-500/15 px-2 py-0.5 font-bold text-[10px] text-amber-700 dark:border-amber-800 dark:text-amber-400">
																{locale === "hi" ? "कुछ ही शेष" : "FEW LEFT"}
															</span>
														) : (
															<span className="rounded-full border border-emerald-300/60 bg-emerald-500/15 px-2 py-0.5 font-bold text-[10px] text-emerald-600 dark:border-emerald-800 dark:text-emerald-400">
																{locale === "hi" ? "स्टॉक में उपलब्ध" : "IN STOCK"}
															</span>
														)}
													</div>
													{offerCountdown && (
														<span
															className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-extrabold text-[9px] shadow-2xs ${
																offerCountdown.urgency === "urgent"
																	? "animate-pulse border border-rose-300/80 bg-rose-500/15 text-rose-700 dark:border-rose-800 dark:text-rose-300"
																	: "border border-amber-300/80 bg-amber-500/15 text-amber-800 dark:text-amber-300"
															}`}
														>
															<ClockIcon className="h-2.5 w-2.5" />
															<span>{offerCountdown.badgeText}</span>
														</span>
													)}
												</div>

												{/* Product Image Thumbnail */}
												<div className="relative my-2.5 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-gradient-to-b from-slate-100/60 to-slate-50/40 p-2 dark:from-slate-800/40 dark:to-slate-900/40">
													{prodImg ? (
														<img
															src={prodImg}
															alt={prod.name}
															className="max-h-full max-w-full object-contain drop-shadow-xs transition-transform duration-200 hover:scale-105"
															loading="lazy"
														/>
													) : (
														<div className="flex select-none flex-col items-center justify-center gap-1 text-muted-foreground/60">
															<PackageIcon className="h-8 w-8 stroke-[1.5]" />
															<span className="font-medium text-[10px]">
																{prod.category || "General"}
															</span>
														</div>
													)}
												</div>

												<h4 className="mt-2 line-clamp-1 font-semibold text-foreground text-sm">
													{prod.name}
												</h4>
												{prod.sku && (
													<p className="font-mono text-[10px] text-muted-foreground">
														SKU: {prod.sku}
													</p>
												)}
												{(prod as any).stockWarningText && (
													<p
														className={`mt-1 font-medium text-[10px] leading-tight ${
															(prod as any).stockStatus === "out_of_stock" ||
															(prod as any).stockStatus === "almost_sold_out"
																? "font-semibold text-red-600 dark:text-red-400"
																: "text-amber-700 dark:text-amber-400"
														}`}
													>
														{locale === "hi"
															? (prod as any).stockWarningTextHi
															: (prod as any).stockWarningText}
													</p>
												)}

												{/* Volume Slab Pricing Tiers Preview */}
												{prod.slabs && prod.slabs.length > 0 && (
													<div className="mt-2 rounded-md border border-purple-200/80 bg-purple-50/50 p-1.5 dark:border-purple-900/60 dark:bg-purple-950/20">
														<div className="mb-1 flex items-center justify-between font-bold text-[10px] text-purple-800 dark:text-purple-300">
															<span className="flex items-center gap-1">
																<PackageIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
																<span>
																	{locale === "hi"
																		? "थोक दर स्लैब"
																		: "Volume Slabs"}
																</span>
															</span>
															<span className="font-semibold text-[9px] text-purple-600 dark:text-purple-400">
																{prod.slabs.length} Tiers
															</span>
														</div>
														{offerCountdown ? (
															<div className="mb-1 flex items-center justify-between gap-1 rounded border border-amber-300/70 bg-amber-100/70 px-1.5 py-0.5 font-bold text-[9px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
																<span className="flex min-w-0 shrink-0 items-center gap-1">
																	<ClockIcon className="h-2.5 w-2.5 animate-pulse text-amber-600 dark:text-amber-400" />
																	<span className="whitespace-nowrap font-mono">
																		{offerCountdown.formattedDate}
																	</span>
																</span>
																<span className="shrink-0 whitespace-nowrap rounded bg-amber-200/80 px-1.5 py-0.5 font-extrabold font-mono text-[8.5px] text-amber-950 dark:bg-amber-900/80 dark:text-amber-100">
																	{offerCountdown.badgeText}
																</span>
															</div>
														) : (
															<div className="mb-1 flex items-center justify-between rounded border border-purple-200/60 bg-white/70 px-1.5 py-0.5 font-medium text-[8.5px] text-purple-800 dark:border-purple-800/60 dark:bg-slate-900/60 dark:text-purple-300">
																<span className="flex items-center gap-0.5">
																	<CalendarIcon className="h-2.5 w-2.5 text-purple-600" />
																	<span>
																		{locale === "hi"
																			? "दर वैधता: नियमित थोक दर"
																			: "Rate Validity: Regular Rate"}
																	</span>
																</span>
																<span className="font-semibold text-emerald-600 dark:text-emerald-400">
																	{locale === "hi" ? "सक्रिय" : "Active"}
																</span>
															</div>
														)}
														<div className="grid grid-cols-2 gap-1 text-center">
															{prod.slabs
																.slice(0, 2)
																.map((slab: any, idx: number) => (
																	<div
																		key={idx}
																		className="rounded border border-purple-200/60 bg-white p-1 text-[10px] dark:border-purple-800/60 dark:bg-slate-900"
																	>
																		<div className="truncate font-semibold text-[9px] text-muted-foreground">
																			{slab.minQuantity}
																			{slab.maxQuantity
																				? `–${slab.maxQuantity}`
																				: "+"}{" "}
																			{prod.unit || "qty"}
																		</div>
																		<div className="font-bold font-mono text-emerald-600 text-xs dark:text-emerald-400">
																			₹{Number(slab.unitPrice).toFixed(2)}
																		</div>
																	</div>
																))}
														</div>
													</div>
												)}
											</div>
											<div className="mt-3 flex items-baseline justify-between border-border/40 border-t pt-2">
												<div className="flex flex-col">
													{hasOffer && prod.originalPrice > prod.price && (
														<span className="font-semibold text-[11px] text-muted-foreground line-through">
															₹
															{Number(prod.originalPrice).toLocaleString(
																undefined,
																{
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																},
															)}
														</span>
													)}
													<span
														className={`font-bold text-base ${
															hasOffer
																? "font-extrabold text-red-600 dark:text-red-400"
																: "text-emerald-600 dark:text-emerald-400"
														}`}
													>
														₹
														{Number(prod.price || 0).toLocaleString(undefined, {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</span>
												</div>
												{prod.unit && (
													<span className="text-muted-foreground text-xs">
														/ {prod.unit}
													</span>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</motion.div>
			)}

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
							<Link href="/customer/products">
								<Card className="h-full cursor-pointer transition-colors hover:border-green-500/40 hover:shadow">
									<CardContent className="flex flex-col items-start gap-3 p-5">
										<div className="rounded-full bg-green-500/10 p-2.5">
											<PackageIcon className="h-5 w-5 text-green-500" />
										</div>
										<div>
											<h4 className="font-bold text-sm">{t.placeOrder}</h4>
											<p className="mt-1 text-muted-foreground text-xs">
												{t.placeOrderDesc}
											</p>
										</div>
									</CardContent>
								</Card>
							</Link>

							{/* History */}
							<Link href="/customer/orders">
								<Card className="h-full cursor-pointer transition-colors hover:border-blue-500/40 hover:shadow">
									<CardContent className="flex flex-col items-start gap-3 p-5">
										<div className="rounded-full bg-blue-500/10 p-2.5">
											<LayoutDashboardIcon className="h-5 w-5 text-blue-500" />
										</div>
										<div>
											<h4 className="font-bold text-sm">{t.viewOrders}</h4>
											<p className="mt-1 text-muted-foreground text-xs">
												{t.viewOrdersDesc}
											</p>
										</div>
									</CardContent>
								</Card>
							</Link>

							{/* Profile */}
							<Link href="/customer/profile">
								<Card className="h-full cursor-pointer transition-colors hover:border-purple-500/40 hover:shadow">
									<CardContent className="flex flex-col items-start gap-3 p-5">
										<div className="rounded-full bg-purple-500/10 p-2.5">
											<UserIcon className="h-5 w-5 text-purple-500" />
										</div>
										<div>
											<h4 className="font-bold text-sm">{t.myProfile}</h4>
											<p className="mt-1 text-muted-foreground text-xs">
												{t.myProfileDesc}
											</p>
										</div>
									</CardContent>
								</Card>
							</Link>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</PageTransition>
	);
}
