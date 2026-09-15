"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
	Search,
	Printer,
	RefreshCw,
	QrCode,
	ClipboardCheck,
} from "lucide-react";
import { PrintUPCLabelModal } from "./print-upc-label";
import { UPCTaskModal } from "./upc-task-modal";

export function UPCHistoryTable() {
	const [searchInput, setSearchInput] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 15;

	const [printModalOpen, setPrintModalOpen] = useState(false);
	const [printProduct, setPrintProduct] = useState<{ name: string; sku: string; upc: string } | null>(null);

	const [taskModalOpen, setTaskModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; sku: string; upc?: string | null } | null>(null);

	const utils = trpc.useUtils();

	const historyQuery = trpc.upc.listHistory.useQuery({
		search: searchInput.trim() || undefined,
		page,
		pageSize,
	});

	const refreshData = () => {
		utils.upc.listHistory.invalidate();
	};

	return (
		<div className="space-y-4">
			{/* Filters & Actions Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative min-w-[240px] flex-1 sm:max-w-md">
					<Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="Search by product name, SKU, category, or UPC..."
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							setPage(1);
						}}
						className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
					/>
				</div>

				<button
					type="button"
					onClick={refreshData}
					className="flex items-center gap-1.5 self-end sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
				>
					<RefreshCw className={`h-3.5 w-3.5 ${historyQuery.isFetching ? "animate-spin text-indigo-600" : ""}`} />
					Refresh
				</button>
			</div>

			{/* Table Container */}
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
							<tr>
								<th className="px-4 py-3.5">UPC Code</th>
								<th className="px-4 py-3.5">Product Name</th>
								<th className="px-4 py-3.5">SKU</th>
								<th className="px-4 py-3.5">Category</th>
								<th className="px-4 py-3.5">Generated / Allocated Date</th>
								<th className="px-4 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
							{historyQuery.isLoading ? (
								Array.from({ length: 5 }).map((_, idx) => (
									<tr key={idx} className="animate-pulse">
										<td colSpan={6} className="px-4 py-4 text-center text-slate-400">
											<div className="h-4 bg-slate-100 rounded dark:bg-slate-800" />
										</td>
									</tr>
								))
							) : historyQuery.data?.history.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
										<QrCode className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
										<p className="text-sm font-semibold">No UPC history records found</p>
										<p className="text-xs mt-1">Generated UPCs will appear here once allocated.</p>
									</td>
								</tr>
							) : (
								historyQuery.data?.history.map((row) => (
									<tr
										key={row.id}
										className="hover:bg-slate-50/60 transition-colors dark:hover:bg-slate-800/40"
									>
										<td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
											<span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 dark:bg-indigo-950/40">
												<QrCode className="h-3.5 w-3.5" />
												{row.barcode}
											</span>
										</td>
										<td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
											{row.product_name || "Unknown Product"}
										</td>
										<td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono">
											{row.sku || "N/A"}
										</td>
										<td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
											{row.category || "General"}
										</td>
										<td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
											{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
										</td>
										<td className="px-4 py-3.5 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<button
													type="button"
													title="Print Barcode Label"
													onClick={() => {
														setPrintProduct({
															name: row.product_name || "Product",
															sku: row.sku || "N/A",
															upc: row.barcode,
														});
														setPrintModalOpen(true);
													}}
													className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors"
												>
													<Printer className="h-3.5 w-3.5" />
													Print Label
												</button>
												<button
													type="button"
													title="Create / Assign Task"
													onClick={() => {
														setSelectedProduct({
															id: row.product_id,
															name: row.product_name || "Product",
															sku: row.sku || "N/A",
															upc: row.barcode,
														});
														setTaskModalOpen(true);
													}}
													className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
												>
													<ClipboardCheck className="h-3.5 w-3.5" />
													Assign Task
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{historyQuery.data && historyQuery.data.totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
						<span className="text-xs text-slate-500 dark:text-slate-400">
							Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, historyQuery.data.total)} of {historyQuery.data.total} barcodes
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								disabled={page === 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
							>
								Previous
							</button>
							<span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2">
								{page} / {historyQuery.data.totalPages}
							</span>
							<button
								type="button"
								disabled={page >= historyQuery.data.totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Print Modal */}
			{printProduct && (
				<PrintUPCLabelModal
					isOpen={printModalOpen}
					onClose={() => {
						setPrintModalOpen(false);
						setPrintProduct(null);
					}}
					productName={printProduct.name}
					sku={printProduct.sku}
					upc={printProduct.upc}
				/>
			)}

			{/* Assign Task Modal */}
			{selectedProduct && (
				<UPCTaskModal
					isOpen={taskModalOpen}
					onClose={() => {
						setTaskModalOpen(false);
						setSelectedProduct(null);
					}}
					product={selectedProduct}
					onSuccess={() => {
						utils.upc.getStats.invalidate();
						utils.upc.listTasks.invalidate();
					}}
				/>
			)}
		</div>
	);
}
