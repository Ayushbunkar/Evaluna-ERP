"use client";

import { SupplierForm } from "@/components/forms/supplier-form";

export default function CreateSupplierPage() {
	return (
		<div className="space-y-4">
			<h1 className="font-bold text-2xl">Create Supplier</h1>
			<SupplierForm />
		</div>
	);
}
