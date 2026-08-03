"use client";

import { Button } from "@evaluna/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { useTRPC } from "@/lib/trpc/client";
import type { supplierSchema } from "@/lib/validation/supplier";

export function SupplierForm({
	supplier,
}: {
	supplier?: z.infer<typeof supplierSchema> & { id: number };
}) {
	const router = useRouter();

	const form = useForm({
		validator: zodValidator,
		defaultValues: supplier || {
			name: "",
			email: "",
			phone: "",
			address: "",
			gstin: "",
			pan: "",
		},
	});

	const { mutate: createSupplier } = useTRPC().suppliers.create.useMutation({
		onSuccess: () => {
			router.push("/admin/suppliers/list");
		},
	});

	const { mutate: updateSupplier } = useTRPC().suppliers.update.useMutation({
		onSuccess: () => {
			router.push("/admin/suppliers/list");
		},
	});

	const handleSubmit = (values: z.infer<typeof supplierSchema>) => {
		if (supplier) {
			updateSupplier({ ...values, id: supplier.id });
		} else {
			createSupplier(values);
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit(handleSubmit)();
			}}
			className="space-y-4"
		>
			<form.Field
				name="name"
				children={(field) => (
					<div>
						<label>Name</label>
						<input
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>

			<form.Field
				name="email"
				children={(field) => (
					<div>
						<label>Email</label>
						<input
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>

			<form.Field
				name="phone"
				children={(field) => (
					<div>
						<label>Phone</label>
						<input
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>

			<form.Field
				name="address"
				children={(field) => (
					<div>
						<label>Address</label>
						<input
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>

			<form.Field
				name="gstin"
				children={(field) => (
					<div>
						<label>GSTIN</label>
						<input
							value={field.state.value}
							onChange={(e) => {
								// Format GSTIN as uppercase and validate pattern
								let value = e.target.value.toUpperCase();
								// GSTIN format: 12ABCDE1234F1Z1 (15 characters)
								if (value.length > 15) {
									value = value.substring(0, 15);
								}
								field.handleChange(value);
							}}
							placeholder="12ABCDE1234F1Z1"
							maxLength={15}
						/>
					</div>
				)}
			/>

			<form.Field
				name="pan"
				children={(field) => (
					<div>
						<label>PAN</label>
						<input
							value={field.state.value}
							onChange={(e) => {
								// Format PAN as uppercase and validate pattern
								let value = e.target.value.toUpperCase();
								// PAN format: AAAAA1234A (10 characters)
								if (value.length > 10) {
									value = value.substring(0, 10);
								}
								field.handleChange(value);
							}}
							placeholder="AAAAA1234A"
							maxLength={10}
						/>
					</div>
				)}
			/>

			<Button type="submit">{supplier ? "Update" : "Create"}</Button>
		</form>
	);
}
