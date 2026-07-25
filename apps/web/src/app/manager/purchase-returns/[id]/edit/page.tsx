
"use client";

import { useTRPC } from "@/lib/trpc/client";
import { PurchaseReturnForm } from "@/components/forms/purchase-return-form";
import { useParams } from "next/navigation";

export default function EditPurchaseReturnPage() {
  const params = useParams();
  const { data: purchaseReturn, isLoading } = useTRPC().purchaseReturns.get.useQuery({ id: Number(params.id) });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!purchaseReturn) {
    return <p>Purchase return not found</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Purchase Return</h1>
      <PurchaseReturnForm purchaseReturn={purchaseReturn} />
    </div>
  );
}
