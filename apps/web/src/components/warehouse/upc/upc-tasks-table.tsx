"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
	Search,
	Filter,
	Eye,
	Printer,
	UserCheck,
	Play,
	CheckCircle2,
	XCircle,
	RefreshCw,
} from "lucide-react";
import { UPCTaskDetailsDrawer } from "./upc-task-details-drawer";
import { PrintUPCLabelModal } from "./print-upc-label";
import { ReassignTaskModal } from "./reassign-task-modal";
import { CancelTaskModal } from "./cancel-task-modal";

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
	PENDING: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", label: "Pending" },
	ASSIGNED: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", label: "Assigned" },
	IN_PROGRESS: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", label: "In Progress" },
	COMPLETED: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", label: "Completed" },
	VERIFIED: { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", label: "Verified" },
	REJECTED: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", label: "Rejected" },
	CANCELLED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-400", label: "Cancelled" },
};

const PRIORITY_BADGES: Record<string, { bg: string; text: string }> = {
	LOW: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", text: "Low" },
	MEDIUM: { bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", text: "Medium" },
	HIGH: { bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", text: "High" },
	URGENT: { bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300", text: "Urgent" },
};

export function UPCTasksTable() {
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [priorityFilter, setPriorityFilter] = useState("ALL");
	const [searchInput, setSearchInput] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 15;

	// Modals & Drawers state
	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [printModalOpen, setPrintModalOpen] = useState(false);
	const [printTask, setPrintTask] = useState<{ name: string; sku: string; upc: string } | null>(null);
	const [reassignModalOpen, setReassignModalOpen] = useState(false);
	const [reassignTask, setReassignTask] = useState<any>(null);
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [cancelTask, setCancelTask] = useState<any>(null);

	const utils = trpc.useUtils();

	const tasksQuery = trpc.upc.listTasks.useQuery({
		status: statusFilter === "ALL" ? undefined : statusFilter,
		priority: priorityFilter === "ALL" ? undefined : priorityFilter,
		search: searchInput.trim() || undefined,
		page,
		pageSize,
	});

	const startMutation = trpc.upc.startTask.useMutation({
		onSuccess: () => {
			utils.upc.listTasks.invalidate();
			utils.upc.getStats.invalidate();
		},
	});

	const completeMutation = trpc.upc.completeTask.useMutation({
		onSuccess: () => {
			utils.upc.listTasks.invalidate();
			utils.upc.getStats.invalidate();
			utils.upc.listHistory.invalidate();
		},
	});

	const refreshData = () => {
		utils.upc.listTasks.invalidate();
		utils.upc.getStats.invalidate();
	};

	return (
		<div className="space-y-4">
			{/* Filters & Actions Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-wrap items-center gap-2.5">
					{/* Search */}
					<div className="relative min-w-[240px] flex-1 sm:max-w-xs">
						<Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							placeholder="Search task, product, UPC, employee..."
							value={searchInput}
							onChange={(e) => {
								setSearchInput(e.target.value);
								setPage(1);
							}}
							className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
						/>
					</div>

					{/* Status filter */}
					<div className="flex items-center gap-1.5">
						<Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
						<select
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setPage(1);
							}}
							className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
						>
							<option value="ALL">All Statuses</option>
							<option value="PENDING">Pending</option>
							<option value="ASSIGNED">Assigned</option>
							<option value="IN_PROGRESS">In Progress</option>
							<option value="COMPLETED">Completed</option>
							<option value="VERIFIED">Verified</option>
							<option value="REJECTED">Rejected</option>
							<option value="CANCELLED">Cancelled</option>
						</select>
					</div>

					{/* Priority filter */}
					<select
						value={priorityFilter}
						onChange={(e) => {
							setPriorityFilter(e.target.value);
							setPage(1);
						}}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
					>
						<option value="ALL">All Priorities</option>
						<option value="LOW">Low</option>
						<option value="MEDIUM">Medium</option>
						<option value="HIGH">High</option>
						<option value="URGENT">Urgent</option>
					</select>
				</div>

				<button
					type="button"
					onClick={refreshData}
					className="flex items-center gap-1.5 self-end sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
				>
					<RefreshCw className={`h-3.5 w-3.5 ${tasksQuery.isFetching ? "animate-spin text-indigo-600" : ""}`} />
					Refresh
				</button>
			</div>

			{/* Table Container */}
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
							<tr>
								<th className="px-4 py-3.5">Task ID</th>
								<th className="px-4 py-3.5">Product & SKU</th>
								<th className="px-4 py-3.5">Task Type</th>
								<th className="px-4 py-3.5">Assigned Operator</th>
								<th className="px-4 py-3.5">Priority</th>
								<th className="px-4 py-3.5">Status</th>
								<th className="px-4 py-3.5">UPC Code</th>
								<th className="px-4 py-3.5">Due Date</th>
								<th className="px-4 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
							{tasksQuery.isLoading ? (
								Array.from({ length: 5 }).map((_, idx) => (
									<tr key={idx} className="animate-pulse">
										<td colSpan={9} className="px-4 py-4 text-center text-slate-400">
											<div className="h-4 bg-slate-100 rounded dark:bg-slate-800" />
										</td>
									</tr>
								))
							) : tasksQuery.data?.tasks.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
										<p className="text-sm font-semibold">No UPC tasks found</p>
										<p className="text-xs mt-1">Try adjusting your filters or create a new UPC task above.</p>
									</td>
								</tr>
							) : (
								tasksQuery.data?.tasks.map((task) => {
									const statusMeta = STATUS_BADGES[task.status] || STATUS_BADGES.PENDING;
									const priorityMeta = PRIORITY_BADGES[task.priority || "MEDIUM"] || PRIORITY_BADGES.MEDIUM;
									const isTerminal = ["COMPLETED", "VERIFIED", "CANCELLED"].includes(task.status);

									return (
										<tr
											key={task.id}
											className="hover:bg-slate-50/60 transition-colors dark:hover:bg-slate-800/40"
										>
											<td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
												#{task.id}
											</td>
											<td className="px-4 py-3.5">
												<div className="font-semibold text-slate-900 dark:text-white">
													{task.product_name || "Unknown Product"}
												</div>
												<div className="text-[11px] text-slate-400">
													SKU: {task.sku || "N/A"} • {task.category || "General"}
												</div>
											</td>
											<td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300 capitalize">
												{task.task_type}
											</td>
											<td className="px-4 py-3.5">
												{task.assigned_to_name ? (
													<div>
														<span className="font-semibold text-slate-800 dark:text-slate-200">
															{task.assigned_to_name}
														</span>
														<span className="block text-[10px] text-slate-400 uppercase tracking-wider">
															{task.assigned_to_role}
														</span>
													</div>
												) : (
													<span className="italic text-slate-400">Unassigned</span>
												)}
											</td>
											<td className="px-4 py-3.5">
												<span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${priorityMeta.bg}`}>
													{priorityMeta.text}
												</span>
											</td>
											<td className="px-4 py-3.5">
												<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.bg} ${statusMeta.text}`}>
													<span className="h-1.5 w-1.5 rounded-full bg-current" />
													{statusMeta.label}
												</span>
											</td>
											<td className="px-4 py-3.5">
												{task.upc_value ? (
													<span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
														{task.upc_value}
													</span>
												) : (
													<span className="text-slate-400 italic">Not Assigned</span>
												)}
											</td>
											<td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
												{task.due_at ? new Date(task.due_at).toLocaleDateString() : "—"}
											</td>
											<td className="px-4 py-3.5 text-right">
												<div className="flex items-center justify-end gap-1">
													{/* View Details */}
													<button
														type="button"
														title="View Details"
														onClick={() => {
															setSelectedTaskId(task.id);
															setDetailsOpen(true);
														}}
														className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors"
													>
														<Eye className="h-4 w-4" />
													</button>

													{/* Print Label */}
													{task.upc_value && (
														<button
															type="button"
															title="Print Barcode Label"
															onClick={() => {
																setPrintTask({
																	name: task.product_name || "Product",
																	sku: task.sku || "N/A",
																	upc: task.upc_value!,
																});
																setPrintModalOpen(true);
															}}
															className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors"
														>
															<Printer className="h-4 w-4" />
														</button>
													)}

													{/* Start Task (if pending/assigned) */}
													{(task.status === "PENDING" || task.status === "ASSIGNED") && (
														<button
															type="button"
															title="Start Task"
															disabled={startMutation.isPending}
															onClick={() => startMutation.mutate({ taskId: task.id })}
															className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
														>
															<Play className="h-4 w-4" />
														</button>
													)}

													{/* Complete Task (if in progress) */}
													{task.status === "IN_PROGRESS" && (
														<button
															type="button"
															title="Complete Task"
															disabled={completeMutation.isPending}
															onClick={() => completeMutation.mutate({ taskId: task.id })}
															className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors"
														>
															<CheckCircle2 className="h-4 w-4" />
														</button>
													)}

													{/* Reassign (if non-terminal) */}
													{!isTerminal && (
														<button
															type="button"
															title="Reassign Task"
															onClick={() => {
																setReassignTask(task);
																setReassignModalOpen(true);
															}}
															className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors"
														>
															<UserCheck className="h-4 w-4" />
														</button>
													)}

													{/* Cancel (if non-terminal) */}
													{!isTerminal && (
														<button
															type="button"
															title="Cancel Task"
															onClick={() => {
																setCancelTask(task);
																setCancelModalOpen(true);
															}}
															className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
														>
															<XCircle className="h-4 w-4" />
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{tasksQuery.data && tasksQuery.data.totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
						<span className="text-xs text-slate-500 dark:text-slate-400">
							Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, tasksQuery.data.total)} of {tasksQuery.data.total} tasks
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
								{page} / {tasksQuery.data.totalPages}
							</span>
							<button
								type="button"
								disabled={page >= tasksQuery.data.totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Drawers and Modals */}
			<UPCTaskDetailsDrawer
				taskId={selectedTaskId}
				isOpen={detailsOpen}
				onClose={() => {
					setDetailsOpen(false);
					setSelectedTaskId(null);
				}}
				onStatusChanged={refreshData}
			/>

			{printTask && (
				<PrintUPCLabelModal
					isOpen={printModalOpen}
					onClose={() => {
						setPrintModalOpen(false);
						setPrintTask(null);
					}}
					productName={printTask.name}
					sku={printTask.sku}
					upc={printTask.upc}
				/>
			)}

			<ReassignTaskModal
				isOpen={reassignModalOpen}
				onClose={() => {
					setReassignModalOpen(false);
					setReassignTask(null);
				}}
				task={reassignTask}
				onSuccess={refreshData}
			/>

			<CancelTaskModal
				isOpen={cancelModalOpen}
				onClose={() => {
					setCancelModalOpen(false);
					setCancelTask(null);
				}}
				task={cancelTask}
				onSuccess={refreshData}
			/>
		</div>
	);
}
