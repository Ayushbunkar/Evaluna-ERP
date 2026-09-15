"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { AlertTriangle, X } from "lucide-react";

interface CancelTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: {
		id: number;
		product_name: string | null;
		sku: string | null;
	} | null;
	onSuccess?: () => void;
}

export function CancelTaskModal({
	isOpen,
	onClose,
	task,
	onSuccess,
}: CancelTaskModalProps) {
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);

	const cancelMutation = trpc.upc.cancelTask.useMutation({
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
			setReason("");
			setError(null);
		}
	}, [task]);

	if (!isOpen || !task) return null;

	const handleCancel = () => {
		setError(null);
		cancelMutation.mutate({
			taskId: task.id,
			reason: reason.trim() || undefined,
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl dark:border-rose-950/40 dark:bg-slate-900">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
							<AlertTriangle className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Cancel UPC Task #{task.id}
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

				{/* Error */}
				{error && (
					<div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
						{error}
					</div>
				)}

				<div className="mt-5 space-y-4">
					<p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
						Are you sure you want to cancel this task? This action will transition the task into a terminal <span className="font-semibold text-rose-600">CANCELLED</span> state and release any assigned operator.
					</p>

					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
							Reason for Cancellation (Optional)
						</label>
						<textarea
							rows={3}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="e.g. Duplicate order, product barcode already applied at factory..."
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-rose-400"
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
						Keep Task
					</button>
					<button
						type="button"
						onClick={handleCancel}
						disabled={cancelMutation.isPending}
						className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
					>
						{cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Task"}
					</button>
				</div>
			</div>
		</div>
	);
}
