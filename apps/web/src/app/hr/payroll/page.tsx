"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function PayrollProcessingPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const { data: payrollList, isLoading } = trpc.payroll.list.useQuery({});

	const columns: Column<any>[] = [
		{ key: "staff.name", header: "Employee", sortable: true },
		{ key: "month", header: "Month", sortable: true },
		{ key: "base_salary", header: "Base Salary" },
		{ key: "net_payable", header: "Net Payable" },
		{ key: "status", header: "Status" },
	];

	const formatRupees = (amount: number | string) => {
		const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(num || 0);
	};

	// Filter data based on search term
	const filteredData =
		payrollList
			?.map((record) => ({
				...record,
				"staff.name": record.staff?.name || "Unknown",
				base_salary: formatRupees(record.base_salary as any),
				net_payable: formatRupees(record.net_payable as any),
			}))
			.filter(
				(record) =>
					record["staff.name"]
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					record.month?.toLowerCase().includes(searchTerm.toLowerCase()),
			) || [];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					Payroll Processing
				</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for payroll processing.
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
