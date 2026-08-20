"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	type FilterOption,
	SearchFilter,
} from "@evaluna/ui/components/search-filter";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Textarea } from "@evaluna/ui/components/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
	BadgeCheckIcon,
	CheckCircle2Icon,
	PlayIcon,
	PlusCircle,
	ScanBarcodeIcon,
	SendIcon,
	Wand2Icon,
	XCircleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		PENDING: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
		ASSIGNED:
			"bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
		IN_PROGRESS:
			"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		VERIFICATION_REQUIRED:
			"bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
		VERIFIED:
			"bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
		REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
	};
	return (
		<Badge variant="outline" className={map[status] ?? ""}>
			{status?.replace(/_/g, " ")}
		</Badge>
	);
}

export default function UpcPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { activeBranchId } = useBranch();

	const {
		data: tasks = [],
		isLoading,
		error,
	} = trpc.upc.listTasks.useQuery({ branchId: activeBranchId ?? undefined });

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: [["upc", "listTasks"]] });

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Generate dialog
	const [isGenOpen, setIsGenOpen] = useState(false);
	const [genProductId, setGenProductId] = useState("");
	const [genUpc, setGenUpc] = useState("");
	const [genSource, setGenSource] = useState<"internal" | "external">(
		"internal",
	);

	// Assign dialog
	const [isAssignOpen, setIsAssignOpen] = useState(false);
	const [asgProductId, setAsgProductId] = useState("");
	const [asgTaskType, setAsgTaskType] = useState<"generate" | "verify">(
		"generate",
	);
	const [asgAssignedTo, setAsgAssignedTo] = useState("");
	const [asgNotes, setAsgNotes] = useState("");

	// Complete dialog
	const [completeId, setCompleteId] = useState<number | null>(null);
	const [cUpcValue, setCUpcValue] = useState("");
	const [cUpcSource, setCUpcSource] = useState<"internal" | "external">(
		"internal",
	);

	// Reject dialog
	const [rejectId, setRejectId] = useState<number | null>(null);
	const [rReason, setRReason] = useState("");

	const generateMutation = trpc.upc.generate.useMutation({
		onSuccess: (res) => {
			invalidate();
			toast.success(`UPC ${res.upc} generated`);
			setIsGenOpen(false);
			setGenProductId("");
			setGenUpc("");
		},
		onError: (err) => toast.error(err.message),
	});

	const assignMutation = trpc.upc.assignTask.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Task assigned");
			setIsAssignOpen(false);
			setAsgProductId("");
			setAsgAssignedTo("");
			setAsgNotes("");
		},
		onError: (err) => toast.error(err.message),
	});

	const startMutation = trpc.upc.startTask.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Task started");
		},
		onError: (err) => toast.error(err.message),
	});

	const completeMutation = trpc.upc.completeTask.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Submitted for verification");
			setCompleteId(null);
			setCUpcValue("");
		},
		onError: (err) => toast.error(err.message),
	});

	const verifyMutation = trpc.upc.verifyTask.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Task verified");
		},
		onError: (err) => toast.error(err.message),
	});

	const rejectMutation = trpc.upc.rejectTask.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Task rejected");
			setRejectId(null);
			setRReason("");
		},
		onError: (err) => toast.error(err.message),
	});

	const statusFilterOptions: FilterOption[] = [
		{ label: "All", value: "all" },
		{ label: "Pending", value: "PENDING" },
		{ label: "Assigned", value: "ASSIGNED" },
		{ label: "In Progress", value: "IN_PROGRESS", variant: "warning" },
		{
			label: "Verification Req.",
			value: "VERIFICATION_REQUIRED",
			variant: "warning",
		},
		{ label: "Verified", value: "VERIFIED", variant: "success" },
		{ label: "Rejected", value: "REJECTED", variant: "danger" },
	];

	const filtered = useMemo(() => {
		return (tasks as any[]).filter((t) => {
			if (statusFilter !== "all" && t.status !== statusFilter) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(t.id).includes(q) ||
				String(t.product_id).includes(q) ||
				String(t.upc_value ?? "").includes(q) ||
				String(t.task_type ?? "").toLowerCase().includes(q)
			);
		});
	}, [tasks, statusFilter, searchTerm]);

	const handleGenerate = () => {
		if (!genProductId.trim()) {
			toast.error("Product ID is required");
			return;
		}
		generateMutation.mutate({
			productId: Number(genProductId),
			upc: genUpc.trim() || undefined,
			source: genSource,
		});
	};

	const handleAssign = () => {
		if (!asgProductId.trim()) {
			toast.error("Product ID is required");
			return;
		}
		assignMutation.mutate({
			productId: Number(asgProductId),
			branchId: activeBranchId ?? undefined,
			taskType: asgTaskType,
			assignedTo: asgAssignedTo ? Number(asgAssignedTo) : undefined,
			notes: asgNotes.trim() || undefined,
		});
	};

	const handleComplete = () => {
		if (completeId === null) return;
		if (!cUpcValue.trim()) {
			toast.error("UPC value is required");
			return;
		}
		completeMutation.mutate({
			taskId: completeId,
			upcValue: cUpcValue.trim(),
			upcSource: cUpcSource,
		});
	};

	const handleReject = () => {
		if (rejectId === null) return;
		rejectMutation.mutate({
			taskId: rejectId,
			reason: rReason.trim() || undefined,
		});
	};

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{ key: "product_id", header: "Product", sortable: true },
		{
			key: "task_type",
			header: "Type",
			render: (row) => (
				<Badge variant="secondary" className="capitalize">
					{row.task_type}
				</Badge>
			),
		},
		{
			key: "upc_value",
			header: "UPC",
			render: (row) => (
				<span className="font-mono text-xs">{row.upc_value ?? "—"}</span>
			),
		},
		{
			key: "assigned_to",
			header: "Assignee",
			hideOnMobile: true,
			render: (row) => (row.assigned_to != null ? `#${row.assigned_to}` : "—"),
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row) => <StatusBadge status={row.status} />,
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => (
				<TableActions>
					{(row.status === "PENDING" || row.status === "ASSIGNED") && (
						<TableActionButton
							onClick={() => startMutation.mutate({ taskId: row.id })}
							icon={<PlayIcon className="h-4 w-4" />}
							label="Start"
						/>
					)}
					{row.status === "IN_PROGRESS" && (
						<TableActionButton
							onClick={() => {
								setCompleteId(row.id);
								setCUpcValue(row.upc_value ?? "");
								setCUpcSource("internal");
							}}
							icon={<SendIcon className="h-4 w-4" />}
							label="Complete"
						/>
					)}
					{row.status === "VERIFICATION_REQUIRED" && (
						<>
							<TableActionButton
								onClick={() => verifyMutation.mutate({ taskId: row.id })}
								icon={<CheckCircle2Icon className="h-4 w-4" />}
								label="Verify"
							/>
							<TableActionButton
								variant="danger"
								onClick={() => {
									setRejectId(row.id);
									setRReason("");
								}}
								icon={<XCircleIcon className="h-4 w-4" />}
								label="Reject"
							/>
						</>
					)}
					{(row.status === "VERIFIED" || row.status === "REJECTED") && (
						<span className="text-muted-foreground text-xs">—</span>
					)}
				</TableActions>
			),
		},
	];

	if (isLoading) {
		return (
			<Card className="flex flex-col gap-6 p-6">
				<CardHeader className="p-0">
					<Skeleton className="h-10 w-64" />
				</CardHeader>
				<CardContent className="space-y-3 p-0">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-full" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-500">{(error as any)?.message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<PageTransition>
			<Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search by product, UPC or type"
						filters={[
							{
								options: statusFilterOptions,
								value: statusFilter,
								onChange: setStatusFilter,
							},
						]}
					>
						<Button size="sm" variant="secondary" onClick={() => setIsAssignOpen(true)}>
							<PlusCircle className="mr-2 h-4 w-4" />
							Assign Task
						</Button>
						<Button size="sm" onClick={() => setIsGenOpen(true)}>
							<Wand2Icon className="mr-2 h-4 w-4" />
							Generate UPC
						</Button>
					</SearchFilter>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filtered}
						columns={columns}
						emptyMessage="No UPC tasks found"
						emptyIcon={<ScanBarcodeIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				{/* Generate UPC */}
				<Dialog
					open={isGenOpen}
					onOpenChange={(open) => {
						if (!open) setIsGenOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								<span className="flex items-center gap-2">
									<BadgeCheckIcon className="h-5 w-5" />
									Generate / Assign UPC
								</span>
							</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="genProductId">Product ID</Label>
								<Input
									id="genProductId"
									value={genProductId}
									onChange={(e) => setGenProductId(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="genSource">Source</Label>
								<Select
									value={genSource}
									onValueChange={(v) =>
										setGenSource(v as "internal" | "external")
									}
								>
									<SelectTrigger id="genSource">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="internal">
											Internal (auto-generate)
										</SelectItem>
										<SelectItem value="external">External (provided)</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="genUpc">
									UPC value {genSource === "internal" ? "(optional)" : "(required)"}
								</Label>
								<Input
									id="genUpc"
									value={genUpc}
									onChange={(e) => setGenUpc(e.target.value)}
									placeholder="12-digit UPC-A"
									className="font-mono"
								/>
								<p className="text-muted-foreground text-xs">
									Leave blank with Internal source to auto-generate a unique
									UPC-A.
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setIsGenOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleGenerate}
								disabled={generateMutation.isPending || !genProductId.trim()}
							>
								Generate
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Assign task */}
				<Dialog
					open={isAssignOpen}
					onOpenChange={(open) => {
						if (!open) setIsAssignOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Assign UPC Task</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="asgProductId">Product ID</Label>
								<Input
									id="asgProductId"
									value={asgProductId}
									onChange={(e) => setAsgProductId(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="asgTaskType">Task Type</Label>
								<Select
									value={asgTaskType}
									onValueChange={(v) =>
										setAsgTaskType(v as "generate" | "verify")
									}
								>
									<SelectTrigger id="asgTaskType">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="generate">Generate</SelectItem>
										<SelectItem value="verify">Verify</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="asgAssignedTo">Assign to staff ID (optional)</Label>
								<Input
									id="asgAssignedTo"
									value={asgAssignedTo}
									onChange={(e) => setAsgAssignedTo(e.target.value)}
									placeholder="Leave blank for an unassigned (PENDING) task"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="asgNotes">Notes (optional)</Label>
								<Textarea
									id="asgNotes"
									value={asgNotes}
									onChange={(e) => setAsgNotes(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setIsAssignOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleAssign}
								disabled={assignMutation.isPending || !asgProductId.trim()}
							>
								Assign
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Complete task */}
				<Dialog
					open={completeId !== null}
					onOpenChange={(open) => {
						if (!open) setCompleteId(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Complete Task #{completeId}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="cUpcValue">UPC value (12-digit UPC-A)</Label>
								<Input
									id="cUpcValue"
									value={cUpcValue}
									onChange={(e) => setCUpcValue(e.target.value)}
									className="font-mono"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="cUpcSource">Source</Label>
								<Select
									value={cUpcSource}
									onValueChange={(v) =>
										setCUpcSource(v as "internal" | "external")
									}
								>
									<SelectTrigger id="cUpcSource">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="internal">Internal</SelectItem>
										<SelectItem value="external">External</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setCompleteId(null)}>
								Cancel
							</Button>
							<Button
								onClick={handleComplete}
								disabled={completeMutation.isPending || !cUpcValue.trim()}
							>
								Submit for verification
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Reject task */}
				<Dialog
					open={rejectId !== null}
					onOpenChange={(open) => {
						if (!open) setRejectId(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Reject Task #{rejectId}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="rReason">Reason (optional)</Label>
								<Textarea
									id="rReason"
									value={rReason}
									onChange={(e) => setRReason(e.target.value)}
									placeholder="Why is this task being rejected?"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setRejectId(null)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleReject}
								disabled={rejectMutation.isPending}
							>
								Reject
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
