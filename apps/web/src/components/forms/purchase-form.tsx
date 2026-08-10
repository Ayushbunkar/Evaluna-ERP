"use client";

import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import type { purchaseSchema } from "@/lib/validation/purchase";

export function PurchaseForm({
	purchase,
}: {
	purchase?: z.infer<typeof purchaseSchema> & { id: string };
}) {
	const router = useRouter();

	const [suppliers] = trpc.suppliers.list.useSuspenseQuery();
	const { data: products, error: productsError } =
		trpc.products.list.useQuery();

	const form = useForm({
		defaultValues: purchase || {
			supplierId: "",
			total: 0,
			items: [],
		},
		onSubmit: ({ value }) => handleSubmit(value),
	});

	const { mutate: createPurchase } = trpc.purchases.create.useMutation({
		onSuccess: () => {
			router.push("/admin/purchases");
		},
	});

	const handleSubmit = (values: z.infer<typeof purchaseSchema>) => {
		createPurchase(values);
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="supplierId">Supplier</Label>
					<form.Field
						name="supplierId"
						children={(field) => (
							<Select
								value={field.state.value?.toString()}
								onValueChange={(value) => field.handleChange(value)}
							>
								<SelectTrigger id="supplierId">
									<SelectValue placeholder="Select a supplier" />
								</SelectTrigger>
								<SelectContent>
									{suppliers?.map((supplier) => (
										<SelectItem
											key={supplier.id}
											value={supplier.id.toString()}
										>
											{supplier.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="total">Total Amount</Label>
					<form.Field
						name="total"
						children={(field) => (
							<Input
								id="total"
								type="number"
								value={field.state.value ?? ""}
								onChange={(e) => field.handleChange(Number(e.target.value))}
								placeholder="Enter total amount"
							/>
						)}
					/>
				</div>
			</div>

			<div className="space-y-4">
				<h3 className="font-medium text-lg">Purchase Items</h3>

				<form.Field
					name="items"
					mode="array"
					children={(itemsField) => (
						<div className="space-y-4">
							{itemsField.state.value.map((_, index) => (
								<div
									key={index}
									className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-4"
								>
									<div className="space-y-2">
										<Label htmlFor={`items[${index}].productId`}>Product</Label>
										<form.Field
											name={`items[${index}].productId`}
											children={(field) => (
												<Select
													value={field.state.value?.toString()}
													onValueChange={(value) => field.handleChange(value)}
												>
													<SelectTrigger id={`items[${index}].productId`}>
														<SelectValue placeholder="Select product" />
													</SelectTrigger>
													<SelectContent>
														{products?.map((product) => (
															<SelectItem
																key={product.id}
																value={product.id.toString()}
															>
																{product.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor={`items[${index}].quantity`}>Quantity</Label>
										<form.Field
											name={`items[${index}].quantity`}
											children={(field) => (
												<Input
													id={`items[${index}].quantity`}
													type="number"
													value={field.state.value ?? ""}
													onChange={(e) =>
														field.handleChange(Number(e.target.value))
													}
													placeholder="Quantity"
												/>
											)}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor={`items[${index}].price`}>Price</Label>
										<form.Field
											name={`items[${index}].price`}
											children={(field) => (
												<Input
													id={`items[${index}].price`}
													type="number"
													value={field.state.value ?? ""}
													onChange={(e) =>
														field.handleChange(Number(e.target.value))
													}
													placeholder="Price"
												/>
											)}
										/>
									</div>

									<div className="flex items-end">
										<Button
											type="button"
											variant="destructive"
											onClick={() => itemsField.removeValue(index)}
											className="w-full"
										>
											Remove
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				/>

				<Button
					type="button"
					variant="outline"
					onClick={() => {
						form.pushFieldValue("items", {
							productId: "",
							quantity: 1,
							price: 0,
						});
					}}
					className="w-full md:w-auto"
				>
					Add Item
				</Button>
			</div>

			<div className="flex justify-end">
				<Button type="submit" size="lg">
					{purchase ? "Update Purchase" : "Create Purchase"}
				</Button>
			</div>
		</form>
	);
}
