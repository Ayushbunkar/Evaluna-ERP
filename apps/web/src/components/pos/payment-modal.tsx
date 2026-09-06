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
import { useLocale } from "next-intl";

export function PaymentModal({
	open,
	onOpenChange,
	totalAmount = 0,
	onConfirm,
}: any) {
	const locale = useLocale();
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [shopName, setShopName] = useState("");

	// Hindi Translation dictionary
	const t = {
		title: locale === "hi" ? "भुगतान पूरा करें" : "Complete Payment",
		totalDue: locale === "hi" ? "कुल देय राशि" : "Total Due",
		custDetails: locale === "hi" ? "ग्राहक का विवरण" : "Customer Details",
		optional: locale === "hi" ? "(वैकल्पिक)" : "(optional)",
		custName: locale === "hi" ? "ग्राहक का नाम" : "Customer Name",
		custNamePlaceholder: locale === "hi" ? "जैसे: रमेश कुमार" : "e.g. Ramesh Kumar",
		phone: locale === "hi" ? "फ़ोन नंबर" : "Phone Number",
		shopName: locale === "hi" ? "दुकान / फर्म का नाम" : "Shop / Firm Name",
		shopPlaceholder: locale === "hi" ? "जैसे: शर्मा जनरल स्टोर" : "e.g. Sharma General Store",
		cancel: locale === "hi" ? "रद्द करें" : "Cancel",
		confirm: locale === "hi" ? "पुष्टि करें और प्रिंट करें" : "Confirm & Print",
	};

	// Reset when opened
	useEffect(() => {
		if (open) {
			setCustomerName("");
			setCustomerPhone("");
			setShopName("");
		}
	}, [open]);

	const handleConfirm = () => {
		const amountToPay = typeof totalAmount === "number" ? totalAmount : Number.parseFloat(totalAmount || "0");
		const payments = [{ methodId: 1, amount: amountToPay.toString() }];
		onConfirm(payments, {
			customerName: customerName.trim() || undefined,
			customerPhone: customerPhone.trim() || undefined,
			shopName: shopName.trim() || undefined,
		});
		onOpenChange(false);
	};

	const displayAmount = typeof totalAmount === "number" ? totalAmount : Number.parseFloat(totalAmount || "0");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[420px]">
				<DialogHeader>
					<DialogTitle className="text-2xl">{t.title}</DialogTitle>
				</DialogHeader>

				<div className="grid gap-6 py-4">
					{/* Total Due */}
					<div className="flex items-center justify-between rounded-lg bg-muted p-4">
						<span className="font-medium text-xl">{t.totalDue}</span>
						<span className="font-bold text-3xl">
							₹{displayAmount.toFixed(2)}
						</span>
					</div>

					{/* Customer Details */}
					<div className="space-y-4">
						<Label className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							{t.custDetails}{" "}
							<span className="font-normal text-xs normal-case">
								{t.optional}
							</span>
						</Label>

						<div className="space-y-3">
							<div className="space-y-1.5">
								<Label htmlFor="customerName">{t.custName}</Label>
								<Input
									id="customerName"
									placeholder={t.custNamePlaceholder}
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="customerPhone">{t.phone}</Label>
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
								<Label htmlFor="shopName">{t.shopName}</Label>
								<Input
									id="shopName"
									placeholder={t.shopPlaceholder}
									value={shopName}
									onChange={(e) => setShopName(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t.cancel}
					</Button>
					<Button size="lg" onClick={handleConfirm}>
						{t.confirm}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
