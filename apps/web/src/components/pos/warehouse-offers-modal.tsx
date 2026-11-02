"use client";

import {
	Calendar,
	Loader2,
	Percent,
	Search,
	ShoppingCart,
	Sparkles,
	Tag,
	TrendingDown,
	X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getLocalizedProductName } from "@/app/(dashboards)/sales/pos/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

export interface WarehouseOfferItem {
	id: string;
	name: string;
	originalPrice: number;
	currentPrice: number;
	stock: number;
	unit: string;
	barcode?: string | null;
	sku?: string | null;
	category?: string | null;
	hasOffer: boolean;
	offer?: {
		id: string;
		discountPercent: number;
		discountedPrice: number;
		reason?: string | null;
		notes?: string | null;
		discountType?: string;
	} | null;
}

interface WarehouseOffersModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddToCart?: (product: WarehouseOfferItem) => void;
	initialDate?: string;
}

export function WarehouseOffersModal({
	open,
	onOpenChange,
	onAddToCart,
	initialDate,
}: WarehouseOffersModalProps) {
	const locale = useLocale();
	const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
	const [selectedDate, setSelectedDate] = useState<string>(
		initialDate || todayStr,
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [activeTab, setActiveTab] = useState<"active" | "all">("active");

	// Sync initialDate if changed from parent
	const effectiveDate = selectedDate || todayStr;

	// Query daily offers from backend trpc
	const { data: offersData, isLoading } =
		trpc.discounts.listDailyOffers.useQuery(
			{
				date: effectiveDate,
				search: searchQuery || undefined,
				category: selectedCategory !== "all" ? selectedCategory : undefined,
				status: activeTab === "active" ? "active" : "all",
			},
			{
				enabled: open,
				refetchOnWindowFocus: true,
			},
		);

	// Query summary statistics
	const { data: stats } = trpc.discounts.getDailyOfferStats.useQuery(
		{ date: effectiveDate },
		{ enabled: open },
	);

	const categories = useMemo(() => {
		if (!offersData) return [];
		const cats = new Set<string>();
		for (const item of offersData) {
			if (item.category) cats.add(item.category);
		}
		return Array.from(cats).sort();
	}, [offersData]);

	const activeOffersCount = stats?.totalActiveOffers ?? 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] w-[95vw] min-w-0 max-w-4xl flex-col gap-0 overflow-hidden border-border bg-white p-0 shadow-2xl sm:max-w-4xl dark:bg-slate-900">
				{/* Pinned Modal Header */}
				<DialogHeader className="shrink-0 border-border/60 border-b bg-gradient-to-r from-amber-500/10 via-background to-emerald-500/10 p-4 pb-3 text-left sm:p-5">
					<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div className="flex items-center gap-2.5">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
								<Sparkles className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<DialogTitle className="font-bold text-base text-foreground sm:text-lg">
										{locale === "hi"
											? "गोदाम दैनिक ऑफ़र और छूट"
											: "Warehouse Daily Offers & Discounts"}
									</DialogTitle>
									<Badge
										variant="outline"
										className="border-amber-500/40 bg-amber-500/15 font-bold text-[11px] text-amber-800 dark:text-amber-300"
									>
										{activeOffersCount}{" "}
										{locale === "hi" ? "सक्रिय ऑफ़र" : "Active Offers"}
									</Badge>
								</div>
								<DialogDescription className="mt-0.5 text-muted-foreground text-xs">
									{locale === "hi"
										? "गोदाम द्वारा निर्धारित विशेष दैनिक छूट और उत्पाद ऑफ़र"
										: "Live promotional discounts & special rates configured by the Warehouse team"}
								</DialogDescription>
							</div>
						</div>

						{/* Date Picker Selector */}
						<div className="flex shrink-0 items-center gap-1.5 self-start sm:self-center">
							<div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs shadow-2xs">
								<Calendar className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
								<span className="hidden font-semibold text-[11px] text-muted-foreground sm:inline">
									{locale === "hi" ? "तारीख:" : "Offer Date:"}
								</span>
								<input
									type="date"
									value={effectiveDate}
									onChange={(e) => setSelectedDate(e.target.value)}
									className="cursor-pointer border-none bg-transparent p-0 font-bold text-foreground text-xs focus:outline-none dark:text-slate-100"
								/>
								{effectiveDate !== todayStr && (
									<button
										type="button"
										onClick={() => setSelectedDate(todayStr)}
										className="ml-1 rounded-full px-1 font-extrabold text-[10px] text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/60"
										title="Reset to today"
									>
										Today
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Top Summary Stats Bar */}
					<div className="mt-3 flex flex-wrap items-center gap-2 border-border/40 border-t pt-2 text-xs">
						<div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
							<Tag className="h-3 w-3 text-amber-600" />
							<span>
								{locale === "hi" ? "सक्रिय उत्पाद:" : "Discounted Products:"}{" "}
								<strong>{activeOffersCount}</strong>
							</span>
						</div>
						<div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
							<Percent className="h-3 w-3 text-emerald-600" />
							<span>
								{locale === "hi" ? "औसत छूट:" : "Average Discount:"}{" "}
								<strong>{stats?.avgDiscountPercent ?? 0}%</strong>
							</span>
						</div>
						<div className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
							<TrendingDown className="h-3 w-3 text-blue-600" />
							<span>
								{locale === "hi" ? "यूनिट बचत:" : "Max Unit Savings:"} up to{" "}
								<strong>
									₹{Number(stats?.totalSavingsPerUnit ?? 0).toFixed(2)}
								</strong>
							</span>
						</div>
					</div>
				</DialogHeader>

				{/* Search & Filter Bar */}
				<div className="flex shrink-0 flex-col items-stretch justify-between gap-2 border-border/60 border-b bg-muted/20 p-3 sm:flex-row sm:items-center">
					{/* Search Input */}
					<div className="relative min-w-0 flex-1">
						<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={
								locale === "hi"
									? "उत्पाद का नाम, SKU या बारकोड खोजें..."
									: "Search discounted products by name, SKU, or barcode..."
							}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-8.5 bg-background pl-8 font-medium text-xs"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						)}
					</div>

					<div className="flex shrink-0 items-center gap-1.5">
						{/* Category Filter */}
						<select
							className="h-8.5 truncate rounded-md border border-input bg-background px-2 font-semibold text-foreground text-xs focus:ring-1 focus:ring-primary"
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
						>
							<option value="all">
								{locale === "hi" ? "सभी श्रेणियां" : "All Categories"}
							</option>
							{categories.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>

						{/* Active Offers vs All Catalog Tab Toggle */}
						<div className="flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
							<button
								type="button"
								onClick={() => setActiveTab("active")}
								className={`rounded-md px-2.5 py-1 font-bold text-xs transition-colors ${
									activeTab === "active"
										? "bg-amber-500 text-white shadow-2xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{locale === "hi" ? "केवल ऑफ़र" : "Offers Only"}
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("all")}
								className={`rounded-md px-2.5 py-1 font-bold text-xs transition-colors ${
									activeTab === "all"
										? "bg-slate-900 text-white shadow-2xs dark:bg-slate-100 dark:text-slate-900"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{locale === "hi" ? "पूरा कैटलॉग" : "All Items"}
							</button>
						</div>
					</div>
				</div>

				{/* Scrollable Offers List */}
				<div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
							<Loader2 className="h-7 w-7 animate-spin text-amber-500" />
							<span className="font-semibold text-xs">
								{locale === "hi"
									? "गोदाम ऑफ़र लोड हो रहे हैं..."
									: "Loading warehouse offers..."}
							</span>
						</div>
					) : !offersData || offersData.length === 0 ? (
						<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
							<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
								<Tag className="h-7 w-7" />
							</div>
							<h3 className="font-bold text-foreground text-sm sm:text-base">
								{locale === "hi"
									? "इस तारीख के लिए कोई सक्रिय ऑफ़र नहीं मिला"
									: `No Active Warehouse Offers on ${effectiveDate}`}
							</h3>
							<p className="mt-1 max-w-md text-muted-foreground text-xs">
								{locale === "hi"
									? "गोदाम प्रबंधक द्वारा इस तारीख पर कोई दैनिक छूट नहीं जोड़ी गई है। जैसे ही वे ऑफ़र जोड़ेंगे, वे यहाँ तुरंत दिखाई देंगे।"
									: "Warehouse managers have not scheduled promotional discounts for this date. Switch dates or check back once offers are configured."}
							</p>
							{activeTab === "active" && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setActiveTab("all")}
									className="mt-3 text-xs"
								>
									{locale === "hi"
										? "सभी उत्पाद कैटलॉग देखें"
										: "View Full Catalog Instead"}
								</Button>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
							{offersData.map((item) => {
								const hasOffer = item.hasActiveOffer && item.offer;
								const originalPrice = item.originalPrice;
								const currentPrice = item.currentPrice;
								const discountPercent = item.offer?.discountPercent || 0;
								const stock = item.stock || 0;
								const isOut = stock <= 0;

								return (
									<div
										key={item.id}
										className={`relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
											hasOffer
												? "border-amber-400/60 bg-gradient-to-br from-amber-500/5 via-background to-amber-500/10 shadow-xs dark:border-amber-600/30 dark:bg-amber-950/20"
												: "border-border/60 bg-muted/10 opacity-70"
										}`}
									>
										{/* Top Info */}
										<div>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-1.5">
														<span className="truncate font-bold text-foreground text-sm leading-snug">
															{getLocalizedProductName(item.name, locale)}
														</span>
														{hasOffer && (
															<Badge className="bg-amber-500 px-1.5 py-0 font-extrabold text-[10px] text-white uppercase hover:bg-amber-600">
																✨ {discountPercent}% OFF
															</Badge>
														)}
													</div>
													<div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
														<span className="font-mono">SKU: {item.sku}</span>
														<span>&bull;</span>
														<span>{item.category}</span>
														<span>&bull;</span>
														<Badge
															variant="outline"
															className={`px-1.5 py-0 font-semibold text-[10px] ${
																isOut
																	? "border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-950/30"
																	: stock <= 5
																		? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30"
																		: "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
															}`}
														>
															{isOut
																? "Out of Stock (0)"
																: `${stock} ${item.unit} in stock`}
														</Badge>
													</div>
												</div>
											</div>

											{/* Reason / Notes Banner */}
											{hasOffer && item.offer?.reason && (
												<div className="mt-2 flex items-center justify-between gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-900 dark:text-amber-200">
													<div className="flex items-center gap-1 truncate">
														<Tag className="h-3 w-3 shrink-0 text-amber-600" />
														<span className="truncate font-semibold">
															{item.offer.reason}
														</span>
													</div>
													{item.offer.notes && (
														<span className="truncate text-[10px] text-muted-foreground italic">
															({item.offer.notes})
														</span>
													)}
												</div>
											)}
										</div>

										{/* Price & Action Bottom Row */}
										<div className="mt-3 flex items-center justify-between gap-2 border-border/50 border-t pt-2">
											<div className="flex items-baseline gap-2">
												{hasOffer ? (
													<>
														<span className="font-bold text-muted-foreground text-sm line-through decoration-rose-500">
															₹{originalPrice.toFixed(2)}
														</span>
														<span className="font-black text-base text-emerald-600 dark:text-emerald-400">
															₹{currentPrice.toFixed(2)}
														</span>
														<span className="text-[10px] text-muted-foreground">
															/{item.unit}
														</span>
													</>
												) : (
													<span className="font-bold text-foreground text-sm">
														₹{originalPrice.toFixed(2)} /{item.unit}
													</span>
												)}
											</div>

											{/* Add To Cart Button */}
											{onAddToCart && (
												<Button
													type="button"
													size="sm"
													disabled={isOut}
													onClick={() => onAddToCart(item)}
													className={`h-7 gap-1 px-2.5 font-bold text-xs shadow-2xs ${
														hasOffer
															? "bg-amber-500 text-white hover:bg-amber-600"
															: "bg-primary text-primary-foreground hover:bg-primary/90"
													}`}
												>
													<ShoppingCart className="h-3.5 w-3.5" />
													<span>
														{isOut
															? "Out of Stock"
															: locale === "hi"
																? "+ कार्ट में जोड़ें"
																: "+ Add to Order"}
													</span>
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="flex shrink-0 items-center justify-between border-border/60 border-t bg-muted/10 p-3 text-muted-foreground text-xs">
					<span>
						{locale === "hi"
							? "ऑफ़र गोदाम प्रबंधन प्रणाली से सीधे सिंक होते हैं।"
							: "Offers synchronize live from the Warehouse Management panel."}
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						className="h-7 font-semibold text-xs"
					>
						{locale === "hi" ? "बंद करें" : "Close"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
