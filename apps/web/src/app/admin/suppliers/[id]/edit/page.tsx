"use client";

import { useParams } from "next/navigation";
import { SupplierForm } from "@/components/forms/supplier-form";
import { useTRPC } from "@/lib/trpc/client";

export default function EditSupplierPage() {
	const params = useParams();
	const { data: supplier, isLoading } = useTRPC().suppliers.get.useQuery({
		id: Number(params.id),
	});

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (!supplier) {
		return <p>Supplier not found</p>;
	}

	return (
		<div className="space-y-4">
			<h1 className="font-bold text-2xl">Edit Supplier</h1>
			<SupplierForm supplier={supplier} />
		</div>
	);
}
