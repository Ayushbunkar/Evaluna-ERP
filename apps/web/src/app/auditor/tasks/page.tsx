"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import {
	type FilterOption,
	SearchFilter,
} from "@evaluna/ui/components/search-filter";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { ClipboardListIcon, ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const sourceLabels: Record<string, string> = {
	upc: "UPC",
	corrective_action: "Corrective Action",
	stock_audit: "Stock Audit",
};

const sourceVariant = (s: string): "default" | "secondary" | "outline" => {
	if (s === "upc") return "default";
	if (s === "corrective_action") return "secondary";
	return "outline";
};

export default function AuditTasksPage() {
	const trpc = useTRPC();
	const router = useRouter();

	const [sourceFilter, setSourceFilter] = useState("all");
	const [onlyOpen, setOnlyOpen] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: tasks = [],
		isLoading,
		error,
	} = trpc.auditTasks.feed.useQuery(
		onlyOpen === "open" ? { onlyOpen: true } : undefined,
	);

	const sourceFilterOptions: FilterOption[] = [
		{ label: "All Sources", value: "all" },
		{ label: "UPC", value: "upc" },
		{ label: "Corrective Action", value: "corrective_action" },
		{ label: "Stock Audit", value: "stock_audit" },
	];

	const openFilterOptions: FilterOption[] = [
		{ label: "All", value: "all" },
		{ label: "Only Open", value: "open", variant: "warning" },
	];

	const filteredTasks = useMemo(() => {
		return (tasks as any[]).filter((t) => {
			if (sourceFilter !== "all" && t.source !== sourceFilter) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(t.title ?? "").toLowerCase().includes(q) ||
				String(t.status ?? "").toLowerCase().includes(q)
			);
		});
	}, [tasks, sourceFilter, searchTerm]);

	const columns: Column<any>[] = [
		{
			key: "source",
			header: "Source",
			sortable: true,
			render: (row: any) => (
				<Badge variant={sourceVariant(row.source)}>
					{sourceLabels[row.source] ?? row.source}
				</Badge>
			),
		},
		{
			key: "title",
			header: "Task",
			sortable: true,
			className: "font-medium",
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row: any) => (
				<Badge variant="secondary" className="capitalize">
					{String(row.status ?? "").toLowerCase().replace(/_/g, " ")}
				</Badge>
			),
		},
		{
			key: "dueAt",
			header: "Due",
			sortable: true,
			render: (row: any) =>
				row.dueAt ? new Date(row.dueAt).toLocaleDateString() : "—",
		},
		{
			key: "overdue",
			header: "Overdue",
			sortable: true,
			render: (row: any) =>
				row.overdue ? (
					<Badge variant="destructive">Overdue</Badge>
				) : (
					<span className="text-muted-foreground text-xs">—</span>
				),
		},
		{
			key: "actions",
			header: "Actions",
			render: (row: any) =>
				row.source === "upc" ? (
					<TableActions>
						<TableActionButton
							onClick={() => router.push("/auditor/upc")}
							icon={<ExternalLinkIcon className="h-4 w-4" />}
							label="Open UPC"
						/>
					</TableActions>
				) : (
					<span className="text-muted-foreground text-xs">—</span>
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
						<div key={i} className="flex items-center gap-4">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
						</div>
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
					<div className="mb-2">
						<h1 className="font-bold text-2xl tracking-tight">Audit Tasks</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Unified read-only feed of UPC tasks, corrective actions, and stock
							audits.
						</p>
					</div>
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search tasks by title or status"
						filters={[
							{
								options: sourceFilterOptions,
								value: sourceFilter,
								onChange: setSourceFilter,
							},
							{
								options: openFilterOptions,
								value: onlyOpen,
								onChange: setOnlyOpen,
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filteredTasks}
						columns={columns}
						emptyMessage="No audit tasks found"
						emptyIcon={<ClipboardListIcon className="h-8 w-8" />}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
