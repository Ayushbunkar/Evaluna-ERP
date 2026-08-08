"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PutAwayTasksPage() {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const { data, isLoading } = trpc.putter.getPutAwayTasks.useQuery({});

	const columns: Column<any>[] = [
		{ key: "id", header: "Task ID", sortable: true },
		{ key: "product", header: "Product" },
		{ key: "sku", header: "SKU" },
		{ key: "qty", header: "Qty" },
		{ key: "from", header: "From" },
		{ key: "to_location", header: "To Location" },
		{ key: "status", header: "Status" },
	];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Put Away Tasks</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for put away tasks.
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
						data={data || []}
						columns={columns}

						emptyMessage="No records found in this module yet."
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
