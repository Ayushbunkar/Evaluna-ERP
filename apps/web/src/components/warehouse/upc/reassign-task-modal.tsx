"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { UserCheck, X } from "lucide-react";

interface ReassignTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: {
		id: number;
		product_name: string | null;
		sku: string | null;
		assigned_to: number | null;
		priority: string | null;
		instructions: string | null;
	} | null;
	onSuccess?: () => void;
}

export function ReassignTaskModal({
	isOpen,
	onClose,
	task,
	onSuccess,
}: ReassignTaskModalProps) {
	const [selectedStaffId, setSelectedStaffId] = useState<number | "">("");
	const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
	const [instructions, setInstructions] = useState("");
	const [error, setError] = useState<string | null>(null);

	const employeesQuery = trpc.upc.getEligibleEmployees.useQuery(undefined, {
		enabled: isOpen,
	});

	const reassignMutation = trpc.upc.reassignTask.useMutation({
		onSuccess: () => {
			onSuccess?.();
			onClose();
		},
		onError: (err) => {
			setError(err.message);
		},
	});

	React.useEffect(() => {
		if (task) {
			setSelectedStaffId(task.assigned_to || "");
			setPriority((task.priority as any) || "MEDIUM");
			setInstructions(task.instructions || "");
			setError(null);
		}
	}, [task]);

	if (!isOpen || !task) return null;

	const handleReassign = () => {
		if (!selectedStaffId) {
			setError("Please select an employee to reassign this task to.");
			return;
		}

		setError(null);
		reassignMutation.mutate({
			taskId: task.id,
			newAssignedTo: Number(selectedStaffId),
			priority,
			instructions: instructions.trim() || undefined,
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
							<UserCheck className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Reassign UPC Task #{task.id}
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{task.product_name} ({task.sku || "No SKU"})
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						type="button"
						className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Error display */}
				{error && (
					<div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
						{error}
					</div>
				)}

				<div className="mt-5 space-y-4">
					{/* Employee select */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
							Assign To Eligible Warehouse Operator <span className="text-rose-500">*</span>
						</label>
						<select
							value={selectedStaffId}
							onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : "")}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400"
						>
							<option value="">Select Employee...</option>
							{employeesQuery.data?.map((emp) => (
								<option key={emp.id} value={emp.id}>
									{emp.name} — {emp.role.toUpperCase()} ({emp.department || "Warehouse"})
								</option>
							))}
						</select>
					</div>

					{/* Priority */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
							Task Priority
						</label>
						<div className="grid grid-cols-4 gap-2">
							{(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
								<button
									key={p}
									type="button"
									onClick={() => setPriority(p)}
									className={`rounded-lg py-2 text-xs font-semibold border transition-all ${
										priority === p
											? p === "URGENT"
												? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
												: p === "HIGH"
												? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
												: "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
											: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400"
									}`}
								>
									{p}
								</button>
							))}
						</div>
					</div>

					{/* Instructions */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
							Instructions for Operator
						</label>
						<textarea
							rows={3}
							value={instructions}
							onChange={(e) => setInstructions(e.target.value)}
							placeholder="e.g. Place thermal label on outer carton and master case..."
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400"
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleReassign}
						disabled={reassignMutation.isPending}
						className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
					>
						{reassignMutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
					</button>
				</div>
			</div>
		</div>
	);
}
