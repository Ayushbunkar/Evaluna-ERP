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
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

interface CheckoutDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	cart: Array<{
		id: number;
		name: string;
		price: number;
		cartQuantity: number;
	}>;
	customerId: number | null;
	onSuccess: () => void;
}

export function CheckoutDialog({
	open,
	onOpenChange,
	cart,
	customerId,
	onSuccess,
}: CheckoutDialogProps) {
	const trpc = useTRPC();
	const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mixed">(
		"cash",
	);
	const [cashAmount, setCashAmount] = useState("");
	const [change, setChange] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [notes, setNotes] = useState("");

	const subtotal = cart.reduce(
		(total, item) => total + item.price * item.cartQuantity,
		0,
	);
	const tax = subtotal * 0.1;
	const total = subtotal + tax;

	const calculateChange = () => {
		const amount = Number.parseFloat(cashAmount) || 0;
		return amount - total;
	};

	const handleCashAmountChange = (value: string) => {
		setCashAmount(value);
		setChange(calculateChange());
	};

	const handleSubmit = async () => {
		if (!customerId) {
			toast.error("Customer is required");
			return;
		}

		if (
			paymentMethod === "cash" &&
			(Number.parseFloat(cashAmount) || 0) < total
		) {
			toast.error("Insufficient cash amount");
			return;
		}

		setIsProcessing(true);
		try {
			await trpc.pos.createSale.mutate({
				customerId: customerId,
				items: cart.map((item) => ({
					productId: item.id,
					quantity: item.cartQuantity,
					unitPrice: item.price,
				})),
				paymentMethod,
				cashAmount:
					paymentMethod === "cash" ? Number.parseFloat(cashAmount) : undefined,
				notes,
			});

			toast.success("Sale completed successfully!");
			onSuccess();
			onOpenChange(false);
			resetForm();
		} catch (error) {
			console.error("Failed to create sale:", error);
			toast.error("Failed to complete sale");
		} finally {
			setIsProcessing(false);
		}
	};

	const resetForm = () => {
		setPaymentMethod("cash");
		setCashAmount("");
		setChange(0);
		setNotes("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Checkout</DialogTitle>
					<DialogDescription>
						Complete the sale and process payment
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Customer Info */}
					<div className="space-y-2">
						<Label>Customer</Label>
						<div className="rounded-lg border bg-muted p-3">
							{customerId ? "Customer selected" : "No customer selected"}
						</div>
					</div>

					{/* Payment Method */}
					<div className="space-y-2">
						<Label>Payment Method</Label>
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Input
									type="radio"
									id="cash"
									name="paymentMethod"
									checked={paymentMethod === "cash"}
									onChange={() => setPaymentMethod("cash")}
									className="h-4 w-4"
								/>
								<Label htmlFor="cash" className="cursor-pointer">
									Cash
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Input
									type="radio"
									id="card"
									name="paymentMethod"
									checked={paymentMethod === "card"}
									onChange={() => setPaymentMethod("card")}
									className="h-4 w-4"
								/>
								<Label htmlFor="card" className="cursor-pointer">
									Card
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Input
									type="radio"
									id="mixed"
									name="paymentMethod"
									checked={paymentMethod === "mixed"}
									onChange={() => setPaymentMethod("mixed")}
									className="h-4 w-4"
								/>
								<Label htmlFor="mixed" className="cursor-pointer">
									Mixed
								</Label>
							</div>
						</div>
					</div>

					{/* Cash Amount (if cash payment) */}
					{paymentMethod === "cash" && (
						<div className="space-y-2">
							<Label>Cash Amount</Label>
							<Input
								type="number"
								placeholder="Enter amount received"
								value={cashAmount}
								onChange={(e) => handleCashAmountChange(e.target.value)}
								min={total}
								step="0.01"
							/>
							{cashAmount && (
								<div className="text-muted-foreground text-sm">
									Change: {formatCurrency(change, "en")}
								</div>
							)}
						</div>
					)}

					{/* Notes */}
					<div className="space-y-2">
						<Label>Notes (Optional)</Label>
						<Input
							placeholder="Add any special instructions..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>

					{/* Order Summary */}
					<div className="space-y-2 rounded-lg border p-4">
						<div className="border-b pb-2 font-medium text-muted-foreground text-sm">
							Order Summary
						</div>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span>Subtotal:</span>
								<span>{formatCurrency(subtotal, "en")}</span>
							</div>
							<div className="flex justify-between">
								<span>Tax (10%):</span>
								<span>{formatCurrency(tax, "en")}</span>
							</div>
							<div className="flex justify-between font-bold text-lg">
								<span>Total:</span>
								<span>{formatCurrency(total, "en")}</span>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isProcessing}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isProcessing}>
						{isProcessing ? "Processing..." : "Complete Sale"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
