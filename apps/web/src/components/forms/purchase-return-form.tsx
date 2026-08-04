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
import type { purchaseReturnSchema } from "@/lib/validation/purchase-return";

export function PurchaseReturnForm({
	purchaseReturn,
}: {
	purchaseReturn?: z.infer<typeof purchaseReturnSchema> & { id: number };
}) {
	const router = useRouter();
	const { data: purchases } = useTRPC().purchases.list.useQuery();
	const { data: products } = useTRPC().products.list.useQuery();

	const form = useForm({
		validator: zodValidator,
		defaultValues: purchaseReturn || {
			purchaseId: "",
			purchaseReturnItems: [],
		},
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
				form.handleSubmit(handleSubmit)();
			}}
			className="space-y-6"
		>
			<div className="space-y-2">
				<Label htmlFor="purchaseId">Purchase</Label>
				<form.Field
					name="purchaseId"
					children={(field) => (
						<Select
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<SelectTrigger id="purchaseId">
								<SelectValue placeholder="Select a purchase" />
							</SelectTrigger>
							<SelectContent>
								{purchases?.map((purchase) => (
									<SelectItem key={purchase.id} value={purchase.id}>
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
					{form.state.values.purchaseReturnItems.map((_, index) => (
						<div
							key={index}
							className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3"
						>
							<div className="space-y-2">
								<Label htmlFor={`purchaseReturnItems[${index}].productId`}>
									Product
								</Label>
								<form.Field
									name={`purchaseReturnItems[${index}].productId`}
									children={(subField) => (
										<Select
											value={subField.state.value}
											onValueChange={(value) => subField.handleChange(value)}
										>
											<SelectTrigger id={`purchaseReturnItems[${index}].productId`}>
												<SelectValue placeholder="Select a product" />
											</SelectTrigger>
											<SelectContent>
												{products?.map((product) => (
													<SelectItem key={product.id} value={product.id}>
														{product.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`purchaseReturnItems[${index}].quantity`}>
									Quantity
								</Label>
								<form.Field
									name={`purchaseReturnItems[${index}].quantity`}
									children={(subField) => (
										<Input
											id={`purchaseReturnItems[${index}].quantity`}
											type="number"
											value={subField.state.value}
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
									onClick={() => form.removeFieldValue("purchaseReturnItems", index)}
									className="w-full"
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
					className="mt-4"
					onClick={() => form.pushFieldValue("purchaseReturnItems", { productId: "", quantity: 1 })}
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