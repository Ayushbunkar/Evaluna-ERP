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
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangleIcon,
	CalendarDaysIcon,
	HistoryIcon,
	ArrowRightIcon,
	BoxesIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	Edit3Icon,
	FilterIcon,
	IndianRupeeIcon,
	InfoIcon,
	LayersIcon,
	Loader2Icon,
	LockIcon,
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
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { toBilingualProductName } from "@/lib/utils/hindi-transliteration";

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

const STANDARD_CATEGORIES = [
	"General",
	"Beverages",
	"Snacks & Namkeen",
	"Dairy Products",
	"Grocery & Staples",
	"Spices & Masala",
	"Confectionery",
	"Personal Care",
	"Household & Cleaning",
	"Bakery",
	"Packaged Foods",
];

export default function StockPage() {
	const t = useTranslations();
	const trpc = useTRPC();
	const locale = useLocale();

	// Search, Category, and Status Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "in_stock" | "low_stock" | "out_of_stock" | "on_offer"
	>("all");
	const [historicalDate, setHistoricalDate] = useState<string>("");

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 50;

	// Edit Stock & Product Specifications Modal
	const [editItem, setEditItem] = useState<any>(null);
	const [editName, setEditName] = useState<string>("");
	const [editCategory, setEditCategory] = useState<string>("");
	const [editUnit, setEditUnit] = useState<string>("");
	const [editBarcode, setEditBarcode] = useState<string>("");
	const [editSku, setEditSku] = useState<string>("");
	const [editDescription, setEditDescription] = useState<string>("");
	const [editStockQty, setEditStockQty] = useState<string>("");
	const [editReorderLevel, setEditReorderLevel] = useState<string>("10");
	const [editPrice, setEditPrice] = useState<string>("");
	const [editCostPrice, setEditCostPrice] = useState<string>("");
	const [editReason, setEditReason] = useState<string>("");
	const [editPricingDate, setEditPricingDate] = useState<string>("");

	// Manager Delete Product Modal States
	const [deleteItem, setDeleteItem] = useState<any>(null);
	const [deleteReasonPreset, setDeleteReasonPreset] = useState<string>(
		"Discontinued Product (उत्पाद बंद कर दिया गया)",
	);
	const [customDeleteReason, setCustomDeleteReason] = useState<string>("");

	// Daily Offer Modal (Inline from Stock Page)
	const [offerItem, setOfferItem] = useState<any>(null);
	const [offerPriceInput, setOfferPriceInput] = useState<string>("");
	const [discountPercentInput, setDiscountPercentInput] = useState<string>("");
	const [selectedReason, setSelectedReason] = useState<string>(
		PRESET_DISCOUNT_REASONS[0],
	);
	const [customReason, setCustomReason] = useState<string>("");
	const [notesInput, setNotesInput] = useState<string>("");

	// Add New Item Modal States
	const [addItemOpen, setAddItemOpen] = useState(false);
	const [newItem, setNewItem] = useState({
		name: "",
		sku: "",
		price: "",
		costPrice: "",
		category: "General",
		unit: "Pcs",
		initialStock: "10",
		reorderLevel: "10",
		binLocation: "Aisle A - Bin A101",
	});
	const [isCustomCategory, setIsCustomCategory] = useState(false);
	const [customCategoryName, setCustomCategoryName] = useState("");

	// Create New Category Modal States
	const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryDesc, setNewCategoryDesc] = useState("");

	// Categories query from DB
	const { data: dbCategoriesData, refetch: refetchCategories } =
		trpc.categories.list.useQuery();

	// Today string
	const todayDateStr = useMemo(
		() => new Date().toISOString().split("T")[0],
		[],
	);
	const yesterdayDateStr = useMemo(() => {
		const y = new Date();
		y.setDate(y.getDate() - 1);
		return y.toISOString().split("T")[0];
	}, []);

	// Query full inventory catalogue (all ~560 products)
	const {
		data: invData,
		isLoading: invLoading,
		isFetching,
		refetch,
	} = trpc.inventory.list.useQuery({
		search: searchQuery || undefined,
		category: selectedCategory !== "all" ? selectedCategory : undefined,
		status: statusFilter !== "all" ? statusFilter : undefined,
		limit: 1000,
	});

	// Historical stock snapshot query (Past 30 days)
	const {
		data: historicalData,
		isLoading: histLoading,
		isFetching: histFetching,
	} = trpc.inventory.getHistoricalStockSnapshot.useQuery(
		{
			date: historicalDate,
			search: searchQuery || undefined,
			category: selectedCategory !== "all" ? selectedCategory : undefined,
		},
		{
			enabled: Boolean(historicalDate),
		},
	);

	const updateMutation = trpc.inventory.updateStockAndPrice.useMutation({
		onSuccess: () => {
			toast.success(
				"Product specifications & stock updated successfully! Synced across POS & dashboards.",
			);
			refetch();
			setEditItem(null);
		},
		onError: (err) => {
			toast.error(`Failed to update product: ${err.message}`);
		},
	});

	const deleteMutation = trpc.products.delete.useMutation({
		onSuccess: () => {
			toast.success(
				locale === "hi"
					? "उत्पाद डेटाबेस से सफलतापूर्वक हटा दिया गया!"
					: "Product deleted successfully from inventory register!",
			);
			refetch();
			setDeleteItem(null);
			setEditItem(null);
		},
		onError: (err) => {
			toast.error(`Failed to delete product: ${err.message}`);
		},
	});

	const setOfferMutation = trpc.discounts.setDailyOffer.useMutation({
		onSuccess: () => {
			toast.success(
				`Daily discount offer saved for ${offerItem?.product || "product"}! Reflected across Sales POS.`,
			);
			refetch();
			setOfferItem(null);
		},
		onError: (err) => {
			toast.error(`Failed to save offer: ${err.message}`);
		},
	});

	const removeOfferMutation = trpc.discounts.removeDailyOffer.useMutation({
		onSuccess: () => {
			toast.success("Daily discount offer removed.");
			refetch();
			setOfferItem(null);
		},
		onError: (err) => {
			toast.error(`Failed to remove offer: ${err.message}`);
		},
	});

	const addItemMutation = trpc.inventory.addItem.useMutation({
		onSuccess: () => {
			toast.success(
				"New item added to warehouse stock & synchronized across all dashboards!",
			);
			refetch();
			setAddItemOpen(false);
			setNewItem({
				name: "",
				sku: "",
				price: "",
				costPrice: "",
				category: "General",
				unit: "Pcs",
				initialStock: "10",
				reorderLevel: "10",
				binLocation: "Aisle A - Bin A101",
			});
			setIsCustomCategory(false);
			setCustomCategoryName("");
		},
		onError: (err) => {
			toast.error(
				err.message.includes("already exists")
					? `⚠️ ${err.message}`
					: `Failed to add item: ${err.message}`,
			);
		},
	});

	const createCategoryMutation = trpc.categories.create.useMutation({
		onSuccess: (newCat) => {
			toast.success(`Category "${newCat.name}" created successfully!`);
			refetchCategories();
			refetch();
			setSelectedCategory(newCat.name);
			setCurrentPage(1);
			setCreateCategoryOpen(false);
			setNewCategoryName("");
			setNewCategoryDesc("");
		},
		onError: (err) => {
			toast.error(`Failed to create category: ${err.message}`);
		},
	});

	const isHistoricalMode = Boolean(historicalDate);
	const rawItems = useMemo(() => {
		if (isHistoricalMode && historicalData) {
			return historicalData.map((h: any) => ({
				id: h.productId,
				product: h.productName,
				sku: h.sku,
				barcode: h.sku,
				category: h.category,
				unit: h.unit,
				qty_on_hand: h.historicalStock,
				current_live_stock: h.currentStock,
				change_since: h.changeSince,
				reorder_level: h.reorderLevel ?? 10,
				price: Number(h.sellingPrice || 0),
				cost_price: Number(h.costPrice || 0),
				costPrice: Number(h.costPrice || 0),
				baseProcurementPrice: Number(h.costPrice || 0),
				base_procurement_price: Number(h.costPrice || 0),
				marginPercent: h.marginPercent,
				isPriceLocked: h.isPriceLocked,
				lockedAt: h.lockedAt,
				pricingNotes: h.pricingNotes,
				hasActiveOffer: false,
				discount_offer_price: null,
				isHistorical: true,
				historicalDate: h.date,
			}));
		}
		return invData?.items || [];
	}, [isHistoricalMode, historicalData, invData]);

	// Extract unique categories for filter bar
	const categories = useMemo(() => {
		const cats = new Set<string>();
		if (dbCategoriesData?.categories) {
			for (const c of dbCategoriesData.categories) {
				if (c.name && c.name.trim()) {
					cats.add(c.name.trim());
				}
			}
		}
		for (const it of rawItems) {
			if (it.category && it.category.trim()) {
				cats.add(it.category.trim());
			}
		}
		return Array.from(cats).sort();
	}, [rawItems, dbCategoriesData]);

	const allAvailableCategories = useMemo(() => {
		const combined = new Set(STANDARD_CATEGORIES);
		for (const cat of categories) {
			if (cat && cat.trim() && cat !== "all") {
				combined.add(cat.trim());
			}
		}
		return Array.from(combined);
	}, [categories]);

	// Real-time duplicate item detection in Add New Product modal
	const localDuplicateMatch = useMemo(() => {
		const trimmedName = newItem.name.trim().toLowerCase();
		const trimmedSku = newItem.sku.trim().toLowerCase();
		if (!trimmedName && !trimmedSku) return null;

		return rawItems.find((item: any) => {
			const itemName = (item.product || item.name || "").trim().toLowerCase();
			const itemSku = (item.sku || "").trim().toLowerCase();
			const itemBarcode = (item.barcode || "").trim().toLowerCase();

			const nameMatches = trimmedName.length >= 2 && itemName === trimmedName;
			const skuMatches =
				trimmedSku.length >= 2 &&
				(itemSku === trimmedSku || itemBarcode === trimmedSku);

			return nameMatches || skuMatches;
		});
	}, [newItem.name, newItem.sku, rawItems]);

	const { data: serverDuplicateData } =
		trpc.inventory.checkExistingProduct.useQuery(
			{
				name: newItem.name.trim(),
				sku: newItem.sku.trim(),
				branchId: 1,
			},
			{
				enabled:
					addItemOpen &&
					(newItem.name.trim().length >= 2 || newItem.sku.trim().length >= 2),
				staleTime: 4000,
			},
		);

	const duplicateMatch =
		localDuplicateMatch || serverDuplicateData?.product || null;

	// Filtered Items (Client-side additional guard if needed)
	const filteredItems = useMemo(() => {
		let items = rawItems;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			items = items.filter(
				(item) =>
					item.product?.toLowerCase().includes(q) ||
					item.sku?.toLowerCase().includes(q) ||
					item.barcode?.toLowerCase().includes(q) ||
					item.category?.toLowerCase().includes(q),
			);
		}
		if (selectedCategory !== "all") {
			items = items.filter((i) => i.category === selectedCategory);
		}
		if (statusFilter === "in_stock") {
			items = items.filter(
				(i) => (i.qty_on_hand || 0) > (i.reorder_level ?? 10),
			);
		} else if (statusFilter === "low_stock") {
			items = items.filter(
				(i) =>
					(i.qty_on_hand || 0) <= (i.reorder_level ?? 10) &&
					(i.qty_on_hand || 0) > 0,
			);
		} else if (statusFilter === "out_of_stock") {
			items = items.filter((i) => (i.qty_on_hand || 0) <= 0);
		} else if (statusFilter === "on_offer") {
			items = items.filter((i) => i.hasActiveOffer);
		}
		return items;
	}, [rawItems, searchQuery, selectedCategory, statusFilter]);

	// Pagination calculations
	const totalItems = filteredItems.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredItems.slice(start, start + pageSize);
	}, [filteredItems, currentPage, pageSize]);

	// Global Metrics across all items
	const totalValuation = rawItems.reduce(
		(acc, curr) => acc + (curr.qty_on_hand || 0) * (curr.price || 0),
		0,
	);
	const totalUnits = rawItems.reduce(
		(acc, curr) => acc + (curr.qty_on_hand || 0),
		0,
	);
	const lowStockCount = rawItems.filter(
		(i) =>
			(i.qty_on_hand || 0) <= (i.reorder_level ?? 10) &&
			(i.qty_on_hand || 0) > 0,
	).length;
	const outOfStockCount = rawItems.filter(
		(i) => (i.qty_on_hand || 0) <= 0,
	).length;
	const activeOffersCount = rawItems.filter((i) => i.hasActiveOffer).length;

	const handleOpenEdit = (item: any) => {
		setEditItem(item);
		setEditName(item.product || "");
		setEditCategory(item.category || "General");
		setEditUnit(item.unit || "Pcs");
		setEditBarcode(item.barcode || "");
		setEditSku(item.sku || "");
		setEditDescription(item.description || "");
		setEditStockQty(String(item.qty_on_hand ?? 0));
		setEditReorderLevel(String(item.reorder_level ?? 10));
		setEditPrice(String(item.price ?? 0));
		const rawCost =
			item.costPrice ??
			item.cost_price ??
			item.baseProcurementPrice ??
			item.base_procurement_price ??
			"";
		setEditCostPrice(
			rawCost !== "" && rawCost !== undefined && rawCost !== null
				? String(rawCost)
				: "0",
		);
		setEditPricingDate(item.historicalDate || historicalDate || todayDateStr);
		setEditReason("Stock and product details updated by warehouse manager");
	};

	const handleSaveEdit = async () => {
		if (!editItem) return;
		if (!editName.trim()) {
			toast.error(
				locale === "hi"
					? "कृपया उत्पाद का नाम दर्ज करें"
					: "Please enter product name",
			);
			return;
		}

		const qty = Number.parseInt(editStockQty, 10);
		const reorder = Number.parseInt(editReorderLevel, 10);
		const price = Number.parseFloat(editPrice);
		const cost = Number.parseFloat(editCostPrice || "0");

		if (Number.isNaN(qty) || qty < 0) {
			toast.error("Stock quantity must be 0 or higher.");
			return;
		}
		if (Number.isNaN(reorder) || reorder < 0) {
			toast.error("Low stock alert threshold must be 0 or higher.");
			return;
		}
		if (Number.isNaN(price) || price < 0) {
			toast.error("Selling price must be a valid positive number.");
			return;
		}

		const targetProdId = editItem.productId ?? editItem.id;
		const targetDate = editPricingDate || historicalDate || todayDateStr;
		await updateMutation.mutateAsync({
			inventoryId: editItem.id ? Number(editItem.id) : undefined,
			productId: targetProdId ? Number(targetProdId) : undefined,
			branchId: editItem.branchId || 1,
			name: editName.trim(),
			category: editCategory.trim() || "General",
			unit: editUnit.trim() || "Pcs",
			barcode: editBarcode.trim() || undefined,
			sku: editSku.trim() || undefined,
			description: editDescription.trim(),
			qtyOnHand: qty,
			reorderLevel: reorder,
			price: price,
			costPrice: Number.isNaN(cost) ? 0 : cost,
			reason: editReason || `Warehouse stock & rate lock for ${targetDate}`,
			pricingDate: targetDate,
		});
	};

	const handleOpenDelete = (item: any) => {
		setDeleteItem(item);
		setDeleteReasonPreset("Discontinued Product (उत्पाद बंद कर दिया गया)");
		setCustomDeleteReason("");
	};

	const handleConfirmDelete = async () => {
		if (!deleteItem) return;
		const finalReason =
			deleteReasonPreset === "Custom Reason / Other"
				? customDeleteReason.trim()
				: deleteReasonPreset;

		if (!finalReason) {
			toast.error(
				locale === "hi"
					? "कृपया हटाने का कारण दर्ज करें"
					: "Please specify a deletion reason",
			);
			return;
		}

		const targetProdId = deleteItem.productId ?? deleteItem.id;
		await deleteMutation.mutateAsync({
			id: Number(targetProdId),
			reason: finalReason,
		});
	};

	const handleOpenOffer = (item: any) => {
		setOfferItem(item);
		const currentPrice = item.price || 0;
		if (item.hasActiveOffer && item.offerPrice) {
			setOfferPriceInput(String(item.offerPrice));
			setDiscountPercentInput(String(item.discountPercent || 0));
			setSelectedReason(item.offerReason || PRESET_DISCOUNT_REASONS[0]);
		} else {
			// Default 10% discount suggestion
			const defaultDiscount = Math.round(currentPrice * 0.9);
			setOfferPriceInput(String(defaultDiscount));
			setDiscountPercentInput("10");
			setSelectedReason(PRESET_DISCOUNT_REASONS[0]);
		}
		setCustomReason("");
		setNotesInput("");
	};

	const handleOfferPriceChange = (val: string) => {
		setOfferPriceInput(val);
		const num = Number.parseFloat(val);
		const orig = offerItem?.price || 0;
		if (!Number.isNaN(num) && orig > 0) {
			const pct = (((orig - num) / orig) * 100).toFixed(1);
			setDiscountPercentInput(pct);
		} else {
			setDiscountPercentInput("");
		}
	};

	const handleDiscountPercentChange = (val: string) => {
		setDiscountPercentInput(val);
		const pct = Number.parseFloat(val);
		const orig = offerItem?.price || 0;
		if (!Number.isNaN(pct) && orig > 0) {
			const calculatedPrice = (orig * (1 - pct / 100)).toFixed(2);
			setOfferPriceInput(calculatedPrice);
		} else {
			setOfferPriceInput("");
		}
	};

	const applyQuickPercent = (pct: number) => {
		setDiscountPercentInput(String(pct));
		const orig = offerItem?.price || 0;
		if (orig > 0) {
			const calculatedPrice = (orig * (1 - pct / 100)).toFixed(2);
			setOfferPriceInput(calculatedPrice);
		}
	};

	const handleSaveOffer = async () => {
		if (!offerItem) return;
		const offerPriceNum = Number.parseFloat(offerPriceInput);
		const orig = offerItem.price || 0;

		if (Number.isNaN(offerPriceNum) || offerPriceNum < 0) {
			toast.error("Please enter a valid offer price.");
			return;
		}

		if (offerPriceNum > orig) {
			toast.error(
				`Offer price (₹${offerPriceNum}) cannot exceed original price (₹${orig}).`,
			);
			return;
		}

		const finalReason =
			selectedReason === "Custom / Other Reason"
				? customReason.trim() || "Warehouse Manager Special Promotion"
				: selectedReason;

		const targetProdId = offerItem.productId ?? offerItem.id;
		await setOfferMutation.mutateAsync({
			productId: Number(targetProdId),
			effectiveDate: todayDateStr,
			discountType: "fixed_price",
			discountValue: Math.max(0, orig - offerPriceNum),
			offerPrice: offerPriceNum,
			reason: finalReason,
			notes: notesInput || null,
		});
	};

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Warehouse Stock Ledger (वेयरहाउस स्टॉक)
						</h2>
						<Badge
							variant="outline"
							className="border-emerald-200 bg-emerald-50 font-bold text-emerald-800 text-xs dark:bg-emerald-950/40 dark:text-emerald-300"
						>
							{rawItems.length > 0
								? `${rawItems.length} Products Loaded`
								: "Loading..."}
						</Badge>
					</div>
					<p className="text-muted-foreground text-sm">
						Master inventory repository with real-time stock balances, pricing,
						and daily discount offer management.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						asChild
						className="gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
					>
						<Link href="/dashboard/warehouse/discounts">
							<TagIcon className="h-4 w-4 text-blue-600" />
							<span>Daily Offers Hub</span>
							{activeOffersCount > 0 && (
								<Badge className="ml-1 bg-blue-600 text-white text-xs">
									{activeOffersCount}
								</Badge>
							)}
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isFetching}
						className="shrink-0 gap-1.5"
					>
						<RefreshCwIcon
							className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
						/>
						<span>{isFetching ? "Syncing..." : "Refresh"}</span>
					</Button>
					<Button
						size="sm"
						onClick={() => setAddItemOpen(true)}
						className="shrink-0 gap-1.5 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
					>
						<PlusIcon className="h-4 w-4" />
						<span>+ Add New Product</span>
					</Button>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{/* Total Inventory Asset Cost */}
				<Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Total Inventory Value
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold font-mono text-2xl text-slate-900 dark:text-slate-100">
							₹
							{totalValuation.toLocaleString("en-IN", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Across {rawItems.length} warehouse items
						</p>
					</CardContent>
				</Card>

				{/* Total Stored Units */}
				<Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Stored Quantity Units
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold font-mono text-2xl text-slate-900 dark:text-slate-100">
							{invLoading ? "..." : totalUnits.toLocaleString("en-IN")}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Physical count on bins
						</p>
					</CardContent>
				</Card>

				{/* Low Stock Lines */}
				<Card
					onClick={() =>
						setStatusFilter(statusFilter === "low_stock" ? "all" : "low_stock")
					}
					className={`cursor-pointer border-l-4 border-l-amber-500 shadow-sm transition-all hover:bg-muted/40 ${
						statusFilter === "low_stock" ? "ring-2 ring-amber-500" : ""
					}`}
				>
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Low Stock Alerts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold font-mono text-2xl text-amber-600">
							{lowStockCount}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Stock ≤ 10 units
						</p>
					</CardContent>
				</Card>

				{/* Out of Stock Lines */}
				<Card
					onClick={() =>
						setStatusFilter(
							statusFilter === "out_of_stock" ? "all" : "out_of_stock",
						)
					}
					className={`cursor-pointer border-l-4 border-l-red-500 shadow-sm transition-all hover:bg-muted/40 ${
						statusFilter === "out_of_stock" ? "ring-2 ring-red-500" : ""
					}`}
				>
					<CardHeader className="pb-2">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Out of Stock
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold font-mono text-2xl text-red-500">
							{outOfStockCount}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">0 stock on hand</p>
					</CardContent>
				</Card>

				{/* Active Daily Discount Offers */}
				<Card
					onClick={() =>
						setStatusFilter(statusFilter === "on_offer" ? "all" : "on_offer")
					}
					className={`cursor-pointer border-l-4 border-l-blue-500 shadow-sm transition-all hover:bg-muted/40 ${
						statusFilter === "on_offer" ? "ring-2 ring-blue-500" : ""
					}`}
				>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between font-bold text-slate-500 text-xs uppercase tracking-wider">
							<span>Daily Offers Active</span>
							<SparklesIcon className="h-3.5 w-3.5 text-blue-500" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold font-mono text-2xl text-blue-600">
							{activeOffersCount}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Live discounts today
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Day-Wise Costing & Rate Lock Filter Bar */}
			<Card className="border-blue-200/80 bg-blue-50/40 dark:border-blue-900/60 dark:bg-blue-950/20 shadow-xs">
				<CardContent className="p-3.5">
					<div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200 mr-1">
								<CalendarDaysIcon className="h-4 w-4 text-blue-600" />
								Day-Wise Rates & Stock (तारीख के अनुसार दर व लागत):
							</span>
							<Button
								type="button"
								size="sm"
								variant={!historicalDate ? "default" : "outline"}
								className={
									!historicalDate
										? "bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs font-semibold shadow-xs"
										: "h-7 text-xs font-medium"
								}
								onClick={() => {
									setHistoricalDate("");
									setCurrentPage(1);
								}}
							>
								Live / Current (वर्तमान)
							</Button>
							<Button
								type="button"
								size="sm"
								variant={historicalDate === todayDateStr ? "default" : "outline"}
								className={
									historicalDate === todayDateStr
										? "bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs font-semibold shadow-xs"
										: "h-7 text-xs font-medium"
								}
								onClick={() => {
									setHistoricalDate(todayDateStr);
									setCurrentPage(1);
								}}
							>
								Today (आज)
							</Button>
							<Button
								type="button"
								size="sm"
								variant={historicalDate === yesterdayDateStr ? "default" : "outline"}
								className={
									historicalDate === yesterdayDateStr
										? "bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs font-semibold shadow-xs"
										: "h-7 text-xs font-medium"
								}
								onClick={() => {
									setHistoricalDate(yesterdayDateStr);
									setCurrentPage(1);
								}}
							>
								Yesterday (कल)
							</Button>

							<div className="flex items-center gap-1.5 pl-1">
								<span className="text-xs text-muted-foreground font-medium">Custom Date:</span>
								<input
									type="date"
									value={historicalDate}
									onChange={(e) => {
										setHistoricalDate(e.target.value);
										setCurrentPage(1);
									}}
									className="h-7 rounded-md border border-input bg-background px-2 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							</div>
						</div>

						{/* Lock Status Pill */}
						<div className="flex items-center gap-2">
							<Badge
								variant="secondary"
								className="border border-blue-200 bg-white font-medium text-blue-900 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200 text-xs px-2.5 py-1 gap-1.5"
							>
								{isHistoricalMode ? (
									<>
										<LockIcon className="h-3 w-3 text-blue-600" />
										<span>Day-Wise Locked Mode:</span>
										<span className="font-bold">{historicalDate}</span>
									</>
								) : (
									<>
										<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
										<span className="font-bold">Live Active Inventory</span>
									</>
								)}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Filter and Search Bar */}
			<Card className="border-border/60 shadow-sm">
				<CardContent className="p-4 sm:p-5">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						{/* Search */}
						<div className="relative flex-1">
							<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search 560+ products by name, SKU, barcode, or category..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setCurrentPage(1);
								}}
							/>
						</div>

						{/* Category & Status Filters */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Category select & New Category button */}
							<div className="flex items-center gap-1.5">
								<LayersIcon className="h-4 w-4 text-muted-foreground" />
								<select
									value={selectedCategory}
									onChange={(e) => {
										const val = e.target.value;
										if (val === "__create_new__") {
											setCreateCategoryOpen(true);
										} else {
											setSelectedCategory(val);
											setCurrentPage(1);
										}
									}}
									className="rounded-md border border-input bg-background px-3 py-1.5 font-medium text-foreground text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
								>
									<option value="all">All Categories ({rawItems.length})</option>
									{categories.map((c) => (
										<option key={c} value={c}>
											{c} (
											{rawItems.filter((i) => i.category === c).length})
										</option>
									))}
									<option
										value="__create_new__"
										className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950"
									>
										+ Create New Category...
									</option>
								</select>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => setCreateCategoryOpen(true)}
									className="h-7 px-2 text-xs gap-1 border-dashed text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
									title="Create a new product category"
								>
									<PlusIcon className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">New Category</span>
								</Button>
							</div>

							{/* Status Filter Buttons */}
							<div className="flex flex-wrap items-center rounded-lg border bg-muted/40 p-1">
								<Button
									variant={statusFilter === "all" ? "default" : "ghost"}
									size="sm"
									className="h-7 px-2.5 text-xs"
									onClick={() => {
										setStatusFilter("all");
										setCurrentPage(1);
									}}
								>
									All ({rawItems.length})
								</Button>
								<Button
									variant={statusFilter === "in_stock" ? "default" : "ghost"}
									size="sm"
									className="h-7 px-2.5 text-xs"
									onClick={() => {
										setStatusFilter("in_stock");
										setCurrentPage(1);
									}}
								>
									In Stock (
									{rawItems.filter((i) => (i.qty_on_hand || 0) > 10).length})
								</Button>
								<Button
									variant={statusFilter === "low_stock" ? "default" : "ghost"}
									size="sm"
									className="h-7 px-2.5 text-xs"
									onClick={() => {
										setStatusFilter("low_stock");
										setCurrentPage(1);
									}}
								>
									Low Stock ({lowStockCount})
								</Button>
								<Button
									variant={
										statusFilter === "out_of_stock" ? "default" : "ghost"
									}
									size="sm"
									className="h-7 px-2.5 text-xs"
									onClick={() => {
										setStatusFilter("out_of_stock");
										setCurrentPage(1);
									}}
								>
									Out of Stock ({outOfStockCount})
								</Button>
								<Button
									variant={statusFilter === "on_offer" ? "default" : "ghost"}
									size="sm"
									className="h-7 gap-1 px-2.5 text-xs text-blue-600 dark:text-blue-400"
									onClick={() => {
										setStatusFilter("on_offer");
										setCurrentPage(1);
									}}
								>
									<SparklesIcon className="h-3 w-3" />
									<span>On Offer ({activeOffersCount})</span>
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Stock Table */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between border-b pb-3">
					<div>
						<CardTitle className="font-bold text-base">
							{isHistoricalMode
								? `Warehouse Stock as of ${historicalDate} (${filteredItems.length} Products)`
								: `Warehouse Stock Register (${filteredItems.length} Products)`}
						</CardTitle>
						<CardDescription className="text-xs">
							Showing items {(currentPage - 1) * pageSize + 1} to{" "}
							{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
						</CardDescription>
					</div>
					{/* Pagination Top Control */}
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
						>
							<ChevronLeftIcon className="h-4 w-4" />
						</Button>
						<span className="px-2 font-mono font-semibold text-xs">
							{currentPage} / {totalPages}
						</span>
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage >= totalPages}
						>
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{invLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-3 text-muted-foreground text-sm">
								Loading comprehensive product inventory...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="w-10">#</TableHead>
										<TableHead>Product Name & Category</TableHead>
										<TableHead>SKU / Barcode</TableHead>
										<TableHead className="font-bold text-emerald-700 dark:text-emerald-400">
											Selling Rate (विक्रय दर)
										</TableHead>
										<TableHead className="font-bold text-slate-700 dark:text-slate-300">
											Cost Price (लागत दर)
										</TableHead>
										<TableHead className="font-bold text-center">
											Margin %
										</TableHead>
										<TableHead>Warehouse Stock (स्टॉक)</TableHead>
										<TableHead>Lock Status</TableHead>
										<TableHead>Daily Offer</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedItems.map((item, idx) => {
										const rowNum = (currentPage - 1) * pageSize + idx + 1;
										const sp = Number(item.price || 0);
										const cp = Number(
											item.cost_price ??
												item.costPrice ??
												item.base_procurement_price ??
												0,
										);
										const margin =
											sp > 0 ? Math.round(((sp - cp) / sp) * 100) : 0;

										return (
											<TableRow
												key={item.productId || item.id}
												className="hover:bg-muted/40"
											>
												<TableCell className="font-mono text-muted-foreground text-xs">
													{rowNum}
												</TableCell>
												<TableCell>
													{(() => {
														const rawProd = item.product || "";
														const bracketMatch = rawProd.match(/^(.*?)\s*\(([^)]+)\)$/);
														if (bracketMatch) {
															return (
																<div>
																	<div className="font-bold text-slate-900 text-sm dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
																		<span>{bracketMatch[1].trim()}</span>
																		<span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800">
																			({bracketMatch[2].trim()})
																		</span>
																	</div>
																	{item.description && item.description !== rawProd && (
																		<div
																			className="text-[11px] text-muted-foreground line-clamp-1 italic max-w-xs mt-0.5"
																			title={item.description}
																		>
																			{item.description}
																		</div>
																	)}
																</div>
															);
														}
														return (
															<div>
																<div className="font-bold text-slate-900 text-sm dark:text-slate-100">
																	{rawProd}
																</div>
																{item.description && item.description !== rawProd && (
																	<div
																		className="text-[11px] text-muted-foreground line-clamp-1 italic max-w-xs mt-0.5"
																		title={item.description}
																	>
																		{item.description}
																	</div>
																)}
															</div>
														);
													})()}
													<div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
														<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
															{item.category || "General"}
														</span>
														<span>•</span>
														<span>Unit: {item.unit || "Pcs"}</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="font-mono font-semibold text-slate-600 text-xs dark:text-slate-400">
														{item.sku}
													</div>
													{item.barcode && (
														<div className="font-mono text-[11px] text-muted-foreground">
															UPC: {item.barcode}
														</div>
													)}
												</TableCell>
												<TableCell>
													<div className="font-bold font-mono text-emerald-600 text-sm dark:text-emerald-400">
														₹
														{sp.toLocaleString("en-IN", {
															minimumFractionDigits: 2,
														})}
													</div>
												</TableCell>
												<TableCell>
													<div className="font-bold font-mono text-slate-700 text-sm dark:text-slate-300">
														₹
														{cp.toLocaleString("en-IN", {
															minimumFractionDigits: 2,
														})}
													</div>
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-xs">
													{sp > 0 ? (
														<span
															className={
																sp >= cp
																	? "text-emerald-600 font-bold"
																	: "text-rose-600 font-bold"
															}
														>
															{margin}%
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>
												<TableCell>
													<div className="font-bold font-mono text-slate-900 text-sm dark:text-slate-100">
														{item.qty_on_hand}{" "}
														<span className="font-normal text-muted-foreground text-xs">
															{item.unit || "Pcs"}
														</span>
													</div>
													<div className="text-[10px] text-muted-foreground font-mono mt-0.5">
														Min: {item.reorder_level ?? 10} {item.unit || "Pcs"}
													</div>
												</TableCell>
												<TableCell>
													{item.isPriceLocked ? (
														<Badge
															variant="outline"
															className="border-blue-300 bg-blue-50 text-blue-800 text-[10px] font-bold dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 gap-1"
															title={
																item.lockedAt
																	? `Locked on ${item.lockedAt}`
																	: "Rate locked"
															}
														>
															<LockIcon className="h-2.5 w-2.5" />
															<span>Locked</span>
														</Badge>
													) : isHistoricalMode ? (
														<Badge
															variant="outline"
															className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
														>
															Historical
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-[10px] text-muted-foreground"
														>
															Live
														</Badge>
													)}
												</TableCell>
												<TableCell>
													{item.hasActiveOffer ? (
														<div className="space-y-0.5">
															<div className="flex items-center gap-1.5">
																<Badge className="border-blue-200 bg-blue-100 font-bold text-blue-800 text-[11px] dark:bg-blue-950 dark:text-blue-300">
																	<SparklesIcon className="mr-1 h-3 w-3 text-blue-600" />
																	₹{item.offerPrice?.toFixed(2)} (
																	{item.discountPercent}% OFF)
																</Badge>
															</div>
															{item.offerReason && (
																<p className="truncate text-[11px] text-muted-foreground">
																	{item.offerReason}
																</p>
															)}
														</div>
													) : (
														<span className="text-muted-foreground text-xs">
															Standard Price
														</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1.5">
														<Button
															size="sm"
															variant="outline"
															className="h-8 gap-1 border-slate-300 text-xs hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40"
															onClick={() => handleOpenEdit(item)}
															title="Edit Details & Lock Rates"
														>
															<PencilIcon className="h-3.5 w-3.5 text-blue-600" />
															<span>Edit & Lock Rate</span>
														</Button>
														<Button
															size="sm"
															variant={
																item.hasActiveOffer ? "secondary" : "outline"
															}
															className={`h-8 gap-1 text-xs ${
																item.hasActiveOffer
																	? "border-blue-300 bg-blue-50 font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
																	: "border-slate-300 hover:bg-emerald-50 hover:text-emerald-700"
															}`}
															onClick={() => handleOpenOffer(item)}
															title="Set or Edit Daily Discount Offer"
														>
															<TagIcon className="h-3.5 w-3.5" />
															<span>
																{item.hasActiveOffer
																	? "Edit Offer"
																	: "Daily Offer"}
															</span>
														</Button>
														<Button
															size="sm"
															variant="outline"
															className="h-8 w-8 p-0 text-red-600 border-red-200 bg-red-50/50 hover:bg-red-100 hover:border-red-300 dark:bg-red-950/40 dark:border-red-900"
															onClick={() => handleOpenDelete(item)}
															title="Delete Product (requires reason)"
														>
															<Trash2Icon className="h-3.5 w-3.5 text-red-600" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
									{paginatedItems.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={8}
												className="py-16 text-center text-muted-foreground"
											>
												<BoxesIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-base">
													No products found matching filters
												</p>
												<p className="text-xs">
													Try clearing your search query or selecting "All
													Categories".
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>

				{/* Bottom Pagination Bar */}
				<div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
					<div className="text-muted-foreground text-xs">
						Showing {(currentPage - 1) * pageSize + 1} to{" "}
						{Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
						products
					</div>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage(1)}
							disabled={currentPage === 1}
							className="h-8 px-2 text-xs"
						>
							<ChevronsLeftIcon className="mr-1 h-3.5 w-3.5" />
							First
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="h-8 px-2.5 text-xs"
						>
							<ChevronLeftIcon className="mr-1 h-3.5 w-3.5" />
							Prev
						</Button>
						<span className="px-3 font-mono font-bold text-xs">
							Page {currentPage} of {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage >= totalPages}
							className="h-8 px-2.5 text-xs"
						>
							Next
							<ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage(totalPages)}
							disabled={currentPage >= totalPages}
							className="h-8 px-2 text-xs"
						>
							Last
							<ChevronsRightIcon className="ml-1 h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</Card>

			{/* Edit Stock Quantity & Product Specifications Dialog */}
			<Dialog
				open={!!editItem}
				onOpenChange={(open) => !open && setEditItem(null)}
			>
				<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between text-lg">
							<span className="flex items-center gap-2">
								<Edit3Icon className="h-5 w-5 text-blue-600" />
								<span>Edit Product Specifications & Stock (उत्पाद विवरण)</span>
							</span>
							<Badge variant="outline" className="text-xs font-mono">
								#{editItem?.productId || editItem?.id}
							</Badge>
						</DialogTitle>
						<DialogDescription>
							Update item name, category, unit, barcode, full description, prices, and stock count.
						</DialogDescription>
					</DialogHeader>

					{editItem && (
						<div className="space-y-3.5 py-1">
							{/* Product Name & Category */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<Label htmlFor="editName" className="font-semibold text-xs">
											Product Name (उत्पाद का नाम) *
										</Label>
										<button
											type="button"
											onClick={() => setEditName(toBilingualProductName(editName))}
											className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium hover:underline cursor-pointer"
										>
											+ Add Hindi (हिंदी जोड़ें)
										</button>
									</div>
									<Input
										id="editName"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										placeholder="e.g. Sarso Oil 1 Ltr (सरसों तेल 1 Ltr)"
										className="font-bold text-sm"
									/>
									{editName && !editName.includes("(") && (
										<p className="text-[11px] text-muted-foreground">
											Suggested: <span className="font-semibold text-emerald-600">{toBilingualProductName(editName)}</span>
										</p>
									)}
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="editCategory" className="font-semibold text-xs">
										Category (श्रेणी)
									</Label>
									<Input
										id="editCategory"
										list="editCategoryList"
										value={editCategory}
										onChange={(e) => setEditCategory(e.target.value)}
										placeholder="e.g. Snacks / Beverages / Grocery"
										className="text-sm"
									/>
									<datalist id="editCategoryList">
										{allAvailableCategories.map((c) => (
											<option key={c} value={c} />
										))}
									</datalist>
								</div>
							</div>

							{/* Unit & Barcode/SKU */}
							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="editUnit" className="font-semibold text-xs">
										Unit (माप इकाई)
									</Label>
									<Input
										id="editUnit"
										value={editUnit}
										onChange={(e) => setEditUnit(e.target.value)}
										placeholder="e.g. Pcs / Kg / Ltr / Pack"
										className="text-sm font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="editSku" className="font-semibold text-xs">
										SKU Code
									</Label>
									<Input
										id="editSku"
										value={editSku}
										onChange={(e) => setEditSku(e.target.value)}
										placeholder="SKU-0001"
										className="text-sm font-mono"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="editBarcode" className="font-semibold text-xs">
										Barcode / UPC
									</Label>
									<Input
										id="editBarcode"
										value={editBarcode}
										onChange={(e) => setEditBarcode(e.target.value)}
										placeholder="e.g. 890123456789"
										className="text-sm font-mono"
									/>
								</div>
							</div>

							{/* Full Description Textarea */}
							<div className="space-y-1.5">
								<Label htmlFor="editDescription" className="font-semibold text-xs flex items-center justify-between">
									<span>Full Product Description (पूरा उत्पाद विवरण)</span>
									<span className="text-[10px] text-muted-foreground font-normal">Shows in POS & Details Modal</span>
								</Label>
								<Textarea
									id="editDescription"
									rows={3}
									value={editDescription}
									onChange={(e) => setEditDescription(e.target.value)}
									placeholder="Enter full specification, ingredients, net weight, or details..."
									className="text-xs font-medium leading-relaxed"
								/>
							</div>

							{/* Day-Wise Pricing Lock Option */}
							<div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/60 dark:bg-blue-950/40">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
									<div>
										<Label htmlFor="editPricingDate" className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
											<LockIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
											<span>Lock Rates For Date (दर लॉक करने की तारीख):</span>
										</Label>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											Selling Price & Cost Price will be locked for this date. Past/future reports in Manager & Warehouse will preserve this date's exact margin.
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Input
											id="editPricingDate"
											type="date"
											value={editPricingDate}
											onChange={(e) => setEditPricingDate(e.target.value)}
											className="w-auto h-8 text-xs font-mono font-bold bg-background border-blue-300 dark:border-blue-700"
										/>
										{editPricingDate && (
											<Badge variant="outline" className="h-8 text-[11px] bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 shrink-0">
												{editPricingDate === todayDateStr ? "Today" : editPricingDate === yesterdayDateStr ? "Yesterday" : editPricingDate}
											</Badge>
										)}
									</div>
								</div>
								{Number.parseFloat(editPrice || "0") > 0 && (
									<div className="mt-2.5 pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex flex-wrap items-center gap-4 text-xs">
										<span className="text-muted-foreground">
											Profit Per Unit:{" "}
											<strong
												className={
													(Number.parseFloat(editPrice || "0") - Number.parseFloat(editCostPrice || "0")) >= 0
														? "text-emerald-600 font-mono"
														: "text-red-600 font-mono"
												}
											>
												₹{(Number.parseFloat(editPrice || "0") - Number.parseFloat(editCostPrice || "0")).toFixed(2)}
											</strong>
										</span>
										<span className="text-muted-foreground">
											Margin %:{" "}
											<strong
												className={
													(Number.parseFloat(editPrice || "0") - Number.parseFloat(editCostPrice || "0")) >= 0
														? "text-emerald-600 font-mono"
														: "text-red-600 font-mono"
												}
											>
												{(
													((Number.parseFloat(editPrice || "0") - Number.parseFloat(editCostPrice || "0")) /
														Number.parseFloat(editPrice || "1")) *
													100
												).toFixed(1)}
												%
											</strong>
										</span>
									</div>
								)}
							</div>

							{/* Selling Price & Cost Price */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="editPrice" className="font-semibold text-xs text-emerald-700 dark:text-emerald-400">
										Selling Price (विक्रय मूल्य ₹) *
									</Label>
									<div className="relative">
										<span className="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-muted-foreground text-xs">
											₹
										</span>
										<Input
											id="editPrice"
											type="number"
											step="0.01"
											min="0"
											placeholder="0.00"
											value={editPrice}
											onChange={(e) => setEditPrice(e.target.value)}
											className="pl-7 font-bold font-mono text-sm text-emerald-700"
										/>
									</div>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="editCostPrice" className="font-semibold text-xs">
										Base Cost Price (लागत मूल्य ₹)
									</Label>
									<div className="relative">
										<span className="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-muted-foreground text-xs">
											₹
										</span>
										<Input
											id="editCostPrice"
											type="number"
											step="0.01"
											min="0"
											placeholder="0.00"
											value={editCostPrice}
											onChange={(e) => setEditCostPrice(e.target.value)}
											className="pl-7 font-mono text-sm"
										/>
									</div>
								</div>
							</div>

							{/* Stock Qty, Low Stock Threshold & Audit Reason */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="stockQty" className="font-semibold text-xs">
										Physical Stock Quantity ({editUnit || "Units"}) *
									</Label>
									<Input
										id="stockQty"
										type="number"
										min="0"
										placeholder="e.g. 100"
										value={editStockQty}
										onChange={(e) => setEditStockQty(e.target.value)}
										className="font-bold font-mono text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<Label
										htmlFor="editReorderLevel"
										className="font-semibold text-xs flex items-center gap-1 text-amber-700 dark:text-amber-400"
									>
										<AlertTriangleIcon className="h-3 w-3 text-amber-500" />
										<span>Low Stock Threshold *</span>
									</Label>
									<Input
										id="editReorderLevel"
										type="number"
										min="0"
										placeholder="e.g. 10"
										value={editReorderLevel}
										onChange={(e) => setEditReorderLevel(e.target.value)}
										className="font-bold font-mono text-sm border-amber-300 bg-amber-50/50 text-amber-950 focus:border-amber-500 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"
									/>
									<span className="text-[10px] text-muted-foreground block leading-tight">
										Low stock alert below this
									</span>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="editReason" className="font-semibold text-xs">
										Audit / Remarks (कारण)
									</Label>
									<Input
										id="editReason"
										placeholder="e.g. Stock count verified during audit"
										value={editReason}
										onChange={(e) => setEditReason(e.target.value)}
										className="text-xs"
									/>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:justify-between items-center pt-2 border-t">
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={() => handleOpenDelete(editItem)}
							className="gap-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
						>
							<Trash2Icon className="h-3.5 w-3.5" />
							<span>Delete Item</span>
						</Button>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setEditItem(null)}
								disabled={updateMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSaveEdit}
								disabled={updateMutation.isPending}
								className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs"
							>
								{updateMutation.isPending ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									<SaveIcon className="h-4 w-4" />
								)}
								<span>Save Changes</span>
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Manager Delete Product Dialog */}
			<Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
							<AlertTriangleIcon className="h-5 w-5 text-red-600" />
							<span>Delete Product (उत्पाद हटाएं)</span>
						</DialogTitle>
						<DialogDescription>
							You are about to delete <strong className="text-foreground">{deleteItem?.product}</strong> (#{deleteItem?.productId || deleteItem?.id}).
						</DialogDescription>
					</DialogHeader>

					{deleteItem && (
						<div className="space-y-4 py-1">
							<div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-900 dark:bg-red-950/50 dark:border-red-900 dark:text-red-200">
								<p className="font-bold flex items-center gap-1.5">
									<AlertTriangleIcon className="h-4 w-4 shrink-0 text-red-600" />
									Warning: Permanent Action
								</p>
								<p className="mt-1 font-medium">
									Deleting this item will remove it from active warehouse inventory, POS billing catalogs, and store registers.
								</p>
							</div>

							<div className="space-y-2">
								<Label className="font-bold text-xs text-foreground">
									Reason for Deletion (हटाने का कारण) *
								</Label>

								<div className="space-y-1.5">
									{[
										"Discontinued Product (उत्पाद बंद कर दिया गया)",
										"Damaged / Expired Stock (क्षतिग्रस्त / एक्सपायर्ड स्टॉक)",
										"Duplicate / Incorrect Entry (गलत या डुप्लीकेट प्रविष्टि)",
										"Clearance / Removed from Catalog (कैटलॉग से हटाया गया)",
										"Custom Reason / Other",
									].map((reasonOption) => (
										<button
											key={reasonOption}
											type="button"
											onClick={() => setDeleteReasonPreset(reasonOption)}
											className={`w-full text-left rounded-md px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
												deleteReasonPreset === reasonOption
													? "bg-red-50 border-red-400 text-red-900 font-bold dark:bg-red-950/60 dark:text-red-200"
													: "bg-background border-border hover:bg-muted"
											}`}
										>
											{reasonOption}
										</button>
									))}
								</div>

								{deleteReasonPreset === "Custom Reason / Other" && (
									<Input
										placeholder="Enter specific reason for deletion..."
										value={customDeleteReason}
										onChange={(e) => setCustomDeleteReason(e.target.value)}
										className="mt-2 text-xs font-medium border-red-300 focus:border-red-500"
									/>
								)}
							</div>
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteItem(null)}
							disabled={deleteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleConfirmDelete}
							disabled={deleteMutation.isPending}
							className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold"
						>
							{deleteMutation.isPending ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								<Trash2Icon className="h-4 w-4" />
							)}
							<span>Confirm & Delete</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Set Daily Offer Modal */}
			<Dialog
				open={!!offerItem}
				onOpenChange={(open) => !open && setOfferItem(null)}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<SparklesIcon className="h-5 w-5 text-blue-600" />
							<span>Set Daily Discount Offer (दैनिक ऑफर)</span>
						</DialogTitle>
						<DialogDescription>
							{offerItem?.product} • Original Price: ₹
							{Number(offerItem?.price || 0).toFixed(2)}
						</DialogDescription>
					</DialogHeader>

					{offerItem && (
						<div className="space-y-4 py-2">
							{/* Pricing Comparison Cards */}
							<div className="grid grid-cols-3 gap-3 rounded-lg border bg-blue-50/50 p-3 text-center dark:bg-blue-950/30">
								<div>
									<span className="block text-muted-foreground text-xs">
										Original Price
									</span>
									<span className="font-bold font-mono text-base text-slate-700 dark:text-slate-300">
										₹{Number(offerItem.price || 0).toFixed(2)}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground text-xs">
										Offer Price (Today)
									</span>
									<span className="font-bold font-mono text-base text-emerald-600">
										₹
										{Number.parseFloat(offerPriceInput || "0") > 0
											? Number.parseFloat(offerPriceInput).toFixed(2)
											: "—"}
									</span>
								</div>
								<div>
									<span className="block text-muted-foreground text-xs">
										You Save
									</span>
									<span className="font-bold font-mono text-base text-blue-600">
										{Number.parseFloat(discountPercentInput || "0") > 0
											? `${discountPercentInput}% OFF`
											: "0%"}
									</span>
								</div>
							</div>

							{/* Quick Discount Presets */}
							<div className="space-y-1.5">
								<Label className="text-muted-foreground text-xs">
									Quick Discount Presets:
								</Label>
								<div className="flex flex-wrap gap-2">
									{[5, 10, 15, 20, 25, 30, 50].map((pct) => (
										<Button
											key={pct}
											type="button"
											size="sm"
											variant={
												discountPercentInput === String(pct)
													? "default"
													: "outline"
											}
											className="h-7 px-2.5 text-xs"
											onClick={() => applyQuickPercent(pct)}
										>
											{pct}% OFF
										</Button>
									))}
								</div>
							</div>

							{/* Dual Inputs: Offer Price vs Discount Percent */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label
										htmlFor="offerPriceInput"
										className="font-semibold text-xs"
									>
										Offer Price (₹)
									</Label>
									<div className="relative">
										<span className="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-muted-foreground text-xs">
											₹
										</span>
										<Input
											id="offerPriceInput"
											type="number"
											step="0.01"
											min="0"
											max={offerItem.price}
											value={offerPriceInput}
											onChange={(e) => handleOfferPriceChange(e.target.value)}
											className="pl-7 font-bold font-mono text-emerald-600 text-sm"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label
										htmlFor="discountPercentInput"
										className="font-semibold text-xs"
									>
										Discount Percentage (%)
									</Label>
									<div className="relative">
										<Input
											id="discountPercentInput"
											type="number"
											step="0.1"
											min="0"
											max="100"
											value={discountPercentInput}
											onChange={(e) =>
												handleDiscountPercentChange(e.target.value)
											}
											className="pr-7 font-bold font-mono text-blue-600 text-sm"
										/>
										<span className="absolute top-1/2 right-3 -translate-y-1/2 font-bold text-muted-foreground text-xs">
											%
										</span>
									</div>
								</div>
							</div>

							{/* Mandatory Reason Dropdown */}
							<div className="space-y-1.5">
								<Label className="font-semibold text-xs">
									Reason for Discount Offer (ऑफर का कारण){" "}
									<span className="text-red-500">*</span>
								</Label>
								<select
									value={selectedReason}
									onChange={(e) => setSelectedReason(e.target.value)}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
								>
									{PRESET_DISCOUNT_REASONS.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>

							{selectedReason === "Custom / Other Reason" && (
								<div className="space-y-1.5">
									<Label className="font-semibold text-xs">
										Specify Custom Reason
									</Label>
									<Input
										placeholder="e.g. Promotional launch scheme for new retail customers"
										value={customReason}
										onChange={(e) => setCustomReason(e.target.value)}
										className="text-xs"
									/>
								</div>
							)}

							<div className="space-y-1.5">
								<Label className="text-muted-foreground text-xs">
									Notes / Remarks (Optional)
								</Label>
								<Input
									placeholder="e.g. Valid for today's billing only"
									value={notesInput}
									onChange={(e) => setNotesInput(e.target.value)}
									className="text-xs"
								/>
							</div>
						</div>
					)}

					<DialogFooter className="flex flex-col-reverse justify-between gap-2 sm:flex-row">
						{offerItem?.hasActiveOffer && (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								disabled={removeOfferMutation.isPending}
								onClick={() => {
									const targetProdId = offerItem.productId ?? offerItem.id;
									removeOfferMutation.mutate({
										productId: Number(targetProdId),
										date: todayDateStr,
									});
								}}
								className="gap-1.5 text-xs"
							>
								<Trash2Icon className="h-3.5 w-3.5" />
								<span>Remove Offer</span>
							</Button>
						)}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setOfferItem(null)}
								disabled={setOfferMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSaveOffer}
								disabled={setOfferMutation.isPending}
								className="gap-1.5 bg-blue-600 font-semibold text-white hover:bg-blue-700"
							>
								{setOfferMutation.isPending ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									<SaveIcon className="h-4 w-4" />
								)}
								<span>Apply Daily Offer</span>
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create New Category Modal */}
			<Dialog
				open={createCategoryOpen}
				onOpenChange={(open) => {
					setCreateCategoryOpen(open);
					if (!open) {
						setNewCategoryName("");
						setNewCategoryDesc("");
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<LayersIcon className="h-5 w-5 text-emerald-600" />
							<span>Create New Product Category</span>
						</DialogTitle>
						<DialogDescription>
							New categories will instantly appear across the Category Filter, Product Creation, Edit Modal, and POS Catalog.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Category Name Input */}
						<div className="space-y-1.5">
							<Label htmlFor="categoryNameInput" className="font-semibold text-xs">
								Category Name (श्रेणी का नाम) <span className="text-red-500">*</span>
							</Label>
							<Input
								id="categoryNameInput"
								placeholder="e.g. Beverages, Snacks, Dairy Products, Spices..."
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								autoFocus
							/>
						</div>

						{/* Quick Presets */}
						<div className="space-y-1.5">
							<Label className="text-[11px] font-medium text-muted-foreground">
								Quick Suggestions / लोकप्रिय श्रेणियां (Click to pick):
							</Label>
							<div className="flex flex-wrap gap-1.5">
								{[
									"Beverages",
									"Snacks & Namkeen",
									"Dairy Products",
									"Grocery & Staples",
									"Spices & Masala",
									"Confectionery",
									"Personal Care",
									"Household & Cleaning",
									"Bakery",
									"Packaged Foods",
									"Tobacco & Paan",
								]
									.filter((s) => !categories.includes(s))
									.slice(0, 8)
									.map((suggested) => (
										<Button
											key={suggested}
											type="button"
											variant="secondary"
											size="sm"
											className="h-6 text-[11px] px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800"
											onClick={() => setNewCategoryName(suggested)}
										>
											+ {suggested}
										</Button>
									))}
							</div>
						</div>

						{/* Description (Optional) */}
						<div className="space-y-1.5">
							<Label htmlFor="categoryDescInput" className="font-semibold text-xs text-muted-foreground">
								Description / विवरण (Optional)
							</Label>
							<Input
								id="categoryDescInput"
								placeholder="e.g. Cold drinks, packaged snacks, spices..."
								value={newCategoryDesc}
								onChange={(e) => setNewCategoryDesc(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => setCreateCategoryOpen(false)}
							disabled={createCategoryMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
							onClick={() => {
								if (!newCategoryName.trim()) {
									toast.error("Please enter a category name.");
									return;
								}
								createCategoryMutation.mutate({
									name: newCategoryName.trim(),
									description: newCategoryDesc.trim() || undefined,
								});
							}}
							className="gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
						>
							{createCategoryMutation.isPending ? (
								<>
									<Loader2Icon className="h-4 w-4 animate-spin" />
									Creating Category...
								</>
							) : (
								<>
									<PlusIcon className="h-4 w-4" />
									Create Category
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add New Item Dialog */}
			<Dialog
				open={addItemOpen}
				onOpenChange={(open) => {
					setAddItemOpen(open);
					if (!open) {
						setIsCustomCategory(false);
						setCustomCategoryName("");
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<PlusIcon className="h-5 w-5 text-emerald-600" />
							<span>Add New Product to Warehouse Stock</span>
						</DialogTitle>
						<DialogDescription>
							New products will instantly reflect across the Warehouse Stock
							Ledger, Sales Catalog, and POS.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Product Name & Category */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="newProdName" className="font-semibold text-xs">
										Product Name (उत्पाद नाम) <span className="text-red-500">*</span>
									</Label>
									<button
										type="button"
										onClick={() => setNewItem({ ...newItem, name: toBilingualProductName(newItem.name) })}
										className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium hover:underline cursor-pointer"
									>
										+ Add Hindi (हिंदी जोड़ें)
									</button>
								</div>
								<Input
									id="newProdName"
									placeholder="e.g. Sarso Oil 1 Ltr (सरसों तेल 1 Ltr)"
									value={newItem.name}
									onChange={(e) =>
										setNewItem({ ...newItem, name: e.target.value })
									}
								/>
								{newItem.name && !newItem.name.includes("(") && (
									<p className="text-[11px] text-muted-foreground">
										Suggested: <span className="font-semibold text-emerald-600">{toBilingualProductName(newItem.name)}</span>
									</p>
								)}
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="newItemCategory" className="font-semibold text-xs flex items-center justify-between">
									<span>Category / उत्पाद श्रेणी <span className="text-red-500">*</span></span>
									{isCustomCategory && (
										<button
											type="button"
											onClick={() => {
												setIsCustomCategory(false);
												setNewItem({ ...newItem, category: "General" });
											}}
											className="text-[10px] text-blue-600 hover:underline font-normal"
										>
											Back to list
										</button>
									)}
								</Label>
								<select
									id="newItemCategory"
									value={isCustomCategory ? "__custom__" : newItem.category}
									onChange={(e) => {
										const val = e.target.value;
										if (val === "__custom__") {
											setIsCustomCategory(true);
											setNewItem({ ...newItem, category: customCategoryName || "" });
										} else {
											setIsCustomCategory(false);
											setNewItem({ ...newItem, category: val });
										}
									}}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{allAvailableCategories.map((cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									))}
									<option value="__custom__">+ Custom / नई श्रेणी दर्ज करें...</option>
								</select>
								{isCustomCategory && (
									<Input
										placeholder="Type custom category name..."
										value={customCategoryName}
										onChange={(e) => {
											setCustomCategoryName(e.target.value);
											setNewItem({ ...newItem, category: e.target.value });
										}}
										className="mt-1.5 text-xs font-medium"
										autoFocus
									/>
								)}
							</div>
						</div>

						{/* Duplicate Item Warning Banner */}
						{duplicateMatch && (
							<div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3.5 text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
								<div className="flex items-start gap-2.5">
									<AlertTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
									<div className="space-y-1.5 flex-1 text-xs">
										<div className="flex items-center justify-between gap-2">
											<p className="font-bold text-sm text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
												<span>उत्पाद पहले से मौजूद है! (Item Already Exists)</span>
											</p>
											<Badge
												variant="outline"
												className="border-amber-500 bg-amber-100 text-amber-900 font-bold text-[10px] dark:bg-amber-900/60 dark:text-amber-200 shrink-0"
											>
												Already in Stock
											</Badge>
										</div>
										<p className="text-amber-800 dark:text-amber-300 leading-tight">
											वेयरहाउस में{" "}
											<strong className="text-foreground font-semibold">
												&ldquo;{duplicateMatch.product || duplicateMatch.name}&rdquo;
											</strong>{" "}
											पहले से दर्ज है। डबल एंट्री रोकने के लिए नया आइटम बनाने के बजाय पुराने आइटम का स्टॉक या रेट अपडेट करें।
										</p>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded border border-amber-200 bg-amber-100/60 p-2 text-[11px] font-medium dark:border-amber-800 dark:bg-amber-900/30">
											<div>
												<span className="text-muted-foreground block text-[10px]">
													SKU / Code:
												</span>
												<strong className="font-mono text-slate-800 dark:text-slate-200">
													{duplicateMatch.sku || "N/A"}
												</strong>
											</div>
											<div>
												<span className="text-muted-foreground block text-[10px]">
													Category:
												</span>
												<span className="text-slate-800 dark:text-slate-200">
													{duplicateMatch.category || "General"}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground block text-[10px]">
													Current Stock:
												</span>
												<strong className="font-mono text-emerald-700 dark:text-emerald-400">
													{duplicateMatch.qty_on_hand ?? duplicateMatch.stock ?? 0}{" "}
													{duplicateMatch.unit || "Pcs"}
												</strong>
											</div>
											<div>
												<span className="text-muted-foreground block text-[10px]">
													Selling Price:
												</span>
												<strong className="font-mono text-slate-800 dark:text-slate-200">
													₹{duplicateMatch.price || 0}
												</strong>
											</div>
										</div>
										<div className="pt-1 flex flex-wrap items-center gap-2">
											<Button
												type="button"
												size="sm"
												className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1"
												onClick={() => {
													setAddItemOpen(false);
													handleOpenEdit(duplicateMatch);
												}}
											>
												<PencilIcon className="h-3 w-3" />
												<span>
													Edit Existing Item / Update Stock (पुराने आइटम का स्टॉक अपडेट करें)
												</span>
											</Button>
										</div>
									</div>
								</div>
							</div>
						)}

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="newItemSku" className="font-semibold text-sm">
									SKU Code / कोड
								</Label>
								<Input
									id="newItemSku"
									placeholder="e.g. SPR-600ML"
									value={newItem.sku}
									onChange={(e) =>
										setNewItem({ ...newItem, sku: e.target.value })
									}
									className="font-mono text-xs uppercase"
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="newItemUnit" className="font-semibold text-sm">
									Unit of Measure / इकाई <span className="text-red-500">*</span>
								</Label>
								<select
									id="newItemUnit"
									value={newItem.unit}
									onChange={(e) =>
										setNewItem({ ...newItem, unit: e.target.value })
									}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="ml">Liquid (ml)</option>
									<option value="L">Liquid (L)</option>
									<option value="kg">Weight (kg)</option>
									<option value="g">Weight (g)</option>
									<option value="Pcs">Pieces (Pcs)</option>
									<option value="Box">Box / कार्टन</option>
									<option value="Crate">Crate / क्रेट</option>
									<option value="Bottle">Bottle / बोतल</option>
									<option value="Pack">Pack / पैकेट</option>
									<option value="Can">Can / कैन</option>
									<option value="Jar">Jar / जार</option>
								</select>
							</div>
						</div>

						{/* Selling Price & Cost Price */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="newItemPrice" className="font-semibold text-sm">
									Selling Price / बिक्री मूल्य (₹){" "}
									<span className="text-red-500">*</span>
								</Label>
								<div className="relative">
									<span className="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-muted-foreground text-xs">
										₹
									</span>
									<Input
										id="newItemPrice"
										type="number"
										step="0.01"
										min="0"
										placeholder="e.g. 40.00"
										value={newItem.price}
										onChange={(e) =>
											setNewItem({ ...newItem, price: e.target.value })
										}
										className="pl-7 font-bold font-mono text-emerald-700 text-sm"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="newItemCost" className="font-semibold text-sm">
									Cost Price / लागत मूल्य (₹)
								</Label>
								<div className="relative">
									<span className="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-muted-foreground text-xs">
										₹
									</span>
									<Input
										id="newItemCost"
										type="number"
										step="0.01"
										min="0"
										placeholder="e.g. 32.00"
										value={newItem.costPrice}
										onChange={(e) =>
											setNewItem({ ...newItem, costPrice: e.target.value })
										}
										className="pl-7 font-mono text-sm"
									/>
								</div>
							</div>
						</div>

						{/* Initial Stock, Low Stock Threshold & Bin Location */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="newItemStock" className="font-semibold text-xs">
									Initial Stock Qty / प्रारंभिक स्टॉक{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									id="newItemStock"
									type="number"
									step="any"
									min="0"
									placeholder="e.g. 50"
									value={newItem.initialStock}
									onChange={(e) =>
										setNewItem({ ...newItem, initialStock: e.target.value })
									}
									className="font-bold font-mono text-sm"
								/>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="newItemReorder"
									className="font-semibold text-xs flex items-center gap-1 text-amber-700 dark:text-amber-400"
								>
									<AlertTriangleIcon className="h-3 w-3 text-amber-500" />
									<span>Low Stock Threshold *</span>
								</Label>
								<Input
									id="newItemReorder"
									type="number"
									min="0"
									placeholder="e.g. 10"
									value={newItem.reorderLevel}
									onChange={(e) =>
										setNewItem({ ...newItem, reorderLevel: e.target.value })
									}
									className="font-bold font-mono text-sm border-amber-300 bg-amber-50/50 text-amber-950 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="newItemBin" className="font-semibold text-xs">
									Bin Location / लेआउट
								</Label>
								<Input
									id="newItemBin"
									placeholder="e.g. Aisle B - Bin B202"
									value={newItem.binLocation}
									onChange={(e) =>
										setNewItem({ ...newItem, binLocation: e.target.value })
									}
									className="text-xs"
								/>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => setAddItemOpen(false)}
							disabled={addItemMutation.isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							disabled={
								addItemMutation.isPending ||
								!newItem.name.trim() ||
								!newItem.price ||
								Boolean(duplicateMatch)
							}
							onClick={() => {
								if (duplicateMatch) {
									toast.error(
										`Product "${duplicateMatch.product || duplicateMatch.name}" already exists in warehouse stock! Double entry is blocked.`,
									);
									return;
								}

								const parsedPrice = Number.parseFloat(newItem.price);
								const parsedCost = newItem.costPrice
									? Number.parseFloat(newItem.costPrice)
									: undefined;
								const parsedStock =
									Number.parseFloat(newItem.initialStock) || 0;
								const parsedReorder =
									Number.parseInt(newItem.reorderLevel, 10) || 10;

								if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
									toast.error("Please enter a valid positive selling price.");
									return;
								}

								const finalCategory =
									(isCustomCategory
										? customCategoryName.trim()
										: newItem.category.trim()) || "General";

								addItemMutation.mutate({
									name: newItem.name.trim(),
									sku: newItem.sku,
									price: parsedPrice,
									costPrice: parsedCost,
									category: finalCategory,
									unit: newItem.unit,
									initialStock: parsedStock,
									reorderLevel: parsedReorder,
									binLocation: newItem.binLocation,
									branchId: 1,
								});
							}}
							className={`gap-2 font-semibold text-white ${
								duplicateMatch
									? "bg-amber-600 hover:bg-amber-700 cursor-not-allowed opacity-90"
									: "bg-emerald-600 hover:bg-emerald-700"
							}`}
						>
							{duplicateMatch ? (
								<>
									<AlertTriangleIcon className="h-4 w-4" />
									<span>Item Already Exists (Double Entry Blocked)</span>
								</>
							) : addItemMutation.isPending ? (
								<>
									<Loader2Icon className="h-4 w-4 animate-spin" />
									Adding Item...
								</>
							) : (
								<>
									<PlusIcon className="h-4 w-4" />
									Add Item to Stock
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
