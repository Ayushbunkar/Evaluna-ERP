"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function InboundReceivingPage() {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const { data, isLoading } = trpc.putter.getReceiving.useQuery({});

	const columns: Column<any>[] = [
		{ key: "id", header: "GRN / ID", sortable: true },
		{ key: "supplier", header: "Supplier" },
		{ key: "products", header: "Items" },
		{ key: "qty", header: "Total Qty" },
		{ key: "po_ref", header: "PO Ref" },
		{ key: "received_by", header: "Received By" },
		{ key: "date", header: "Date" },
		{ key: "status", header: "Status" },
	];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Inbound Receiving</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for inbound receiving.
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
