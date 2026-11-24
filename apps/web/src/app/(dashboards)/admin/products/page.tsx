"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
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
	CameraIcon,
	CheckCircle2Icon,
	FilterIcon,
	ImageIcon,
	LayoutGridIcon,
	ListIcon,
	Loader2Icon,
	PackageIcon,
	RefreshCwIcon,
	SearchIcon,
	Trash2Icon,
	UploadCloudIcon,
	XIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { compressProductImageFile } from "@/lib/image-compression";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

interface ProductItem {
	id: number;
	name: string;
	sku: string;
	category: string;
	price: number;
	imageUrl: string | null;
	storagePath: string | null;
	qtyOnHand: number;
	unit: string;
	barcode: string;
	raw: unknown;
}

export default function AdminProductImageManagementPage() {
	const locale = useLocale();
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// Search & Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "has_image" | "missing_image"
	>("all");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

	// Active modal state
	const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalImagePreview, setModalImagePreview] = useState<string | null>(
		null,
	);
	const [modalImageUrl, setModalImageUrl] = useState<string>("");
	const [modalStoragePath, setModalStoragePath] = useState<string>("");
	const [modalFileName, setModalFileName] = useState<string>("");
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const quickFileInputRef = useRef<HTMLInputElement>(null);
	const [quickUploadProductId, setQuickUploadProductId] = useState<
		number | null
	>(null);

	// Fetch all inventory/products
	const { data, isLoading, refetch } = trpc.inventory.list.useQuery({
		branchId: 1,
		status: "all",
		limit: 500,
	});

	const productsList = useMemo<ProductItem[]>(() => {
		const items = (data?.items || []) as Array<Record<string, unknown>>;
		return items.map((p) => {
			const id = Number(p.productId ?? p.id);
			const name = String(p.product ?? p.name ?? "Unnamed Product");
			const sku = String(p.sku ?? "NO-SKU");
			const category = String(p.category ?? "General");
			const price = Number(p.price || p.baseSellingPrice || 0);
			const imageUrl = p.imageUrl || null;
			const storagePath = p.imageStoragePath || null;
			const qtyOnHand = Number(p.qty_on_hand || 0);
			return {
				id,
				name,
				sku,
				category,
				price,
				imageUrl,
				storagePath,
				qtyOnHand,
				unit: p.unit || "Pcs",
				barcode: p.barcode || "",
				raw: p,
			};
		});
	}, [data]);

	// Extract unique categories
	const categories = useMemo(() => {
		const cats = new Set<string>();
		productsList.forEach((p) => {
			if (p.category) cats.add(p.category);
		});
		return Array.from(cats).sort();
	}, [productsList]);

	// Filtered products
	const filteredProducts = useMemo(() => {
		return productsList.filter((p) => {
			// Status Filter
			if (statusFilter === "has_image" && !p.imageUrl) return false;
			if (statusFilter === "missing_image" && p.imageUrl) return false;

			// Category Filter
			if (selectedCategory !== "all" && p.category !== selectedCategory)
				return false;

			// Search Query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchName = p.name.toLowerCase().includes(q);
				const matchSku = p.sku.toLowerCase().includes(q);
				const matchBarcode = p.barcode.toLowerCase().includes(q);
				const matchCategory = p.category.toLowerCase().includes(q);
				if (!matchName && !matchSku && !matchBarcode && !matchCategory)
					return false;
			}

			return true;
		});
	}, [productsList, statusFilter, selectedCategory, searchQuery]);

	// Stats counters
	const totalProducts = productsList.length;
	const productsWithPhoto = useMemo(
		() => productsList.filter((p) => Boolean(p.imageUrl)).length,
		[productsList],
	);
	const productsMissingPhoto = totalProducts - productsWithPhoto;

	// Open edit modal for a product
	const handleOpenModal = (prod: ProductItem) => {
		setActiveProduct(prod);
		setModalImagePreview(prod.imageUrl || null);
		setModalImageUrl(prod.imageUrl || "");
		setModalStoragePath(prod.storagePath || "");
		setModalFileName("");
		setUploadError(null);
		setUploadProgress(0);
		setIsModalOpen(true);
	};

	// Execute file upload
	const handleUploadFile = async (file: File, targetProductId?: number) => {
		const prodId = targetProductId ?? activeProduct?.id;
		if (!prodId) {
			toast.error("No product selected for upload.");
			return;
		}

		const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		if (!allowedMimes.includes(file.type.toLowerCase())) {
			const msg =
				"Invalid file type. Only JPG, JPEG, PNG, and WEBP formats are allowed.";
			setUploadError(msg);
			toast.error(msg);
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			const msg = `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB.`;
			setUploadError(msg);
			toast.error(msg);
			return;
		}

		setUploadError(null);
		setIsUploading(true);
		setUploadProgress(15);
		setModalFileName(file.name);

		try {
			// Client-Side Canvas WebP Compression:
			// Compresses 2MB-10MB camera photo to ~35KB-70KB WebP max 800px preserving crystal clarity
			let fileToUpload = file;
			try {
				fileToUpload = await compressProductImageFile(file, {
					maxWidth: 800,
					maxHeight: 800,
					quality: 0.78,
				});
			} catch (compErr) {
				console.warn("[admin/products] Pre-compression skipped, using original:", compErr);
			}

			// Local preview of the optimized file
			const localUrl = URL.createObjectURL(fileToUpload);
			setModalImagePreview(localUrl);
			setUploadProgress(45);

			const formData = new FormData();
			formData.append("file", fileToUpload);
			formData.append("productId", String(prodId));

			const res = await fetch("/api/products/upload", {
				method: "POST",
				body: formData,
			});

			setUploadProgress(85);
			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.error || "Failed to upload product image.");
			}

			setUploadProgress(100);
			setModalImageUrl(result.imageUrl);
			setModalStoragePath(result.storagePath);
			setModalImagePreview(result.imageUrl);
			setModalFileName(result.fileName || file.name);

			toast.success(
				locale === "hi"
					? "उत्पाद फोटो सफलतापूर्वक अपडेट हो गई!"
					: "Product image uploaded and saved successfully!",
			);

			// Invalidate queries so all lists update immediately
			utils.inventory.invalidate();
		} catch (err: unknown) {
			console.error("[admin/products] Upload error:", err);
			const message =
				err instanceof Error ? err.message : "Failed to upload image";
			setUploadError(message);
			toast.error(message);
		} finally {
			setIsUploading(false);
		}
	};

	// Remove image
	const handleRemoveImage = async (prodId?: number) => {
		const targetId = prodId ?? activeProduct?.id;
		if (!targetId) return;

		try {
			// Call updateStockAndPrice with null imageUrl to clear image reference
			const targetProd = productsList.find((p) => p.id === targetId);
			if (targetProd) {
				await trpc.inventory.updateStockAndPrice.mutate({
					productId: targetId,
					branchId: 1,
					qtyOnHand: targetProd.qtyOnHand,
					price: targetProd.price,
					imageUrl: "",
					imageStoragePath: "",
					reason: "Product image removed by Admin",
				});
			}

			setModalImageUrl("");
			setModalStoragePath("");
			setModalImagePreview(null);
			setModalFileName("");
			setUploadError(null);

			toast.info(
				locale === "hi"
					? "उत्पाद से फोटो हटा दी गई।"
					: "Product image removed successfully.",
			);

			utils.inventory.invalidate();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to remove image";
			toast.error(message);
		}
	};

	// Quick 1-click upload trigger
	const handleQuickUploadClick = (productId: number) => {
		setQuickUploadProductId(productId);
		quickFileInputRef.current?.click();
	};

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 border-border/60 border-b pb-5 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2.5">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-500/20 shadow-md">
							<CameraIcon className="h-5 w-5" />
						</div>
						<div>
							<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
								{locale === "hi"
									? "उत्पाद फोटो प्रबंधन"
									: "Product Catalog & Images"}
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								{locale === "hi"
									? "सभी उत्पादों की फोटो अपलोड करें व बदलें। यह फोटो कस्टमर स्टोरफ्रंट, POS और वेयरहाउस में तुरंत दिखेगी।"
									: "Upload, replace, and manage product photos visible across Customer Storefront, POS, and Warehouse."}
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						className="gap-1.5 text-xs shadow-xs"
					>
						<RefreshCwIcon className="h-3.5 w-3.5" />
						<span>{locale === "hi" ? "रिफ्रेश" : "Refresh"}</span>
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				<Card className="border-border/60 bg-card/60 shadow-xs backdrop-blur-xs">
					<CardContent className="flex items-center justify-between p-4 sm:p-5">
						<div>
							<p className="font-medium text-muted-foreground text-xs">
								{locale === "hi" ? "कुल उत्पाद" : "Total Products"}
							</p>
							<p className="mt-1 font-bold text-2xl tracking-tight">
								{totalProducts}
							</p>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
							<PackageIcon className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer border-border/60 shadow-xs transition-all hover:border-emerald-300 dark:hover:border-emerald-700 ${
						statusFilter === "has_image"
							? "bg-emerald-50/20 ring-2 ring-emerald-500 dark:bg-emerald-950/20"
							: "bg-card/60"
					}`}
					onClick={() =>
						setStatusFilter(statusFilter === "has_image" ? "all" : "has_image")
					}
				>
					<CardContent className="flex items-center justify-between p-4 sm:p-5">
						<div>
							<div className="flex items-center gap-1.5">
								<p className="font-medium text-muted-foreground text-xs">
									{locale === "hi" ? "फोटो उपलब्ध" : "With Photos"}
								</p>
								<Badge
									variant="outline"
									className="border-emerald-300 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
								>
									{totalProducts > 0
										? `${Math.round((productsWithPhoto / totalProducts) * 100)}%`
										: "0%"}
								</Badge>
							</div>
							<p className="mt-1 font-bold text-2xl text-emerald-600 tracking-tight dark:text-emerald-400">
								{productsWithPhoto}
							</p>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
							<CheckCircle2Icon className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>

				<Card
					className={`cursor-pointer border-border/60 shadow-xs transition-all hover:border-amber-300 dark:hover:border-amber-700 ${
						statusFilter === "missing_image"
							? "bg-amber-50/20 ring-2 ring-amber-500 dark:bg-amber-950/20"
							: "bg-card/60"
					}`}
					onClick={() =>
						setStatusFilter(
							statusFilter === "missing_image" ? "all" : "missing_image",
						)
					}
				>
					<CardContent className="flex items-center justify-between p-4 sm:p-5">
						<div>
							<div className="flex items-center gap-1.5">
								<p className="font-medium text-muted-foreground text-xs">
									{locale === "hi" ? "बिना फोटो" : "Missing Photos"}
								</p>
								{productsMissingPhoto > 0 && (
									<Badge
										variant="outline"
										className="border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
									>
										Needs Photo
									</Badge>
								)}
							</div>
							<p className="mt-1 font-bold text-2xl text-amber-600 tracking-tight dark:text-amber-400">
								{productsMissingPhoto}
							</p>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
							<AlertTriangleIcon className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/60 shadow-xs backdrop-blur-xs">
					<CardContent className="flex items-center justify-between p-4 sm:p-5">
						<div>
							<p className="font-medium text-muted-foreground text-xs">
								{locale === "hi" ? "श्रेणियां (Categories)" : "Categories"}
							</p>
							<p className="mt-1 font-bold text-2xl tracking-tight">
								{categories.length}
							</p>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100/80 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
							<FilterIcon className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search, Filter Tabs & View Toggle */}
			<div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs lg:flex-row lg:items-center">
				<div className="flex flex-1 flex-col items-center gap-2 sm:flex-row">
					{/* Search Input */}
					<div className="relative w-full sm:w-80">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={
								locale === "hi"
									? "उत्पाद नाम, SKU या बारकोड खोजें..."
									: "Search by product name, SKU, barcode..."
							}
							className="h-9 pr-8 pl-9 text-xs"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<XIcon className="h-3.5 w-3.5" />
							</button>
						)}
					</div>

					{/* Category Selector */}
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="h-9 w-full rounded-lg border border-border bg-background px-3 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
					>
						<option value="all">
							{locale === "hi"
								? "सभी श्रेणियां (All Categories)"
								: "All Categories"}
						</option>
						{categories.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center justify-between gap-2 border-border/50 border-t pt-2 sm:justify-end sm:border-t-0 sm:pt-0">
					{/* Status Filter Buttons */}
					<div className="inline-flex rounded-lg bg-muted p-1 text-xs">
						<button
							type="button"
							onClick={() => setStatusFilter("all")}
							className={`rounded-md px-2.5 py-1 font-medium transition-all ${
								statusFilter === "all"
									? "bg-background font-semibold text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{locale === "hi" ? "सभी" : "All"} ({totalProducts})
						</button>
						<button
							type="button"
							onClick={() => setStatusFilter("missing_image")}
							className={`rounded-md px-2.5 py-1 font-medium transition-all ${
								statusFilter === "missing_image"
									? "bg-amber-100 font-semibold text-amber-900 shadow-xs dark:bg-amber-950 dark:text-amber-200"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{locale === "hi" ? "बिना फोटो" : "No Photo"} (
							{productsMissingPhoto})
						</button>
						<button
							type="button"
							onClick={() => setStatusFilter("has_image")}
							className={`rounded-md px-2.5 py-1 font-medium transition-all ${
								statusFilter === "has_image"
									? "bg-emerald-100 font-semibold text-emerald-900 shadow-xs dark:bg-emerald-950 dark:text-emerald-200"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{locale === "hi" ? "फोटो सहित" : "With Photo"} (
							{productsWithPhoto})
						</button>
					</div>

					{/* View Mode Toggle */}
					<div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
						<button
							type="button"
							onClick={() => setViewMode("grid")}
							className={`rounded-md p-1.5 transition-colors ${
								viewMode === "grid"
									? "bg-background text-blue-600 shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
							title="Grid View"
						>
							<LayoutGridIcon className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => setViewMode("table")}
							className={`rounded-md p-1.5 transition-colors ${
								viewMode === "table"
									? "bg-background text-blue-600 shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
							title="Table View"
						>
							<ListIcon className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Hidden Quick Native File Input */}
			<input
				type="file"
				ref={quickFileInputRef}
				className="hidden"
				accept="image/jpeg,image/png,image/webp,image/jpg"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file && quickUploadProductId) {
						handleUploadFile(file, quickUploadProductId);
					}
					e.target.value = "";
				}}
			/>

			{/* Loading State */}
			{isLoading && (
				<div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-border/60 bg-card p-16">
					<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
					<p className="font-medium text-muted-foreground text-xs">
						{locale === "hi"
							? "उत्पाद सूची लोड हो रही है..."
							: "Loading products catalog..."}
					</p>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && filteredProducts.length === 0 && (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-border border-dashed bg-card p-16 text-center">
					<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
						<PackageIcon className="h-7 w-7" />
					</div>
					<h3 className="font-bold text-base text-foreground">
						{locale === "hi" ? "कोई उत्पाद नहीं मिला" : "No products found"}
					</h3>
					<p className="mt-1 max-w-sm text-muted-foreground text-xs">
						{searchQuery || statusFilter !== "all" || selectedCategory !== "all"
							? "Try clearing your search query or reset filters."
							: "No products exist in your inventory yet."}
					</p>
					{(searchQuery ||
						statusFilter !== "all" ||
						selectedCategory !== "all") && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSearchQuery("");
								setStatusFilter("all");
								setSelectedCategory("all");
							}}
							className="mt-4 text-xs"
						>
							Reset Filters
						</Button>
					)}
				</div>
			)}

			{/* Grid View */}
			{!isLoading && viewMode === "grid" && filteredProducts.length > 0 && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
					{filteredProducts.map((prod) => (
						<Card
							key={prod.id}
							className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-200 hover:border-blue-400/80 hover:shadow-md"
						>
							<div>
								{/* Image Preview Area */}
								<div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden border-border/60 border-b bg-slate-50 p-3 dark:bg-slate-900">
									{prod.imageUrl ? (
										<img
											src={prod.imageUrl}
											alt={prod.name}
											className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
											onError={(e) => {
												(e.target as HTMLImageElement).src = "";
											}}
										/>
									) : (
										<div className="flex flex-col items-center justify-center p-4 text-center">
											<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200/60 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
												<CameraIcon className="h-6 w-6" />
											</div>
											<span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
												No Photo Uploaded
											</span>
											<span className="mt-0.5 text-[10px] text-muted-foreground">
												Default icon is shown to customers
											</span>
										</div>
									)}

									{/* Status Badge Over Image */}
									<div className="absolute top-2 left-2">
										{prod.imageUrl ? (
											<Badge
												variant="outline"
												className="gap-1 border-emerald-300 bg-emerald-50/90 font-bold text-[10px] text-emerald-800 shadow-xs backdrop-blur-xs dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300"
											>
												<CheckCircle2Icon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
												<span>Photo Active</span>
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="gap-1 border-amber-300 bg-amber-50/90 font-bold text-[10px] text-amber-800 shadow-xs backdrop-blur-xs dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-300"
											>
												<AlertCircleIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
												<span>Needs Photo</span>
											</Badge>
										)}
									</div>
								</div>

								{/* Product Details */}
								<div className="space-y-2 p-3.5">
									<div className="flex items-start justify-between gap-2">
										<h3
											className="line-clamp-2 font-bold text-foreground text-sm leading-snug"
											title={prod.name}
										>
											{prod.name}
										</h3>
									</div>

									<div className="flex flex-wrap items-center gap-1.5 text-[11px]">
										<span className="rounded bg-muted px-1.5 py-0.5 font-medium font-mono text-[10px] text-slate-500 dark:text-slate-400">
											{prod.sku}
										</span>
										<span className="text-muted-foreground">•</span>
										<span className="max-w-[120px] truncate text-muted-foreground">
											{prod.category}
										</span>
									</div>

									<div className="flex items-center justify-between pt-1">
										<span className="font-bold text-blue-600 text-sm dark:text-blue-400">
											{formatCurrency(prod.price)}
										</span>
										<span className="text-[11px] text-muted-foreground">
											Stock:{" "}
											<strong className="text-foreground">
												{prod.qtyOnHand} {prod.unit}
											</strong>
										</span>
									</div>
								</div>
							</div>

							{/* Card Action Footer */}
							<div className="mt-2 flex items-center gap-2 border-border/40 border-t p-3 pt-0">
								<Button
									type="button"
									variant={prod.imageUrl ? "outline" : "default"}
									size="sm"
									onClick={() => handleOpenModal(prod)}
									className={`h-8 flex-1 gap-1.5 font-semibold text-xs ${
										!prod.imageUrl
											? "bg-blue-600 text-white hover:bg-blue-700"
											: ""
									}`}
								>
									{prod.imageUrl ? (
										<>
											<RefreshCwIcon className="h-3.5 w-3.5" />
											<span>Replace Photo</span>
										</>
									) : (
										<>
											<UploadCloudIcon className="h-3.5 w-3.5" />
											<span>Upload Photo</span>
										</>
									)}
								</Button>

								{prod.imageUrl && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveImage(prod.id)}
										title="Remove Photo"
										className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
									>
										<Trash2Icon className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Table View */}
			{!isLoading && viewMode === "table" && filteredProducts.length > 0 && (
				<div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/40 hover:bg-muted/40">
								<TableHead className="w-16 text-center">Photo</TableHead>
								<TableHead>Product Name</TableHead>
								<TableHead>SKU</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Selling Price</TableHead>
								<TableHead>Stock</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredProducts.map((prod) => (
								<TableRow key={prod.id} className="hover:bg-muted/20">
									<TableCell className="p-2 text-center">
										<div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-50 dark:bg-slate-900">
											{prod.imageUrl ? (
												<img
													src={prod.imageUrl}
													alt={prod.name}
													className="h-full w-full object-contain"
												/>
											) : (
												<CameraIcon className="h-5 w-5 text-muted-foreground/60" />
											)}
										</div>
									</TableCell>
									<TableCell>
										<span
											className="block max-w-xs truncate font-semibold text-foreground text-xs sm:text-sm"
											title={prod.name}
										>
											{prod.name}
										</span>
									</TableCell>
									<TableCell>
										<span className="font-mono text-muted-foreground text-xs">
											{prod.sku}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-muted-foreground text-xs">
											{prod.category}
										</span>
									</TableCell>
									<TableCell>
										<span className="font-bold text-foreground text-xs">
											{formatCurrency(prod.price)}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-muted-foreground text-xs">
											{prod.qtyOnHand} {prod.unit}
										</span>
									</TableCell>
									<TableCell>
										{prod.imageUrl ? (
											<Badge
												variant="outline"
												className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
											>
												Photo Active
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300"
											>
												No Photo
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1.5">
											<Button
												size="sm"
												variant={prod.imageUrl ? "outline" : "default"}
												onClick={() => handleOpenModal(prod)}
												className="h-7 px-2.5 font-medium text-xs"
											>
												{prod.imageUrl ? "Replace" : "Upload"}
											</Button>
											{prod.imageUrl && (
												<Button
													size="icon"
													variant="ghost"
													onClick={() => handleRemoveImage(prod.id)}
													className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
													title="Remove Photo"
												>
													<Trash2Icon className="h-3.5 w-3.5" />
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Full Interactive Image Upload Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-[95vw] rounded-2xl sm:max-w-xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
							<ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							<span>Product Image Management (उत्पाद की फोटो)</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							{activeProduct ? (
								<span className="font-semibold text-foreground">
									#{activeProduct.id} • {activeProduct.name} (
									{activeProduct.sku})
								</span>
							) : (
								"Upload or update product photo."
							)}
						</DialogDescription>
					</DialogHeader>

					{/* Hidden Native File Input inside Modal */}
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept="image/jpeg,image/png,image/webp,image/jpg"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								handleUploadFile(file);
							}
							e.target.value = "";
						}}
					/>

					<div className="space-y-4 py-2">
						{modalImagePreview ? (
							<div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
								<div className="flex flex-col items-center gap-4 sm:flex-row">
									{/* Image Preview Box */}
									<div className="relative flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-inner sm:h-48 sm:w-48 dark:border-slate-800 dark:bg-slate-900">
										<img
											src={modalImagePreview}
											alt={activeProduct?.name || "Product preview"}
											className="h-full w-full object-contain"
										/>
										{isUploading && (
											<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white backdrop-blur-xs">
												<Loader2Icon className="h-6 w-6 animate-spin text-blue-400" />
												<span className="font-bold text-[11px]">
													Uploading... {uploadProgress}%
												</span>
											</div>
										)}
									</div>

									{/* Image Details & Action Controls */}
									<div className="flex w-full flex-1 flex-col justify-between space-y-3">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className="gap-1 border-emerald-300 bg-emerald-50 font-bold text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
												>
													<CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
													<span>Photo Linked</span>
												</Badge>
												{modalFileName && (
													<span
														className="max-w-[180px] truncate font-mono text-muted-foreground text-xs"
														title={modalFileName}
													>
														{modalFileName}
													</span>
												)}
											</div>
											<p className="pt-1 text-[11px] text-muted-foreground">
												{locale === "hi"
													? "यह फोटो कस्टमर कैटलॉग, POS और वेयरहाउस में तुरंत दिखेगी।"
													: "This photo is permanently stored and visible in Customer Catalog, POS, and Warehouse."}
											</p>
										</div>

										{/* Progress Bar */}
										{isUploading && (
											<div className="w-full space-y-1">
												<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
													<div
														className="h-full bg-blue-600 transition-all duration-300"
														style={{ width: `${uploadProgress}%` }}
													/>
												</div>
												<span className="text-[10px] text-muted-foreground">
													{uploadProgress}% uploaded...
												</span>
											</div>
										)}

										{/* Replace & Remove buttons */}
										<div className="flex flex-wrap items-center gap-2 pt-1">
											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={isUploading}
												onClick={() => fileInputRef.current?.click()}
												className="h-8 gap-1.5 border-slate-300 font-semibold text-xs hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:hover:bg-blue-950/40"
											>
												<RefreshCwIcon className="h-3.5 w-3.5" />
												<span>Replace Image (फोटो बदलें)</span>
											</Button>

											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={isUploading}
												onClick={() => handleRemoveImage()}
												className="h-8 gap-1.5 border-rose-200 font-semibold text-rose-600 text-xs hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
											>
												<Trash2Icon className="h-3.5 w-3.5" />
												<span>Remove (फोटो हटाएं)</span>
											</Button>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragging(true);
								}}
								onDragLeave={(e) => {
									e.preventDefault();
									setIsDragging(false);
								}}
								onDrop={(e) => {
									e.preventDefault();
									setIsDragging(false);
									const file = e.dataTransfer.files?.[0];
									if (file) {
										handleUploadFile(file);
									}
								}}
								className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
									isDragging
										? "border-blue-500 bg-blue-50/80 dark:border-blue-400 dark:bg-blue-950/40"
										: "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
								}`}
							>
								<div className="mb-2.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs dark:bg-blue-950/60 dark:text-blue-400">
									<UploadCloudIcon className="h-7 w-7" />
								</div>
								<p className="font-semibold text-slate-800 text-xs dark:text-slate-200">
									Drag and drop image here or{" "}
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className="cursor-pointer font-bold text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
									>
										Browse Files
									</button>
								</p>
								<p className="mt-1 text-[11px] text-muted-foreground">
									Supported formats: JPG, JPEG, PNG, WEBP (Maximum file size: 5
									MB)
								</p>
								<Button
									type="button"
									size="sm"
									variant="default"
									onClick={() => fileInputRef.current?.click()}
									disabled={isUploading}
									className="mt-4 h-8 gap-1.5 bg-blue-600 font-semibold text-white text-xs hover:bg-blue-700"
								>
									<UploadCloudIcon className="h-3.5 w-3.5" />
									<span>Upload Product Photo</span>
								</Button>
							</div>
						)}

						{/* Error notice if upload failed */}
						{uploadError && (
							<div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2.5 font-medium text-rose-700 text-xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
								<AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-600" />
								<span>{uploadError}</span>
							</div>
						)}
					</div>

					<DialogFooter className="border-border/50 border-t pt-3 sm:justify-between">
						<span className="self-center text-[11px] text-muted-foreground">
							Max 5 MB • Persistent Storage
						</span>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsModalOpen(false)}
							className="font-semibold text-xs"
						>
							Close (बंद करें)
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
