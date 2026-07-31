"use client";

import { PurchaseReturnForm } from "@/components/forms/purchase-return-form";

export default function CreatePurchaseReturnPage() {
	return (
		<div className="space-y-4">
			<h1 className="font-bold text-2xl">Create Purchase Return</h1>
			<PurchaseReturnForm />
		</div>
	);
}
