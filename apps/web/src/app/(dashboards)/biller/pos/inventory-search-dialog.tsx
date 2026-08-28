// @ts-nocheck
"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

interface InventorySearchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (
		items: Array<{
			id: number;
			name: string;
			price: number;
			quantity: number;
		}>,
	) => void;
}

export function InventorySearchDialog({
	open,
	onOpenChange,
	onConfirm,
}: InventorySearchDialogProps) {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [inventory, setInventory] = useState<
		Array<{
			id: number;
			name: string;
			price: number;
			stock: number;
			barcode: string;
		}>
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedItems, setSelectedItems] = useState<
		Array<{
			id: number;
			name: string;
			price: number;
			quantity: number;
		}>
	>([]);

	useEffect(() => {
		if (open && searchTerm) {
			const timer = setTimeout(() => {
				fetchInventory();
			}, 300);
			return () => clearTimeout(timer);
		}
		if (open && !searchTerm) {
			fetchInventory();
		}
	}, [open, searchTerm]);

	const fetchInventory = async () => {
		if (!open) return;

		setIsLoading(true);
		try {
			const data = await trpc.pos.inventory.query({
				search: searchTerm,
				limit: 50,
			});
			setInventory(
				data.map((item) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					stock: item.stock,
					barcode: item.barcode || "",
				})),
			);
		} catch (error) {
			console.error("Failed to fetch inventory:", error);
			toast.error("Failed to load inventory");
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddItem = (item: {
		id: number;
		name: string;
		price: number;
		stock: number;
	}) => {
		setSelectedItems((prev) => {
			const existingItem = prev.find((i) => i.id === item.id);
			if (existingItem) {
				return prev.map((i) =>
					i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
				);
			}
			return [
				...prev,
				{ id: item.id, name: item.name, price: item.price, quantity: 1 },
			];
		});
	};

	const handleQuantityChange = (id: number, quantity: number) => {
		setSelectedItems((prev) =>
			prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
		);
	};

	const handleRemoveItem = (id: number) => {
		setSelectedItems((prev) => prev.filter((i) => i.id !== id));
	};

	const handleConfirm = () => {
		if (selectedItems.length === 0) {
			toast.error("Please add at least one item to cart");
			return;
		}

		onConfirm(selectedItems);
		onOpenChange(false);
		setSearchTerm("");
		setSelectedItems([]);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Add Items to Cart</DialogTitle>
					<DialogDescription>
						Search for products and add them to the sale
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Search Products</Label>
						<Input
							placeholder="Search by name, barcode, or SKU..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{isLoading && (
						<div className="text-muted-foreground text-sm">Loading...</div>
					)}

					{searchTerm && inventory.length > 0 && (
						<div className="space-y-2">
							<div className="border-b pb-2 font-medium text-muted-foreground text-sm">
								Available Products
							</div>
							<div className="space-y-2">
								{inventory.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div className="flex-1">
											<div className="font-medium">{item.name}</div>
											<div className="text-muted-foreground text-sm">
												{formatCurrency(item.price, "en")} â€¢ Stock:{" "}
												{item.stock}
												{item.barcode && (
													<span className="ml-2">
														â€¢ Barcode: {item.barcode}
													</span>
												)}
											</div>
										</div>
										<Button
											size="sm"
											onClick={() => handleAddItem(item)}
											disabled={item.stock <= 0}
										>
											{item.stock <= 0 ? "Out of Stock" : "Add"}
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{searchTerm && inventory.length === 0 && !isLoading && (
						<div className="text-muted-foreground text-sm">
							No products found. Try a different search term.
						</div>
					)}

					{selectedItems.length > 0 && (
						<div className="mt-6 space-y-2">
							<div className="border-b pb-2 font-medium text-muted-foreground text-sm">
								Selected Items ({selectedItems.length})
							</div>
							<div className="space-y-3">
								{selectedItems.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div className="flex-1">
											<div className="font-medium">{item.name}</div>
											<div className="text-muted-foreground text-sm">
												{formatCurrency(item.price, "en")} Ã— {item.quantity}
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Input
												type="number"
												min="1"
												max="99"
												value={item.quantity}
												onChange={(e) =>
													handleQuantityChange(
														item.id,
														Number.parseInt(e.target.value) || 1,
													)
												}
												className="w-16 text-center"
											/>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleRemoveItem(item.id)}
											>
												Remove
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={selectedItems.length === 0 || isLoading}
					>
						{isLoading ? "Processing..." : "Add to Cart"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
