"use client";

import { Button } from "@evaluna/ui/components/button";
import { DataTable } from "@evaluna/ui/components/data-table";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { columns } from "./list/columns";

export default function PurchasesList() {
	const { data: purchases, isLoading } = useTRPC().purchases.list.useQuery({} as any);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl">Purchases</h1>
				<Link href="/admin/purchases/create">
					<Button>New Purchase</Button>
				</Link>
			</div>
			{isLoading ? (
				<p>Loading...</p>
			) : (
				<DataTable columns={columns as any[]} data={purchases?.items as any} />
			)}
		</div>
	);
}







