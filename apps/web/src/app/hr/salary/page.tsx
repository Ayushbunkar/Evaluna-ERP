"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function SalaryStructurePage() {
	const [searchTerm, setSearchTerm] = useState("");
	const { data: salaryList, isLoading } = trpc.hr.getSalaryStructure.useQuery({});

	const columns: Column<any>[] = [
		{ key: "emp_name", header: "Employee", sortable: true },
		{ key: "department", header: "Department" },
		{ key: "basic", header: "Basic" },
		{ key: "hra", header: "HRA" },
		{ key: "allowances", header: "Allowances" },
		{ key: "deductions", header: "Deductions" },
		{ key: "net_salary", header: "Net Salary" },
	];

	const filteredData = salaryList?.filter(
		(record: any) =>
			record.emp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.department?.toLowerCase().includes(searchTerm.toLowerCase())
	).map(r => ({
		...r,
		basic: `$${r.basic}`,
		hra: `$${r.hra}`,
		allowances: `$${r.allowances}`,
		deductions: `$${r.deductions}`,
		net_salary: `$${r.net_salary}`,
	})) || [];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Salary Structure</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for salary structure.
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
