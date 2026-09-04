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
	CheckSquareIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	UserPlusIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function TasksPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// Queries Sourced Entirely From Real DB
	const { data: tasks = [], isLoading: tasksLoading } =
		trpc.manager.getTasks.useQuery();
	const { data: employees = [] } = trpc.manager.getEmployees.useQuery();
	const { data: productsList = [] } = trpc.products.list.useQuery();

	// Mutations Sourced Entirely From Real DB
	const createTaskMutation = trpc.manager.createTask.useMutation({
		onSuccess: () => {
			toast.success("Task created successfully in the operational ledger!");
			setIsCreateOpen(false);
			utils.manager.getTasks.invalidate();
			utils.manager.getDashboardStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to create task: ${err.message}`);
		},
	});

	const assignTaskMutation = trpc.manager.assignTask.useMutation({
		onSuccess: () => {
			toast.success("Task assigned successfully!");
			setIsAssignOpen(false);
			utils.manager.getTasks.invalidate();
			utils.manager.getDashboardStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Assignment failed: ${err.message}`);
		},
	});

	// Modal States
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isAssignOpen, setIsAssignOpen] = useState(false);
	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

	// Form States (Create)
	const [productId, setProductId] = useState("");
	const [taskType, setTaskType] = useState<"generate" | "verify">("generate");
	const [dueAt, setDueAt] = useState("");

	// Form States (Assign)
	const [assignedTo, setAssignedTo] = useState("");

	const handleCreate = async () => {
		if (!productId || !dueAt) {
			toast.error("Please fill in all mandatory fields.");
			return;
		}
		await createTaskMutation.mutateAsync({
			productId: Number.parseInt(productId, 10),
			taskType,
			dueAt,
		});
	};

	const handleAssign = async () => {
		if (!selectedTaskId || !assignedTo) return;
		await assignTaskMutation.mutateAsync({
			taskId: selectedTaskId,
			assignedTo: Number.parseInt(assignedTo, 10),
		});
	};

	const openAssignModal = (id: number) => {
		setSelectedTaskId(id);
		setIsAssignOpen(true);
	};

	return (
		<PageTransition className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<CheckSquareIcon className="h-6 w-6 text-blue-600" />
						Task Operational Control Center
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Monitor, assign, reassign, and create SLA-bearing verification &
						generation work.
					</p>
				</div>
				<Button
					size="sm"
					onClick={() => setIsCreateOpen(true)}
					className="bg-blue-600 hover:bg-blue-700"
				>
					<PlusIcon className="mr-1.5 h-4 w-4" /> New Operational Task
				</Button>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Workspace Team Tasks Queue
					</CardTitle>
					<CardDescription>
						Interactive overview of unassigned and in-flight tasks
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{tasksLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b text-slate-500">
										<th className="p-3 font-semibold">Task ID</th>
										<th className="p-3 font-semibold">Type</th>
										<th className="p-3 font-semibold">Status</th>
										<th className="p-3 font-semibold">Assigned To</th>
										<th className="p-3 text-right font-semibold">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{tasks.map((task) => {
										const assignee = employees.find(
											(e) => e.id === task.assigned_to,
										);
										return (
											<tr key={task.id} className="hover:bg-slate-50/40">
												<td className="p-3 font-bold text-slate-900">
													TASK-#{task.id}
												</td>
												<td className="p-3 font-semibold capitalize">
													{task.task_type}
												</td>
												<td className="p-3">
													<Badge className="font-bold text-[10px] capitalize tracking-wide">
														{task.status}
													</Badge>
												</td>
												<td className="p-3 font-medium text-slate-600">
													{assignee ? assignee.name : "Unassigned"}
												</td>
												<td className="p-3 text-right">
													{!task.assigned_to && (
														<Button
															size="sm"
															variant="outline"
															onClick={() => openAssignModal(task.id)}
															className="h-7 border-blue-200 text-[10px] text-blue-600 hover:bg-blue-50"
														>
															<UserPlusIcon className="mr-1 h-3.5 w-3.5" />{" "}
															Assign Team
														</Button>
													)}
												</td>
											</tr>
										);
									})}
									{tasks.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-12 text-center text-slate-400 text-xs"
											>
												No team tasks logged.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* CREATE TASK DIALOG */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							New Verification or Generation Task
						</DialogTitle>
						<DialogDescription>
							Create a tracking SLA task mapped directly to a master product
							record.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Select Product
							</Label>
							<select
								value={productId}
								onChange={(e) => setProductId(e.target.value)}
								className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm"
							>
								<option value="">-- Choose Product --</option>
								{productsList.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} ({p.sku})
									</option>
								))}
							</select>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Task Type
							</Label>
							<select
								value={taskType}
								onChange={(e: any) => setTaskType(e.target.value)}
								className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs"
							>
								<option value="generate">Generate UPC</option>
								<option value="verify">Verify UPC</option>
							</select>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Due Date (SLA)
							</Label>
							<Input
								type="date"
								value={dueAt}
								onChange={(e) => setDueAt(e.target.value)}
								className="mt-1 h-9 text-xs"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsCreateOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCreate}
							disabled={createTaskMutation.isPending}
						>
							{createTaskMutation.isPending ? "Creating..." : "Create Task"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ASSIGN TASK DIALOG */}
			<Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Assign Task to Team Member
						</DialogTitle>
						<DialogDescription>
							Delegate work ownership directly to a qualified workforce staff.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Select Assignee
							</Label>
							<select
								value={assignedTo}
								onChange={(e) => setAssignedTo(e.target.value)}
								className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm"
							>
								<option value="">-- Choose Operator --</option>
								{employees.map((emp) => (
									<option key={emp.id} value={emp.id}>
										{emp.name} ({emp.role})
									</option>
								))}
							</select>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsAssignOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleAssign}
							disabled={assignTaskMutation.isPending}
						>
							{assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
