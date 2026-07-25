/* eslint-disable @next/next/no-img-element */
"use client";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import Link from "next/link";
import { DataTable } from "@evaluna/ui/components/data-table";
import { columns } from "./columns";

export default function PurchaseReturnsList() {
  const { data: purchaseReturns, isLoading } = useTRPC().purchaseReturns.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Returns</h1>
        <Link href="/admin/purchase-returns/create">
          <Button>New Purchase Return</Button>
        </Link>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} data={purchaseReturns ?? []} />
      )}
    </div>
  );
}
