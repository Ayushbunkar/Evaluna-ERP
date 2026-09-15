"use client";

import React, { useState } from "react";
import {
	QrCode,
	ClipboardList,
	Clock,
	PlusSquare,
	Users,
} from "lucide-react";
import { UPCSummaryCards } from "@/components/warehouse/upc/upc-summary-cards";
import { UPCGeneratorForm } from "@/components/warehouse/upc/upc-generator-form";
import { UPCTasksTable } from "@/components/warehouse/upc/upc-tasks-table";
import { UPCHistoryTable } from "@/components/warehouse/upc/upc-history-table";
import { UPCBulkModal } from "@/components/warehouse/upc/upc-bulk-modal";
import { UPCBulkAssignModal } from "@/components/warehouse/upc/upc-bulk-assign-modal";
import { trpc } from "@/lib/trpc/client";

export default function WarehouseUPCGeneratorPage() {
	const [activeTab, setActiveTab] = useState<"generator" | "tasks" | "history">("generator");
	const [bulkModalOpen, setBulkModalOpen] = useState(false);
	const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);

	const utils = trpc.useUtils();

	const handleRefreshAll = () => {
		utils.upc.getStats.invalidate();
		utils.upc.listTasks.invalidate();
		utils.upc.listHistory.invalidate();
		utils.upc.searchProducts.invalidate();
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2.5">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 dark:bg-indigo-500">
							<QrCode className="h-6 w-6" />
						</div>
						<div>
							<h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
								UPC Generator & Task Assignment
							</h1>
							<p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
								GS1-compliant UPC generation, operator task assignments, and physical labeling workflows.
							</p>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="flex flex-wrap items-center gap-2.5">
					<button
						type="button"
						onClick={() => setBulkModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
					>
						<PlusSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
						Bulk UPC Generator
					</button>

					<button
						type="button"
						onClick={() => setBulkAssignModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
					>
						<Users className="h-4 w-4" />
						Bulk Assign Tasks
					</button>
				</div>
			</div>

			{/* Summary Stats Cards */}
			<UPCSummaryCards />

			{/* Tab Navigation */}
			<div className="border-b border-slate-200 dark:border-slate-800">
				<nav className="flex space-x-6">
					<button
						type="button"
						onClick={() => setActiveTab("generator")}
						className={`flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition-colors ${
							activeTab === "generator"
								? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
								: "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
						}`}
					>
						<QrCode className="h-4 w-4" />
						UPC Generator
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("tasks")}
						className={`flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition-colors ${
							activeTab === "tasks"
								? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
								: "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
						}`}
					>
						<ClipboardList className="h-4 w-4" />
						Tasks Queue
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("history")}
						className={`flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition-colors ${
							activeTab === "history"
								? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
								: "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
						}`}
					>
						<Clock className="h-4 w-4" />
						Barcode History
					</button>
				</nav>
			</div>

			{/* Tab Contents */}
			{activeTab === "generator" && (
				<div className="space-y-6">
					<UPCGeneratorForm />
				</div>
			)}

			{activeTab === "tasks" && (
				<div className="space-y-4">
					<UPCTasksTable />
				</div>
			)}

			{activeTab === "history" && (
				<div className="space-y-4">
					<UPCHistoryTable />
				</div>
			)}

			{/* Modals */}
			<UPCBulkModal
				isOpen={bulkModalOpen}
				onClose={() => setBulkModalOpen(false)}
				onSuccess={handleRefreshAll}
			/>

			<UPCBulkAssignModal
				isOpen={bulkAssignModalOpen}
				onClose={() => setBulkAssignModalOpen(false)}
				onSuccess={handleRefreshAll}
			/>
		</div>
	);
}
