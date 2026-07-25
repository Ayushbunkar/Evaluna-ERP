
"use client";

import { useTRPC } from "@/lib/trpc/client";
import { SupplierForm } from "@/components/forms/supplier-form";
import { useParams } from "next/navigation";

export default function EditSupplierPage() {
  const params = useParams();
  const { data: supplier, isLoading } = useTRPC().suppliers.get.useQuery({ id: Number(params.id) });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!supplier) {
    return <p>Supplier not found</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Supplier</h1>
      <SupplierForm supplier={supplier} />
    </div>
  );
}
