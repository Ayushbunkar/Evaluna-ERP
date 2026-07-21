"use client";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import Link from "next/link";
import { DataTable } from "@evaluna/ui/components/data-table";
import { columns } from "./list/columns";

export default function PurchasesList() {
  const { data: purchases, isLoading } = useTRPC().purchases.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <Link href="/admin/purchases/create">
          <Button>New Purchase</Button>
        </Link>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} data={purchases?.items ?? []} />
      )}
    </div>
  );
}
