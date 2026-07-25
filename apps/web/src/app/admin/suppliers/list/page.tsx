
"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import Link from "next/link";
import { DataTable } from "@evaluna/ui/components/data-table";
import { columns } from "./columns";

export default function SuppliersList() {
  const [suppliers] = trpc.suppliers.list.useSuspenseQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Link href="/admin/suppliers/create">
          <Button>New Supplier</Button>
        </Link>
      </div>
      <DataTable columns={columns} data={suppliers ?? []} />
    </div>
  );
}
