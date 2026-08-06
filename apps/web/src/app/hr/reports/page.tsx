"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function HRAnalyticsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const { data: reportList, isLoading } = trpc.hr.getEmployees.useQuery({});

	const columns: Column<any>[] = [
		{ key: "emp_code", header: "Code", sortable: true },
		{ key: "name", header: "Employee" },
		{ key: "department", header: "Department" },
		{ key: "join_date", header: "Join Date" },
		{ key: "status", header: "Status" },
	];

	const filteredData = reportList?.filter(
		(record: any) =>
			record.name?.toLowerCase().includes(searchTerm.toLowerCase())
	) || [];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">HR Analytics</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for hr analytics.
				</p>
			</div>

			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader className="p-4">
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search records..."
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filteredData}
						columns={columns}
						emptyMessage={isLoading ? "Loading records..." : "No records found in this module yet."}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
