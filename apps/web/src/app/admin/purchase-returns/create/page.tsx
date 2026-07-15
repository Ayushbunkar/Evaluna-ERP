
"use client";

import { PurchaseReturnForm } from "@/components/forms/purchase-return-form";

export default function CreatePurchaseReturnPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Purchase Return</h1>
      <PurchaseReturnForm />
    </div>
  );
}
