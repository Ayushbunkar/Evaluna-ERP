"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertCircle,
	Camera,
	CheckCircle2,
	FileText,
	Loader2,
	MapPin,
	Package,
	Phone,
	Printer,
	QrCode,
	RotateCcw,
	Search,
	ShieldCheck,
	Tag,
	Truck,
	User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { AnimatedCard, PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverScannerPage() {
	const trpc = useTRPC();
	const [scannedCode, setScannedCode] = useState<string>("");
	const [inputCode, setInputCode] = useState<string>("");
	const [scannerOpen, setScannerOpen] = useState<boolean>(false);

	const {
		data: result,
		isLoading,
		isError,
		error,
		refetch,
	} = trpc.driver.lookupOrderByScan.useQuery(
		{ code: scannedCode },
		{
			enabled: scannedCode.length > 0,
			retry: false,
		},
	);

	const handleScanSuccess = (barcode: string) => {
		const clean = barcode.trim();
		if (clean) {
			setScannedCode(clean);
			setInputCode(clean);
			setScannerOpen(false);
		}
	};

	const handleManualSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const clean = inputCode.trim();
		if (clean) {
			setScannedCode(clean);
		}
	};

	const handleReset = () => {
		setScannedCode("");
		setInputCode("");
	};

	const handlePrintReceipt = () => {
		window.print();
	};

	return (
		<PageTransition className="container mx-auto max-w-5xl space-y-6 pb-12">
			{/* Print Receipt Section - Only visible during browser print */}
			{result?.success && (
				<div className="hidden print:fixed print:inset-0 print:z-[9999] print:block print:bg-white print:p-6">
					<div className="mx-auto max-w-[360px] font-mono text-black text-xs leading-relaxed">
						<div className="border-black border-b-2 pb-3 text-center">
							<h1 className="font-extrabold text-base uppercase tracking-wider">
								EVALUNA LOGISTICS
							</h1>
							<p className="text-[10px]">DELIVERY INVOICE & PARCEL BILL</p>
							<p className="mt-1 font-bold text-sm">
								{result.order.orderNumber}
							</p>
							<p className="text-[10px]">Pkg: {result.package.packageNumber}</p>
						</div>

						{/* Customer Details */}
						<div className="space-y-0.5 border-black border-b py-2">
							<p className="font-bold">CUSTOMER:</p>
							<p className="font-semibold text-sm">{result.customer.name}</p>
							<p>{result.customer.phone}</p>
							<p>
								{result.customer.address}, {result.customer.city}
							</p>
						</div>

						{/* Items */}
						<div className="border-black border-b py-2">
							<div className="flex justify-between border-gray-400 border-b pb-1 font-bold">
								<span>ITEM</span>
								<span>QTY x RATE</span>
								<span>TOTAL</span>
							</div>
							{result.items.map((it, idx) => (
								<div
									key={idx}
									className="flex justify-between py-1 text-[11px]"
								>
									<div className="max-w-[170px] pr-2">
										<p className="font-semibold">{it.name}</p>
										<p className="text-[9px] text-gray-700">{it.sku}</p>
									</div>
									<div className="text-right">
										{it.quantity} {it.unit} x ₹{it.price}
									</div>
									<div className="text-right font-bold">₹{it.itemTotal}</div>
								</div>
							))}
						</div>

						{/* Financials */}
						<div className="space-y-1 border-black border-b-2 py-2">
							<div className="flex justify-between">
								<span>Subtotal:</span>
								<span>₹{result.order.subtotal}</span>
							</div>
							{result.order.discountAmount > 0 && (
								<div className="flex justify-between">
									<span>Discount:</span>
									<span>-₹{result.order.discountAmount}</span>
								</div>
							)}
							{result.order.otherCharges > 0 && (
								<div className="flex justify-between">
									<span>Other Charges:</span>
									<span>+₹{result.order.otherCharges}</span>
								</div>
							)}
							<div className="flex justify-between">
								<span>GST / Tax:</span>
								<span>₹{result.order.totalTax}</span>
							</div>
							<div className="flex justify-between border-black border-t pt-1 font-extrabold text-sm">
								<span>GRAND TOTAL:</span>
								<span>₹{result.order.totalAmount}</span>
							</div>
							<div className="flex justify-between pt-1 font-bold">
								<span>PAYMENT:</span>
								<span className="uppercase">
									{result.order.paymentMethod} ({result.order.paymentStatus})
								</span>
							</div>
						</div>

						{/* Footer */}
						<div className="pt-3 text-center text-[10px]">
							<p className="font-bold">
								VERIFIED BY DRIVER: {result.deliveryInfo.driverName}
							</p>
							<p className="text-gray-700">
								Vehicle: {result.deliveryInfo.vehiclePlate}
							</p>
							<p className="mt-2">Thank you for ordering with Evaluna!</p>
						</div>
					</div>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
						<QrCode className="h-7 w-7 text-blue-600 dark:text-blue-400" />
						Driver Package & Bill Scanner
					</h1>
					<p className="text-muted-foreground text-sm">
						पार्सल पर लगे बारकोड या क्यूआर कोड को स्कैन करें और ग्राहक का पूरा बिल व ऑर्डर
						विवरण देखें।
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleReset}
						disabled={!scannedCode}
						className="gap-1.5 text-xs"
					>
						<RotateCcw className="h-3.5 w-3.5" />
						Clear / नया स्कैन
					</Button>
					{result?.success && (
						<Button
							size="sm"
							onClick={handlePrintReceipt}
							className="gap-1.5 bg-blue-600 text-white text-xs shadow-sm hover:bg-blue-700"
						>
							<Printer className="h-3.5 w-3.5" />
							Print Bill / रसीद प्रिंट
						</Button>
					)}
				</div>
			</div>

			{/* Scanner & Search Control Card */}
			<AnimatedCard>
				<Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur-xl">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center justify-between font-semibold text-base">
							<span>Scan or Enter Parcel Code</span>
							<Badge
								variant="outline"
								className="border-blue-300 font-mono text-[11px] text-blue-600"
							>
								QR / UPC / Barcode
							</Badge>
						</CardTitle>
						<CardDescription className="text-xs">
							Point your smartphone camera at the printed shipping tag or type
							the Package # (e.g. PKG-2026-XXXXXX) or Order # (e.g. ORD-101).
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
							{/* Camera Trigger Button */}
							<Button
								type="button"
								onClick={() => setScannerOpen(true)}
								className="h-11 flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-medium text-sm text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
							>
								<Camera className="h-5 w-5 animate-pulse" />
								Scan with Camera (कैमरा से स्कैन करें)
							</Button>

							<div className="hidden font-semibold text-muted-foreground text-xs uppercase sm:block">
								OR
							</div>

							{/* Manual Input Form */}
							<form
								onSubmit={handleManualSearch}
								className="flex flex-1 items-center gap-2"
							>
								<div className="relative flex-1">
									<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<input
										type="text"
										placeholder="e.g. PKG-2026-123456 or ORD-10"
										value={inputCode}
										onChange={(e) => setInputCode(e.target.value)}
										className="h-11 w-full rounded-md border border-input bg-background pr-3 pl-9 font-mono text-sm shadow-sm placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<Button
									type="submit"
									variant="secondary"
									className="h-11 px-4 font-semibold text-xs"
								>
									Lookup
								</Button>
							</form>
						</div>

						{/* Quick Tips / Scanned Feedback */}
						{scannedCode && (
							<div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-blue-900 text-xs dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
								<div className="flex items-center gap-2">
									<Tag className="h-3.5 w-3.5 shrink-0 text-blue-600" />
									<span>
										Active Query:{" "}
										<strong className="font-mono">{scannedCode}</strong>
									</span>
								</div>
								<button
									type="button"
									onClick={() => refetch()}
									className="text-[11px] text-blue-700 underline hover:text-blue-900 dark:text-blue-300"
								>
									Refresh
								</button>
							</div>
						)}
					</CardContent>
				</Card>
			</AnimatedCard>

			{/* Loading State */}
			{isLoading && (
				<div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
					<Loader2 className="h-10 w-10 animate-spin text-blue-600" />
					<p className="font-semibold text-base text-foreground">
						Retrieving Order & Generating Bill...
					</p>
					<p className="text-muted-foreground text-xs">
						पार्सल और ग्राहक बिल का विवरण लोड हो रहा है, कृपया प्रतीक्षा करें...
					</p>
				</div>
			)}

			{/* Error State */}
			{isError && (
				<Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
					<CardContent className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
						<AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
						<div>
							<h3 className="font-bold text-base text-red-900 dark:text-red-200">
								Parcel or Order Not Found (ऑर्डर नहीं मिला)
							</h3>
							<p className="mt-1 max-w-md text-red-700 text-xs dark:text-red-300">
								{error?.message ||
									`No matching package or order found for code "${scannedCode}". Please ensure the package label was packed in the warehouse.`}
							</p>
						</div>
						<div className="flex gap-2 pt-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setScannerOpen(true)}
								className="gap-1.5 border-red-300 text-red-900 text-xs hover:bg-red-100 dark:border-red-800 dark:text-red-200"
							>
								<Camera className="h-3.5 w-3.5" />
								Scan Again
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={handleReset}
								className="text-red-800 text-xs dark:text-red-300"
							>
								Dismiss
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Scanned Result / Full Bill Card */}
			{result?.success && (
				<div className="space-y-6">
					{/* Status Bar */}
					<Card className="border-border/60 bg-gradient-to-r from-blue-50/50 via-background to-emerald-50/50 shadow-sm dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
										<Package className="h-6 w-6" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h2 className="font-bold font-mono text-foreground text-lg sm:text-xl">
												{result.order.orderNumber}
											</h2>
											<Badge
												className={
													result.order.status === "delivered" ||
													result.order.status === "completed"
														? "bg-emerald-600 text-white"
														: result.order.status === "out_for_delivery"
															? "bg-blue-600 text-white"
															: "bg-amber-600 text-white"
												}
											>
												{result.order.status.replace(/_/g, " ").toUpperCase()}
											</Badge>
										</div>
										<p className="mt-0.5 font-mono text-muted-foreground text-xs">
											Package:{" "}
											<strong className="text-foreground">
												{result.package.packageNumber}
											</strong>{" "}
											•{" "}
											{result.package.weight
												? `${result.package.weight} kg`
												: "Standard Weight"}
										</p>
									</div>
								</div>

								{/* Payment Status Pill */}
								<div className="flex flex-col items-start gap-1 sm:items-end">
									<span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
										Payment Collection Status
									</span>
									<div className="flex items-center gap-2">
										<Badge
											variant={result.order.isPaid ? "default" : "destructive"}
											className={`px-2.5 py-1 font-bold text-xs ${
												result.order.isPaid
													? "bg-emerald-600 text-white hover:bg-emerald-700"
													: "bg-amber-500 text-white hover:bg-amber-600"
											}`}
										>
											{result.order.paymentStatus}
										</Badge>
										<span className="font-extrabold font-mono text-foreground text-lg">
											₹{result.order.totalAmount}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* 2-Column Info Grid: Customer Details & Package Specifications */}
					<div className="grid gap-4 sm:grid-cols-2">
						{/* Customer Information */}
						<Card className="border-border/60 shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 font-semibold text-sm">
									<User className="h-4 w-4 text-blue-600" />
									Customer & Delivery Address (ग्राहक विवरण)
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-xs">
								<div className="flex items-start justify-between">
									<span className="text-muted-foreground">Recipient Name:</span>
									<span className="font-bold text-foreground text-sm">
										{result.customer.name}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Contact Phone:</span>
									<a
										href={`tel:${result.customer.phone}`}
										className="flex items-center gap-1 font-semibold text-blue-600 hover:underline"
									>
										<Phone className="h-3 w-3" />
										{result.customer.phone}
									</a>
								</div>

								<div className="flex items-start justify-between">
									<span className="text-muted-foreground">
										Delivery Address:
									</span>
									<span className="max-w-[240px] text-right font-medium text-foreground">
										{result.customer.address}
										{result.customer.city ? `, ${result.customer.city}` : ""}
										{result.customer.pincode
											? ` - ${result.customer.pincode}`
											: ""}
									</span>
								</div>

								<div className="flex items-center justify-between border-border/50 border-t pt-2">
									<span className="text-muted-foreground">Assigned Route:</span>
									<span className="font-semibold text-foreground">
										{result.deliveryInfo.routeName}
									</span>
								</div>
							</CardContent>
						</Card>

						{/* Package & Warehouse Details */}
						<Card className="border-border/60 shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 font-semibold text-sm">
									<ShieldCheck className="h-4 w-4 text-emerald-600" />
									Warehouse Packing Specs (पैकिंग विवरण)
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-xs">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Package Number:</span>
									<span className="font-bold font-mono text-foreground">
										{result.package.packageNumber}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Packed By Staff:
									</span>
									<span className="font-medium text-foreground">
										{result.package.packedBy}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Parcel Weight & Size:
									</span>
									<span className="font-medium text-foreground">
										{result.package.weight
											? `${result.package.weight} kg`
											: "N/A"}{" "}
										• {result.package.dimensions}
									</span>
								</div>

								<div className="flex items-center justify-between border-border/50 border-t pt-2">
									<span className="text-muted-foreground">
										Vehicle Assigned:
									</span>
									<span className="font-mono font-semibold text-foreground">
										{result.deliveryInfo.vehiclePlate}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Itemized Bill / Product Manifest Table */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<FileText className="h-4 w-4 text-blue-600" />
									Itemized Bill Manifest (सामान की सूची एवं बिल)
								</CardTitle>
								<Badge variant="secondary" className="font-mono text-xs">
									{result.items.length}{" "}
									{result.items.length === 1 ? "Item" : "Items"}
								</Badge>
							</div>
							<CardDescription className="text-xs">
								All packed items and their unit prices according to the verified
								warehouse manifest.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-4">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[50px]">#</TableHead>
											<TableHead>Product Name & SKU</TableHead>
											<TableHead className="text-center">Quantity</TableHead>
											<TableHead className="text-right">Unit Rate</TableHead>
											<TableHead className="text-right">Tax Rate</TableHead>
											<TableHead className="text-right">Item Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{result.items.map((item, index) => (
											<TableRow key={item.id || index}>
												<TableCell className="font-mono text-muted-foreground text-xs">
													{index + 1}
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-semibold text-foreground text-sm">
															{item.name}
														</span>
														<span className="font-mono text-[11px] text-muted-foreground">
															SKU: {item.sku}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Badge
														variant="outline"
														className="font-bold text-xs"
													>
														{item.quantity} {item.unit}
													</Badge>
												</TableCell>
												<TableCell className="text-right font-mono text-xs">
													₹{item.price.toFixed(2)}
												</TableCell>
												<TableCell className="text-right font-mono text-muted-foreground text-xs">
													{item.cgstRate + item.sgstRate}% GST
												</TableCell>
												<TableCell className="text-right font-bold font-mono text-foreground text-sm">
													₹{item.itemTotal.toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					{/* Bill Financial Summary Card */}
					<Card className="border-border/60 bg-card shadow-sm">
						<CardContent className="p-4 sm:p-6">
							<div className="grid gap-6 sm:grid-cols-2">
								{/* Left: Driver Action & Instructions */}
								<div className="space-y-3 rounded-lg border border-border/70 bg-muted/30 p-4">
									<h4 className="flex items-center gap-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										<Truck className="h-4 w-4 text-blue-600" />
										Driver Delivery Next Steps
									</h4>
									<p className="text-foreground text-xs leading-relaxed">
										Verify all {result.items.length} items with the customer
										upon arrival. If payment is{" "}
										<strong>Cash on Delivery</strong>, collect{" "}
										<strong>₹{result.order.totalAmount}</strong> in full before
										marking as delivered.
									</p>

									<div className="flex flex-wrap gap-2 pt-2">
										<Button
											size="sm"
											asChild
											className="gap-1.5 bg-blue-600 text-white text-xs shadow-sm hover:bg-blue-700"
										>
											<Link href="/driver/delivery">
												<CheckCircle2 className="h-3.5 w-3.5" />
												Go to Delivery Confirmation
											</Link>
										</Button>
										<Button
											size="sm"
											variant="outline"
											asChild
											className="gap-1.5 text-xs"
										>
											<Link href="/driver/route">
												<MapPin className="h-3.5 w-3.5 text-blue-600" />
												Open Route Navigation
											</Link>
										</Button>
									</div>
								</div>

								{/* Right: Detailed Bill Calculations */}
								<div className="space-y-2 text-xs">
									{result.order.discountAmount > 0 && (
										<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-950 dark:text-emerald-200 space-y-1.5 mb-2">
											<div className="flex items-center justify-between font-bold text-xs sm:text-sm">
												<span className="flex items-center gap-1.5">
													<Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
													Applied Discount:
												</span>
												<span className="font-extrabold font-mono text-emerald-700 dark:text-emerald-300 text-sm">
													-₹{result.order.discountAmount.toFixed(2)}
												</span>
											</div>
											{result.order.discountReason && (
												<div className="rounded border border-emerald-500/20 bg-white/70 p-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
													<span className="font-bold text-emerald-800 dark:text-emerald-300">
														Reason / Products:{" "}
													</span>
													<span>{result.order.discountReason}</span>
												</div>
											)}
										</div>
									)}

									<div className="flex justify-between border-border/50 border-b py-1 text-muted-foreground">
										<span>Items Subtotal (कर-पूर्व राशि):</span>
										<span className="font-medium font-mono text-foreground">
											₹{result.order.subtotal.toFixed(2)}
										</span>
									</div>

									{result.order.discountAmount > 0 && (
										<div className="flex justify-between border-border/50 border-b py-1 text-emerald-600 dark:text-emerald-400">
											<span>
												Discount Applied (
												{result.order.discountReason || "Promo"}):
											</span>
											<span className="font-medium font-mono">
												-₹{result.order.discountAmount.toFixed(2)}
											</span>
										</div>
									)}

									{result.order.otherCharges > 0 && (
										<div className="flex justify-between border-border/50 border-b py-1 text-muted-foreground">
											<span>Delivery / Extra Charges:</span>
											<span className="font-medium font-mono text-foreground">
												+₹{result.order.otherCharges.toFixed(2)}
											</span>
										</div>
									)}

									<div className="flex justify-between border-border/50 border-b py-1 text-muted-foreground">
										<span>GST & Taxes (कुल टैक्स):</span>
										<span className="font-medium font-mono text-foreground">
											₹{result.order.totalTax.toFixed(2)}
										</span>
									</div>

									{/* Prominent Grand Total */}
									<div className="mt-2 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/80 p-3.5 dark:border-blue-900 dark:bg-blue-950/40">
										<div>
											<p className="font-extrabold text-blue-950 text-sm uppercase tracking-wide dark:text-blue-100">
												Grand Total (कुल बिल)
											</p>
											<p className="font-medium text-[11px] text-blue-700 dark:text-blue-300">
												Mode: {result.order.paymentMethod}
											</p>
										</div>
										<div className="text-right">
											<span className="font-extrabold font-mono text-2xl text-blue-600 dark:text-blue-400">
												₹{result.order.totalAmount.toFixed(2)}
											</span>
										</div>
									</div>

									{/* COD Callout if unpaid */}
									{!result.order.isPaid && (
										<div className="flex items-center gap-2 rounded border border-amber-300 bg-amber-50 p-2.5 font-semibold text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
											<AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
											<span>
												ध्यान दें: ग्राहक से{" "}
												<strong>₹{result.order.totalAmount}</strong> नकद / UPI
												द्वारा संग्रह करना अनिवार्य है।
											</span>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Empty Initial State - Only when no search has been initiated */}
			{!scannedCode && !isLoading && (
				<Card className="border-2 border-border/70 border-dashed bg-card/40">
					<CardContent className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20">
							<QrCode className="h-8 w-8 animate-pulse" />
						</div>
						<div className="max-w-md space-y-1">
							<h3 className="font-bold text-base text-foreground">
								Ready to Scan Parcels (स्कैन करने के लिए तैयार)
							</h3>
							<p className="text-muted-foreground text-xs">
								Click &quot;Scan with Camera&quot; above to open the barcode
								viewfinder, or type any Package ID or Order ID to inspect
								customer bill, items, and payment instructions.
							</p>
						</div>
						<Button
							onClick={() => setScannerOpen(true)}
							className="mt-2 gap-2 bg-blue-600 text-white text-xs shadow-sm hover:bg-blue-700"
						>
							<Camera className="h-4 w-4" />
							Launch Camera Scanner
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Camera Scanner Modal */}
			<CameraBarcodeScannerModal
				open={scannerOpen}
				onOpenChange={setScannerOpen}
				onScan={handleScanSuccess}
				title="Scan Parcel Barcode or QR Code"
				description="Hold the parcel's shipping label in front of your camera. Both CODE128 barcodes and 2D QR codes will be automatically detected."
			/>
		</PageTransition>
	);
}
