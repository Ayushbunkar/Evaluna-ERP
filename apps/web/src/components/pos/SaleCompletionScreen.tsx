"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeftRight,
	CheckCircle2,
	Copy,
	Download,
	FileText,
	Mail,
	MessageCircle,
	Printer,
	RotateCcw,
	ShoppingBag,
	X,
	XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompletedOrder {
	id: number;
	createdAt: string;
	items: Array<{
		id: number;
		name: string;
		qty: number;
		price: string;
	}>;
	total: number;
	subtotal: number;
	discount: number;
	payments: Array<{ methodId: number; amount: string }>;
	cashierName?: string;
	customerName?: string;
	customerPhone?: string;
	shopName?: string;
	couponCode?: string;
}

interface SaleCompletionScreenProps {
	order: CompletedOrder;
	onNewSale: () => void;
}

const STORE = {
	name: "EVALUNA PVT LTD",
	address: "Near Bank of India, Vidisha Road, Berasia",
	city: "Bhopal, MP – 463106",
	phone: "7000219747",
};

const PAYMENT_METHOD_LABELS: Record<number, string> = {
	1: "Cash",
	2: "Card",
	3: "UPI",
	4: "Store Credit",
};

const getPaymentStatusBadge = (order: CompletedOrder) => {
	const paid = order.payments.reduce(
		(a, p) => a + Number.parseFloat(p.amount),
		0,
	);
	if (paid >= order.total - 0.01)
		return {
			label: "PAID",
			color: "bg-green-100 text-green-700 border-green-300",
		};
	if (paid > 0)
		return {
			label: "PARTIAL",
			color: "bg-yellow-100 text-yellow-700 border-yellow-300",
		};
	return { label: "UNPAID", color: "bg-red-100 text-red-700 border-red-300" };
};

export function SaleCompletionScreen({
	order,
	onNewSale,
}: SaleCompletionScreenProps) {
	const receiptRef = useRef<HTMLDivElement>(null);
	const [pageSize, setPageSize] = useState<"80mm" | "A4">("80mm");

	const totalPaid = order.payments.reduce(
		(a, p) => a + Number.parseFloat(p.amount),
		0,
	);
	const change = Math.max(0, totalPaid - order.total);
	const balanceDue = Math.max(0, order.total - totalPaid);
	const roundOff = Math.round(order.total) - order.total;
	const grandTotal = Math.round(order.total);
	const status = getPaymentStatusBadge(order);

	const formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	const handlePrint = () => {
		const printContent = document.getElementById("printable-receipt");
		if (!printContent) return;

		const printWindow = window.open("", "_blank", "width=800,height=900");
		if (!printWindow) {
			toast.error("Popup blocker prevented printing. Please allow popups.");
			return;
		}

		// Inject only target content and style rules
		const pageSizeStyle = pageSize === "80mm"
			? `
				@page { size: 80mm auto; margin: 0; }
				body { width: 80mm; margin: 0; padding: 4px; font-family: sans-serif; font-size: 11px; color: #000; }
				#printable-receipt { width: 80mm; margin: 0; padding: 0; }
			`
			: `
				@page { size: A4 portrait; margin: 20mm; }
				body { width: 100%; margin: 0; padding: 0; font-family: sans-serif; font-size: 13px; color: #000; }
				#printable-receipt { width: 100%; margin: 0; padding: 0; }
			`;

		printWindow.document.write(`
			<html>
				<head>
					<title>Invoice #${order.id}</title>
					<style>
						${pageSizeStyle}
						hr { border: none; border-top: 1px dashed #000; margin: 12px 0; }
						table { width: 100%; border-collapse: collapse; margin-bottom: 8px; table-layout: fixed; }
						th { border-bottom: 1px dashed #000; padding: 6px 2px; font-size: 11px; text-transform: uppercase; }
						td { padding: 4px 2px; vertical-align: top; }
						.text-right { text-align: right; }
						.text-center { text-align: center; }
						.font-bold { font-weight: bold; }
						.text-gray-500 { color: #666; }
						.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
						.mb-4 { margin-bottom: 16px; }
						.text-xl { font-size: 18px; }
						.text-xs { font-size: 10px; }
					</style>
				</head>
				<body>
					<div>
						${printContent.innerHTML}
					</div>
					<script>
						window.onload = function() {
							setTimeout(function() {
								window.print();
								window.close();
							}, 200);
						};
					</script>
				</body>
			</html>
		`);
		printWindow.document.close();
	};

	const handleDownloadPDF = async () => {
		const toastId = toast.loading("Generating vector PDF...");
		try {
			// Dynamically import @react-pdf/renderer to avoid SSR issues
			const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

			// Register a font that supports Devanagari (Hindi) and basic Latin
			// We use Noto Sans Devanagari. It includes Latin characters as well.
			Font.register({
				family: "NotoSansDevanagari",
				src: "https://fonts.gstatic.com/s/notosansdevanagari/v28/Equ7FZ55t0yrL6sJ7w4PMc_w1N7q9-Vn.ttf"
			});

			const isA4 = pageSize === "A4";
			const calculatedHeight = pageSize === "80mm"
				? Math.max(140, 110 + order.items.length * 12 + (order.customerName ? 20 : 0) + order.payments.length * 5)
				: 297; // A4 height is 297mm

			const styles = StyleSheet.create({
				page: {
					fontFamily: "NotoSansDevanagari",
					padding: isA4 ? 40 : 10,
					fontSize: isA4 ? 12 : 9,
					backgroundColor: "#ffffff",
				},
				header: {
					textAlign: "center",
					marginBottom: 10,
				},
				title: {
					fontSize: isA4 ? 16 : 12,
					fontWeight: "bold",
					marginBottom: 4,
				},
				subtitle: {
					fontSize: isA4 ? 10 : 8,
					marginBottom: 2,
				},
				separator: {
					borderBottomWidth: 1,
					borderBottomStyle: "dashed",
					borderBottomColor: "#000",
					marginVertical: 6,
				},
				row: {
					flexDirection: "row",
					justifyContent: "space-between",
					marginBottom: 4,
				},
				bold: {
					fontWeight: "bold",
				},
				tableHeader: {
					flexDirection: "row",
					borderBottomWidth: 1,
					borderBottomStyle: "dashed",
					borderBottomColor: "#000",
					paddingBottom: 4,
					marginBottom: 4,
				},
				tableRow: {
					flexDirection: "row",
					marginBottom: 4,
				},
				colItem: { flex: isA4 ? 4 : 3 },
				colQty: { flex: 1, textAlign: "right" },
				colRate: { flex: 2, textAlign: "right" },
				colTotal: { flex: 2, textAlign: "right" },
				footer: {
					textAlign: "center",
					marginTop: 10,
					fontSize: isA4 ? 10 : 7.5,
				}
			});

			const InvoiceDocument = () => (
				<Document>
					<Page 
						size={pageSize === "80mm" ? [226.77, calculatedHeight * 2.834] : "A4"} 
						style={styles.page}
					>
						{/* Header */}
						<View style={styles.header}>
							<Text style={styles.title}>{STORE.name}</Text>
							<Text style={styles.subtitle}>{STORE.address}</Text>
							<Text style={styles.subtitle}>{STORE.city}</Text>
							<Text style={styles.subtitle}>Phone: {STORE.phone}</Text>
						</View>

						<View style={styles.separator} />

						{/* Invoice Meta */}
						<View style={styles.row}>
							<Text>Invoice No:</Text>
							<Text>#{order.id}</Text>
						</View>
						<View style={styles.row}>
							<Text>Date & Time:</Text>
							<Text>{formattedDate}</Text>
						</View>
						<View style={styles.row}>
							<Text>Cashier:</Text>
							<Text>{order.cashierName || "Counter 1"}</Text>
						</View>

						{/* Customer Details */}
						{(order.customerName || order.customerPhone || order.shopName) && (
							<>
								<View style={styles.separator} />
								<Text style={[styles.bold, { marginBottom: 4 }]}>BILL TO:</Text>
								{order.customerName && (
									<View style={styles.row}>
										<Text>Name:</Text>
										<Text>{order.customerName}</Text>
									</View>
								)}
								{order.shopName && (
									<View style={styles.row}>
										<Text>Shop:</Text>
										<Text>{order.shopName}</Text>
									</View>
								)}
								{order.customerPhone && (
									<View style={styles.row}>
										<Text>Phone:</Text>
										<Text>{order.customerPhone}</Text>
									</View>
								)}
							</>
						)}

						<View style={styles.separator} />

						{/* Table Header */}
						<View style={styles.tableHeader}>
							<Text style={[styles.colItem, styles.bold]}>Item</Text>
							<Text style={[styles.colQty, styles.bold]}>Qty</Text>
							<Text style={[styles.colRate, styles.bold]}>Rate</Text>
							<Text style={[styles.colTotal, styles.bold]}>Total</Text>
						</View>

						{/* Table Items */}
						{order.items.map((item, idx) => {
							const rate = Number.parseFloat(item.price);
							const lineTotal = rate * item.qty;
							const qtyStr = Number.isInteger(item.qty) ? item.qty.toString() : item.qty.toFixed(3);
							return (
								<View key={idx} style={styles.tableRow}>
									<Text style={styles.colItem}>{item.name}</Text>
									<Text style={styles.colQty}>{qtyStr}</Text>
									<Text style={styles.colRate}>Rs.{rate.toFixed(2)}</Text>
									<Text style={styles.colTotal}>Rs.{lineTotal.toFixed(2)}</Text>
								</View>
							);
						})}

						<View style={styles.separator} />

						{/* Summary */}
						<View style={styles.row}>
							<Text>Subtotal:</Text>
							<Text>Rs.{order.subtotal.toFixed(2)}</Text>
						</View>
						{order.discount > 0 && (
							<View style={styles.row}>
								<Text>Discount:</Text>
								<Text>-Rs.{order.discount.toFixed(2)}</Text>
							</View>
						)}
						{roundOff !== 0 && (
							<View style={styles.row}>
								<Text>Round-off:</Text>
								<Text>{roundOff > 0 ? "+" : ""}Rs.{roundOff.toFixed(2)}</Text>
							</View>
						)}

						<View style={styles.separator} />
						<View style={styles.row}>
							<Text style={[styles.bold, { fontSize: isA4 ? 14 : 11 }]}>Grand Total:</Text>
							<Text style={[styles.bold, { fontSize: isA4 ? 14 : 11 }]}>Rs.{grandTotal.toFixed(2)}</Text>
						</View>
						<View style={styles.separator} />

						{/* Payment Details */}
						<Text style={[styles.bold, { marginTop: 4, marginBottom: 4 }]}>PAYMENT DETAILS</Text>
						{order.payments.map((p, idx) => (
							<View key={idx} style={styles.row}>
								<Text>{PAYMENT_METHOD_LABELS[p.methodId] ?? "Payment"}</Text>
								<Text>Rs.{Number.parseFloat(p.amount).toFixed(2)}</Text>
							</View>
						))}

						<View style={styles.separator} />

						{/* Footer */}
						<View style={styles.footer}>
							<Text style={[styles.bold, { marginBottom: 2, fontSize: isA4 ? 12 : 9 }]}>Thank you for shopping!</Text>
							<Text>Goods once sold will not be taken back</Text>
							<Text>without valid receipt within 7 days</Text>
						</View>
					</Page>
				</Document>
			);

			const blob = await pdf(<InvoiceDocument />).toBlob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `invoice_${order.id}_${pageSize}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Vector PDF downloaded successfully!", { id: toastId });
		} catch (err: any) {
			console.error("PDF generation error:", err);
			toast.error(`Failed: ${err?.message || "Error"}. Try 'Print Receipt' -> 'Save as PDF'`, { id: toastId });
		}
	};

	const handleWhatsApp = () => {
		let itemsText = "";
		order.items.forEach((item, idx) => {
			const rate = Number.parseFloat(item.price);
			const lineTotal = rate * item.qty;
			const qtyStr = Number.isInteger(item.qty)
				? item.qty
				: item.qty.toFixed(3);
			itemsText += `${idx + 1}. *${item.name}*\n   Qty: ${qtyStr} x ₹${rate.toFixed(2)} = *₹${lineTotal.toFixed(2)}*\n`;
		});

		let customerText = "";
		if (order.customerName || order.customerPhone || order.shopName) {
			customerText += `--------------------------------\n*BILL TO:*\n`;
			if (order.customerName) customerText += `• Name: ${order.customerName}\n`;
			if (order.shopName) customerText += `• Shop: ${order.shopName}\n`;
			if (order.customerPhone) customerText += `• Phone: ${order.customerPhone}\n`;
		}

		const fullText = `🧾 *INVOICE #${order.id}*\n*${STORE.name}*\n_${STORE.address}, ${STORE.city}_\n📞 Phone: ${STORE.phone}\n--------------------------------\n*Date:* ${formattedDate}\n*Cashier:* ${order.cashierName || "Counter 1"}\n${customerText}--------------------------------\n*ITEMS:*\n${itemsText}--------------------------------\n*Subtotal:* ₹${order.subtotal.toFixed(2)}\n*Grand Total:* *₹${grandTotal.toFixed(2)}*\n*Payment:* ${order.payments.map((p) => `${PAYMENT_METHOD_LABELS[p.methodId] ?? "Payment"}: ₹${Number.parseFloat(p.amount).toFixed(2)}`).join(", ")}\n--------------------------------\nThank you for shopping!\n_*EVALUNA PVT LTD*_`;

		window.open(
			`https://wa.me/?text=${encodeURIComponent(fullText)}`,
			"_blank",
		);
	};

	const handleEmail = () => {
		const subject = encodeURIComponent(`Invoice #${order.id} - ${STORE.name}`);
		const body = encodeURIComponent(
			`Dear Customer,\n\nYour invoice #${order.id} has been generated.\nTotal: ₹${order.total.toFixed(2)}\nDate: ${formattedDate}\n\nThank you for shopping at ${STORE.name}!`,
		);
		window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
	};

	const handleDuplicate = () => {
		toast.info("Duplicate invoice feature requires manager permission.");
	};

	const handleReturn = () => {
		toast.info(
			"Return items: Please go to Invoice History → Select this invoice → Return.",
		);
	};

	const handleExchange = () => {
		toast.info(
			"Exchange items: Please go to Invoice History → Select this invoice → Exchange.",
		);
	};

	const handleCancel = () => {
		toast.warning("Cancel Invoice: Requires manager PIN. Feature coming soon.");
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			>
				<motion.div
					initial={{ scale: 0.92, opacity: 0, y: 20 }}
					animate={{ scale: 1, opacity: 1, y: 0 }}
					exit={{ scale: 0.92, opacity: 0 }}
					transition={{ type: "spring", damping: 22, stiffness: 300 }}
					className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
				>
					{/* ── Header ── */}
					<div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4 text-white">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
								<CheckCircle2 className="h-6 w-6" />
							</div>
							<div>
								<div className="font-bold text-lg leading-tight">
									Sale Completed
								</div>
								<div className="text-green-100 text-sm">
									Invoice #{order.id} generated successfully
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span
								className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold text-xs ${status.color}`}
							>
								{status.label}
							</span>
						</div>
					</div>

					<div className="flex min-h-0 flex-1 overflow-hidden">
						{/* ── Left: Receipt Preview ── */}
						<div className="flex min-h-0 flex-1 flex-col border-r bg-gray-100/50">
							{/* Size selector at the top of preview */}
							<div className="flex justify-between items-center border-b bg-white px-6 py-2.5 shrink-0 relative z-20">
								<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Template Preview
								</span>
								<div className="flex rounded-md bg-muted p-0.5 relative z-25 pointer-events-auto">
									<button
										type="button"
										onClick={() => setPageSize("80mm")}
										className={`rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer relative z-30 pointer-events-auto ${
											pageSize === "80mm"
												? "bg-white text-foreground shadow-sm font-semibold"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										80mm Thermal
									</button>
									<button
										type="button"
										onClick={() => setPageSize("A4")}
										className={`rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer relative z-30 pointer-events-auto ${
											pageSize === "A4"
												? "bg-white text-foreground shadow-sm font-semibold"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										A4 Page
									</button>
								</div>
							</div>

							<ScrollArea className="flex-1 p-6">
								<div
									ref={receiptRef}
									id="printable-receipt"
									className={`mx-auto bg-white border shadow-sm transition-all duration-200 ${
										pageSize === "80mm"
											? "w-[302px] max-w-full p-4 text-[11px] leading-relaxed"
											: "w-full max-w-[700px] p-12 text-sm"
									}`}
									style={{ color: "#000" }}
								>
									{/* Store Header */}
									<div className="mb-4 text-center">
										<h2 className="font-bold text-xl tracking-wide">
											{STORE.name}
										</h2>
										<p className="text-gray-500 mt-0.5">{STORE.address}</p>
										<p className="text-gray-500">{STORE.city}</p>
										<p className="text-gray-500">📞 {STORE.phone}</p>
									</div>

									<hr className="my-3 border-t border-dashed border-gray-400" />

									{/* Invoice Meta */}
									<div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1">
										<div className="text-gray-500">Invoice No.</div>
										<div className="text-right font-semibold">
											#{order.id}
										</div>
										<div className="text-gray-500">Date &amp; Time</div>
										<div className="text-right">
											{formattedDate}
										</div>
										<div className="text-gray-500">Cashier</div>
										<div className="text-right">
											{order.cashierName || "Counter 1"}
										</div>
										{order.couponCode && (
											<>
												<div className="text-gray-500">Coupon</div>
												<div className="text-right font-medium text-green-600">
													{order.couponCode}
												</div>
											</>
										)}
									</div>

									{/* Customer Details */}
									{(order.customerName || order.customerPhone || order.shopName) && (
										<>
											<hr className="my-3 border-t border-dashed border-gray-400" />
											<div className="mb-3">
												<div className="mb-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide">
													Bill To
												</div>
												<div className="grid grid-cols-2 gap-x-4 gap-y-1">
													{order.customerName && (
														<>
															<div className="text-gray-500">Name</div>
															<div className="text-right font-medium">{order.customerName}</div>
														</>
													)}
													{order.shopName && (
														<>
															<div className="text-gray-500">Shop</div>
															<div className="text-right font-medium">{order.shopName}</div>
														</>
													)}
													{order.customerPhone && (
														<>
															<div className="text-gray-500">Phone</div>
															<div className="text-right">{order.customerPhone}</div>
														</>
													)}
												</div>
											</div>
										</>
									)}

									<hr className="my-3 border-t border-dashed border-gray-400" />

									{/* Item Table */}
									<table className="mb-2 w-full">
										<colgroup>
											<col style={{ width: "44%" }} />
											<col style={{ width: "12%" }} />
											<col style={{ width: "22%" }} />
											<col style={{ width: "22%" }} />
										</colgroup>
										<thead>
											<tr className="border-b border-dashed border-gray-400 text-gray-400 text-xs uppercase tracking-wide">
												<th className="py-2 text-left font-semibold">Item</th>
												<th className="py-2 text-center font-semibold">Qty</th>
												<th className="py-2 text-right font-semibold">Rate</th>
												<th className="py-2 text-right font-semibold">Total</th>
											</tr>
										</thead>
										<tbody>
											{order.items.map((item, idx) => {
												const rate = Number.parseFloat(item.price);
												const lineTotal = rate * item.qty;
												return (
													<tr
														key={item.id ?? idx}
														className="border-b border-gray-100 last:border-0"
													>
														<td
															className="py-2 pr-2 leading-snug"
															style={{
																wordBreak: "break-word",
																overflowWrap: "anywhere",
															}}
														>
															{item.name}
														</td>
														<td className="py-2 text-center align-top text-gray-600">
															{Number.isInteger(item.qty)
																? item.qty
																: item.qty.toFixed(3)}
														</td>
														<td className="py-2 text-right align-top text-gray-600">
															₹{rate.toFixed(2)}
														</td>
														<td className="py-2 text-right align-top font-medium">
															₹{lineTotal.toFixed(2)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>

									<hr className="my-3 border-t border-dashed border-gray-400" />

									{/* Summary */}
									<div className="space-y-1.5">
										<div className="flex justify-between text-gray-600">
											<span>Subtotal</span>
											<span>₹{order.subtotal.toFixed(2)}</span>
										</div>
										{order.discount > 0 && (
											<div className="flex justify-between text-green-600">
												<span>
													Discount{" "}
													{order.couponCode ? `(${order.couponCode})` : ""}
												</span>
												<span>− ₹{order.discount.toFixed(2)}</span>
											</div>
										)}
										{roundOff !== 0 && (
											<div className="flex justify-between text-gray-500">
												<span>Round-off</span>
												<span>
													{roundOff > 0 ? "+" : ""}₹{roundOff.toFixed(2)}
												</span>
											</div>
										)}
										<hr className="my-2 border-gray-200" />
										<div className="flex justify-between font-bold text-base">
											<span>Grand Total</span>
											<span>₹{grandTotal.toFixed(2)}</span>
										</div>
									</div>

									<hr className="my-3 border-t border-dashed border-gray-400" />

									{/* Payment */}
									<div className="space-y-1.5">
										<div className="mb-2 font-medium text-gray-400 text-xs uppercase tracking-wide">
											Payment Details
										</div>
										{order.payments.map((p, i) => (
											<div key={i} className="flex justify-between text-gray-700">
												<span>
													{PAYMENT_METHOD_LABELS[p.methodId] ?? "Payment"}
												</span>
												<span>₹{Number.parseFloat(p.amount).toFixed(2)}</span>
											</div>
										))}
										{change > 0 && (
											<div className="flex justify-between font-medium text-blue-600">
												<span>Change Returned</span>
												<span>₹{change.toFixed(2)}</span>
											</div>
										)}
										{balanceDue > 0 && (
											<div className="flex justify-between font-semibold text-red-600">
												<span>Balance Due</span>
												<span>₹{balanceDue.toFixed(2)}</span>
											</div>
										)}
									</div>

									<hr className="my-4 border-t border-dashed border-gray-400" />

									<div className="space-y-1 text-center text-gray-400 text-xs">
										<p className="font-semibold text-gray-600">
											Thank you for shopping!
										</p>
										<p>Goods once sold will not be taken back</p>
										<p>without valid receipt within 7 days</p>
										<p className="mt-2 font-semibold text-gray-500">
											{STORE.name}
										</p>
										<p>{STORE.phone}</p>
									</div>
								</div>
							</ScrollArea>
						</div>

						{/* ── Right: Actions Panel ── */}
						<div className="flex w-64 shrink-0 flex-col gap-3 bg-gray-50/80 p-4">
							<div className="mb-1 font-semibold text-gray-400 text-xs uppercase tracking-wide">
								Actions
							</div>

							<Button
								size="lg"
								className="h-12 w-full bg-green-600 font-bold text-base text-white shadow-md hover:bg-green-700"
								onClick={onNewSale}
							>
								<ShoppingBag className="mr-2 h-5 w-5" />
								New Sale
							</Button>

							<hr className="my-1 border-gray-200" />
							<div className="font-medium text-gray-400 text-xs uppercase tracking-wide">
								Print &amp; Share ({pageSize})
							</div>

							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handlePrint}
							>
								<Printer className="h-4 w-4 text-gray-500" />
								Print Receipt
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handlePrint}
							>
								<RotateCcw className="h-4 w-4 text-gray-500" />
								Reprint
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handleDownloadPDF}
							>
								<Download className="h-4 w-4 text-gray-500" />
								Download PDF
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handleWhatsApp}
							>
								<MessageCircle className="h-4 w-4 text-green-500" />
								Send WhatsApp
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handleEmail}
							>
								<Mail className="h-4 w-4 text-blue-500" />
								Send Email
							</Button>

							<hr className="my-1 border-gray-200" />
							<div className="font-medium text-gray-400 text-xs uppercase tracking-wide">
								Invoice Actions
							</div>

							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handleDuplicate}
							>
								<Copy className="h-4 w-4 text-gray-500" />
								Duplicate Invoice
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handleReturn}
							>
								<ArrowLeftRight className="h-4 w-4 text-orange-500" />
								Return Items
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm"
								onClick={handleExchange}
							>
								<ArrowLeftRight className="h-4 w-4 text-purple-500" />
								Exchange Items
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-red-200 text-red-600 text-sm hover:bg-red-50 hover:text-red-700"
								onClick={handleCancel}
							>
								<XCircle className="h-4 w-4" />
								Cancel Invoice
							</Button>
						</div>
					</div>

					{/* ── Footer ── */}
					<div className="flex shrink-0 items-center justify-between border-t bg-gray-50 px-6 py-3 text-gray-400 text-xs">
						<span>
							Invoice #{order.id} • {formattedDate}
						</span>
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center gap-1">
								<span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
								Stock updated
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
								Ledger recorded
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
								Audit logged
							</span>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
