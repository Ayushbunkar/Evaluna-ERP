"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function EmployeeDirectoryPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const { data: staffList, isLoading } = trpc.staff.list.useQuery();

	const columns: Column<any>[] = [
		{ key: "staff_code", header: "Code", sortable: true },
		{ key: "name", header: "Name", sortable: true },
		{ key: "email", header: "Email" },
		{ key: "role", header: "Role", sortable: true },
		{ key: "department", header: "Department", sortable: true },
		{ key: "status", header: "Status" },
	];

	// Filter data based on search term
	const filteredData =
		staffList?.filter(
			(emp) =>
				emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				emp.staff_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				emp.email?.toLowerCase().includes(searchTerm.toLowerCase()),
		) || [];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					Employee Directory
				</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for employee directory.
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
						emptyMessage={
							isLoading
								? "Loading records..."
								: "No records found in this module yet."
						}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
