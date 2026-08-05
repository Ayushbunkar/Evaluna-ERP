"use client";

import { Button } from "@evaluna/ui/components/button";
import { DataTable } from "@evaluna/ui/components/data-table";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";
import { columns } from "./columns";

export default function PurchaseReturnsList() {
	const { data: purchaseReturns, isLoading } =
		useTRPC().purchaseReturns.list.useQuery();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl">Purchase Returns</h1>
				<Link href="/admin/purchase-returns/create">
					<Button>New Purchase Return</Button>
				</Link>
			</div>
			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</div>
			) : (
				<DataTable columns={columns as any[]} data={purchaseReturns as any} />
			)}
		</div>
	);
}







