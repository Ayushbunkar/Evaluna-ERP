"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Textarea } from "@evaluna/ui/components/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	PlayIcon,
	PlusCircle,
	SearchCheckIcon,
	ShieldCheckIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		OPEN: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
		UNDER_REVIEW:
			"bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
		CORRECTIVE_ACTION_REQUIRED:
			"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		RESOLVED:
			"bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
		VERIFIED:
			"bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
		CLOSED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
		PENDING: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
		IN_PROGRESS:
			"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		COMPLETED:
			"bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
		OVERDUE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
	};
	return (
		<Badge variant="outline" className={map[status] ?? ""}>
			{status?.replace(/_/g, " ")}
		</Badge>
	);
}

export default function FindingDetailPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const findingId = Number(params.id);

	const { data, isLoading, error } = trpc.auditFindings.get.useQuery({
		findingId,
	});

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: [["auditFindings", "get"]] });
		queryClient.invalidateQueries({ queryKey: [["auditFindings", "list"]] });
	};

	const [isAddOpen, setIsAddOpen] = useState(false);
	const [caDescription, setCaDescription] = useState("");
	const [caAssignedTo, setCaAssignedTo] = useState("");
	const [caDueAt, setCaDueAt] = useState("");

	const updateStatusMutation = trpc.auditFindings.updateStatus.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Status updated");
		},
		onError: (err) => toast.error(err.message),
	});

	const resolveMutation = trpc.auditFindings.resolve.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Finding resolved");
		},
		onError: (err) => toast.error(err.message),
	});

	const verifyMutation = trpc.auditFindings.verify.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Finding verified & closed");
		},
		onError: (err) => toast.error(err.message),
	});

	const assignCaMutation = trpc.auditFindings.assignCorrectiveAction.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Corrective action assigned");
			setIsAddOpen(false);
			setCaDescription("");
			setCaAssignedTo("");
			setCaDueAt("");
		},
		onError: (err) => toast.error(err.message),
	});

	const updateCaMutation = trpc.auditFindings.updateCorrectiveAction.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Action updated");
		},
		onError: (err) => toast.error(err.message),
	});

	const handleAssignCa = () => {
		if (!caDescription.trim()) {
			toast.error("Description is required");
			return;
		}
		assignCaMutation.mutate({
			findingId,
			description: caDescription.trim(),
			assignedTo: caAssignedTo ? Number(caAssignedTo) : undefined,
			dueAt: caDueAt ? new Date(caDueAt) : undefined,
		});
	};

	const caColumns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{
			key: "description",
			header: "Description",
			className: "font-medium",
			render: (row) => row.description,
		},
		{
			key: "assigned_to",
			header: "Assignee",
			render: (row) => (row.assigned_to != null ? `#${row.assigned_to}` : "—"),
		},
		{
			key: "due_at",
			header: "Due",
			hideOnMobile: true,
			render: (row) =>
				row.due_at ? new Date(row.due_at).toLocaleDateString() : "—",
		},
		{
			key: "status",
			header: "Status",
			render: (row) => <StatusBadge status={row.status} />,
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => (
				<div className="flex gap-2">
					{row.status === "PENDING" && (
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								updateCaMutation.mutate({
									correctiveActionId: row.id,
									status: "IN_PROGRESS",
								})
							}
						>
							<PlayIcon className="mr-1 h-4 w-4" />
							Start
						</Button>
					)}
					{(row.status === "PENDING" || row.status === "IN_PROGRESS") && (
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								updateCaMutation.mutate({
									correctiveActionId: row.id,
									status: "COMPLETED",
								})
							}
						>
							<CheckCircle2Icon className="mr-1 h-4 w-4" />
							Complete
						</Button>
					)}
					{(row.status === "COMPLETED" || row.status === "OVERDUE") && (
						<span className="text-muted-foreground text-xs">—</span>
					)}
				</div>
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

	const finding = data?.finding as any;
	const actions = (data?.correctiveActions ?? []) as any[];
	const status = finding?.status as string | undefined;

	return (
		<PageTransition>
			<Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<div className="flex items-center gap-3">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => router.push("/auditor/findings")}
						>
							<ArrowLeftIcon className="mr-1 h-4 w-4" />
							Back
						</Button>
						<h1 className="font-bold text-2xl tracking-tight">
							Finding #{findingId}
						</h1>
					</div>

					{finding ? (
						<div className="mt-3 space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<StatusBadge status={finding.status} />
								<Badge variant="secondary" className="capitalize">
									{finding.finding_type}
								</Badge>
								<Badge variant="outline">{finding.severity}</Badge>
							</div>
							<div>
								<h2 className="font-semibold text-lg">{finding.title}</h2>
								{finding.description && (
									<p className="mt-1 text-muted-foreground text-sm">
										{finding.description}
									</p>
								)}
							</div>
							<p className="text-muted-foreground text-xs">
								Raised by #{finding.raised_by ?? "—"}
								{finding.reference_type
									? ` · ref ${finding.reference_type} #${finding.reference_id ?? "—"}`
									: ""}
								{finding.created_at
									? ` · ${new Date(finding.created_at).toLocaleString()}`
									: ""}
							</p>

							{/* Status-transition controls */}
							<div className="flex flex-wrap gap-2 pt-1">
								{status === "OPEN" && (
									<Button
										size="sm"
										variant="outline"
										disabled={updateStatusMutation.isPending}
										onClick={() =>
											updateStatusMutation.mutate({
												findingId,
												status: "UNDER_REVIEW",
											})
										}
									>
										<SearchCheckIcon className="mr-1 h-4 w-4" />
										Mark Under Review
									</Button>
								)}
								{(status === "OPEN" || status === "UNDER_REVIEW") && (
									<Button
										size="sm"
										variant="outline"
										disabled={updateStatusMutation.isPending}
										onClick={() =>
											updateStatusMutation.mutate({
												findingId,
												status: "CORRECTIVE_ACTION_REQUIRED",
											})
										}
									>
										<ClipboardCheckIcon className="mr-1 h-4 w-4" />
										Require Corrective Action
									</Button>
								)}
								{(status === "OPEN" ||
									status === "UNDER_REVIEW" ||
									status === "CORRECTIVE_ACTION_REQUIRED") && (
									<Button
										size="sm"
										disabled={resolveMutation.isPending}
										onClick={() => resolveMutation.mutate({ findingId })}
									>
										<CheckCircle2Icon className="mr-1 h-4 w-4" />
										Resolve
									</Button>
								)}
								{status === "RESOLVED" && (
									<Button
										size="sm"
										disabled={verifyMutation.isPending}
										onClick={() => verifyMutation.mutate({ findingId })}
									>
										<ShieldCheckIcon className="mr-1 h-4 w-4" />
										Verify & Close
									</Button>
								)}
							</div>
							<p className="text-muted-foreground text-xs">
								Separation of duties: a finding cannot be resolved by the person
								who raised it.
							</p>
						</div>
					) : (
						<p className="mt-3 text-muted-foreground text-sm">
							Finding not found.
						</p>
					)}
				</CardHeader>

				<CardContent className="space-y-3 p-0">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-sm">Corrective Actions</h3>
						<Button size="sm" variant="secondary" onClick={() => setIsAddOpen(true)}>
							<PlusCircle className="mr-2 h-4 w-4" />
							Add Action
						</Button>
					</div>
					<DataTable
						data={actions}
						columns={caColumns}
						emptyMessage="No corrective actions yet"
						emptyIcon={<ClipboardCheckIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				{/* Add corrective action */}
				<Dialog
					open={isAddOpen}
					onOpenChange={(open) => {
						if (!open) setIsAddOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Corrective Action</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="caDescription">Description</Label>
								<Textarea
									id="caDescription"
									value={caDescription}
									onChange={(e) => setCaDescription(e.target.value)}
									placeholder="What must be done to correct this?"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="caAssignedTo">Assign to staff ID</Label>
									<Input
										id="caAssignedTo"
										value={caAssignedTo}
										onChange={(e) => setCaAssignedTo(e.target.value)}
										placeholder="Optional"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="caDueAt">Due date</Label>
									<Input
										id="caDueAt"
										type="date"
										value={caDueAt}
										onChange={(e) => setCaDueAt(e.target.value)}
									/>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setIsAddOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleAssignCa}
								disabled={assignCaMutation.isPending || !caDescription.trim()}
							>
								Assign
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
