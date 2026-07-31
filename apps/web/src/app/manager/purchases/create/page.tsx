"use client";

import { PurchaseForm } from "@/components/forms/purchase-form";

export default function CreatePurchasePage() {
	return (
		<div className="space-y-4">
			<h1 className="font-bold text-2xl">Create Purchase</h1>
			<PurchaseForm />
		</div>
	);
}
