"use client";

import {
	CheckCircle2Icon,
	MapPinIcon,
	PhoneIcon,
	SearchIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/lib/trpc/client";

interface CustomerOption {
	id: number;
	name: string;
	phone?: string | null;
	address?: string | null;
	customer_code?: string | null;
}

export function PaymentModal({
	open,
	onOpenChange,
	totalAmount = 0,
	onConfirm,
}: any) {
	const locale = useLocale();
	const trpc = useTRPC();
	const { data: customerList = [] } = trpc.customers.list.useQuery(undefined, {
		enabled: open,
	});

	const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
		null,
	);
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [shopName, setShopName] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Hindi Translation dictionary
	const t = {
		title: locale === "hi" ? "भुगतान पूरा करें" : "Complete Payment",
		totalDue: locale === "hi" ? "कुल देय राशि" : "Total Due",
		custDetails: locale === "hi" ? "ग्राहक का विवरण" : "Customer Details",
		optional: locale === "hi" ? "(वैकल्पिक)" : "(optional)",
		custName: locale === "hi" ? "ग्राहक का नाम / खोजें" : "Customer Name / Search",
		custNamePlaceholder:
			locale === "hi"
				? "नाम, फ़ोन या गाँव से खोजें…"
				: "Type name, phone or village to search…",
		phone: locale === "hi" ? "फ़ोन नंबर" : "Phone Number",
		phonePlaceholder: locale === "hi" ? "फ़ोन नंबर" : "e.g. 9876543210",
		shopName: locale === "hi" ? "गाँव / दुकान / पता" : "Village / Shop / Address",
		shopPlaceholder:
			locale === "hi"
				? "जैसे: बरखेड़ा बरोदी, मध्य प्रदेश"
				: "e.g. BARKHEDA BARODI / Sharma Store",
		cancel: locale === "hi" ? "रद्द करें" : "Cancel",
		confirm: locale === "hi" ? "पुष्टि करें और प्रिंट करें" : "Confirm & Print",
		linked: locale === "hi" ? "डेटाबेस ग्राहक लिंक किया गया" : "Database Customer Linked",
		unlink: locale === "hi" ? "हटाएं" : "Unlink",
		selectCustomer: locale === "hi" ? "ग्राहक चुनें" : "Select Customer",
		noResults: locale === "hi" ? "कोई ग्राहक नहीं मिला (नया ग्राहक दर्ज करें)" : "No existing customer found (type new)",
	};

	// Reset when opened
	useEffect(() => {
		if (open) {
			setSelectedCustomerId(null);
			setCustomerName("");
			setCustomerPhone("");
			setShopName("");
			setIsSearchOpen(false);
		}
	}, [open]);

	// Filter customers for autocomplete
	const filteredCustomers = useMemo(() => {
		if (!customerName.trim()) return [];
		const q = customerName.toLowerCase().trim();
		const digits = q.replace(/[^0-9]/g, "");

		return (customerList as CustomerOption[])
			.filter((c) => {
				const nameMatch = c.name?.toLowerCase().includes(q);
				const phoneMatch =
					digits.length > 0 &&
					c.phone &&
					c.phone.replace(/[^0-9]/g, "").includes(digits);
				const addrMatch = c.address?.toLowerCase().includes(q);
				const codeMatch = c.customer_code?.toLowerCase().includes(q);
				return nameMatch || phoneMatch || addrMatch || codeMatch;
			})
			.slice(0, 8);
	}, [customerList, customerName]);

	const handleSelectCustomer = (c: CustomerOption) => {
		setSelectedCustomerId(c.id);
		setCustomerName(c.name);
		setCustomerPhone(c.phone || "");
		setShopName(c.address || "");
		setIsSearchOpen(false);
	};

	const handleUnlink = () => {
		setSelectedCustomerId(null);
		setCustomerName("");
		setCustomerPhone("");
		setShopName("");
	};

	const handleConfirm = () => {
		const amountToPay =
			typeof totalAmount === "number"
				? totalAmount
				: Number.parseFloat(totalAmount || "0");
		const payments = [{ methodId: 1, amount: amountToPay.toString() }];
		onConfirm(payments, {
			customerId: selectedCustomerId || undefined,
			customerName: customerName.trim() || undefined,
			customerPhone: customerPhone.trim() || undefined,
			shopName: shopName.trim() || undefined,
			address: shopName.trim() || undefined,
		});
		onOpenChange(false);
	};

	const displayAmount =
		typeof totalAmount === "number"
			? totalAmount
			: Number.parseFloat(totalAmount || "0");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader>
					<DialogTitle className="text-2xl">{t.title}</DialogTitle>
				</DialogHeader>

				<div className="grid gap-5 py-3">
					{/* Total Due */}
					<div className="flex items-center justify-between rounded-lg bg-muted/80 p-4">
						<span className="font-medium text-lg">{t.totalDue}</span>
						<span className="font-bold text-3xl text-emerald-600">
							₹{displayAmount.toFixed(2)}
						</span>
					</div>

					{/* Customer Details */}
					<div className="space-y-3.5">
						<div className="flex items-center justify-between">
							<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								{t.custDetails}{" "}
								<span className="font-normal text-xs normal-case">
									{t.optional}
								</span>
							</Label>
							{selectedCustomerId && (
								<Badge
									variant="outline"
									className="flex items-center gap-1 border-emerald-500/30 bg-emerald-50 text-[11px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
								>
									<CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
									{t.linked}
									<button
										type="button"
										onClick={handleUnlink}
										className="ml-1 text-muted-foreground hover:text-destructive"
									>
										<XIcon className="h-3 w-3" />
									</button>
								</Badge>
							)}
						</div>

						<div className="space-y-3">
							{/* Customer Name with Autocomplete */}
							<div className="relative space-y-1.5" ref={dropdownRef}>
								<Label htmlFor="customerName" className="text-xs font-medium">
									{t.custName}
								</Label>
								<div className="relative">
									<Input
										id="customerName"
										placeholder={t.custNamePlaceholder}
										value={customerName}
										autoComplete="off"
										onChange={(e) => {
											setCustomerName(e.target.value);
											setSelectedCustomerId(null);
											setIsSearchOpen(true);
										}}
										onFocus={() => {
											if (customerName.trim().length > 0) {
												setIsSearchOpen(true);
											}
										}}
										className="pr-8"
									/>
									<SearchIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
								</div>

								{/* Autocomplete Dropdown List */}
								{isSearchOpen && filteredCustomers.length > 0 && (
									<div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
										<p className="px-2 py-1 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
											{t.selectCustomer} ({filteredCustomers.length}):
										</p>
										{filteredCustomers.map((c) => (
											<button
												key={c.id}
												type="button"
												onClick={() => handleSelectCustomer(c)}
												className="flex w-full flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
											>
												<div className="flex items-center justify-between font-semibold text-foreground">
													<span className="flex items-center gap-1.5 truncate">
														<UserIcon className="h-3.5 w-3.5 text-primary shrink-0" />
														{c.name}
													</span>
													{c.customer_code && (
														<span className="font-mono text-[10px] text-muted-foreground">
															{c.customer_code}
														</span>
													)}
												</div>
												<div className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
													{c.phone && (
														<span className="flex items-center gap-1">
															<PhoneIcon className="h-3 w-3 text-emerald-600" />
															{c.phone}
														</span>
													)}
													{c.address && (
														<span className="flex items-center gap-1 truncate">
															<MapPinIcon className="h-3 w-3 text-blue-500 shrink-0" />
															{c.address}
														</span>
													)}
												</div>
											</button>
										))}
									</div>
								)}
							</div>

							{/* Phone Number Field */}
							<div className="space-y-1.5">
								<Label htmlFor="customerPhone" className="text-xs font-medium">
									{t.phone}
								</Label>
								<Input
									id="customerPhone"
									placeholder={t.phonePlaceholder}
									value={customerPhone}
									onChange={(e) => setCustomerPhone(e.target.value)}
								/>
							</div>

							{/* Village / Shop / Address Field */}
							<div className="space-y-1.5">
								<Label htmlFor="shopName" className="text-xs font-medium">
									{t.shopName}
								</Label>
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

				<div className="flex justify-end gap-3 pt-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t.cancel}
					</Button>
					<Button
						size="lg"
						onClick={handleConfirm}
						className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
					>
						{t.confirm}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
