"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@evaluna/ui/components/card";
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
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	ClipboardCheck,
	Loader2,
	Package,
	Plus,
	Printer,
	QrCode,
	RefreshCw,
	Search,
	Sparkles,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
import { BarcodeRenderer } from "./barcode-renderer";
import { PrintUpcLabelModal } from "./print-upc-label";
import { AssignUpcTaskModal } from "./upc-task-modal";

export function UpcGeneratorForm({
	onUpcGenerated,
}: {
	onUpcGenerated?: () => void;
}) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedProduct, setSelectedProduct] = useState<{
		id: number;
		name: string;
		sku: string | null;
		category: string | null;
		price: string;
		barcode: string | null;
		upc: string | null;
		hasUpc: boolean;
		upcCreatedAt?: Date | null;
	} | null>(null);

	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
	const [assignTaskOpen, setAssignTaskOpen] = useState(false);
	const [printOpen, setPrintOpen] = useState(false);

	// Server-side product search
	const { data: searchResults, isLoading: isSearching } =
		trpc.upc.searchProducts.useQuery(
			{
				search: searchTerm,
				pageSize: 15,
			},
			{
				enabled: isSearchOpen || searchTerm.length > 1,
			},
		);

	const generateMutation = trpc.upc.generate.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.replaced
					? `UPC replaced successfully: ${data.upc}`
					: `UPC generated successfully: ${data.upc}`,
			);
			setSelectedProduct((prev) =>
				prev
					? {
							...prev,
							upc: data.upc,
							barcode: data.upc,
							hasUpc: true,
						}
					: null,
			);
			utils.upc.getStats.invalidate();
			utils.upc.searchProducts.invalidate();
			utils.upc.listHistory.invalidate();
			onUpcGenerated?.();
			setReplaceConfirmOpen(false);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to generate UPC.");
		},
	});

	const handleSelectProduct = (prod: any) => {
		setSelectedProduct(prod);
		setIsSearchOpen(false);
		setSearchTerm("");
	};

	const handleGenerateClick = () => {
		if (!selectedProduct) return;
		if (selectedProduct.hasUpc) {
			setReplaceConfirmOpen(true);
		} else {
			generateMutation.mutate({
				productId: selectedProduct.id,
				replaceExisting: false,
			});
		}
	};

	const handleConfirmReplace = () => {
		if (!selectedProduct) return;
		generateMutation.mutate({
			productId: selectedProduct.id,
			replaceExisting: true,
		});
	};

	return (
		<div className="space-y-4">
			<Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
				<CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<div>
							<CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
								<QrCode className="w-5 h-5 text-blue-600" />
								UPC Generator & Allocation
							</CardTitle>
							<CardDescription className="text-xs text-slate-500">
								Select product from ERP inventory, generate GS1-compliant 12-digit UPC-A, and assign physical task.
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 font-mono">
								Format: UPC-A (12 Digits)
							</Badge>
						</div>
					</div>
				</CardHeader>

				<CardContent className="pt-4 space-y-4">
					{/* Product Selection Bar */}
					<div className="space-y-1.5 relative">
						<Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
							Select Product for UPC Allocation
						</Label>
						<div className="relative">
							<Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
							<Input
								placeholder="Search product name, SKU, or category..."
								className="pl-9 text-xs h-9"
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setIsSearchOpen(true);
								}}
								onFocus={() => setIsSearchOpen(true)}
							/>
						</div>

						{/* Search Autocomplete Dropdown */}
						{isSearchOpen && (
							<div className="absolute z-20 left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1 space-y-1">
								{isSearching ? (
									<div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
										<Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching product catalog...
									</div>
								) : searchResults?.items && searchResults.items.length > 0 ? (
									searchResults.items.map((prod) => (
										<button
											key={prod.id}
											type="button"
											className="w-full text-left p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2 text-xs"
											onClick={() => handleSelectProduct(prod)}
										>
											<div className="truncate">
												<div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
													{prod.name}
												</div>
												<div className="text-[11px] text-slate-500 flex gap-2 mt-0.5">
													<span>SKU: <strong className="font-mono">{prod.sku || "N/A"}</strong></span>
													<span>•</span>
													<span>{prod.category || "General"}</span>
												</div>
											</div>
											<div>
												{prod.hasUpc ? (
													<Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50">
														UPC: {prod.upc}
													</Badge>
												) : (
													<Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">
														No UPC
													</Badge>
												)}
											</div>
										</button>
									))
								) : (
									<div className="p-4 text-center text-xs text-muted-foreground">
										No products found matching &quot;{searchTerm}&quot;.
									</div>
								)}
							</div>
						)}
					</div>

					{/* Selected Product Card & Actions */}
					{selectedProduct ? (
						<div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-4">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
											{selectedProduct.name}
										</span>
										{selectedProduct.hasUpc ? (
											<Badge className="bg-emerald-600 text-white text-[10px]">Active UPC</Badge>
										) : (
											<Badge variant="secondary" className="text-[10px]">Unassigned</Badge>
										)}
									</div>
									<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
										<span>SKU: <strong className="font-mono text-slate-900 dark:text-slate-200">{selectedProduct.sku || "N/A"}</strong></span>
										<span>Category: <strong>{selectedProduct.category || "General"}</strong></span>
										<span>Price: <strong>₹{selectedProduct.price}</strong></span>
									</div>
								</div>

								{/* Barcode & Generation Controls */}
								<div className="flex flex-wrap items-center gap-2">
									{!selectedProduct.hasUpc ? (
										<Button
											size="sm"
											className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
											onClick={handleGenerateClick}
											disabled={generateMutation.isPending}
										>
											{generateMutation.isPending ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<Sparkles className="w-3.5 h-3.5" />
											)}
											Generate UPC Code
										</Button>
									) : (
										<>
											<Button
												size="sm"
												variant="outline"
												className="text-xs gap-1.5"
												onClick={() => setPrintOpen(true)}
											>
												<Printer className="w-3.5 h-3.5" /> Print Label
											</Button>
											<Button
												size="sm"
												className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
												onClick={() => setAssignTaskOpen(true)}
											>
												<ClipboardCheck className="w-3.5 h-3.5" /> Assign Task
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-xs text-amber-700 hover:text-amber-800 border-amber-300 hover:bg-amber-50"
												onClick={handleGenerateClick}
											>
												<RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
											</Button>
										</>
									)}
								</div>
							</div>

							{/* Active UPC Display Banner */}
							{selectedProduct.hasUpc && selectedProduct.upc && (
								<div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
											<CheckCircle2 className="w-5 h-5" />
										</div>
										<div>
											<div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
												Active UPC-A: <span className="font-mono text-blue-600 text-sm">{selectedProduct.upc}</span>
											</div>
											<div className="text-[11px] text-slate-500">
												Verified GS1 Modulo 10 Checksum • Ready for thermal scanning
											</div>
										</div>
									</div>

									<div className="py-1 px-3 bg-white rounded border border-slate-100 dark:border-slate-800">
										<BarcodeRenderer value={selectedProduct.upc} height={36} width={1.5} fontSize={10} />
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
							<Package className="w-8 h-8 text-slate-400 mx-auto" />
							<p className="text-xs font-medium text-slate-600 dark:text-slate-400">
								Search and select any product from the catalog above to view or generate its UPC.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Confirm Replace Dialog */}
			<Dialog open={replaceConfirmOpen} onOpenChange={setReplaceConfirmOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-amber-600 font-bold">
							<AlertTriangle className="w-5 h-5" />
							Regenerate / Replace Active UPC?
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Product <strong>&quot;{selectedProduct?.name}&quot;</strong> already has active UPC <strong>{selectedProduct?.upc}</strong>.
						</DialogDescription>
					</DialogHeader>
					<Alert variant="destructive" className="my-2 bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200 text-xs">
						<AlertCircle className="w-4 h-4 text-amber-600" />
						<AlertTitle className="font-semibold">Warning: Barcode Replacement</AlertTitle>
						<AlertDescription className="text-[11px] mt-1">
							Replacing this UPC will invalidate previously printed stickers. You must assign a new task to re-label existing inventory on the warehouse floor.
						</AlertDescription>
					</Alert>
					<DialogFooter className="flex gap-2 justify-end">
						<Button variant="outline" size="sm" onClick={() => setReplaceConfirmOpen(false)}>
							Cancel
						</Button>
						<Button
							size="sm"
							className="bg-amber-600 hover:bg-amber-700 text-white"
							onClick={handleConfirmReplace}
							disabled={generateMutation.isPending}
						>
							{generateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
							Confirm New UPC
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Assign Task Modal */}
			{selectedProduct && (
				<AssignUpcTaskModal
					isOpen={assignTaskOpen}
					onClose={() => setAssignTaskOpen(false)}
					product={selectedProduct}
				/>
			)}

			{/* Print Modal */}
			{selectedProduct && selectedProduct.upc && (
				<PrintUpcLabelModal
					isOpen={printOpen}
					onClose={() => setPrintOpen(false)}
					product={{
						id: selectedProduct.id,
						name: selectedProduct.name,
						sku: selectedProduct.sku,
						category: selectedProduct.category,
						price: selectedProduct.price,
						upc: selectedProduct.upc,
					}}
				/>
			)}
		</div>
	);
}

export { UpcGeneratorForm as UPCGeneratorForm };
