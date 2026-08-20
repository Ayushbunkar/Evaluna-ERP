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
import { EyeIcon, FlagIcon, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type FindingType =
	| "receiving"
	| "upc"
	| "placement"
	| "inventory"
	| "price"
	| "route"
	| "discrepancy";

const FINDING_TYPES: FindingType[] = [
	"receiving",
	"upc",
	"placement",
	"inventory",
	"price",
	"route",
	"discrepancy",
];

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
	};
	return (
		<Badge variant="outline" className={map[status] ?? ""}>
			{status?.replace(/_/g, " ")}
		</Badge>
	);
}

function SeverityBadge({ severity }: { severity: string }) {
	const map: Record<string, string> = {
		LOW: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
		MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
		HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
	};
	return (
		<Badge variant="outline" className={map[severity] ?? ""}>
			{severity}
		</Badge>
	);
}

export default function FindingsPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();
	const { activeBranchId } = useBranch();

	const {
		data: findings = [],
		isLoading,
		error,
	} = trpc.auditFindings.list.useQuery({ branchId: activeBranchId ?? undefined });

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: [["auditFindings", "list"]] });

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [severityFilter, setSeverityFilter] = useState("all");

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [cType, setCType] = useState<FindingType>("discrepancy");
	const [cSeverity, setCSeverity] = useState<Severity>("MEDIUM");
	const [cTitle, setCTitle] = useState("");
	const [cDescription, setCDescription] = useState("");

	const createMutation = trpc.auditFindings.create.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Finding created");
			setIsCreateOpen(false);
			setCTitle("");
			setCDescription("");
		},
		onError: (err) => toast.error(err.message),
	});

	const statusFilterOptions: FilterOption[] = [
		{ label: "All statuses", value: "all" },
		{ label: "Open", value: "OPEN" },
		{ label: "Under Review", value: "UNDER_REVIEW" },
		{
			label: "Corrective Action",
			value: "CORRECTIVE_ACTION_REQUIRED",
			variant: "warning",
		},
		{ label: "Resolved", value: "RESOLVED" },
		{ label: "Closed", value: "CLOSED", variant: "success" },
	];

	const severityFilterOptions: FilterOption[] = [
		{ label: "All severities", value: "all" },
		{ label: "Low", value: "LOW" },
		{ label: "Medium", value: "MEDIUM" },
		{ label: "High", value: "HIGH", variant: "warning" },
		{ label: "Critical", value: "CRITICAL", variant: "danger" },
	];

	const filtered = useMemo(() => {
		return (findings as any[]).filter((f) => {
			if (statusFilter !== "all" && f.status !== statusFilter) return false;
			if (severityFilter !== "all" && f.severity !== severityFilter)
				return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(f.id).includes(q) ||
				String(f.title ?? "").toLowerCase().includes(q) ||
				String(f.finding_type ?? "").toLowerCase().includes(q)
			);
		});
	}, [findings, statusFilter, severityFilter, searchTerm]);

	const handleCreate = () => {
		if (!cTitle.trim()) {
			toast.error("Title is required");
			return;
		}
		createMutation.mutate({
			branchId: activeBranchId ?? undefined,
			findingType: cType,
			severity: cSeverity,
			title: cTitle.trim(),
			description: cDescription.trim() || undefined,
		});
	};

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{
			key: "title",
			header: "Title",
			sortable: true,
			className: "font-medium",
			render: (row) => row.title,
		},
		{
			key: "finding_type",
			header: "Type",
			render: (row) => (
				<Badge variant="secondary" className="capitalize">
					{row.finding_type}
				</Badge>
			),
		},
		{
			key: "severity",
			header: "Severity",
			sortable: true,
			render: (row) => <SeverityBadge severity={row.severity} />,
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row) => <StatusBadge status={row.status} />,
		},
		{
			key: "created_at",
			header: "Raised",
			sortable: true,
			hideOnMobile: true,
			render: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => (
				<TableActions>
					<TableActionButton
						onClick={() => router.push(`/auditor/findings/${row.id}`)}
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
						searchPlaceholder="Search by title or type"
						filters={[
							{
								options: statusFilterOptions,
								value: statusFilter,
								onChange: setStatusFilter,
							},
							{
								options: severityFilterOptions,
								value: severityFilter,
								onChange: setSeverityFilter,
							},
						]}
					>
						<Button size="sm" onClick={() => setIsCreateOpen(true)}>
							<PlusCircle className="mr-2 h-4 w-4" />
							New Finding
						</Button>
					</SearchFilter>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filtered}
						columns={columns}
						emptyMessage="No audit findings"
						emptyIcon={<FlagIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				{/* Create finding */}
				<Dialog
					open={isCreateOpen}
					onOpenChange={(open) => {
						if (!open) setIsCreateOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Audit Finding</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="cType">Type</Label>
									<Select
										value={cType}
										onValueChange={(v) => setCType(v as FindingType)}
									>
										<SelectTrigger id="cType">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{FINDING_TYPES.map((t) => (
												<SelectItem key={t} value={t} className="capitalize">
													{t}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="cSeverity">Severity</Label>
									<Select
										value={cSeverity}
										onValueChange={(v) => setCSeverity(v as Severity)}
									>
										<SelectTrigger id="cSeverity">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="LOW">Low</SelectItem>
											<SelectItem value="MEDIUM">Medium</SelectItem>
											<SelectItem value="HIGH">High</SelectItem>
											<SelectItem value="CRITICAL">Critical</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="cTitle">Title</Label>
								<Input
									id="cTitle"
									value={cTitle}
									onChange={(e) => setCTitle(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="cDescription">Description (optional)</Label>
								<Textarea
									id="cDescription"
									value={cDescription}
									onChange={(e) => setCDescription(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleCreate}
								disabled={createMutation.isPending || !cTitle.trim()}
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
