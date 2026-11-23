"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	BoxIcon,
	CheckCircle2Icon,
	CheckSquareIcon,
	ClipboardCheckIcon,
	Loader2Icon,
	PackageCheckIcon,
	PackageIcon,
	RouteIcon,
	ScaleIcon,
	SearchIcon,
	ShieldCheckIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export interface PackVerificationItem {
	id: number;
	product_id?: number | null;
	productName: string;
	sku?: string;
	barcode?: string;
	unit?: string;
	imageUrl?: string | null;
	quantity?: number;
	quantity_ordered?: number;
	quantity_picked?: number;
	status?: string;
}

export interface PackVerificationParcel {
	id: string;
	pick_list_id?: number;
	order_id: number;
	order_ref: string;
	status: string;
	completed_at?: string;
	customerName?: string;
	customerPhone?: string;
	customerAddress?: string;
	driverName?: string;
	routeName?: string;
	vehiclePlate?: string;
	items: PackVerificationItem[];
}

interface PackVerificationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parcel: PackVerificationParcel | null;
	isSubmitting: boolean;
	onConfirmPack: (data: {
		order_id: number;
		pick_list_id?: number;
		weight: number;
		dimensions: string;
		package_type?: string;
		notes?: string;
	}) => void;
}

export function PackVerificationModal({
	open,
	onOpenChange,
	parcel,
	isSubmitting,
	onConfirmPack,
}: PackVerificationModalProps) {
	const [verifiedItems, setVerifiedItems] = useState<Record<number, boolean>>(
		{},
	);
	const [weight, setWeight] = useState("1.5");
	const [dimensions, setDimensions] = useState("30x20x10 cm");
	const [packageType, setPackageType] = useState("Standard Carton");
	const [searchQuery, setSearchQuery] = useState("");
	const [showOnlyShortages, setShowOnlyShortages] = useState(false);

	// Reset state whenever a new parcel is opened
	useEffect(() => {
		if (parcel && open) {
			setVerifiedItems({});
			setWeight("1.5");
			setDimensions("30x20x10 cm");
			setPackageType("Standard Carton");
			setSearchQuery("");
			setShowOnlyShortages(false);
		}
	}, [parcel, open]);

	const items = useMemo(() => parcel?.items || [], [parcel]);

	const filteredItems = useMemo(() => {
		let list = items;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter(
				(it) =>
					it.productName.toLowerCase().includes(q) ||
					(it.sku && it.sku.toLowerCase().includes(q)) ||
					(it.barcode && it.barcode.toLowerCase().includes(q)),
			);
		}
		if (showOnlyShortages) {
			list = list.filter((it) => {
				const ordered = it.quantity_ordered ?? it.quantity ?? 1;
				const picked = it.quantity_picked ?? it.quantity ?? ordered;
				return picked < ordered;
			});
		}
		return list;
	}, [items, searchQuery, showOnlyShortages]);

	const totalItems = items.length;
	const verifiedCount = useMemo(() => {
		return items.filter((it) => verifiedItems[it.id]).length;
	}, [items, verifiedItems]);

	const hasShortages = useMemo(() => {
		return items.some((it) => {
			const ordered = it.quantity_ordered ?? it.quantity ?? 1;
			const picked = it.quantity_picked ?? it.quantity ?? ordered;
			return picked < ordered;
		});
	}, [items]);

	const allVerified = totalItems > 0 && verifiedCount === totalItems;
	const progressPercent =
		totalItems > 0 ? Math.round((verifiedCount / totalItems) * 100) : 0;

	const toggleItem = (itemId: number) => {
		setVerifiedItems((prev) => ({
			...prev,
			[itemId]: !prev[itemId],
		}));
	};

	const handleVerifyAll = () => {
		const next: Record<number, boolean> = {};
		for (const it of items) {
			next[it.id] = true;
		}
		setVerifiedItems(next);
		toast.success(`सभी ${items.length} आइटम सत्यापित मार्क कर दिए गए हैं!`);
	};

	const handleClearAll = () => {
		setVerifiedItems({});
	};

	const handleSubmit = () => {
		if (!parcel) return;

		if (!allVerified) {
			const unverifiedCount = totalItems - verifiedCount;
			const proceed = window.confirm(
				`चेतावनी: अभी भी ${unverifiedCount} आइटम असत्यापित (Unverified) हैं। क्या आप फिर भी पार्सल सील और पैक करना चाहते हैं?`,
			);
			if (!proceed) return;
		}

		const numWeight = Number.parseFloat(weight) || 1.5;
		onConfirmPack({
			order_id: parcel.order_id,
			pick_list_id: parcel.pick_list_id,
			weight: numWeight,
			dimensions: dimensions.trim() || "30x20x10 cm",
			package_type: packageType,
		});
	};

	if (!parcel) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0 sm:max-h-[88vh]">
				{/* Header Section */}
				<div className="border-border/60 border-b bg-muted/30 px-6 py-4">
					<DialogHeader>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
									<PackageCheckIcon className="h-5 w-5" />
								</div>
								<div>
									<DialogTitle className="font-bold text-foreground text-lg tracking-tight sm:text-xl">
										Item Verification & Pack Parcel (आइटम सत्यापन एवं पैकिंग)
									</DialogTitle>
									<DialogDescription className="text-muted-foreground text-xs">
										सेल्स बिल और पिकर द्वारा एकत्रित सामान का मिलान करके सील करें
									</DialogDescription>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<Badge
									variant="outline"
									className="border-blue-300 bg-blue-50 font-mono font-semibold text-blue-800 text-xs dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
								>
									{parcel.order_ref}
								</Badge>
								{parcel.id && (
									<Badge
										variant="outline"
										className="border-gray-200 bg-white font-mono text-gray-700 text-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
									>
										{parcel.id}
									</Badge>
								)}
							</div>
						</div>
					</DialogHeader>

					{/* Customer & Route Quick Info Bar */}
					<div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-card p-3 text-xs sm:grid-cols-3">
						<div className="flex items-center gap-2 truncate">
							<UserIcon className="h-4 w-4 shrink-0 text-blue-600" />
							<span className="truncate">
								<span className="text-muted-foreground">ग्राहक: </span>
								<strong className="text-foreground">
									{parcel.customerName || "Customer"}
								</strong>
							</span>
						</div>
						<div className="flex items-center gap-2 truncate">
							<RouteIcon className="h-4 w-4 shrink-0 text-emerald-600" />
							<span className="truncate">
								<span className="text-muted-foreground">रूट: </span>
								<strong className="text-foreground">
									{parcel.routeName || "Standard Route"}
								</strong>
							</span>
						</div>
						<div className="flex items-center gap-2 truncate">
							<TruckIcon className="h-4 w-4 shrink-0 text-purple-600" />
							<span className="truncate">
								<span className="text-muted-foreground">वाहन / ड्राइवर: </span>
								<strong className="text-foreground">
									{parcel.vehiclePlate && parcel.vehiclePlate !== "N/A"
										? parcel.vehiclePlate
										: parcel.driverName || "Assigned Driver"}
								</strong>
							</span>
						</div>
					</div>
				</div>

				<div className="space-y-4 px-6 py-4">
					{/* Double Verification Protocol Info Banner */}
					<div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50/70 p-3.5 text-indigo-950 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
						<ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
						<div className="space-y-1">
							<p className="font-semibold text-indigo-900 dark:text-indigo-100">
								डबल वेरिफिकेशन प्रोटोकॉल (Packer Double-Check)
							</p>
							<p className="leading-relaxed opacity-90">
								सेल्सपर्सन के बिल में दर्शाए गए प्रत्येक उत्पाद और उसकी मात्रा को पिकर द्वारा
								लाए गए सामान से गिनकर चेक करें। सही होने पर{" "}
								<strong>वेरिफाई (✓)</strong> पर क्लिक करें।
							</p>
						</div>
					</div>

					{/* Verification Progress Bar & Quick Actions */}
					<div className="rounded-lg border border-border/80 bg-card p-3 shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-2 pb-2">
							<div className="flex items-center gap-2">
								<ClipboardCheckIcon className="h-4 w-4 text-emerald-600" />
								<span className="font-semibold text-foreground text-sm">
									सत्यापन प्रगति: {verifiedCount} / {totalItems} आइटम (
									{progressPercent}%)
								</span>
								{allVerified && (
									<Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
										✓ ऑल वेरिफाइड
									</Badge>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={handleVerifyAll}
									className="h-8 border-emerald-300 text-emerald-700 text-xs hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
								>
									<CheckSquareIcon className="mr-1 h-3.5 w-3.5" /> सभी वेरिफाई करें
								</Button>
								{verifiedCount > 0 && (
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={handleClearAll}
										className="h-8 text-muted-foreground text-xs hover:text-foreground"
									>
										रीसेट
									</Button>
								)}
							</div>
						</div>

						{/* Progress Bar Track */}
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full transition-all duration-300 ${
									allVerified ? "bg-emerald-500" : "bg-blue-600"
								}`}
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
					</div>

					{/* Item Search & Shortage Filter */}
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="relative min-w-[200px] flex-1 sm:max-w-xs">
							<SearchIcon className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
							<input
								type="text"
								placeholder="उत्पाद या SKU खोजें..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-8 w-full rounded-md border border-input bg-background pr-3 pl-8 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>

						{hasShortages && (
							<Button
								type="button"
								size="sm"
								variant={showOnlyShortages ? "destructive" : "outline"}
								onClick={() => setShowOnlyShortages(!showOnlyShortages)}
								className="h-8 gap-1 text-xs"
							>
								<AlertTriangleIcon className="h-3.5 w-3.5" />
								{showOnlyShortages ? "सभी दिखाएं" : "केवल कमी वाले आइटम दिखाएं"}
							</Button>
						)}
					</div>

					{/* Item Verification List */}
					<div className="space-y-2.5">
						<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							सेल्स बिल आइटम सूची ({filteredItems.length} उत्पाद)
						</p>

						{filteredItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground text-xs">
								<PackageIcon className="mb-1.5 h-6 w-6 opacity-40" />
								<span>कोई उत्पाद नहीं मिला</span>
							</div>
						) : (
							<div className="space-y-2">
								{filteredItems.map((item, idx) => {
									const isVerified = !!verifiedItems[item.id];
									const orderedQty =
										item.quantity_ordered ?? item.quantity ?? 1;
									const pickedQty =
										item.quantity_picked ?? item.quantity ?? orderedQty;
									const isShortage = pickedQty < orderedQty;
									const unit = item.unit || "Pcs";

									return (
										<button
											type="button"
											key={item.id || idx}
											onClick={() => toggleItem(item.id)}
											className={`group relative flex w-full cursor-pointer flex-col gap-3 rounded-lg border p-3 text-left transition-all sm:flex-row sm:items-center sm:justify-between ${
												isVerified
													? "border-emerald-300 bg-emerald-50/40 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/20"
													: "border-border/80 bg-card hover:border-blue-300 hover:bg-muted/30"
											}`}
										>
											{/* Left: Checkbox & Product Info */}
											<div className="flex items-center gap-3">
												<div
													className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
														isVerified
															? "border-emerald-600 bg-emerald-600 text-white"
															: "border-muted-foreground/40 bg-background text-transparent group-hover:border-blue-500"
													}`}
												>
													<CheckCircle2Icon className="h-4 w-4" />
												</div>

												{/* Thumbnail */}
												<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/40">
													{item.imageUrl ? (
														<img
															src={item.imageUrl}
															alt={item.productName}
															className="h-full w-full object-cover"
															onError={(e) => {
																(e.target as HTMLElement).style.display =
																	"none";
															}}
														/>
													) : (
														<PackageIcon className="h-6 w-6 text-muted-foreground/60" />
													)}
												</div>

												{/* Title & SKU */}
												<div className="space-y-0.5">
													<p className="font-semibold text-foreground text-sm leading-snug">
														{item.productName}
													</p>
													<div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
														{item.sku && (
															<span className="font-medium font-mono">
																SKU: {item.sku}
															</span>
														)}
														{item.barcode && (
															<span>• Barcode: {item.barcode}</span>
														)}
														<span>• {unit}</span>
													</div>
												</div>
											</div>

											{/* Right: Quantities & Verification Status */}
											<div className="flex items-center justify-between gap-4 pl-9 sm:justify-end sm:pl-0">
												{/* Billed Quantity */}
												<div className="text-right">
													<span className="block text-[11px] text-muted-foreground">
														सेल्स बिल मात्रा:
													</span>
													<span className="font-bold text-foreground text-sm">
														{orderedQty} {unit}
													</span>
												</div>

												{/* Picked Quantity */}
												<div className="text-right">
													<span className="block text-[11px] text-muted-foreground">
														पिकर मात्रा:
													</span>
													<span
														className={`font-bold text-sm ${
															isShortage
																? "text-amber-600 dark:text-amber-400"
																: "text-blue-600 dark:text-blue-400"
														}`}
													>
														{pickedQty} {unit}
													</span>
												</div>

												{/* Match / Shortage Badge */}
												<div>
													{isShortage ? (
														<Badge
															variant="outline"
															className="border-amber-300 bg-amber-50 font-semibold text-amber-800 text-[11px] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
														>
															⚠️ कमी (-{orderedQty - pickedQty})
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
														>
															✓ पूर्ण
														</Badge>
													)}
												</div>

												{/* Verification State Pill */}
												<div>
													{isVerified ? (
														<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800 text-xs dark:bg-emerald-900/40 dark:text-emerald-300">
															<CheckCircle2Icon className="h-3.5 w-3.5" /> चेक
															किया
														</span>
													) : (
														<span className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-gray-500 text-xs hover:border-gray-400 dark:border-gray-700 dark:text-gray-400">
															चेक करें
														</span>
													)}
												</div>
											</div>
										</button>
									);
								})}
							</div>
						)}
					</div>

					{/* Packaging Specifications Section */}
					<div className="rounded-lg border border-border/80 bg-muted/20 p-4">
						<p className="mb-2 font-semibold text-foreground text-xs uppercase tracking-wider">
							पार्सल पैकेजिंग विवरण (Package Specifications)
						</p>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div className="space-y-1">
								<label
									htmlFor="parcel-weight"
									className="flex items-center gap-1 font-semibold text-foreground text-xs"
								>
									<ScaleIcon className="h-3.5 w-3.5 text-blue-600" />
									पार्सल वजन / Parcel Weight (Kg)
								</label>
								<input
									id="parcel-weight"
									type="number"
									step="0.1"
									min="0.1"
									className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
									value={weight}
									onChange={(e) => setWeight(e.target.value)}
								/>
							</div>

							<div className="space-y-1">
								<label
									htmlFor="parcel-dimensions"
									className="flex items-center gap-1 font-semibold text-foreground text-xs"
								>
									<BoxIcon className="h-3.5 w-3.5 text-blue-600" />
									बॉक्स माप / Dimensions (L×W×H)
								</label>
								<input
									id="parcel-dimensions"
									type="text"
									placeholder="e.g. 30x20x10 cm"
									className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
									value={dimensions}
									onChange={(e) => setDimensions(e.target.value)}
								/>
							</div>

							<div className="space-y-1">
								<label
									htmlFor="parcel-package-type"
									className="flex items-center gap-1 font-semibold text-foreground text-xs"
								>
									<PackageIcon className="h-3.5 w-3.5 text-blue-600" />
									पैकेजिंग प्रकार / Package Type
								</label>
								<select
									id="parcel-package-type"
									className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
									value={packageType}
									onChange={(e) => setPackageType(e.target.value)}
								>
									<option value="Standard Carton">
										Standard Carton (मानक कार्टन)
									</option>
									<option value="Poly Bag / Pouch">
										Poly Bag / Pouch (थैली / पाउच)
									</option>
									<option value="Heavy Duty Box">
										Heavy Duty Box (मजबूत बक्सा)
									</option>
									<option value="Gunny Bag">Gunny Bag (बोरी)</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				{/* Footer with Actions */}
				<DialogFooter className="border-border/60 border-t bg-muted/20 px-6 py-3">
					<div className="flex w-full flex-col-reverse items-center justify-between gap-2 sm:flex-row">
						<div className="text-muted-foreground text-xs">
							{!allVerified && (
								<span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
									<AlertCircleIcon className="h-3.5 w-3.5" />
									{totalItems - verifiedCount} आइटम का सत्यापन अभी बाकी है
								</span>
							)}
							{allVerified && (
								<span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
									<CheckCircle2Icon className="h-3.5 w-3.5" />
									सभी {totalItems} आइटम सफलतापूर्वक सत्यापित!
								</span>
							)}
						</div>

						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
								className="text-xs"
							>
								रद्द करें (Cancel)
							</Button>

							<Button
								type="button"
								onClick={handleSubmit}
								disabled={isSubmitting}
								className={`text-xs shadow-sm transition-all ${
									allVerified
										? "bg-emerald-600 text-white hover:bg-emerald-700"
										: "bg-blue-600 text-white hover:bg-blue-700"
								}`}
							>
								{isSubmitting ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										पैकिंग सहेज रहे हैं...
									</>
								) : (
									<>
										<BoxIcon className="mr-1.5 h-4 w-4" />
										सत्यापित करें और पैक करें (Confirm & Pack Parcel)
									</>
								)}
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
