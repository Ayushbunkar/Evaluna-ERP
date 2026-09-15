"use client";

import { Button } from "@evaluna/ui/components/button";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Textarea } from "@evaluna/ui/components/textarea";
import { AlertCircle, Calendar, ClipboardCheck, Loader2, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

interface AssignUpcTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: {
		id: number;
		name: string;
		sku?: string | null;
		category?: string | null;
		upc?: string | null;
	} | null;
	onSuccess?: () => void;
}

export function AssignUpcTaskModal({
	isOpen,
	onClose,
	product,
	onSuccess,
}: AssignUpcTaskModalProps) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [taskType, setTaskType] = useState<"labeling" | "placement" | "verification">("labeling");
	const [assignedTo, setAssignedTo] = useState<string>("");
	const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
	const [dueDate, setDueDate] = useState<string>("");
	const [instructions, setInstructions] = useState<string>(
		"Please print the UPC barcode label and stick it cleanly on the designated master packaging / item."
	);

	// Fetch eligible warehouse employees
	const { data: eligibleEmployees, isLoading: loadingEmployees } =
		trpc.upc.getEligibleEmployees.useQuery(undefined, {
			enabled: isOpen,
		});

	const createTaskMutation = trpc.upc.createTask.useMutation({
		onSuccess: (data) => {
			toast.success(`Task #${data.taskId} created and assigned successfully.`);
			utils.upc.getStats.invalidate();
			utils.upc.listTasks.invalidate();
			utils.upc.searchProducts.invalidate();
			onSuccess?.();
			onClose();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create task.");
		},
	});

	if (!product) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createTaskMutation.mutate({
			productId: product.id,
			taskType,
			assignedTo: assignedTo ? Number.parseInt(assignedTo, 10) : undefined,
			priority,
			dueAt: dueDate ? new Date(dueDate) : undefined,
			instructions,
			upcValue: product.upc || undefined,
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
						<ClipboardCheck className="w-5 h-5 text-blue-600" />
						Create & Assign UPC Task
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Assign physical barcode labeling, placement, or quality verification to warehouse personnel.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					{/* Product summary banner */}
					<div className="p-3 rounded-lg border border-blue-100 bg-blue-50/60 dark:border-blue-950 dark:bg-blue-950/30 flex flex-col gap-1 text-xs">
						<div className="flex justify-between items-start">
							<span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
								{product.name}
							</span>
							<span className="font-mono text-blue-700 dark:text-blue-400 font-semibold">
								UPC: {product.upc || "Auto-assign"}
							</span>
						</div>
						<div className="text-slate-600 dark:text-slate-400 flex gap-3">
							<span>SKU: <strong className="font-mono">{product.sku || "N/A"}</strong></span>
							<span>Category: <strong>{product.category || "General"}</strong></span>
						</div>
					</div>

					{/* Task Type */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold">Task Operation Type</Label>
						<Select value={taskType} onValueChange={(val: any) => setTaskType(val)}>
							<SelectTrigger className="text-xs h-9">
								<SelectValue placeholder="Select task type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="labeling">UPC Barcode Label Placement (Sticker & Tag)</SelectItem>
								<SelectItem value="placement">Rack & Bin Placement Verification</SelectItem>
								<SelectItem value="verification">UPC Scan & Quality Audit</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Employee Assignment */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold flex items-center justify-between">
							<span>Assign To Warehouse Staff</span>
							{loadingEmployees && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
						</Label>
						<Select value={assignedTo} onValueChange={setAssignedTo}>
							<SelectTrigger className="text-xs h-9">
								<SelectValue placeholder="Select eligible warehouse operator" />
							</SelectTrigger>
							<SelectContent>
								{eligibleEmployees?.map((emp) => (
									<SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
										{emp.name} — <span className="capitalize font-mono text-slate-500">[{emp.role.replace("_", " ")}]</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Priority & Due Date Row */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Priority Level</Label>
							<Select value={priority} onValueChange={(val: any) => setPriority(val)}>
								<SelectTrigger className="text-xs h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="LOW">Low</SelectItem>
									<SelectItem value="MEDIUM">Medium</SelectItem>
									<SelectItem value="HIGH">High</SelectItem>
									<SelectItem value="URGENT">Urgent (Immediate Floor Priority)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Due Date / Target</Label>
							<Input
								type="date"
								className="text-xs h-9"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
							/>
						</div>
					</div>

					{/* Instructions */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold">Floor Instructions for Operator</Label>
						<Textarea
							rows={3}
							className="text-xs resize-none"
							value={instructions}
							onChange={(e) => setInstructions(e.target.value)}
							placeholder="Enter specific instructions, batch tags, bin locations..."
						/>
					</div>

					<DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
						<Button type="button" variant="outline" size="sm" onClick={onClose} disabled={createTaskMutation.isPending}>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
							disabled={createTaskMutation.isPending}
						>
							{createTaskMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
							Create & Assign Task
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export { AssignUpcTaskModal as UPCTaskModal };
