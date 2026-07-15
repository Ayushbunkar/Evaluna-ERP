'use client';

import { PurchaseForm } from '@/components/forms/purchase-form';

export default function CreatePurchasePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Purchase</h1>
      <PurchaseForm />
    </div>
  );
}
