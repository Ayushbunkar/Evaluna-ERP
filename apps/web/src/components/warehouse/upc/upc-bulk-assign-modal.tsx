"use client";

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
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	ClipboardCheck,
	Loader2,
	Search,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

interface BulkAssignTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function BulkAssignTaskModal({ isOpen, onClose, onSuccess }: BulkAssignTaskModalProps) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [assignedTo, setAssignedTo] = useState<string>("");
	const [taskType, setTaskType] = useState<"labeling" | "placement" | "verification">("labeling");
	const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
	const [dueDate, setDueDate] = useState<string>("");
	const [instructions, setInstructions] = useState<string>("Bulk UPC barcode labeling & placement on designated shelves.");

	const { data: eligibleEmployees } = trpc.upc.getEligibleEmployees.useQuery(undefined, {
		enabled: isOpen,
	});

	const { data: productsData, isLoading: loadingProducts } = trpc.upc.searchProducts.useQuery(
		{
			search,
			hasUpcFilter: "with_upc",
			pageSize: 50,
		},
		{
			enabled: isOpen,
		},
	);

	const bulkAssignMutation = trpc.upc.bulkAssignTasks.useMutation({
		onSuccess: (res) => {
			toast.success(`Created and assigned ${res.createdCount} UPC tasks.`);
			utils.upc.getStats.invalidate();
			utils.upc.listTasks.invalidate();
			onSuccess?.();
			setSelectedIds([]);
			onClose();
		},
		onError: (err) => {
			toast.error(err.message || "Bulk task assignment failed.");
		},
	});

	const handleToggleAll = () => {
		if (!productsData?.items) return;
		if (selectedIds.length === productsData.items.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(productsData.items.map((i) => i.id));
		}
	};

	const handleToggle = (id: number) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedIds.length === 0) {
			toast.error("Please select at least one product with a UPC.");
			return;
		}
		if (!assignedTo) {
			toast.error("Please select an employee to assign tasks to.");
			return;
		}

		bulkAssignMutation.mutate({
			productIds: selectedIds,
			assignedTo: Number.parseInt(assignedTo, 10),
			taskType,
			priority,
			dueAt: dueDate ? new Date(dueDate) : undefined,
			instructions,
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
						<Users className="w-5 h-5 text-blue-600" />
						Bulk Task Assignment
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Assign barcode labeling or placement tasks for multiple products to a designated warehouse staff member.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Assign To Employee</Label>
							<Select value={assignedTo} onValueChange={setAssignedTo}>
								<SelectTrigger className="text-xs h-9">
									<SelectValue placeholder="Select operator" />
								</SelectTrigger>
								<SelectContent>
									{eligibleEmployees?.map((emp) => (
										<SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
											{emp.name} — <span className="capitalize text-slate-500">[{emp.role.replace("_", " ")}]</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Operation Type</Label>
							<Select value={taskType} onValueChange={(val: any) => setTaskType(val)}>
								<SelectTrigger className="text-xs h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="labeling">UPC Label Placement</SelectItem>
									<SelectItem value="placement">Rack & Bin Placement Verification</SelectItem>
									<SelectItem value="verification">Quality Audit</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Priority</Label>
							<Select value={priority} onValueChange={(val: any) => setPriority(val)}>
								<SelectTrigger className="text-xs h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="LOW">Low</SelectItem>
									<SelectItem value="MEDIUM">Medium</SelectItem>
									<SelectItem value="HIGH">High</SelectItem>
									<SelectItem value="URGENT">Urgent</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Target Due Date</Label>
							<Input
								type="date"
								className="text-xs h-9"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
							/>
						</div>
					</div>

					{/* Product Selector for Tasks */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs">
							<Label className="font-semibold">Select Products for Task ({selectedIds.length} chosen)</Label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
								onClick={handleToggleAll}
							>
								{productsData?.items && selectedIds.length === productsData.items.length ? "Deselect All" : "Select All"}
							</Button>
						</div>

						<div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
							{loadingProducts ? (
								<div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
									<Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading products with UPC...
								</div>
							) : productsData?.items && productsData.items.length > 0 ? (
								productsData.items.map((prod) => {
									const isChecked = selectedIds.includes(prod.id);
									return (
										<div
											key={prod.id}
											className={`p-2.5 flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer ${
												isChecked ? "bg-blue-50/70 dark:bg-blue-950/30" : ""
											}`}
											onClick={() => handleToggle(prod.id)}
										>
											<div className="flex items-center gap-2.5 truncate">
												<Checkbox
													checked={isChecked}
													onCheckedChange={() => handleToggle(prod.id)}
													onClick={(e) => e.stopPropagation()}
												/>
												<div className="truncate">
													<span className="font-semibold text-slate-900 dark:text-slate-100">{prod.name}</span>
													<span className="text-[11px] text-slate-500 font-mono ml-2">UPC: {prod.upc}</span>
												</div>
											</div>
										</div>
									);
								})
							) : (
								<div className="py-6 text-center text-xs text-slate-500">
									No products with UPCs available.
								</div>
							)}
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs font-semibold">Instructions</Label>
						<Textarea
							rows={2}
							className="text-xs resize-none"
							value={instructions}
							onChange={(e) => setInstructions(e.target.value)}
						/>
					</div>

					<DialogFooter className="flex gap-2 justify-end pt-2">
						<Button type="button" variant="outline" size="sm" onClick={onClose} disabled={bulkAssignMutation.isPending}>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
							disabled={selectedIds.length === 0 || !assignedTo || bulkAssignMutation.isPending}
						>
							{bulkAssignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
							Assign Tasks ({selectedIds.length})
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export { BulkAssignTaskModal as UPCBulkAssignModal };
