"use client";

import { Button } from "@evaluna/ui/components/button";
import { DataTable } from "@evaluna/ui/components/data-table";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { columns } from "./list/columns";

export default function ExpensesList() {
	const { data: expenses, isLoading } = useTRPC().expenses.list.useQuery({} as any);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl">Expenses</h1>
				<Link href="/admin/expenses/create">
					<Button>New Expense</Button>
				</Link>
			</div>
			{isLoading ? (
				<p>Loading...</p>
			) : (
				<DataTable columns={columns as any[]} data={expenses?.items ?? []} />
			)}
		</div>
	);
}

