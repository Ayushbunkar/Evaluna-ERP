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
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardListIcon, EyeIcon, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		planned: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
		in_progress:
			"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		escalated: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
		completed:
			"bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
	};
	return (
		<Badge variant="outline" className={map[status] ?? ""}>
			{status?.replace(/_/g, " ")}
		</Badge>
	);
}

export default function InventoryAuditPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();
	const { activeBranchId } = useBranch();

	const {
		data: audits = [],
		isLoading,
		error,
	} = trpc.audit.listAudits.useQuery({ branchId: activeBranchId ?? undefined });

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: [["audit", "listAudits"]] });

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [auditorId, setAuditorId] = useState("");

	const createMutation = trpc.audit.create.useMutation({
		onSuccess: (row: any) => {
			invalidate();
			toast.success("Audit created");
			setIsCreateOpen(false);
			setAuditorId("");
			if (row?.id) router.push(`/auditor/inventory-audit/${row.id}`);
		},
		onError: (err) => toast.error(err.message),
	});

	const statusFilterOptions: FilterOption[] = [
		{ label: "All", value: "all" },
		{ label: "Planned", value: "planned" },
		{ label: "In Progress", value: "in_progress", variant: "warning" },
		{ label: "Escalated", value: "escalated", variant: "danger" },
		{ label: "Completed", value: "completed", variant: "success" },
	];

	const filtered = useMemo(() => {
		return (audits as any[]).filter((a) => {
			if (statusFilter !== "all" && a.status !== statusFilter) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(a.id).includes(q) ||
				String(a.branch_id ?? "").includes(q) ||
				String(a.auditor_id ?? "").includes(q)
			);
		});
	}, [audits, statusFilter, searchTerm]);

	const handleCreate = () => {
		if (!activeBranchId) {
			toast.error("Select a branch first");
			return;
		}
		if (!auditorId.trim()) {
			toast.error("Auditor staff ID is required");
			return;
		}
		createMutation.mutate({
			branch_id: activeBranchId,
			auditor_id: Number(auditorId),
		});
	};

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{
			key: "branch_id",
			header: "Branch",
			render: (row) => row.branch_id ?? "—",
		},
		{
			key: "auditor_id",
			header: "Auditor",
			render: (row) => (row.auditor_id != null ? `#${row.auditor_id}` : "—"),
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row) => <StatusBadge status={row.status} />,
		},
		{
			key: "created_at",
			header: "Created",
			sortable: true,
			hideOnMobile: true,
			render: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleString() : "—",
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => (
				<TableActions>
					<TableActionButton
						onClick={() => router.push(`/auditor/inventory-audit/${row.id}`)}
						icon={<EyeIcon className="h-4 w-4" />}
						label="Open"
					/>
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
						searchPlaceholder="Search by audit, branch or auditor ID"
						filters={[
							{
								options: statusFilterOptions,
								value: statusFilter,
								onChange: setStatusFilter,
							},
						]}
					>
						<Button size="sm" onClick={() => setIsCreateOpen(true)}>
							<PlusCircle className="mr-2 h-4 w-4" />
							New Audit
						</Button>
					</SearchFilter>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filtered}
						columns={columns}
						emptyMessage="No inventory audits found"
						emptyIcon={<ClipboardListIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				{/* Create audit */}
				<Dialog
					open={isCreateOpen}
					onOpenChange={(open) => {
						if (!open) setIsCreateOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Inventory Audit</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="branch">Branch</Label>
								<Input
									id="branch"
									value={activeBranchId ?? ""}
									disabled
									placeholder="Select a branch in the header"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="auditorId">Auditor Staff ID</Label>
								<Input
									id="auditorId"
									value={auditorId}
									onChange={(e) => setAuditorId(e.target.value)}
									placeholder="e.g. 7"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleCreate}
								disabled={
									createMutation.isPending || !activeBranchId || !auditorId.trim()
								}
							>
								Create
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
