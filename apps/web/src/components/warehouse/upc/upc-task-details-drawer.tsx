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
import { Separator } from "@evaluna/ui/components/separator";
import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	History,
	Loader2,
	Play,
	Printer,
	QrCode,
	RefreshCw,
	ShieldCheck,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
import { BarcodeRenderer } from "./barcode-renderer";
import { PrintUpcLabelModal } from "./print-upc-label";

interface TaskDetailsModalProps {
	taskId: number | null;
	isOpen: boolean;
	onClose: () => void;
	onReassignClick?: (taskId: number) => void;
	onCancelClick?: (taskId: number) => void;
}

export function TaskDetailsModal({
	taskId,
	isOpen,
	onClose,
	onReassignClick,
	onCancelClick,
}: TaskDetailsModalProps) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const [printOpen, setPrintOpen] = useState(false);

	const { data, isLoading } = trpc.upc.getTaskDetails.useQuery(
		{ taskId: taskId ?? 0 },
		{ enabled: isOpen && !!taskId },
	);

	const startTaskMutation = trpc.upc.startTask.useMutation({
		onSuccess: () => {
			toast.success("Task started (In Progress).");
			utils.upc.getStats.invalidate();
			utils.upc.listTasks.invalidate();
			utils.upc.getTaskDetails.invalidate({ taskId: taskId ?? 0 });
		},
		onError: (err) => toast.error(err.message),
	});

	const completeTaskMutation = trpc.upc.completeTask.useMutation({
		onSuccess: () => {
			toast.success("Task marked completed.");
			utils.upc.getStats.invalidate();
			utils.upc.listTasks.invalidate();
			utils.upc.getTaskDetails.invalidate({ taskId: taskId ?? 0 });
		},
		onError: (err) => toast.error(err.message),
	});

	if (!taskId) return null;

	const task = data?.task;
	const isActionable = task?.status === "ASSIGNED" || task?.status === "PENDING" || task?.status === "IN_PROGRESS";

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending</Badge>;
			case "ASSIGNED":
				return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Assigned</Badge>;
			case "IN_PROGRESS":
				return <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 animate-pulse">In Progress</Badge>;
			case "COMPLETED":
			case "VERIFIED":
				return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Completed</Badge>;
			case "CANCELLED":
				return <Badge variant="outline" className="text-slate-500 border-slate-300 bg-slate-100">Cancelled</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const getPriorityBadge = (p: string | null) => {
		switch (p) {
			case "URGENT":
				return <Badge className="bg-red-600 text-white hover:bg-red-700">Urgent</Badge>;
			case "HIGH":
				return <Badge className="bg-orange-500 text-white hover:bg-orange-600">High</Badge>;
			case "MEDIUM":
				return <Badge variant="secondary">Medium</Badge>;
			case "LOW":
				return <Badge variant="outline" className="text-slate-500">Low</Badge>;
			default:
				return null;
		}
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
								<QrCode className="w-5 h-5 text-blue-600" />
								UPC Task #{taskId}
							</DialogTitle>
							<div className="flex items-center gap-2">
								{task && getPriorityBadge(task.priority)}
								{task && getStatusBadge(task.status)}
							</div>
						</div>
						<DialogDescription className="text-xs text-slate-500">
							Complete task information, floor assignment, barcode specs, and audit history.
						</DialogDescription>
					</DialogHeader>

					{isLoading || !task ? (
						<div className="py-12 flex flex-col items-center justify-center space-y-3">
							<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
							<p className="text-xs text-slate-500">Loading task details...</p>
						</div>
					) : (
						<div className="space-y-5 my-2">
							{/* Product & Barcode Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
								<div className="space-y-2">
									<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Specifications</h4>
									<div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
										{task.product_name}
									</div>
									<div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
										<div>SKU: <strong className="font-mono text-slate-900 dark:text-slate-200">{task.sku || "N/A"}</strong></div>
										<div>Category: <strong className="text-slate-900 dark:text-slate-200">{task.category || "General"}</strong></div>
										<div>Price: <strong className="text-slate-900 dark:text-slate-200">₹{task.price || "0"}</strong></div>
									</div>
								</div>

								<div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
									{task.upc_value ? (
										<>
											<BarcodeRenderer value={task.upc_value} height={38} width={1.6} fontSize={10} />
											<Button
												variant="ghost"
												size="sm"
												className="h-7 text-xs text-blue-600 hover:text-blue-700 mt-1 gap-1"
												onClick={() => setPrintOpen(true)}
											>
												<Printer className="w-3.5 h-3.5" /> Print Label
											</Button>
										</>
									) : (
										<div className="text-center py-4 text-xs text-muted-foreground">
											UPC will be allocated upon generation
										</div>
									)}
								</div>
							</div>

							{/* Assignment & Operational Details */}
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
								<div>
									<span className="text-slate-500 block mb-0.5">Assigned To:</span>
									<span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
										<User className="w-3.5 h-3.5 text-blue-600" />
										{data.assignedStaff?.name || "Unassigned"}
									</span>
									{data.assignedStaff && (
										<span className="text-[10px] text-slate-500 font-mono capitalize">
											[{data.assignedStaff.role.replace("_", " ")}]
										</span>
									)}
								</div>

								<div>
									<span className="text-slate-500 block mb-0.5">Created By:</span>
									<span className="font-semibold text-slate-900 dark:text-slate-100">
										{data.createdByStaff?.name || "Warehouse Manager"}
									</span>
								</div>

								<div>
									<span className="text-slate-500 block mb-0.5">Target Due Date:</span>
									<span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
										<Calendar className="w-3.5 h-3.5 text-slate-400" />
										{task.due_at ? new Date(task.due_at).toLocaleDateString() : "Immediate"}
									</span>
								</div>
							</div>

							{/* Floor Instructions */}
							<div className="space-y-1 text-xs">
								<h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
									<FileText className="w-3.5 h-3.5 text-blue-600" />
									Floor Instructions & Notes
								</h4>
								<div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
									{task.instructions || task.notes || "No special instructions provided."}
								</div>
							</div>

							{/* Audit Trail Timeline */}
							{data.auditLogs && data.auditLogs.length > 0 && (
								<div className="space-y-2 text-xs">
									<h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
										<History className="w-3.5 h-3.5 text-indigo-600" />
										Audit History
									</h4>
									<div className="space-y-2 border-l-2 border-blue-200 dark:border-blue-900 ml-2 pl-3">
										{data.auditLogs.map((log) => (
											<div key={log.id} className="text-[11px] text-slate-600 dark:text-slate-400">
												<span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
												<span className="text-slate-400 ml-2">
													{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					<DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-between items-center">
						<div className="flex gap-2">
							{isActionable && (
								<>
									<Button
										variant="outline"
										size="sm"
										className="text-xs text-amber-700 hover:text-amber-800 border-amber-300 hover:bg-amber-50"
										onClick={() => {
											onClose();
											onReassignClick?.(taskId);
										}}
									>
										<RefreshCw className="w-3.5 h-3.5 mr-1" /> Reassign
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="text-xs text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
										onClick={() => {
											onClose();
											onCancelClick?.(taskId);
										}}
									>
										<XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Task
									</Button>
								</>
							)}
						</div>

						<div className="flex gap-2">
							{task?.status === "ASSIGNED" && (
								<Button
									size="sm"
									className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
									onClick={() => startTaskMutation.mutate({ taskId })}
									disabled={startTaskMutation.isPending}
								>
									{startTaskMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
									Start Task
								</Button>
							)}
							{(task?.status === "IN_PROGRESS" || task?.status === "ASSIGNED") && (
								<Button
									size="sm"
									className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
									onClick={() => completeTaskMutation.mutate({ taskId, upcValue: task.upc_value || undefined })}
									disabled={completeTaskMutation.isPending}
								>
									{completeTaskMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
									Mark Completed
								</Button>
							)}
							<Button variant="outline" size="sm" onClick={onClose} className="text-xs">
								Close
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{task?.upc_value && (
				<PrintUpcLabelModal
					isOpen={printOpen}
					onClose={() => setPrintOpen(false)}
					product={{
						id: task.product_id,
						name: task.product_name || "Product",
						sku: task.sku,
						category: task.category,
						price: task.price,
						upc: task.upc_value,
					}}
				/>
			)}
		</>
	);
}

export { TaskDetailsModal as UPCTaskDetailsDrawer };
