"use client";

import { Button } from "@evaluna/ui/components/button";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { RouterOutputs } from "@/lib/trpc/router";

type Purchase = RouterOutputs["purchases"]["list"][number];

export const columns: ColumnDef<Purchase>[] = [
	{
		accessorKey: "grn_number",
		header: "GRN Number",
		cell: ({ row }) => (
			<span className="font-medium">{row.getValue("grn_number")}</span>
		),
	},
	{
		id: "supplier",
		header: "Supplier",
		accessorFn: (row) => row.supplier?.name || "Unknown",
	},
	{
		accessorKey: "total_amount",
		header: "Total",
		cell: ({ row }) => `₹${row.getValue("total_amount")}`,
	},
	{
		accessorKey: "payment_status",
		header: "Payment Status",
		cell: ({ row }) => (
			<span
				className={`rounded px-2 py-1 text-xs capitalize ${row.original.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
			>
				{row.original.payment_status || "unpaid"}
			</span>
		),
	},
	{
		accessorKey: "created_at",
		header: "Date",
		cell: ({ row }) =>
			new Date(row.getValue("created_at")).toLocaleDateString(),
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const router = useRouter();
			return (
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							router.push(`/admin/purchases/${row.original.id}/return`)
						}
					>
						Return Items
					</Button>
				</div>
			);
		},
	},
];
