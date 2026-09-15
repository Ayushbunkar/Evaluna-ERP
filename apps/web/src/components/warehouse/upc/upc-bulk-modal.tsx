"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Checkbox } from "@evaluna/ui/components/checkbox";
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
	CheckCircle2,
	Layers,
	Loader2,
	Package,
	Search,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

interface BulkUpcModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function BulkUpcModal({ isOpen, onClose, onSuccess }: BulkUpcModalProps) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [forceReplace, setForceReplace] = useState(false);

	const { data, isLoading } = trpc.upc.searchProducts.useQuery(
		{
			search,
			hasUpcFilter: "without_upc",
			pageSize: 50,
		},
		{
			enabled: isOpen,
		},
	);

	const bulkGenerateMutation = trpc.upc.bulkGenerate.useMutation({
		onSuccess: (res) => {
			toast.success(`Generated ${res.generatedCount} UPCs (${res.skippedCount} skipped).`);
			utils.upc.getStats.invalidate();
			utils.upc.searchProducts.invalidate();
			utils.upc.listHistory.invalidate();
			onSuccess?.();
			setSelectedIds([]);
			onClose();
		},
		onError: (err) => {
			toast.error(err.message || "Bulk generation failed.");
		},
	});

	const handleToggleAll = () => {
		if (!data?.items) return;
		if (selectedIds.length === data.items.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(data.items.map((i) => i.id));
		}
	};

	const handleToggle = (id: number) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const handleSubmit = () => {
		if (selectedIds.length === 0) {
			toast.error("Please select at least one product.");
			return;
		}
		bulkGenerateMutation.mutate({
			productIds: selectedIds,
			forceReplace,
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
						<Layers className="w-5 h-5 text-blue-600" />
						Bulk UPC Generation
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Select multiple catalog items without UPC codes to automatically allocate GS1-compliant 12-digit UPC-A barcodes.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 my-2">
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
							<Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
							<Input
								placeholder="Filter eligible products by name or SKU..."
								className="pl-9 text-xs h-9"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="text-xs h-9"
							onClick={handleToggleAll}
							disabled={!data?.items || data.items.length === 0}
						>
							{data?.items && selectedIds.length === data.items.length ? "Deselect All" : "Select All"}
						</Button>
					</div>

					<div className="flex items-center justify-between px-1 text-xs text-slate-500">
						<span>Selected: <strong className="text-blue-600">{selectedIds.length}</strong> products</span>
						<label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
							<Checkbox
								checked={forceReplace}
								onCheckedChange={(checked) => setForceReplace(Boolean(checked))}
							/>
							<span>Overwrite products that already have a UPC</span>
						</label>
					</div>

					{/* Product List */}
					<div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
						{isLoading ? (
							<div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
								<Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading products...
							</div>
						) : data?.items && data.items.length > 0 ? (
							data.items.map((prod) => {
								const isChecked = selectedIds.includes(prod.id);
								return (
									<div
										key={prod.id}
										className={`p-3 flex items-center justify-between text-xs hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors cursor-pointer ${
											isChecked ? "bg-blue-50/70 dark:bg-blue-950/30" : ""
										}`}
										onClick={() => handleToggle(prod.id)}
									>
										<div className="flex items-center gap-3 truncate">
											<Checkbox
												checked={isChecked}
												onCheckedChange={() => handleToggle(prod.id)}
												onClick={(e) => e.stopPropagation()}
											/>
											<div className="truncate">
												<div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
													{prod.name}
												</div>
												<div className="text-[11px] text-slate-500 flex gap-2">
													<span>SKU: <strong className="font-mono">{prod.sku || "N/A"}</strong></span>
													<span>•</span>
													<span>{prod.category || "General"}</span>
												</div>
											</div>
										</div>
										<Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 shrink-0">
											Unassigned
										</Badge>
									</div>
								);
							})
						) : (
							<div className="py-10 text-center text-xs text-slate-500">
								No products without UPC found matching your criteria.
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="flex gap-2 justify-end pt-2">
					<Button variant="outline" size="sm" onClick={onClose} disabled={bulkGenerateMutation.isPending}>
						Cancel
					</Button>
					<Button
						size="sm"
						className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
						onClick={handleSubmit}
						disabled={selectedIds.length === 0 || bulkGenerateMutation.isPending}
					>
						{bulkGenerateMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Sparkles className="w-4 h-4" />
						)}
						Generate {selectedIds.length} UPCs
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { BulkUpcModal as UPCBulkModal };
