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
import { useTRPC } from "@/lib/trpc/client";
import type { purchaseReturnInsertSchema as purchaseReturnSchema } from "@/lib/validation/purchase-return";

export function PurchaseReturnForm({
	purchaseReturn,
}: {
	purchaseReturn?: z.infer<typeof purchaseReturnSchema> & { id: number };
}) {
	const router = useRouter();
	const { data: purchases } = useTRPC().purchases.list.useQuery({} as any);
	const { data: products } = useTRPC().products.list.useQuery();

	const form = useForm({
		defaultValues: purchaseReturn || {
			purchase_id: 0,
			items: [],
		},
		onSubmit: ({ value }) => handleSubmit(value as any),
	});

	const { mutate: createPurchaseReturn } =
		useTRPC().purchaseReturns.create.useMutation({
			onSuccess: () => {
				router.push("/admin/purchase-returns/list");
			},
		});

	const { mutate: updatePurchaseReturn } =
		useTRPC().purchaseReturns.update.useMutation({
			onSuccess: () => {
				router.push("/admin/purchase-returns/list");
			},
		});

	const handleSubmit = (values: z.infer<typeof purchaseReturnSchema>) => {
		if (purchaseReturn) {
			updatePurchaseReturn({ ...values, id: purchaseReturn.id });
		} else {
			createPurchaseReturn(values);
		}
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
			<div className="space-y-2">
				<Label htmlFor="purchase_id">Purchase</Label>
				<form.Field
					name="purchase_id"
					children={(field) => (
						<Select
							value={field.state.value?.toString()}
							onValueChange={(value) => field.handleChange(Number(value))}
						>
							<SelectTrigger id="purchase_id">
								<SelectValue placeholder="Select a purchase" />
							</SelectTrigger>
							<SelectContent>
								{purchases?.items?.map((purchase: any) => (
									<SelectItem key={purchase.id} value={purchase.id.toString()}>
										{purchase.id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				/>
			</div>

			<div className="space-y-4">
				<h3 className="font-medium text-lg">Purchase Return Items</h3>

				<div className="space-y-4">
					{form.state.values.items?.map((_: any, index: number) => (
						<div
							key={index}
							className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3"
						>
							<div className="space-y-2">
								<Label htmlFor={`items[${index}].product_id`}>Product</Label>
								<form.Field
									name={`items[${index}].product_id`}
									children={(subField) => (
										<Select
											value={subField.state.value?.toString()}
											onValueChange={(value) =>
												subField.handleChange(Number(value))
											}
										>
											<SelectTrigger id={`items[${index}].product_id`}>
												<SelectValue placeholder="Select a product" />
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
									children={(subField) => (
										<Input
											id={`items[${index}].quantity`}
											type="number"
											value={subField.state.value || ""}
											onChange={(e) =>
												subField.handleChange(Number(e.target.value))
											}
											placeholder="Quantity"
										/>
									)}
								/>
							</div>

							<div className="flex items-end">
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="mt-8"
									onClick={() => {
										const newItems = [...form.state.values.items!];
										newItems.splice(index, 1);
										form.setFieldValue("items", newItems);
									}}
								>
									Remove
								</Button>
							</div>
						</div>
					))}
				</div>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => {
						const currentItems = form.state.values.items || [];
						form.setFieldValue("items", [
							...currentItems,
							{ product_id: 0, quantity: 1, price: 0 },
						]);
					}}
				>
					Add Item
				</Button>
			</div>

			<div className="flex justify-end">
				<Button type="submit" size="lg">
					{purchaseReturn ? "Update Return" : "Create Return"}
				</Button>
			</div>
		</form>
	);
}

