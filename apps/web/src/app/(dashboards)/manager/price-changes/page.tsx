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
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	Clock,
	History,
	IndianRupee,
	Plus,
	Search,
	ShieldCheck,
	Tag,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PriceChangesPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchTerm, setSearchTerm] = useState("");
	const [logModalOpen, setLogModalOpen] = useState(false);

	// Form State for manual price update & audit log
	const [productId, setProductId] = useState("");
	const [priceField, setPriceField] = useState<
		"price" | "base_selling_price" | "base_procurement_price"
	>("base_selling_price");
	const [oldPrice, setOldPrice] = useState("");
	const [newPrice, setNewPrice] = useState("");
	const [reason, setReason] = useState("");

	const { data: reviews = [], isLoading } =
		trpc.manager.getPriceReviews.useQuery();

	const logMutation = trpc.manager.logPriceReview.useMutation({
		onSuccess: () => {
			toast.success("Price change successfully applied and audited!");
			setLogModalOpen(false);
			setProductId("");
			setOldPrice("");
			setNewPrice("");
			setReason("");
			utils.manager.getPriceReviews.invalidate();
		},
		onError: (err) => {
			toast.error(`Price update failed: ${err.message}`);
		},
	});

	const handleLogSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const pId = Number.parseInt(productId.replace(/\D/g, ""), 10);
		const oldP = Number.parseFloat(oldPrice);
		const newP = Number.parseFloat(newPrice);

		if (!pId || Number.isNaN(pId)) {
			toast.error("Please enter a valid numeric Product ID.");
			return;
		}
		if (Number.isNaN(newP) || newP <= 0) {
			toast.error("Please enter a valid new price.");
			return;
		}
		if (!reason || reason.trim().length < 3) {
			toast.error("Please provide a valid justification for this price change.");
			return;
		}

		logMutation.mutate({
			productId: pId,
			priceField,
			oldPrice: Number.isNaN(oldP) ? 0 : oldP,
			newPrice: newP,
			reason: reason.trim(),
		});
	};

	const filteredReviews = reviews.filter((r) => {
		if (searchTerm) {
			const q = searchTerm.toLowerCase();
			return (
				(r.product_name && r.product_name.toLowerCase().includes(q)) ||
				(r.sku && r.sku.toLowerCase().includes(q)) ||
				(r.changed_by && r.changed_by.toLowerCase().includes(q)) ||
				(r.reason && r.reason.toLowerCase().includes(q))
			);
		}
		return true;
	});

	return (
		<PageTransition className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<BarChart3 className="h-6 w-6 text-blue-600" />
						Price Change Audit & Review
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Track pricing overrides, margin updates, and enforce audit
						compliance across inventory.
					</p>
				</div>
				<Button
					onClick={() => setLogModalOpen(true)}
					className="bg-blue-600 text-white hover:bg-blue-700"
				>
					<Plus className="mr-2 h-4 w-4" />
					Log Price Change
				</Button>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<History className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Total Price Audits
							</div>
							<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
								{reviews.length}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Compliance Level
							</div>
							<div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
								100%
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<Tag className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Recent Changes (7d)
							</div>
							<div className="font-bold text-2xl text-amber-600 dark:text-amber-400">
								{reviews.length}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder="Search product, SKU, modifier, reason..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Table */}
			<Card>
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="text-base">Price Change Ledger</CardTitle>
					<CardDescription>
						Tamper-evident logs of selling price, procurement cost, and catalog
						modifications.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 text-center text-slate-500">
							Loading price history...
						</div>
					) : filteredReviews.length === 0 ? (
						<div className="py-12 text-center text-slate-500">
							No price change logs found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900/50 dark:text-slate-400">
									<tr>
										<th className="px-6 py-3">Product / SKU</th>
										<th className="px-6 py-3">Field Modified</th>
										<th className="px-6 py-3 text-right">Old Price</th>
										<th className="px-6 py-3 text-right">New Price</th>
										<th className="px-6 py-3 text-center">Variance</th>
										<th className="px-6 py-3">Changed By</th>
										<th className="px-6 py-3">Reason / Justification</th>
										<th className="px-6 py-3 text-right">Date</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
									{filteredReviews.map((item) => {
										const oldP = Number(item.old_price || 0);
										const newP = Number(item.new_price || 0);
										const diff = newP - oldP;
										const isIncrease = diff > 0;

										return (
											<tr
												key={item.id}
												className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
											>
												<td className="px-6 py-4">
													<div className="font-semibold text-slate-900 dark:text-slate-100">
														{item.product_name || `Product #${item.product_id}`}
													</div>
													<div className="text-xs text-slate-400 font-mono">
														{item.sku || "N/A"}
													</div>
												</td>
												<td className="px-6 py-4">
													<Badge variant="outline" className="capitalize text-xs">
														{item.price_field.replace(/_/g, " ")}
													</Badge>
												</td>
												<td className="px-6 py-4 text-right font-medium text-slate-500">
													₹{oldP.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
													₹{newP.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-center">
													<span
														className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-semibold ${
															isIncrease
																? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
																: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
														}`}
													>
														{isIncrease ? (
															<ArrowUpRight className="h-3 w-3" />
														) : (
															<ArrowDownRight className="h-3 w-3" />
														)}
														{isIncrease ? "+" : ""}
														₹{Math.abs(diff).toLocaleString()}
													</span>
												</td>
												<td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
													{item.changed_by || "System Admin"}
												</td>
												<td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
													{item.reason || "Catalog price adjustment"}
												</td>
												<td className="px-6 py-4 text-right text-xs text-slate-400 whitespace-nowrap">
													{item.created_at
														? new Date(item.created_at).toLocaleDateString()
														: "-"}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Log Price Change Modal */}
			<Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle>Log Product Price Change</DialogTitle>
						<DialogDescription>
							Apply and record an auditable price adjustment for inventory.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleLogSubmit} className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="prodId">Product ID *</Label>
							<Input
								id="prodId"
								placeholder="e.g. 1"
								value={productId}
								onChange={(e) => setProductId(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="pField">Price Tier / Field</Label>
							<select
								id="pField"
								value={priceField}
								onChange={(e) => setPriceField(e.target.value as any)}
								className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
							>
								<option value="base_selling_price">
									Base Selling Price (Standard)
								</option>
								<option value="base_procurement_price">
									Base Procurement Cost
								</option>
								<option value="price">POS Catalog Price</option>
							</select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="oldP">Current Price (₹)</Label>
								<Input
									id="oldP"
									type="number"
									step="0.01"
									placeholder="e.g. 120"
									value={oldPrice}
									onChange={(e) => setOldPrice(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="newP">New Price (₹) *</Label>
								<Input
									id="newP"
									type="number"
									step="0.01"
									placeholder="e.g. 135"
									value={newPrice}
									onChange={(e) => setNewPrice(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="reason">Business Justification *</Label>
							<Input
								id="reason"
								placeholder="e.g. Supplier raw material price hike"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								required
							/>
						</div>

						<DialogFooter className="pt-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setLogModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={logMutation.isPending}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{logMutation.isPending ? "Applying..." : "Apply & Audit"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
