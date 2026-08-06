"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function LeaveManagementPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const { data: leaveList, isLoading } = trpc.hr.getLeaveRequests.useQuery({});

	const columns: Column<any>[] = [
		{ key: "emp_name", header: "Employee", sortable: true },
		{ key: "leave_type", header: "Type" },
		{ key: "start_date", header: "Start Date" },
		{ key: "end_date", header: "End Date" },
		{ key: "status", header: "Status" },
	];

	const filteredData = leaveList?.filter(
		(record: any) =>
			record.emp_name?.toLowerCase().includes(searchTerm.toLowerCase())
	) || [];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Leave Management</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for leave management.
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
