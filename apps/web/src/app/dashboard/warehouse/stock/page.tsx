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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	AlertTriangleIcon,
	BoxesIcon,
	Edit3Icon,
	FilterIcon,
	IndianRupeeIcon,
	Loader2Icon,
	PencilIcon,
	RefreshCwIcon,
	SaveIcon,
	SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function StockPage() {
	const t = useTranslations();
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const [editItem, setEditItem] = useState<any>(null);
	const [editStockQty, setEditStockQty] = useState<string>("");
	const [editPrice, setEditPrice] = useState<string>("");

	// Query actual inventory balances using the existing inventory list API
	const {
		data: invData,
		isLoading: invLoading,
		isFetching,
		refetch,
	} = trpc.inventory.list.useQuery({
		search: searchQuery || undefined,
		limit: 100,
	});

	const updateMutation = trpc.inventory.updateStockAndPrice.useMutation({
		onSuccess: () => {
			toast.success(t("warehouse.updateStockSuccess"));
			refetch();
			setEditItem(null);
		},
		onError: (err) => {
			toast.error(`Failed: ${err.message}`);
		},
	});

	const handleOpenEdit = (item: any) => {
		setEditItem(item);
		setEditStockQty(String(item.qty_on_hand ?? 0));
		setEditPrice(String(item.price ?? 0));
	};

	const handleSave = async () => {
		if (!editItem) return;
		const qty = Number.parseInt(editStockQty, 10);
		const price = Number.parseFloat(editPrice);

		if (Number.isNaN(qty) || qty < 0) {
			toast.error(t("products.stockMustBeNonNegative"));
			return;
		}
		if (Number.isNaN(price) || price < 0) {
			toast.error(t("products.priceMustBePositive"));
			return;
		}

		const targetProdId = editItem.productId ?? editItem.id;
		await updateMutation.mutateAsync({
			inventoryId: editItem.id ? Number(editItem.id) : undefined,
			productId: targetProdId ? Number(targetProdId) : undefined,
			branchId: editItem.branchId || 1,
			qtyOnHand: qty,
			price: price,
		});
	};

	const filteredItems =
		invData?.items?.filter(
			(item) =>
				item.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	const totalValuation = filteredItems.reduce(
		(acc, curr) => acc + (curr.qty_on_hand || 0) * (curr.price || 0),
		0,
	);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						{t("warehouse.warehouseStockLedger")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("warehouse.realTimeStockSpreadsheet")}
					</p>
				</div>
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="relative w-full sm:w-72">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t("common.search")}
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isFetching}
						className="shrink-0 gap-1.5"
					>
						<RefreshCwIcon className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
						{isFetching ? t("common.loading") : t("common.update")}
					</Button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-4">
				{/* Total Cost Valuation */}
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							{t("warehouse.inventoryAssetCost")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-slate-900 dark:text-slate-100 font-mono">
							₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
						</div>
					</CardContent>
				</Card>

				{/* Total Available Units */}
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							{t("warehouse.storedUnits")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-slate-900 dark:text-slate-100 font-mono">
							{invLoading
								? "..."
								: filteredItems.reduce(
										(acc, curr) => acc + (curr.qty_on_hand || 0),
										0,
									)}
						</div>
					</CardContent>
				</Card>

				{/* Active Alerts */}
				<Card className="border-l-4 border-l-amber-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							{t("warehouse.lowStockLines")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-amber-600 font-mono">
							{filteredItems.filter((i) => i.status === "low_stock" || (i.qty_on_hand || 0) <= 10).length}
						</div>
					</CardContent>
				</Card>

				{/* Out of Stock Lines */}
				<Card className="border-l-4 border-l-red-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							{t("warehouse.outOfStockLines")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-500 font-mono">
							{filteredItems.filter((i) => (i.qty_on_hand || 0) <= 0).length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Stock Table */}
			<Card className="shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between border-b pb-4">
					<div>
						<CardTitle className="font-bold text-base">
							{t("warehouse.realTimeStockSpreadsheet")}
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{invLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("common.name")}</TableHead>
										<TableHead>{t("warehouse.skuReference")}</TableHead>
										<TableHead>{t("warehouse.sellingPrice")}</TableHead>
										<TableHead>{t("warehouse.binLayout")}</TableHead>
										<TableHead>{t("products.stock")}</TableHead>
										<TableHead>{t("common.status")}</TableHead>
										<TableHead className="text-right">{t("common.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredItems.map((item) => (
										<TableRow key={item.productId || item.id}>
											<TableCell className="font-bold text-slate-900 dark:text-slate-100">
												{item.product}
											</TableCell>
											<TableCell className="font-semibold text-slate-500 text-xs font-mono">
												{item.sku}
											</TableCell>
											<TableCell className="font-bold text-emerald-600 font-mono text-sm">
												₹{Number(item.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</TableCell>
											<TableCell className="font-medium text-slate-600 text-xs">
												Aisle B - Bin B202
											</TableCell>
											<TableCell className="font-bold text-sm font-mono">
												{item.qty_on_hand}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														(item.qty_on_hand || 0) > 10
															? "default"
															: (item.qty_on_hand || 0) > 0
																? "secondary"
																: "destructive"
													}
													className={
														(item.qty_on_hand || 0) <= 10 && (item.qty_on_hand || 0) > 0
															? "border-amber-200 bg-amber-50 text-amber-700"
															: ""
													}
												>
													{(item.qty_on_hand || 0) > 10
														? t("status.inStock")
														: (item.qty_on_hand || 0) > 0
															? t("status.lowStock")
															: t("status.outOfStock")}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="outline"
													className="h-8 gap-1.5 border-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40"
													onClick={() => handleOpenEdit(item)}
												>
													<PencilIcon className="h-3.5 w-3.5" />
													{t("warehouse.editStockAndPrice")}
												</Button>
											</TableCell>
										</TableRow>
									))}
									{filteredItems.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={7}
												className="py-12 text-center text-muted-foreground"
											>
												<BoxesIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													{t("common.noItemFound")}
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

			{/* Edit Stock Quantity & Unit Price Dialog */}
			<Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<Edit3Icon className="h-5 w-5 text-blue-600" />
							{t("warehouse.adjustStockAndUnitPrice")}
						</DialogTitle>
						<DialogDescription>
							{editItem?.product}
						</DialogDescription>
					</DialogHeader>

					{editItem && (
						<div className="space-y-4 py-3">
							<div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-md border text-xs">
								<div>
									<span className="text-muted-foreground block">{t("common.name")}</span>
									<span className="font-bold text-foreground">{editItem.product}</span>
								</div>
								<div>
									<span className="text-muted-foreground block">{t("warehouse.skuReference")}</span>
									<span className="font-mono font-semibold text-foreground">{editItem.sku}</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="stockQty" className="font-semibold text-sm">
									{t("products.stock")}
								</Label>
								<Input
									id="stockQty"
									type="number"
									min="0"
									placeholder="e.g. 50"
									value={editStockQty}
									onChange={(e) => setEditStockQty(e.target.value)}
									className="font-mono text-base font-bold"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="price" className="font-semibold text-sm">
									{t("warehouse.sellingPrice")}
								</Label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
									<Input
										id="price"
										type="number"
										step="0.01"
										min="0"
										placeholder="e.g. 25.00"
										value={editPrice}
										onChange={(e) => setEditPrice(e.target.value)}
										className="pl-8 font-mono text-base font-bold text-emerald-700"
									/>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setEditItem(null)}
							disabled={updateMutation.isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={updateMutation.isPending}
							className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
						>
							{updateMutation.isPending ? (
								<>
									<Loader2Icon className="h-4 w-4 animate-spin" />
									{t("common.loading")}
								</>
							) : (
								<>
									<SaveIcon className="h-4 w-4" />
									{t("common.save")}
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
