"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
} from "@evaluna/ui/components/data-table";
import {
	type FilterOption,
	SearchFilter,
} from "@evaluna/ui/components/search-filter";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { HistoryIcon, LockIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

function JsonCell({ value }: { value: unknown }) {
	if (value === null || value === undefined) {
		return <span className="text-muted-foreground text-xs">—</span>;
	}
	const text =
		typeof value === "string" ? value : JSON.stringify(value, null, 0);
	return (
		<pre className="max-w-[240px] overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-1 text-[10px] leading-tight">
			{text}
		</pre>
	);
}

export default function AuditLogsPage() {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [entityFilter, setEntityFilter] = useState("all");

	const {
		data: logs = [],
		isLoading,
		error,
	} = trpc.auditor.listAuditLogs.useQuery({ limit: 200 });

	const entityOptions: FilterOption[] = useMemo(() => {
		const set = new Set<string>();
		for (const l of logs as any[]) {
			if (l.entity_type) set.add(String(l.entity_type));
		}
		return [
			{ label: "All entities", value: "all" },
			...Array.from(set)
				.sort()
				.map((e) => ({ label: e, value: e })),
		];
	}, [logs]);

	const filtered = useMemo(() => {
		return (logs as any[]).filter((l) => {
			if (entityFilter !== "all" && l.entity_type !== entityFilter)
				return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(l.action ?? "").toLowerCase().includes(q) ||
				String(l.entity_type ?? "").toLowerCase().includes(q) ||
				String(l.user_name ?? "").toLowerCase().includes(q)
			);
		});
	}, [logs, entityFilter, searchTerm]);

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{
			key: "created_at",
			header: "When",
			sortable: true,
			render: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleString() : "—",
		},
		{
			key: "user_name",
			header: "User",
			render: (row) => row.user_name ?? `#${row.user_id ?? "system"}`,
		},
		{
			key: "action",
			header: "Action",
			sortable: true,
			render: (row) => (
				<Badge variant="secondary" className="font-mono text-[10px]">
					{row.action}
				</Badge>
			),
		},
		{
			key: "entity_type",
			header: "Entity",
			sortable: true,
			render: (row) => (
				<span className="text-xs">
					{row.entity_type}
					{row.entity_id != null ? ` #${row.entity_id}` : ""}
				</span>
			),
		},
		{
			key: "old_values",
			header: "Old",
			hideOnMobile: true,
			render: (row) => <JsonCell value={row.old_values} />,
		},
		{
			key: "new_values",
			header: "New",
			hideOnMobile: true,
			render: (row) => <JsonCell value={row.new_values} />,
		},
	];

	if (isLoading) {
		return (
			<Card className="flex flex-col gap-6 p-6">
				<CardHeader className="p-0">
					<Skeleton className="h-10 w-64" />
				</CardHeader>
				<CardContent className="space-y-3 p-0">
					{Array.from({ length: 6 }).map((_, i) => (
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
					<div className="mb-2 flex items-center gap-2">
						<div>
							<h1 className="font-bold text-2xl tracking-tight">Audit Logs</h1>
							<p className="mt-1 flex items-center gap-1 text-muted-foreground text-sm">
								<LockIcon className="h-3 w-3" />
								Append-only, read-only immutable trail. Entries cannot be edited
								or deleted here.
							</p>
						</div>
					</div>
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search by action, entity or user"
						filters={[
							{
								options: entityOptions,
								value: entityFilter,
								onChange: setEntityFilter,
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filtered}
						columns={columns}
						emptyMessage="No audit log entries found"
						emptyIcon={<HistoryIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
