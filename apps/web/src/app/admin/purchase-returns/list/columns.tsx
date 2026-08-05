"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { z } from "zod";
import type { purchaseReturnInsertSchema } from "@/lib/validation/purchase-return";

type PurchaseReturn = z.infer<typeof purchaseReturnInsertSchema> & {
	id: number;
};

export const columns: any[] = [
	{
		accessorKey: "id",
		header: "ID",
	},
	{
		accessorKey: "purchase_id",
		header: "Purchase ID",
	},
	{
		accessorKey: "return_date",
		header: "Return Date",
	},
	{
		accessorKey: "total_amount",
		header: "Total Amount",
	},
	{
		accessorKey: "status",
		header: "Status",
	},
	{
		id: "actions",
		cell: ({ row }: any) => {
			const purchaseReturn = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem asChild>
							<Link href={`/admin/purchase-returns/${purchaseReturn.id}/edit`}>
								Edit
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>Delete</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

