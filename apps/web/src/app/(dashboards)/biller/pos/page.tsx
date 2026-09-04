"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { BarcodeIcon, CameraIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { AddCustomerDialog } from "./add-customer-dialog";
import { CheckoutDialog } from "./checkout-dialog";
import { InventorySearchDialog } from "./inventory-search-dialog";

export default function BillerPOSPage() {
	const trpc = useTRPC();
	const [showCustomerDialog, setShowCustomerDialog] = useState(false);
	const [showInventoryDialog, setShowInventoryDialog] = useState(false);
	const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
	const [showCameraScanner, setShowCameraScanner] = useState(false);
	const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
	const [barcodeInput, setBarcodeInput] = useState("");

	const [customer, setCustomer] = useState<{ id: number; name: string } | null>(
		null,
	);
	const [cart, setCart] = useState<
		Array<{
			id: number;
			name: string;
			price: number;
			cartQuantity: number;
		}>
	>([]);

	const handleCustomerSelected = (id: number, name: string) => {
		setCustomer({ id, name });
		setShowCustomerDialog(false);
	};

	const handleAddToCart = (
		items: Array<{
			id: number;
			name: string;
			price: number;
			quantity: number;
		}>,
	) => {
		setCart((prev) => {
			const newCart = [...prev];
			items.forEach((item) => {
				const existingItem = newCart.find((i) => i.id === item.id);
				if (existingItem) {
					existingItem.cartQuantity += item.quantity;
				} else {
					newCart.push({
						id: item.id,
						name: item.name,
						price: item.price,
						cartQuantity: item.quantity,
					});
				}
			});
			return newCart;
		});
		setShowInventoryDialog(false);
	};

	const handleCameraScanBarcode = async (scannedBarcode: string) => {
		setIsSearchingBarcode(true);
		try {
			const data = await trpc.pos.inventory.query({
				search: scannedBarcode,
				limit: 10,
			});

			if (data && data.length > 0) {
				const product =
					data.find((p) => p.barcode === scannedBarcode) || data[0];
				handleAddToCart([
					{
						id: product.id,
						name: product.name,
						price: Number(product.price) || 0,
						quantity: 1,
					},
				]);
				toast.success(`Added ${product.name} to cart!`);
			} else {
				toast.error(`No product found matching barcode: ${scannedBarcode}`);
			}
		} catch (err) {
			console.error("Error scanning barcode product:", err);
			toast.error("Failed to query product by barcode");
		} finally {
			setIsSearchingBarcode(false);
		}
	};

	const handleManualBarcodeSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!barcodeInput.trim()) return;
		handleCameraScanBarcode(barcodeInput.trim());
		setBarcodeInput("");
	};

	const handleRemoveFromCart = (id: number) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	};

	const handleQuantityChange = (id: number, quantity: number) => {
		setCart((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, cartQuantity: quantity } : item,
			),
		);
	};

	const subtotal = cart.reduce(
		(total, item) => total + item.price * item.cartQuantity,
		0,
	);
	const tax = subtotal * 0.1;
	const total = subtotal + tax;

	const handleSaleComplete = () => {
		setCart([]);
		setCustomer(null);
	};

	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Billing & POS Terminal
					</h1>
					<p className="text-muted-foreground text-sm">
						Point of sale checkout terminal with camera barcode scanning &
						customer billing
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						className="gap-2 bg-blue-600 text-white shadow-md hover:bg-blue-700"
						onClick={() => setShowCameraScanner(true)}
					>
						<CameraIcon className="h-4 w-4" /> Scan Barcode with Camera
					</Button>
				</div>
			</div>

			{/* Quick Barcode Scan Bar */}
			<form onSubmit={handleManualBarcodeSubmit} className="flex gap-2">
				<div className="relative flex-1">
					<BarcodeIcon className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Scan barcode or type EAN/SKU number for instant billing..."
						className="pl-9 text-sm"
						value={barcodeInput}
						onChange={(e) => setBarcodeInput(e.target.value)}
					/>
				</div>
				<Button type="submit" disabled={isSearchingBarcode} variant="secondary">
					{isSearchingBarcode ? (
						<Loader2Icon className="h-4 w-4 animate-spin" />
					) : (
						"Scan Item"
					)}
				</Button>
			</form>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Customer Section */}
				<Card className="border-border/50 shadow-sm lg:col-span-1">
					<CardHeader>
						<CardTitle>Customer Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{customer ? (
								<div className="rounded-lg border bg-muted/30 p-4">
									<div className="font-semibold text-base">{customer.name}</div>
									<div className="mt-0.5 text-muted-foreground text-xs">
										ID: #{customer.id}
									</div>
									<Button
										variant="outline"
										size="sm"
										className="mt-3"
										onClick={() => setCustomer(null)}
									>
										Change Customer
									</Button>
								</div>
							) : (
								<Button
									className="w-full bg-blue-600 text-white hover:bg-blue-700"
									onClick={() => setShowCustomerDialog(true)}
								>
									Select / Add Customer
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Cart Section */}
				<Card className="border-border/50 shadow-sm lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-lg">
							Cart ({cart.length} items)
						</CardTitle>
						<div className="font-bold text-blue-600 text-xl dark:text-blue-400">
							{formatCurrency(total, "en")}
						</div>
					</CardHeader>
					<CardContent>
						{cart.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
								<BarcodeIcon className="h-10 w-10 text-blue-500 opacity-30" />
								<p className="font-medium text-base">
									Your billing cart is empty
								</p>
								<p className="text-muted-foreground text-xs">
									Scan item barcode using phone camera or click Add Items below
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{cart.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30"
									>
										<div className="flex-1">
											<div className="font-semibold text-base">{item.name}</div>
											<div className="mt-0.5 text-muted-foreground text-xs">
												{formatCurrency(item.price, "en")} × {item.cartQuantity}
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Input
												type="number"
												min="1"
												max="99"
												value={item.cartQuantity}
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
												onClick={() => handleRemoveFromCart(item.id)}
											>
												Remove
											</Button>
										</div>
									</div>
								))}

								<div className="space-y-2 border-t pt-4">
									<div className="flex justify-between text-sm">
										<span>Subtotal:</span>
										<span className="font-medium">
											{formatCurrency(subtotal, "en")}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>Tax (10%):</span>
										<span className="font-medium">
											{formatCurrency(tax, "en")}
										</span>
									</div>
									<div className="flex justify-between border-t pt-2 font-bold text-lg">
										<span>Total Payable:</span>
										<span className="text-blue-600 dark:text-blue-400">
											{formatCurrency(total, "en")}
										</span>
									</div>
								</div>

								<Button
									className="mt-4 w-full bg-green-600 text-base text-white shadow-md hover:bg-green-700"
									size="lg"
									onClick={() => setShowCheckoutDialog(true)}
									disabled={!customer}
								>
									{!customer
										? "Select Customer to Checkout"
										: "Proceed to Checkout & Pay"}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-between gap-4">
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setShowInventoryDialog(true)}
					>
						Search Inventory Catalog
					</Button>
					<Button
						variant="outline"
						className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
						onClick={() => setShowCameraScanner(true)}
					>
						<CameraIcon className="h-4 w-4" /> Phone Camera Scanner
					</Button>
				</div>

				<Button
					variant="outline"
					className="border-destructive/30 text-destructive"
					onClick={() => {
						setCart([]);
						setCustomer(null);
					}}
				>
					Clear Cart
				</Button>
			</div>

			{/* Dialogs */}
			<AddCustomerDialog
				open={showCustomerDialog}
				onOpenChange={setShowCustomerDialog}
				onCustomerSelected={handleCustomerSelected}
			/>

			<InventorySearchDialog
				open={showInventoryDialog}
				onOpenChange={setShowInventoryDialog}
				onConfirm={handleAddToCart}
			/>

			<CheckoutDialog
				open={showCheckoutDialog}
				onOpenChange={setShowCheckoutDialog}
				cart={cart}
				customerId={customer?.id || null}
				onSuccess={handleSaleComplete}
			/>

			{/* Phone/Webcam Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={handleCameraScanBarcode}
				title="POS Camera Barcode Scanner"
				description="Point your phone or webcam camera at product barcode tags to add items directly to POS cart."
			/>
		</div>
	);
}
