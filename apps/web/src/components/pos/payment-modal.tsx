"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentModal({
	open,
	onOpenChange,
	totalAmount,
	onConfirm,
}: any) {
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [shopName, setShopName] = useState("");

	// Reset when opened
	useEffect(() => {
		if (open) {
			setCustomerName("");
			setCustomerPhone("");
			setShopName("");
		}
	}, [open]);

	const handleConfirm = () => {
		// Always use Cash (methodId: 1) for full amount
		const payments = [{ methodId: 1, amount: totalAmount.toString() }];
		onConfirm(payments, {
			customerName: customerName.trim() || undefined,
			customerPhone: customerPhone.trim() || undefined,
			shopName: shopName.trim() || undefined,
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[420px]">
				<DialogHeader>
					<DialogTitle className="text-2xl">Complete Payment</DialogTitle>
				</DialogHeader>

				<div className="grid gap-6 py-4">
					{/* Total Due */}
					<div className="flex items-center justify-between rounded-lg bg-muted p-4">
						<span className="font-medium text-xl">Total Due</span>
						<span className="font-bold text-3xl">
							₹{totalAmount.toFixed(2)}
						</span>
					</div>

					{/* Customer Details */}
					<div className="space-y-4">
						<Label className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Customer Details{" "}
							<span className="font-normal text-xs normal-case">
								(optional)
							</span>
						</Label>

						<div className="space-y-3">
							<div className="space-y-1.5">
								<Label htmlFor="customerName">Customer Name</Label>
								<Input
									id="customerName"
									placeholder="e.g. Ramesh Kumar"
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="customerPhone">Phone Number</Label>
								<Input
									id="customerPhone"
									placeholder="e.g. 9876543210"
									type="tel"
									maxLength={10}
									value={customerPhone}
									onChange={(e) =>
										setCustomerPhone(e.target.value.replace(/\D/g, ""))
									}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="shopName">Shop / Firm Name</Label>
								<Input
									id="shopName"
									placeholder="e.g. Sharma General Store"
									value={shopName}
									onChange={(e) => setShopName(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button size="lg" onClick={handleConfirm}>
						Confirm &amp; Print
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
