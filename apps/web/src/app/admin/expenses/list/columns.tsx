"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Expense } from "@/lib/validation/expense";

export const columns: ColumnDef<Expense>[] = [
	{
		accessorKey: "description",
		header: "Description",
	},
	{
		accessorKey: "amount",
		header: "Amount",
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
	},
	{
		accessorKey: "category",
		header: "Category",
	},
];
