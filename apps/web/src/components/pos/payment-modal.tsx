"use client";

import {
	CheckCircle2Icon,
	Edit3Icon,
	HistoryIcon,
	MapPinIcon,
	PhoneIcon,
	PlusIcon,
	RouteIcon,
	SaveIcon,
	SearchIcon,
	UserIcon,
	UserPlusIcon,
	XIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
	onAddItemsToCart,
	isInitialSelection = false,
	initialCustomerDetails,
	onConfirmCustomer,
}: any) {
	const locale = useLocale();
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const { data: customerList = [] } = trpc.customers.list.useQuery(undefined, {
		enabled: open,
	});

	const { data: routes = [] } = trpc.delivery.listRoutes.useQuery(
		{},
		{ enabled: open },
	);

	const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
		initialCustomerDetails?.customerId || null,
	);
	const [customerName, setCustomerName] = useState(
		initialCustomerDetails?.customerName || "",
	);
	const [customerPhone, setCustomerPhone] = useState(
		initialCustomerDetails?.customerPhone || "",
	);
	const [shopName, setShopName] = useState(
		initialCustomerDetails?.shopName || initialCustomerDetails?.address || "",
	);
	const [selectedRouteId, setSelectedRouteId] = useState<number | null>(
		initialCustomerDetails?.routeId || null,
	);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isEditingCustomer, setIsEditingCustomer] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Fetch customer history & assigned route when a customer is selected
	const { data: fullCustomerDetails } = trpc.customers.getById.useQuery(
		{ id: selectedCustomerId ?? 0 },
		{ enabled: !!selectedCustomerId && open },
	);

	// Mutations
	const createCustomerMutation = trpc.customers.create.useMutation({
		onSuccess: (newCust) => {
			toast.success(
				locale === "hi"
					? "नया ग्राहक डेटाबेस में सफलतापूर्वक सहेजा गया!"
					: "New customer saved to database successfully!",
			);
			setSelectedCustomerId(newCust.id);
			setCustomerName(newCust.name);
			setCustomerPhone(newCust.phone || "");
			setShopName(newCust.address || "");
			if (newCust.route_id) setSelectedRouteId(newCust.route_id);
			setIsEditingCustomer(false);
			utils.customers.list.invalidate();
			utils.customers.getById.invalidate({ id: newCust.id });
		},
		onError: (err) => {
			toast.error(`Failed to save customer: ${err.message}`);
		},
	});

	const updateCustomerMutation = trpc.customers.update.useMutation({
		onSuccess: (updatedCust) => {
			toast.success(
				locale === "hi"
					? "ग्राहक विवरण अपडेट कर दिया गया!"
					: "Customer details updated successfully!",
			);
			setIsEditingCustomer(false);
			utils.customers.list.invalidate();
			if (selectedCustomerId) {
				utils.customers.getById.invalidate({ id: selectedCustomerId });
			}
		},
		onError: (err) => {
			toast.error(`Failed to update customer: ${err.message}`);
		},
	});

	// Sync route when full details load
	useEffect(() => {
		if (fullCustomerDetails?.customer) {
			const cust = fullCustomerDetails.customer;
			if (cust.route_id && !selectedRouteId) {
				setSelectedRouteId(cust.route_id);
			}
		}
	}, [fullCustomerDetails, selectedRouteId]);

	// Hindi Translation dictionary
	const t = {
		title: isInitialSelection
			? (locale === "hi" ? "नया बिल - ग्राहक एवं रूट चयन" : "New Order - Select Customer & Route")
			: (locale === "hi" ? "भुगतान एवं ग्राहक चयन" : "Customer & Payment Selection"),
		totalDue: locale === "hi" ? "कुल देय राशि" : "Total Due",
		custDetails: locale === "hi" ? "ग्राहक विवरण" : "Customer Details",
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
		routeSelect: locale === "hi" ? "डिलीवरी रूट (Route Selection)" : "Delivery Route Selection",
		routePlaceholder: locale === "hi" ? "-- रूट चुनें --" : "-- Select Route --",
		cancel: locale === "hi" ? "रद्द करें" : "Cancel",
		confirm: isInitialSelection
			? (locale === "hi" ? "पुष्टि करें और बिक्री शुरू करें" : "Confirm & Start Sale")
			: (locale === "hi" ? "पुष्टि करें और प्रिंट करें" : "Confirm & Print"),
		linked: locale === "hi" ? "डेटाबेस ग्राहक लिंक" : "Database Customer Linked",
		unlink: locale === "hi" ? "हटाएं" : "Unlink",
		selectCustomer: locale === "hi" ? "ग्राहक चुनें" : "Select Customer",
		editCustomer: locale === "hi" ? "विवरण बदलें" : "Edit Details",
		saveChanges: locale === "hi" ? "डेटाबेस में सेव करें" : "Save to Database",
		saveNewCustomer: locale === "hi" ? "+ नया ग्राहक सेव करें" : "+ Save New Customer",
		lastItemsTitle: locale === "hi" ? "पिछली खरीदी सामान (Last Purchased Items)" : "Last Purchased Items",
		addAllItems: locale === "hi" ? "+ सभी कार्ट में जोड़ें" : "+ Add All to Cart",
		addItem: locale === "hi" ? "+ जोड़ें" : "+ Add",
		walkIn: locale === "hi" ? "वाक-इन ग्राहक (Walk-in Customer)" : "Walk-in Customer",
	};

	// Reset when opened if no initial values provided
	useEffect(() => {
		if (open) {
			if (initialCustomerDetails) {
				setSelectedCustomerId(initialCustomerDetails.customerId || null);
				setCustomerName(initialCustomerDetails.customerName || "");
				setCustomerPhone(initialCustomerDetails.customerPhone || "");
				setShopName(initialCustomerDetails.shopName || initialCustomerDetails.address || "");
				setSelectedRouteId(initialCustomerDetails.routeId || null);
			} else if (!isInitialSelection) {
				setSelectedCustomerId(null);
				setCustomerName("");
				setCustomerPhone("");
				setShopName("");
				setSelectedRouteId(null);
			}
			setIsSearchOpen(false);
			setIsEditingCustomer(false);
		}
	}, [open, initialCustomerDetails, isInitialSelection]);

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
		setSelectedRouteId(null);
		setIsSearchOpen(false);
		setIsEditingCustomer(false);
	};

	const handleUnlink = () => {
		setSelectedCustomerId(null);
		setCustomerName("");
		setCustomerPhone("");
		setShopName("");
		setSelectedRouteId(null);
		setIsEditingCustomer(false);
	};

	const handleWalkIn = () => {
		setSelectedCustomerId(null);
		setCustomerName("Walk-in Customer");
		setCustomerPhone("");
		setShopName("");
		setSelectedRouteId(null);
		const customerObj = {
			customerId: undefined,
			customerName: "Walk-in Customer",
			customerPhone: undefined,
			shopName: undefined,
			address: undefined,
			routeId: undefined,
			routeName: undefined,
		};
		if (onConfirmCustomer) {
			onConfirmCustomer(customerObj);
		} else if (onConfirm) {
			onConfirm([{ methodId: 1, amount: totalAmount.toString() }], customerObj);
		}
		onOpenChange(false);
	};

	const handleSaveNewCustomer = () => {
		if (!customerName.trim()) {
			toast.error(locale === "hi" ? "कृपया ग्राहक का नाम दर्ज करें" : "Please enter customer name");
			return;
		}
		createCustomerMutation.mutate({
			name: customerName.trim(),
			phone: customerPhone.trim() || undefined,
			address: shopName.trim() || undefined,
			route_id: selectedRouteId || undefined,
		});
	};

	const handleSaveUpdateCustomer = () => {
		if (!selectedCustomerId || !customerName.trim()) return;
		updateCustomerMutation.mutate({
			id: selectedCustomerId,
			name: customerName.trim(),
			phone: customerPhone.trim() || undefined,
			address: shopName.trim() || undefined,
			route_id: selectedRouteId || undefined,
		});
	};

	const handleConfirm = () => {
		const isWalkIn = customerName.trim().toLowerCase() === "walk-in customer";
		
		// If user typed a new customer name (not walk-in) and hasn't saved to DB / selected from DB
		if (!selectedCustomerId && customerName.trim() && !isWalkIn) {
			toast.error(
				locale === "hi"
					? "कृपया नए ग्राहक को डेटाबेस में सेव करने के लिए '+ Save New Customer' बटन पर क्लिक करें"
					: "Please click '+ Save New Customer' to save the customer to database before proceeding",
			);
			return;
		}

		const amountToPay =
			typeof totalAmount === "number"
				? totalAmount
				: Number.parseFloat(totalAmount || "0");
		const payments = [{ methodId: 1, amount: amountToPay.toString() }];

		const selectedRoute = routes.find((r: any) => r.id === selectedRouteId);
		const customerObj = {
			customerId: selectedCustomerId || undefined,
			customerName: customerName.trim() || undefined,
			customerPhone: customerPhone.trim() || undefined,
			shopName: shopName.trim() || undefined,
			address: shopName.trim() || undefined,
			routeId: selectedRouteId || undefined,
			routeName: selectedRoute?.name || undefined,
		};

		if (onConfirmCustomer) {
			onConfirmCustomer(customerObj);
		} else if (onConfirm) {
			onConfirm(payments, customerObj);
		}
		onOpenChange(false);
	};

	const displayAmount =
		typeof totalAmount === "number"
			? totalAmount
			: Number.parseFloat(totalAmount || "0");

	const lastOrderItems = fullCustomerDetails?.lastOrderItems || [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold flex items-center justify-between">
						<span className="flex items-center gap-2">
							<UserIcon className="h-5 w-5 text-emerald-600" />
							{t.title}
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleWalkIn}
							className="text-xs font-semibold text-muted-foreground hover:text-foreground"
						>
							{t.walkIn}
						</Button>
					</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 py-2">
					{/* Total Due Card */}
					{!isInitialSelection && (
						<div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3.5 border border-emerald-500/20">
							<div>
								<span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block">
									{t.totalDue}
								</span>
								<span className="font-extrabold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
									₹{displayAmount.toFixed(2)}
								</span>
							</div>
							{selectedCustomerId && (
								<Badge
									variant="outline"
									className="flex items-center gap-1.5 border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
								>
									<CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
									{t.linked}
									<button
										type="button"
										onClick={handleUnlink}
										className="ml-1 text-muted-foreground hover:text-destructive"
									>
										<XIcon className="h-3.5 w-3.5" />
									</button>
								</Badge>
							)}
						</div>
					)}

					{/* Customer Details Form */}
					<div className="space-y-3.5 rounded-xl border bg-card p-3.5">
						<div className="flex items-center justify-between">
							<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
								<UserIcon className="h-3.5 w-3.5 text-primary" />
								{t.custDetails}{" "}
								<span className="font-normal text-xs normal-case text-muted-foreground">
									{t.optional}
								</span>
							</Label>

							{selectedCustomerId && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setIsEditingCustomer(!isEditingCustomer)}
									className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary/80"
								>
									<Edit3Icon className="mr-1 h-3 w-3" />
									{isEditingCustomer ? (locale === "hi" ? "संपादन रद्द" : "Cancel Edit") : t.editCustomer}
								</Button>
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
											if (selectedCustomerId) {
												setIsEditingCustomer(true);
											} else {
												setIsSearchOpen(true);
											}
										}}
										onFocus={() => {
											if (!selectedCustomerId && customerName.trim().length > 0) {
												setIsSearchOpen(true);
											}
										}}
										className="pr-8 text-xs sm:text-sm"
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
									onChange={(e) => {
										setCustomerPhone(e.target.value);
										if (selectedCustomerId) setIsEditingCustomer(true);
									}}
									className="text-xs sm:text-sm"
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
									onChange={(e) => {
										setShopName(e.target.value);
										if (selectedCustomerId) setIsEditingCustomer(true);
									}}
									className="text-xs sm:text-sm"
								/>
							</div>

							{/* Delivery Route Selection Dropdown */}
							<div className="space-y-1.5">
								<Label htmlFor="routeSelect" className="text-xs font-medium flex items-center justify-between">
									<span className="flex items-center gap-1.5">
										<RouteIcon className="h-3.5 w-3.5 text-amber-500" />
										{t.routeSelect}
									</span>
									{selectedRouteId && (
										<span className="text-[10px] text-muted-foreground font-normal">
											{routes.find((r: any) => r.id === selectedRouteId)?.stops?.length || 0} stops
										</span>
									)}
								</Label>
								<select
									id="routeSelect"
									value={selectedRouteId || ""}
									onChange={(e) => {
										const val = e.target.value ? Number(e.target.value) : null;
										setSelectedRouteId(val);
										if (selectedCustomerId) setIsEditingCustomer(true);
									}}
									className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
								>
									<option value="">{t.routePlaceholder}</option>
									{routes.map((r: any) => {
										const stopCount = r.stops?.length || 0;
										let villageCount = 0;
										if (r.description) {
											const vParts = r.description.split(/→|->/).map((v: string) => v.trim()).filter(Boolean);
											if (vParts.length > 0) villageCount = vParts.length;
										}
										if (!villageCount && r.stops) {
											const seenV = new Set<string>();
											for (const s of r.stops) {
												const v = (s.customer?.address || "").split(",")[0]?.trim();
												if (v && !["madhya pradesh", "mp", "india"].includes(v.toLowerCase())) {
													seenV.add(v.toLowerCase());
												}
											}
											villageCount = seenV.size;
										}

										const labelSuffix = stopCount > 0
											? villageCount > 0 && villageCount !== stopCount
												? ` (${stopCount} Shops across ${villageCount} Villages)`
												: ` (${stopCount} ${stopCount === 1 ? 'Stop' : 'Stops'})`
											: '';

										return (
											<option key={r.id} value={r.id}>
												{r.name}{labelSuffix}
											</option>
										);
									})}
								</select>
							</div>

							{/* Villages covered in selected route */}
							{selectedRouteId && (
								<div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-50/40 p-3 dark:bg-emerald-950/20">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
											<MapPinIcon className="h-3.5 w-3.5 text-emerald-600" />
											{locale === "hi"
												? "रूट के सभी गाँव (चुनने के लिए क्लिक करें):"
												: "All Villages in Route (Click to select):"}
										</span>
									</div>
									<div className="flex flex-wrap gap-1.5 pt-0.5">
										{(() => {
											const activeRouteObj = routes.find(
												(r: any) => r.id === selectedRouteId,
											);
											const villagesSet = new Set<string>();
											if (activeRouteObj?.description) {
												const parts = activeRouteObj.description.split(/→|->/).map((v: string) => v.trim()).filter(Boolean);
												for (const p of parts) {
													if (p && !["madhya pradesh", "mp", "india"].includes(p.toLowerCase())) {
														villagesSet.add(p);
													}
												}
											}
											if (villagesSet.size === 0 && activeRouteObj?.stops) {
												for (const s of activeRouteObj.stops) {
													const addr = s.customer?.address || s.notes;
													if (addr && addr.trim()) {
														const villageName = addr.split(",")[0]?.trim();
														if (villageName && !["madhya pradesh", "mp", "india"].includes(villageName.toLowerCase())) {
															villagesSet.add(villageName);
														}
													}
												}
											}
											const villages = Array.from(villagesSet);
											if (villages.length === 0) {
												return (
													<span className="text-[11px] text-muted-foreground italic">
														{locale === "hi"
															? "इस रूट में गाँव सूची नहीं है"
															: "No listed stops for this route"}
													</span>
												);
											}
											return villages.map((v: string) => {
												const isSelected = shopName
													?.toLowerCase()
													.includes(v.toLowerCase());
												return (
													<button
														key={v}
														type="button"
														onClick={() => {
															setShopName(v);
															if (selectedCustomerId) setIsEditingCustomer(true);
															toast.info(
																locale === "hi"
																	? `गाँव चुना गया: ${v}`
																	: `Selected Village: ${v}`,
															);
														}}
														className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all border ${
															isSelected
																? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
																: "bg-background text-foreground border-border hover:bg-emerald-50 hover:border-emerald-500/50 dark:hover:bg-emerald-950/50"
														}`}
													>
														<MapPinIcon
															className={`h-3 w-3 ${
																isSelected ? "text-white" : "text-emerald-600"
															}`}
														/>
														{v}
													</button>
												);
											});
										})()}
									</div>
								</div>
							)}

							{/* DB Action Buttons */}
							{selectedCustomerId && isEditingCustomer && (
								<Button
									type="button"
									size="sm"
									onClick={handleSaveUpdateCustomer}
									disabled={updateCustomerMutation.isPending}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs mt-1"
								>
									<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
									{updateCustomerMutation.isPending ? "Updating..." : t.saveChanges}
								</Button>
							)}

							{!selectedCustomerId && customerName.trim().length > 0 && (
								<Button
									type="button"
									size="sm"
									variant="secondary"
									onClick={handleSaveNewCustomer}
									disabled={createCustomerMutation.isPending}
									className="w-full border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-xs mt-1"
								>
									<UserPlusIcon className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
									{createCustomerMutation.isPending ? "Saving..." : t.saveNewCustomer}
								</Button>
							)}
						</div>
					</div>

					{/* Previous Purchased Items Section */}
					{selectedCustomerId && lastOrderItems.length > 0 && (
						<div className="rounded-xl border bg-muted/30 p-3 space-y-2">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
									<HistoryIcon className="h-3.5 w-3.5 text-amber-500" />
									{t.lastItemsTitle} ({lastOrderItems.length})
								</span>

								{onAddItemsToCart && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => onAddItemsToCart(lastOrderItems)}
										className="h-6 text-[11px] font-semibold text-emerald-700 border-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
									>
										<PlusIcon className="mr-1 h-3 w-3" />
										{t.addAllItems}
									</Button>
								)}
							</div>

							<div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
								{lastOrderItems.map((item: any) => (
									<div
										key={item.id}
										className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs shadow-2xs"
									>
										<span className="font-medium text-foreground truncate max-w-[140px]">
											{item.name}
										</span>
										<span className="font-semibold text-emerald-600">
											₹{item.price}
										</span>
										{onAddItemsToCart && (
											<button
												type="button"
												onClick={() => onAddItemsToCart([item])}
												className="ml-1 text-emerald-600 hover:text-emerald-800 font-bold"
												title="Add to cart"
											>
												<PlusIcon className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Dialog Footer */}
				<div className="flex justify-end gap-3 pt-2 border-t">
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

