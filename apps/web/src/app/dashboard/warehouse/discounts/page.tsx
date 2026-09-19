"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	ArrowRightIcon,
	BoxesIcon,
	CalendarDaysIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	Edit3Icon,
	FilterIcon,
	IndianRupeeIcon,
	InfoIcon,
	Loader2Icon,
	PackageCheckIcon,
	PencilIcon,
	PercentIcon,
	PlusIcon,
	RefreshCwIcon,
	SaveIcon,
	SearchIcon,
	SparklesIcon,
	TagIcon,
	Trash2Icon,
	TrendingDownIcon,
	XCircleIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const PRESET_DISCOUNT_REASONS = [
	"Excess Stock Clearance (अतिरिक्त स्टॉक निकासी)",
	"Near Expiry Promotion (नजदीकी एक्सपायरी छूट)",
	"Daily Special Scheme / Flash Offer (दैनिक विशेष स्कीम)",
	"Festive Season Discount (त्योहारी विशेष ऑफर)",
	"Volume / Wholesale Push (थोक बिक्री प्रोत्साहन)",
	"Manager Approved Special Price (मैनेजर विशेष मूल्य)",
	"Damaged Packaging Clearance (पैकेजिंग क्षति छूट)",
	"Custom / Other Reason",
];

export default function WarehouseDiscountsPage() {
	const trpc = useTRPC();
	const locale = useLocale();

	// Today's date in YYYY-MM-DD
	const todayDateStr = useMemo(() => {
		return new Date().toISOString().split("T")[0];
	}, []);

	// State
	const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "no_offer">("all");

	// Discount Modal State
	const [editingProduct, setEditingProduct] = useState<any>(null);
	const [offerPriceInput, setOfferPriceInput] = useState<string>("");
	const [discountPercentInput, setDiscountPercentInput] = useState<string>("");
	const [selectedReason, setSelectedReason] = useState<string>(PRESET_DISCOUNT_REASONS[0]);
	const [customReason, setCustomReason] = useState<string>("");
	const [notesInput, setNotesInput] = useState<string>("");
	const [offerDate, setOfferDate] = useState<string>(todayDateStr);

	// Remove Offer Dialog
	const [deletingOffer, setDeletingOffer] = useState<any>(null);

	// Queries
	const {
		data: productsData,
		isLoading: productsLoading,
		isFetching,
		refetch,
	} = trpc.discounts.listDailyOffers.useQuery({
		date: selectedDate,
		search: searchQuery || undefined,
	});

	const { data: stats, refetch: refetchStats } =
		trpc.discounts.getDailyOfferStats.useQuery({
			date: selectedDate,
		});

	// Mutations
	const setOfferMutation = trpc.discounts.setDailyOffer.useMutation({
		onSuccess: () => {
			toast.success(
				`Daily offer saved for ${editingProduct?.name || "product"}! Reflected across Sales POS & Dashboard.`,
			);
			refetch();
			refetchStats();
			setEditingProduct(null);
		},
		onError: (err) => {
			toast.error(`Failed to save offer: ${err.message}`);
		},
	});

	const removeOfferMutation = trpc.discounts.removeDailyOffer.useMutation({
		onSuccess: () => {
			toast.success("Daily discount offer removed.");
			refetch();
			refetchStats();
			setDeletingOffer(null);
		},
		onError: (err) => {
			toast.error(`Failed to remove offer: ${err.message}`);
		},
	});

	// Open Edit Modal for a Product
	const openOfferModal = (product: any) => {
		setEditingProduct(product);
		setOfferDate(selectedDate);
		const orig = product.originalPrice || 0;

		if (product.hasActiveOffer && product.offer) {
			setOfferPriceInput(product.offer.discountedPrice?.toString() || "");
			setDiscountPercentInput(product.offer.discountPercent?.toString() || "");
			if (PRESET_DISCOUNT_REASONS.includes(product.offer.reason)) {
				setSelectedReason(product.offer.reason);
				setCustomReason("");
			} else {
				setSelectedReason("Custom / Other Reason");
				setCustomReason(product.offer.reason || "");
			}
			setNotesInput(product.offer.notes || "");
		} else {
			// Default 10% off
			const defaultDiscount = orig > 0 ? (orig * 0.9).toFixed(2) : "0";
			setOfferPriceInput(defaultDiscount);
			setDiscountPercentInput("10");
			setSelectedReason(PRESET_DISCOUNT_REASONS[0]);
			setCustomReason("");
			setNotesInput("");
		}
	};

	// Handle price change in modal
	const handlePriceChange = (val: string) => {
		setOfferPriceInput(val);
		const num = Number.parseFloat(val);
		const orig = editingProduct?.originalPrice || 0;
		if (!isNaN(num) && orig > 0) {
			const pct = (((orig - num) / orig) * 100).toFixed(1);
			setDiscountPercentInput(pct);
		}
	};

	// Handle percent change in modal
	const handlePercentChange = (val: string) => {
		setDiscountPercentInput(val);
		const pct = Number.parseFloat(val);
		const orig = editingProduct?.originalPrice || 0;
		if (!isNaN(pct) && orig > 0) {
			const newP = (orig * (1 - pct / 100)).toFixed(2);
			setOfferPriceInput(newP);
		}
	};

	// Submit offer
	const handleSaveOffer = () => {
		if (!editingProduct) return;
		const offerPriceNum = Number.parseFloat(offerPriceInput);
		if (isNaN(offerPriceNum) || offerPriceNum < 0) {
			toast.error("Please enter a valid offer price");
			return;
		}

		const finalReason =
			selectedReason === "Custom / Other Reason"
				? customReason.trim()
				: selectedReason;

		if (!finalReason) {
			toast.error("Please specify a reason for this daily discount");
			return;
		}

		setOfferMutation.mutate({
			productId: editingProduct.id,
			effectiveDate: offerDate,
			discountType: "fixed_price",
			discountValue: Number.parseFloat(discountPercentInput) || 0,
			offerPrice: offerPriceNum,
			reason: finalReason,
			notes: notesInput.trim() || undefined,
		});
	};

	// Filter products
	const filteredProducts = useMemo(() => {
		if (!productsData) return [];
		return productsData.filter((p) => {
			if (statusFilter === "active" && !p.hasActiveOffer) return false;
			if (statusFilter === "no_offer" && p.hasActiveOffer) return false;
			return true;
		});
	}, [productsData, statusFilter]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<div className="flex items-center gap-2">
						<TagIcon className="h-6 w-6 text-rose-500" />
						<h1 className="font-bold text-2xl tracking-tight text-foreground sm:text-3xl">
							Daily Product Discount Offers
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						Configure daily promotional prices and product discounts for specific
						dates. Synchronized in real-time across Sales POS & all dashboards.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					{/* Date Selector / Calendar Header */}
					<div className="flex items-center gap-2 rounded-lg border bg-card p-1.5 shadow-sm">
						<CalendarIcon className="h-4 w-4 text-rose-500" />
						<Label htmlFor="targetDate" className="font-medium text-xs text-muted-foreground">
							Active Date:
						</Label>
						<Input
							id="targetDate"
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="h-8 w-36 border-0 bg-transparent p-0 font-bold font-mono text-sm focus-visible:ring-0"
						/>
						{selectedDate === todayDateStr && (
							<Badge variant="outline" className="border-rose-200 bg-rose-50 font-semibold text-rose-700 text-xs dark:bg-rose-950/40 dark:text-rose-400">
								TODAY
							</Badge>
						)}
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetch();
							refetchStats();
						}}
						disabled={isFetching}
						className="gap-1.5"
					>
						<RefreshCwIcon
							className={`h-4 w-4 ${isFetching ? "animate-spin text-rose-500" : ""}`}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="border-border/60 bg-card/80 shadow-sm">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Active Offers Today
								</p>
								<h3 className="mt-1.5 font-bold text-2xl text-foreground sm:text-3xl">
									{stats?.totalActiveOffers ?? 0}
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
								<TagIcon className="h-6 w-6" />
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Products with special price for {selectedDate}
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/80 shadow-sm">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Avg. Discount
								</p>
								<h3 className="mt-1.5 font-bold text-2xl text-emerald-600 sm:text-3xl">
									{stats?.avgDiscountPercent ?? 0}%
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
								<PercentIcon className="h-6 w-6" />
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Average discount margin applied
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/80 shadow-sm">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Unit Savings (Max)
								</p>
								<h3 className="mt-1.5 font-bold text-2xl text-blue-600 sm:text-3xl">
									₹{stats?.totalSavingsPerUnit?.toFixed(2) ?? "0.00"}
								</h3>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
								<TrendingDownIcon className="h-6 w-6" />
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Combined price reduction per unit
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/80 shadow-sm">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									POS Live Status
								</p>
								<div className="mt-1.5 flex items-center gap-1.5 font-bold text-emerald-600 text-lg sm:text-xl">
									<CheckCircle2Icon className="h-5 w-5" />
									<span>Auto-Synced</span>
								</div>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
								<SparklesIcon className="h-6 w-6" />
							</div>
						</div>
						<p className="mt-2 text-muted-foreground text-xs">
							Shows original + strike & offer price in POS
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Products Table with Search & Status Filters */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="p-4 sm:p-6">
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div>
							<CardTitle className="font-bold text-lg text-foreground">
								Products & Daily Offers Catalog
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Select any product to set today's offer price or edit existing discount reasons.
							</CardDescription>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{/* Filter tabs */}
							<div className="flex items-center rounded-lg border bg-muted/30 p-1 text-xs">
								<button
									type="button"
									onClick={() => setStatusFilter("all")}
									className={`rounded-md px-3 py-1 font-semibold transition-colors ${
										statusFilter === "all"
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									All Products ({productsData?.length || 0})
								</button>
								<button
									type="button"
									onClick={() => setStatusFilter("active")}
									className={`flex items-center gap-1 rounded-md px-3 py-1 font-semibold transition-colors ${
										statusFilter === "active"
											? "bg-rose-500 text-white shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<TagIcon className="h-3 w-3" />
									Active Offers ({stats?.totalActiveOffers || 0})
								</button>
								<button
									type="button"
									onClick={() => setStatusFilter("no_offer")}
									className={`rounded-md px-3 py-1 font-semibold transition-colors ${
										statusFilter === "no_offer"
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Standard Price
								</button>
							</div>

							{/* Search input */}
							<div className="relative min-w-[220px]">
								<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search product, SKU or barcode..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-9 pl-9 text-xs"
								/>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{productsLoading ? (
						<div className="flex h-64 flex-col items-center justify-center gap-3">
							<Loader2Icon className="h-8 w-8 animate-spin text-rose-500" />
							<p className="font-medium text-muted-foreground text-sm">
								Loading products & daily offers...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										<TableHead className="font-semibold text-xs">Product Details</TableHead>
										<TableHead className="font-semibold text-xs">SKU / Barcode</TableHead>
										<TableHead className="font-semibold text-xs">Stock Available</TableHead>
										<TableHead className="font-semibold text-xs">Base Price</TableHead>
										<TableHead className="font-semibold text-xs">Today's Offer Price</TableHead>
										<TableHead className="font-semibold text-xs">Reason / Scheme</TableHead>
										<TableHead className="text-right font-semibold text-xs">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredProducts.map((p) => (
										<TableRow key={p.id} className="hover:bg-muted/20">
											<TableCell className="py-3">
												<div className="font-semibold text-foreground text-sm">
													{p.name}
												</div>
												<div className="text-muted-foreground text-xs">
													{p.category} • {p.unit}
												</div>
											</TableCell>

											<TableCell className="py-3 font-mono text-xs">
												<div>{p.sku}</div>
												{p.barcode && (
													<span className="text-[11px] text-muted-foreground">
														{p.barcode}
													</span>
												)}
											</TableCell>

											<TableCell className="py-3">
												<Badge
													variant="outline"
													className={`font-semibold text-xs ${
														p.stock > 10
															? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
															: p.stock > 0
																? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
																: "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
													}`}
												>
													{p.stock} {p.unit}
												</Badge>
											</TableCell>

											<TableCell className="py-3 font-mono text-sm">
												<span className="font-medium text-muted-foreground">
													₹{p.originalPrice.toFixed(2)}
												</span>
											</TableCell>

											<TableCell className="py-3">
												{p.hasActiveOffer ? (
													<div className="flex flex-col gap-0.5">
														<div className="flex items-center gap-1.5">
															<span className="line-through text-muted-foreground text-xs">
																₹{p.originalPrice.toFixed(2)}
															</span>
															<span className="font-bold font-mono text-base text-rose-600 dark:text-rose-400">
																₹{p.currentPrice.toFixed(2)}
															</span>
														</div>
														<Badge className="w-fit border-0 bg-rose-500 font-bold text-[10px] text-white shadow-xs">
															{p.offer?.discountPercent ?? 0}% OFF
														</Badge>
													</div>
												) : (
													<span className="text-muted-foreground text-xs italic">
														No active offer
													</span>
												)}
											</TableCell>

											<TableCell className="py-3">
												{p.hasActiveOffer && p.offer?.reason ? (
													<div className="max-w-[220px]">
														<div className="truncate font-medium text-foreground text-xs" title={p.offer.reason}>
															{p.offer.reason}
														</div>
														{p.offer.notes && (
															<div className="truncate text-muted-foreground text-[11px]" title={p.offer.notes}>
																{p.offer.notes}
															</div>
														)}
													</div>
												) : (
													<span className="text-muted-foreground text-xs">-</span>
												)}
											</TableCell>

											<TableCell className="py-3 text-right">
												<div className="flex items-center justify-end gap-1.5">
													<Button
														size="sm"
														variant={p.hasActiveOffer ? "secondary" : "default"}
														onClick={() => openOfferModal(p)}
														className={`gap-1 text-xs shadow-xs ${
															!p.hasActiveOffer
																? "bg-rose-600 text-white hover:bg-rose-700"
																: ""
														}`}
													>
														<PencilIcon className="h-3.5 w-3.5" />
														{p.hasActiveOffer ? "Edit Offer" : "Set Offer"}
													</Button>

													{p.hasActiveOffer && (
														<Button
															size="sm"
															variant="ghost"
															onClick={() => setDeletingOffer(p)}
															className="h-8 w-8 p-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
															title="Remove Offer"
														>
															<Trash2Icon className="h-4 w-4" />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}

									{filteredProducts.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={7}
												className="py-12 text-center text-muted-foreground"
											>
												<TagIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
												<p className="font-bold text-sm">No products found</p>
												<p className="text-xs">
													Try adjusting your search query or filters.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Edit / Set Daily Discount Modal */}
			<Dialog
				open={!!editingProduct}
				onOpenChange={(open) => !open && setEditingProduct(null)}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<TagIcon className="h-5 w-5 text-rose-500" />
							{editingProduct?.hasActiveOffer
								? "Edit Daily Discount Offer"
								: "Set Daily Discount Offer"}
						</DialogTitle>
						<DialogDescription>
							Set promotional pricing for {editingProduct?.name}. This will reflect
							across Sales POS for the selected date.
						</DialogDescription>
					</DialogHeader>

					{editingProduct && (
						<div className="space-y-4 py-2">
							{/* Product Summary */}
							<div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
								<div>
									<span className="block text-muted-foreground">Product</span>
									<span className="font-bold text-foreground truncate block">
										{editingProduct.name}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground">SKU</span>
									<span className="font-mono font-semibold text-foreground">
										{editingProduct.sku}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground">Original Price</span>
									<span className="font-bold font-mono text-foreground text-sm">
										₹{editingProduct.originalPrice.toFixed(2)}
									</span>
								</div>
							</div>

							{/* Offer Date */}
							<div className="space-y-1.5">
								<Label htmlFor="offerDate" className="font-semibold text-xs">
									Applicable Date
								</Label>
								<div className="relative">
									<CalendarDaysIcon className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="offerDate"
										type="date"
										value={offerDate}
										onChange={(e) => setOfferDate(e.target.value)}
										className="pl-9 font-semibold font-mono text-sm"
									/>
								</div>
							</div>

							{/* Price and Discount Inputs */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="offerPrice" className="font-semibold text-xs text-rose-600 dark:text-rose-400">
										Today's Offer Price (₹) *
									</Label>
									<div className="relative">
										<span className="absolute top-2.5 left-3 font-bold text-muted-foreground text-sm">
											₹
										</span>
										<Input
											id="offerPrice"
											type="number"
											step="0.01"
											min="0"
											placeholder="0.00"
											value={offerPriceInput}
											onChange={(e) => handlePriceChange(e.target.value)}
											className="pl-8 font-bold font-mono text-base text-rose-600 dark:text-rose-400"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="discPercent" className="font-semibold text-xs">
										Discount Percent (%)
									</Label>
									<div className="relative">
										<Input
											id="discPercent"
											type="number"
											step="0.1"
											min="0"
											max="100"
											placeholder="e.g. 15"
											value={discountPercentInput}
											onChange={(e) => handlePercentChange(e.target.value)}
											className="font-bold font-mono text-base"
										/>
										<span className="absolute top-2.5 right-3 font-bold text-muted-foreground text-sm">
											%
										</span>
									</div>
								</div>
							</div>

							{/* Reason Selection (MANDATORY) */}
							<div className="space-y-1.5">
								<Label htmlFor="reasonSelect" className="font-semibold text-xs">
									Discount Reason / Scheme (कारण) *
								</Label>
								<select
									id="reasonSelect"
									value={selectedReason}
									onChange={(e) => setSelectedReason(e.target.value)}
									className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-medium text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									{PRESET_DISCOUNT_REASONS.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>

							{/* Custom Reason Input if Custom is selected */}
							{selectedReason === "Custom / Other Reason" && (
								<div className="space-y-1.5">
									<Label htmlFor="customReason" className="font-semibold text-xs">
										Specify Custom Reason *
									</Label>
									<Input
										id="customReason"
										placeholder="e.g. Clearance sale for bulk dispatch or festive promo"
										value={customReason}
										onChange={(e) => setCustomReason(e.target.value)}
										className="text-xs"
									/>
								</div>
							)}

							{/* Internal Notes */}
							<div className="space-y-1.5">
								<Label htmlFor="notesInput" className="font-semibold text-xs text-muted-foreground">
									Additional Notes / Remarks (Optional)
								</Label>
								<Input
									id="notesInput"
									placeholder="e.g. Approved by Warehouse Head for today only"
									value={notesInput}
									onChange={(e) => setNotesInput(e.target.value)}
									className="text-xs"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setEditingProduct(null)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							onClick={handleSaveOffer}
							disabled={setOfferMutation.isPending}
							className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700 text-xs"
						>
							{setOfferMutation.isPending ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								<SaveIcon className="h-4 w-4" />
							)}
							Apply & Sync Offer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Remove Confirmation Dialog */}
			<Dialog
				open={!!deletingOffer}
				onOpenChange={(open) => !open && setDeletingOffer(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive text-lg">
							<AlertTriangleIcon className="h-5 w-5" />
							Remove Daily Discount Offer
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove the special daily discount for{" "}
							<span className="font-semibold text-foreground">
								{deletingOffer?.name}
							</span>
							? The product will revert to its standard price (₹
							{deletingOffer?.originalPrice.toFixed(2)}) across all POS terminals.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setDeletingOffer(null)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!deletingOffer) return;
								removeOfferMutation.mutate({
									productId: deletingOffer.id,
									date: selectedDate,
								});
							}}
							disabled={removeOfferMutation.isPending}
							className="gap-1.5 text-xs"
						>
							{removeOfferMutation.isPending ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								<Trash2Icon className="h-4 w-4" />
							)}
							Remove Offer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
