"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CompletedPutAwaysPage() {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const { data, isLoading } = trpc.putter.getCompleted.useQuery({});

	const columns: Column<any>[] = [
		{ key: "id", header: "Task ID", sortable: true },
		{ key: "product", header: "Product" },
		{ key: "qty", header: "Qty" },
		{ key: "location", header: "Location" },
		{ key: "completed_by", header: "Completed By" },
		{ key: "time_taken", header: "Time Taken" },
		{ key: "date", header: "Date" },
	];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					Completed Put-Aways
				</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for completed put-aways.
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
						isLoading={isLoading}
						emptyMessage="No records found in this module yet."
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
