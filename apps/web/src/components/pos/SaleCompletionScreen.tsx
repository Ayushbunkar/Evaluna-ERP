"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeftRight,
	CheckCircle2,
	Copy,
	Download,
	FileText,
	IndianRupee,
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
	address?: string;
	village?: string;
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

function numberToWords(num: number): string {
	const a = [
		"",
		"One",
		"Two",
		"Three",
		"Four",
		"Five",
		"Six",
		"Seven",
		"Eight",
		"Nine",
		"Ten",
		"Eleven",
		"Twelve",
		"Thirteen",
		"Fourteen",
		"Fifteen",
		"Sixteen",
		"Seventeen",
		"Eighteen",
		"Nineteen",
	];
	const b = [
		"",
		"",
		"Twenty",
		"Thirty",
		"Forty",
		"Fifty",
		"Sixty",
		"Seventy",
		"Eighty",
		"Ninety",
	];

	if (num === 0) return "Zero";

	const g = (n: number): string => {
		if (n < 20) return a[n];
		const digit = n % 10;
		return b[Math.floor(n / 10)] + (digit ? "-" + a[digit] : "");
	};

	const h = (n: number): string => {
		if (n >= 100) {
			return (
				a[Math.floor(n / 100)] +
				" Hundred" +
				(n % 100 ? " and " + g(n % 100) : "")
			);
		}
		return g(n);
	};

	let str = "";
	let temp = Math.floor(num);

	if (temp >= 100000) {
		str += h(Math.floor(temp / 100000)) + " Lakh ";
		temp %= 100000;
	}
	if (temp >= 1000) {
		str += h(Math.floor(temp / 1000)) + " Thousand ";
		temp %= 1000;
	}
	if (temp > 0) {
		str += h(temp);
	}
	return str.trim() + " Rupees Only";
}

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
		const pageSizeStyle =
			pageSize === "80mm"
				? `
				@media print { size: 80mm 297mm; margin: 0; }
				body { width: 80mm; margin: 0; padding: 4px; font-family: sans-serif; font-size: 11px; color: #000; }
				#printable-receipt { width: 80mm; margin: 0; padding: 0; }
			`
				: `
				@media print { size: A4 portrait; margin: 20mm; }
				body { width: 100%; margin: 0; padding: 0; font-family: sans-serif; font-size: 13px; color: #000; }
				#printable-receipt { width: 100%; margin: 0; padding: 0; }
			`;

		printWindow.document.write(`
			<html>
				<head>
					<title>Invoice #${order.id}</title>
					<style>
						* { box-sizing: border-box; margin: 0; padding: 0; }
						body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

						/* ── Layout ── */
						.flex { display: flex !important; }
						.flex-col { flex-direction: column !important; }
						.justify-between { justify-content: space-between !important; }
						.justify-end { justify-content: flex-end !important; }
						.items-start { align-items: flex-start !important; }
						.items-end { align-items: flex-end !important; }
						.items-center { align-items: center !important; }
						.shrink-0 { flex-shrink: 0 !important; }
						.gap-1 { gap: 4px !important; }
						.gap-2 { gap: 8px !important; }
						.gap-3 { gap: 12px !important; }
						.gap-4 { gap: 16px !important; }
						.gap-6 { gap: 24px !important; }

						/* ── Widths ── */
						.w-full { width: 100% !important; }
						.w-2\\/3 { width: 66.667% !important; }
						.w-1\\/3 { width: 33.333% !important; }
						.w-7\\/12 { width: 58.333% !important; }
						.w-5\\/12 { width: 41.667% !important; }
						/* Remove fixed pixel column widths - let table auto-size */
						.w-12, .w-20, .w-24, .w-28, .w-48 { width: auto !important; }

						/* Keep the invoice logo at a fixed size (must beat the .w-12 auto rule) */
						.invoice-logo { width: 48px !important; height: 48px !important; min-width: 48px !important; object-fit: cover !important; border-radius: 6px !important; flex-shrink: 0 !important; }

						/* ── Spacing ── */
						.mb-1 { margin-bottom: 4px !important; }
						.mb-2 { margin-bottom: 8px !important; }
						.mb-6 { margin-bottom: 20px !important; }
						.mb-8 { margin-bottom: 28px !important; }
						.mt-1 { margin-top: 4px !important; }
						.mt-0\\.5 { margin-top: 2px !important; }
						.mt-12 { margin-top: 40px !important; }
						.py-2\\.5 { padding-top: 8px !important; padding-bottom: 8px !important; }
						.px-4 { padding-left: 12px !important; padding-right: 12px !important; }
						.p-4 { padding: 12px !important; }
						.pt-6 { padding-top: 20px !important; }
						.pb-1 { padding-bottom: 4px !important; }
						.space-y-1 > * + * { margin-top: 4px !important; }
						.space-y-2 > * + * { margin-top: 8px !important; }

						/* ── Typography ── */
						.font-mono { font-family: monospace !important; }
						.font-bold { font-weight: 700 !important; }
						.font-semibold { font-weight: 600 !important; }
						.font-medium { font-weight: 500 !important; }
						.font-black { font-weight: 900 !important; }
						.text-left { text-align: left !important; }
						.text-center { text-align: center !important; }
						.text-right { text-align: right !important; }
						.text-xs { font-size: 10px !important; }
						.text-sm { font-size: 12px !important; }
						.text-xl { font-size: 18px !important; }
						.text-2xl { font-size: 22px !important; }
						.text-\\[10px\\] { font-size: 9px !important; }
						.uppercase { text-transform: uppercase !important; }
						.tracking-wide { letter-spacing: 0.05em !important; }
						.tracking-wider { letter-spacing: 0.1em !important; }
						.tracking-widest { letter-spacing: 0.15em !important; }
						.leading-none { line-height: 1 !important; }
						.italic { font-style: italic !important; }
						.capitalize { text-transform: capitalize !important; }

						/* ── Colors — NO dark backgrounds to save ink ── */
						.bg-blue-800 { background-color: transparent !important; color: #000 !important; border-bottom: 2px solid #000 !important; }
						.bg-blue-50\\/50, .bg-blue-50 { background-color: transparent !important; }
						.bg-slate-50, .bg-slate-100 { background-color: transparent !important; }
						.bg-green-50 { background-color: transparent !important; }
						.even\\:bg-slate-50\\/50 { background-color: transparent !important; }

						.text-white { color: #000 !important; }
						.text-blue-900 { color: #000 !important; }
						.text-blue-800 { color: #1e40af !important; }
						.text-slate-900 { color: #000 !important; }
						.text-slate-800 { color: #111 !important; }
						.text-slate-700 { color: #333 !important; }
						.text-slate-600 { color: #444 !important; }
						.text-slate-500 { color: #666 !important; }
						.text-slate-400 { color: #888 !important; }
						.text-green-600 { color: #000 !important; }

						/* Status badge */
						[class*="rounded-full"] { border: 1px solid #000 !important; padding: 2px 8px !important; font-weight: 700 !important; background: transparent !important; color: #000 !important; display: inline-block !important; }

						/* ── Borders & Layout containers ── */
						.border { border: 1px solid #ccc !important; }
						.border-t { border-top: 1px solid #ccc !important; }
						.border-b { border-bottom: 1px solid #ccc !important; }
						.border-slate-200, .border-slate-100, .border-blue-100 { border-color: #ccc !important; }
						.border-slate-300 { border-color: #aaa !important; }
						.border-b-0 { border-bottom: none !important; }
						.rounded-xl, .rounded-lg { border-radius: 4px !important; }
						.overflow-hidden { overflow: visible !important; }
						.shadow-xl, .shadow-2xl, .shadow-md { box-shadow: none !important; }
						.h-px { height: 1px !important; background-color: #ccc !important; }

						/* ── Table — auto-layout so columns fit content ── */
						table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; margin-bottom: 12px !important; }
						th {
							padding: 8px 10px !important;
							font-size: 10px !important;
							font-weight: 700 !important;
							text-transform: uppercase !important;
							background-color: transparent !important;
							color: #000 !important;
							border-top: 2px solid #000 !important;
							border-bottom: 2px solid #000 !important;
							text-align: left !important;
							white-space: nowrap !important;
						}
						th.text-center { text-align: center !important; }
						th.text-right { text-align: right !important; }
						td {
							padding: 7px 10px !important;
							vertical-align: top !important;
							font-size: 11px !important;
							border-bottom: 1px solid #eee !important;
							word-break: break-word !important;
							overflow-wrap: anywhere !important;
						}
						td.text-center { text-align: center !important; }
						td.text-right { text-align: right !important; }
						/* Give item name column more space */
						td:nth-child(2) { min-width: 100px !important; }
						/* Compact number columns */
						td:nth-child(1), td:nth-child(3), td:nth-child(4), td:nth-child(5), td:nth-child(6), td:nth-child(7) { white-space: nowrap !important; }

						/* ── Dividers ── */
						.divide-y > * + * { border-top: 1px solid #eee !important; }
						.divide-y.divide-black\\/20 > * + * { border-top: 1px solid #ccc !important; }
						hr { border: none !important; border-top: 1px solid #ccc !important; margin: 10px 0 !important; }
						.h-px.bg-slate-200, .h-px.print\\:bg-black { display: block !important; height: 1px !important; background: #000 !important; width: 100% !important; margin: 6px 0 !important; }

						/* ── Signatory line ── */
						.border-b.border-slate-300 { border-bottom: 1px solid #000 !important; }

						/* ── SVG icons (store icon in header) ── */
						svg { display: inline-block !important; width: 1em !important; height: 1em !important; }

						@media print {
							body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
							th { background-color: transparent !important; }
						}
					</style>
				</head>
				<body>
					<div id="printable-receipt">
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

	const generateInvoicePdfBlob = async (overridePageSize?: "A4" | "80mm") => {
		const { pdf, Document, Page, Text, View, StyleSheet, Font, Image } =
			await import("@react-pdf/renderer");

		try {
			Font.register({
				family: "NotoSansDevanagari",
				src: `${window.location.origin}/fonts/NotoSansDevanagari-Regular.ttf`,
			});
		} catch (e) {
			console.warn("Font registration failed, using fallback.", e);
		}

		const activePageSize = overridePageSize || pageSize;
		const isA4 = activePageSize === "A4";
		const calculatedHeight =
			activePageSize === "80mm"
				? Math.max(
						140,
						110 +
							order.items.length * 12 +
							(order.customerName ? 20 : 0) +
							order.payments.length * 5,
					)
				: 297;

		const styles = StyleSheet.create({
			page: {
				fontFamily: "NotoSansDevanagari",
				padding: isA4 ? 30 : 10,
				fontSize: isA4 ? 11 : 9,
				backgroundColor: "#ffffff",
				color: "#1e293b",
			},
			topBar: {
				height: 6,
				backgroundColor: "#1e40af",
				marginBottom: 20,
			},
			header: {
				flexDirection: isA4 ? "row" : "column",
				justifyContent: "space-between",
				alignItems: isA4 ? "flex-start" : "center",
				marginBottom: 15,
			},
			storeInfo: {
				textAlign: isA4 ? "left" : "center",
			},
			invoiceMeta: {
				textAlign: isA4 ? "right" : "center",
				marginTop: isA4 ? 0 : 6,
			},
			title: {
				fontSize: isA4 ? 20 : 12,
				fontWeight: "bold",
				color: isA4 ? "#1e3a8a" : "#000000",
				marginBottom: 4,
			},
			metaTitle: {
				fontSize: isA4 ? 14 : 10,
				fontWeight: "bold",
				color: isA4 ? "#1e40af" : "#000000",
				marginBottom: 4,
			},
			subtitle: {
				fontSize: isA4 ? 9 : 8,
				color: "#64748b",
				marginBottom: 2,
			},
			separator: {
				borderBottomWidth: 1,
				borderBottomStyle: "dashed",
				borderBottomColor: isA4 ? "#cbd5e1" : "#000000",
				marginVertical: 10,
			},
			cardsContainer: {
				flexDirection: "row",
				gap: 15,
				marginBottom: 15,
			},
			card: {
				flex: 1,
				backgroundColor: "#f8fafc",
				borderWidth: 1,
				borderColor: "#e2e8f0",
				borderRadius: 6,
				padding: 10,
			},
			cardTitle: {
				fontSize: 9,
				fontWeight: "bold",
				color: "#1e40af",
				textTransform: "uppercase",
				marginBottom: 6,
				borderBottomWidth: 1,
				borderBottomColor: "#e2e8f0",
				paddingBottom: 2,
			},
			row: {
				flexDirection: "row",
				justifyContent: "space-between",
				marginBottom: 3,
			},
			bold: {
				fontWeight: "bold",
			},
			tableContainer: isA4
				? {
						borderWidth: 1,
						borderColor: "#e5e7eb",
						borderRadius: 8,
						overflow: "hidden",
						marginBottom: 10,
					}
				: {},
			tableHeader: {
				flexDirection: "row",
				backgroundColor: isA4 ? "#1d4ed8" : "transparent",
				borderBottomWidth: isA4 ? 0 : 1,
				borderBottomStyle: "dashed",
				borderBottomColor: "#000000",
				padding: isA4 ? 10 : 4,
				marginBottom: isA4 ? 0 : 4,
			},
			tableRow: {
				flexDirection: "row",
				borderBottomWidth: 1,
				borderBottomColor: isA4 ? "#e5e7eb" : "transparent",
				paddingVertical: isA4 ? 10 : 2,
				paddingHorizontal: isA4 ? 10 : 0,
				marginBottom: isA4 ? 0 : 2,
			},
			colNum: { width: "5%", textAlign: "center" },
			colItem: { flex: 3 },
			colSku: { width: "15%", textAlign: "center" },
			colQty: { width: "10%", textAlign: "center" },
			colRate: { width: "15%", textAlign: "center" },
			colDiscount: { width: "12%", textAlign: "center" },
			colTotal: { width: "15%", textAlign: "right" },
			thText: {
				color: isA4 ? "#ffffff" : "#000000",
				fontWeight: "bold",
				fontSize: isA4 ? 9 : 9,
			},
			tdText: {
				fontSize: isA4 ? 9 : 9,
				color: "#475569",
			},
			summaryWrapper: {
				flexDirection: "row",
				justifyContent: "space-between",
				marginTop: 10,
				gap: 20,
			},
			amountInWordsCard: {
				flex: 1,
				borderWidth: 1,
				borderColor: "#e5e7eb",
				borderRadius: 6,
				padding: 10,
				height: 50,
			},
			summaryBlock: {
				width: 200,
			},
			footer: {
				textAlign: "center",
				marginTop: 20,
				fontSize: isA4 ? 9 : 7.5,
				color: "#64748b",
			},
		});

		const InvoiceDocument = () => (
			<Document>
				<Page
					size={
						activePageSize === "80mm"
							? [226.77, calculatedHeight * 2.834]
							: "A4"
					}
					style={styles.page}
				>
					{isA4 ? <View style={styles.topBar} /> : null}
					{/* Header */}
					<View style={styles.header}>
						<View
							style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
						>
							<Image
								src={`${typeof window !== "undefined" ? window.location.origin : ""}/logo.jpg`}
								style={{ width: 40, height: 40, borderRadius: 8 }}
							/>
							<View style={styles.storeInfo}>
								<Text style={styles.title}>{STORE.name}</Text>
								<Text style={styles.subtitle}>{STORE.address}</Text>
								<Text style={styles.subtitle}>{STORE.city}</Text>
								<Text style={styles.subtitle}>Phone: {STORE.phone}</Text>
							</View>
						</View>
						<View style={styles.invoiceMeta}>
							<Text style={styles.metaTitle}>INVOICE</Text>
							<Text style={styles.subtitle}>Invoice #: {order.id}</Text>
							<Text style={styles.subtitle}>Date: {formattedDate}</Text>
							<Text style={styles.subtitle}>
								Cashier: {order.cashierName || "Counter 1"}
							</Text>
						</View>
					</View>
					{isA4 ? (
						<View style={styles.cardsContainer}>
							<View style={styles.card}>
								<Text style={styles.cardTitle}>Customer Details</Text>
								{order.customerName || order.customerPhone || order.shopName ? (
									<>
										{order.customerName ? (
											<Text
												style={[styles.bold, { fontSize: 10, marginBottom: 2 }]}
											>
												{order.customerName}
											</Text>
										) : null}
										{order.shopName ? (
											<Text style={styles.subtitle}>
												Shop: {order.shopName}
											</Text>
										) : null}
										{order.customerPhone ? (
											<Text style={styles.subtitle}>
												Phone: {order.customerPhone}
											</Text>
										) : null}
										{order.village ? (
											<Text style={styles.subtitle}>
												Village: {order.village}
											</Text>
										) : null}
										{order.address ? (
											<Text style={styles.subtitle}>
												Address: {order.address}
											</Text>
										) : null}
									</>
								) : (
									<Text style={styles.subtitle}>Walk-in Customer</Text>
								)}
							</View>
							<View style={styles.card}>
								<Text style={styles.cardTitle}>Payment Details</Text>
								<View style={styles.row}>
									<Text style={styles.subtitle}>Status:</Text>
									<Text
										style={[
											styles.bold,
											{
												fontSize: 10,
												color: status.label === "PAID" ? "#16a34a" : "#ca8a04",
											},
										]}
									>
										{status.label}
									</Text>
								</View>
								<View style={styles.row}>
									<Text style={styles.subtitle}>Method:</Text>
									<Text style={styles.subtitle}>
										{order.payments
											.map(
												(p) => PAYMENT_METHOD_LABELS[p.methodId] ?? "Payment",
											)
											.join(", ")}
									</Text>
								</View>
							</View>
						</View>
					) : (
						<>
							<View style={styles.separator} />
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

							{order.customerName || order.customerPhone || order.shopName ? (
								<>
									<View style={styles.separator} />
									<Text style={[styles.bold, { marginBottom: 4 }]}>
										BILL TO:
									</Text>
									{order.customerName ? (
										<View style={styles.row}>
											<Text>Name:</Text>
											<Text>{order.customerName}</Text>
										</View>
									) : null}
									{order.shopName ? (
										<View style={styles.row}>
											<Text>Shop:</Text>
											<Text>{order.shopName}</Text>
										</View>
									) : null}
									{order.customerPhone ? (
										<View style={styles.row}>
											<Text>Phone:</Text>
											<Text>{order.customerPhone}</Text>
										</View>
									) : null}
									{order.village ? (
										<View style={styles.row}>
											<Text>Village:</Text>
											<Text>{order.village}</Text>
										</View>
									) : null}
									{order.address ? (
										<View style={styles.row}>
											<Text>Address:</Text>
											<Text>{order.address}</Text>
										</View>
									) : null}
								</>
							) : null}
						</>
					)}
					<View style={styles.separator} />
					<View style={styles.tableContainer}>
						{/* Table Header */}
						<View style={styles.tableHeader}>
							{isA4 ? (
								<Text style={[styles.colNum, styles.thText]}>#</Text>
							) : null}
							<Text style={[styles.colItem, styles.thText]}>
								Item Description
							</Text>
							{isA4 ? (
								<Text style={[styles.colSku, styles.thText]}>SKU</Text>
							) : null}
							<Text style={[styles.colQty, styles.thText]}>Qty</Text>
							<Text style={[styles.colRate, styles.thText]}>Unit Price</Text>
							{isA4 ? (
								<Text style={[styles.colDiscount, styles.thText]}>
									Discount
								</Text>
							) : null}
							<Text style={[styles.colTotal, styles.thText]}>Total</Text>
						</View>

						{/* Table Items */}
						{order.items.map((item, idx) => {
							const rate = Number.parseFloat(item.price);
							const lineTotal = rate * item.qty;
							const qtyStr = Number.isInteger(item.qty)
								? item.qty.toString()
								: item.qty.toFixed(3);
							return (
								<View key={idx} style={styles.tableRow}>
									{isA4 ? (
										<Text style={[styles.colNum, styles.tdText]}>
											{idx + 1}
										</Text>
									) : null}
									<View style={styles.colItem}>
										<Text style={styles.tdText}>{item.name}</Text>
									</View>
									{isA4 ? (
										<Text
											style={[
												styles.colSku,
												styles.tdText,
												{ fontSize: 7, color: "#94a3b8" },
											]}
										>
											SKU-{item.id}
										</Text>
									) : null}
									<Text
										style={[
											styles.colQty,
											styles.tdText,
											styles.bold,
											{ color: "#000000" },
										]}
									>
										{qtyStr}
									</Text>
									<Text style={[styles.colRate, styles.tdText]}>
										Rs.{rate.toFixed(2)}
									</Text>
									{isA4 ? (
										<Text
											style={[
												styles.colDiscount,
												styles.tdText,
												{ color: "#10b981" },
											]}
										>
											-
										</Text>
									) : null}
									<Text
										style={[
											styles.colTotal,
											styles.tdText,
											styles.bold,
											{ color: "#000000" },
										]}
									>
										Rs.{lineTotal.toFixed(2)}
									</Text>
								</View>
							);
						})}
					</View>
					{/* Summary */}
					{isA4 ? (
						<View style={styles.summaryWrapper}>
							<View style={styles.amountInWordsCard}>
								<Text style={styles.cardTitle}>Amount in Words</Text>
								<Text style={[styles.bold, { fontSize: 10 }]}>
									{numberToWords(grandTotal)} Rupees Only
								</Text>
							</View>
							<View style={styles.summaryBlock}>
								<View style={styles.row}>
									<Text style={styles.tdText}>Subtotal:</Text>
									<Text style={styles.tdText}>
										Rs.{order.subtotal.toFixed(2)}
									</Text>
								</View>
								{order.discount > 0 ? (
									<View style={styles.row}>
										<Text style={styles.tdText}>Discount:</Text>
										<Text style={styles.tdText}>
											-Rs.{order.discount.toFixed(2)}
										</Text>
									</View>
								) : null}
								{roundOff !== 0 ? (
									<View style={styles.row}>
										<Text style={styles.tdText}>Round-off:</Text>
										<Text style={styles.tdText}>
											{roundOff > 0 ? "+" : ""}Rs.{roundOff.toFixed(2)}
										</Text>
									</View>
								) : null}
								<View
									style={[
										styles.row,
										{
											marginTop: 6,
											paddingTop: 6,
											borderTopWidth: 1,
											borderTopColor: "#e5e7eb",
										},
									]}
								>
									<Text
										style={[styles.bold, { fontSize: 12, color: "#1d4ed8" }]}
									>
										Grand Total:
									</Text>
									<Text
										style={[styles.bold, { fontSize: 12, color: "#1d4ed8" }]}
									>
										Rs.{grandTotal.toFixed(2)}
									</Text>
								</View>
							</View>
						</View>
					) : (
						<View style={styles.summaryWrapper}>
							<View style={[styles.summaryBlock, { width: "100%" }]}>
								<View style={styles.row}>
									<Text style={styles.subtitle}>Subtotal:</Text>
									<Text style={styles.subtitle}>
										Rs.{order.subtotal.toFixed(2)}
									</Text>
								</View>
								{order.discount > 0 ? (
									<View style={styles.row}>
										<Text style={styles.subtitle}>Discount:</Text>
										<Text style={styles.subtitle}>
											-Rs.{order.discount.toFixed(2)}
										</Text>
									</View>
								) : null}
								{roundOff !== 0 ? (
									<View style={styles.row}>
										<Text style={styles.subtitle}>Round-off:</Text>
										<Text style={styles.subtitle}>
											{roundOff > 0 ? "+" : ""}Rs.{roundOff.toFixed(2)}
										</Text>
									</View>
								) : null}
								<View
									style={[
										styles.row,
										{
											marginTop: 6,
											paddingTop: 4,
											borderTopWidth: 1,
											borderTopColor: "#cbd5e1",
										},
									]}
								>
									<Text style={[styles.bold, { fontSize: 10 }]}>
										Grand Total:
									</Text>
									<Text style={[styles.bold, { fontSize: 10 }]}>
										Rs.{grandTotal.toFixed(2)}
									</Text>
								</View>
							</View>
						</View>
					)}
					{/* Footer */}
					{isA4 ? (
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "flex-end",
								marginTop: 40,
								borderTopWidth: 1,
								borderTopColor: "#e5e7eb",
								paddingTop: 20,
							}}
						>
							<View>
								<Text
									style={[
										styles.bold,
										{
											fontSize: 9,
											color: "#475569",
											marginBottom: 6,
											textTransform: "uppercase",
										},
									]}
								>
									Terms & Conditions
								</Text>
								<Text
									style={{ fontSize: 8, color: "#94a3b8", marginBottom: 4 }}
								>
									• Goods once sold will not be taken back without valid receipt
									within 7 days.
								</Text>
								<Text style={{ fontSize: 8, color: "#94a3b8" }}>
									• This is a computer generated invoice and requires no
									physical signature.
								</Text>
							</View>
							<View style={{ alignItems: "center" }}>
								<View
									style={{
										width: 120,
										borderBottomWidth: 1,
										borderBottomColor: "#cbd5e1",
										marginBottom: 6,
									}}
								/>
								<Text style={{ fontSize: 9, color: "#64748b" }}>
									Authorized Signatory
								</Text>
							</View>
						</View>
					) : (
						<View style={styles.footer}>
							<Text
								style={[
									styles.bold,
									{ marginBottom: 2, fontSize: 8, color: "#1e3a8a" },
								]}
							>
								Thank you for shopping!
							</Text>
							<Text>
								Goods once sold will not be taken back without valid receipt
								within 7 days
							</Text>
						</View>
					)}
				</Page>
			</Document>
		);

		return await pdf(<InvoiceDocument />).toBlob();
	};

	const handleDownloadPDF = async () => {
		const toastId = toast.loading("Generating vector PDF...");
		try {
			const blob = await generateInvoicePdfBlob(pageSize);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `Invoice-${order.id}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Vector PDF downloaded successfully!", { id: toastId });
		} catch (err: any) {
			console.error("PDF generation error:", err);
			toast.error(
				`Failed: ${err?.message || "Error"}. Try 'Print Receipt' -> 'Save as PDF'`,
				{ id: toastId },
			);
		}
	};

	const handleWhatsApp = async () => {
		const toastId = toast.loading("Preparing PDF for WhatsApp...");
		try {
			const blob = await generateInvoicePdfBlob("A4");
			const fileName = `Invoice-${order.id}.pdf`;
			const file = new File([blob], fileName, { type: "application/pdf" });

			// If on mobile/tablet browser supporting sharing files directly:
			if (
				navigator.share &&
				navigator.canShare &&
				navigator.canShare({ files: [file] })
			) {
				await navigator.share({
					files: [file],
					title: `Invoice #${order.id}`,
					text: `Here is your invoice from ${STORE.name}`,
				});
				toast.success("PDF Shared successfully!", { id: toastId });
				return;
			}

			// Desktop / Web browser fallback: Auto-download the PDF and redirect to WhatsApp Web
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Invoice PDF downloaded!", { id: toastId });
			toast.info(
				"Opening WhatsApp. Drag & drop the downloaded 'Invoice-" +
					order.id +
					".pdf' file to send.",
				{ duration: 8000 },
			);

			const shareText = `Invoice #${order.id} from ${STORE.name} has been generated. Please find the attached PDF.`;
			setTimeout(() => {
				window.open(
					`https://wa.me/?text=${encodeURIComponent(shareText)}`,
					"_blank",
				);
			}, 2000);
		} catch (err: any) {
			console.error("WhatsApp share error:", err);
			toast.error("Could not prepare PDF for sharing.", { id: toastId });
		}
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
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4"
			>
				{/* Global style overrides for printing */}
				<style
					dangerouslySetInnerHTML={{
						__html: `
					@media print {
						body {
							background: #ffffff !important;
							overflow: visible !important;
						}
						.print\\:hidden {
							display: none !important;
						}
						#printable-receipt {
							display: block !important;
							margin: 0 auto !important;
							padding: 0 !important;
							border: none !important;
							box-shadow: none !important;
							width: ${pageSize === "A4" ? "210mm" : "80mm"} !important;
							${
								pageSize === "80mm"
									? `
								font-family: 'Courier New', Courier, monospace !important;
								text-align: left !important;
								color: #000000 !important;
							`
									: ""
							}
						}
						${
							pageSize === "80mm"
								? `
							#printable-receipt * {
								font-family: 'Courier New', Courier, monospace !important;
								color: #000000 !important;
							}
							#printable-receipt .text-left { text-align: left !important; }
							#printable-receipt .text-center { text-align: center !important; }
							#printable-receipt .text-right { text-align: right !important; }
							#printable-receipt .border-dashed, 
							#printable-receipt tr.border-b.border-dashed, 
							#printable-receipt div.border-t.border-dashed {
								border-style: dashed !important;
								border-color: #000000 !important;
								border-width: 0 0 1px 0 !important;
								display: block;
								width: 100%;
							}
							#printable-receipt table tr.border-b.border-dashed {
								display: table-row !important;
							}
						`
								: ""
						}
						* {
							-webkit-print-color-adjust: exact !important;
							print-color-adjust: exact !important;
						}
						tr, .summary-block, .footer-block {
							page-break-inside: avoid;
						}
						@page {
							margin: ${pageSize === "A4" ? "5mm" : "0"};
							size: ${pageSize === "A4" ? "A4 portrait" : "80mm 297mm"};
						}
					}
				`,
					}}
				/>

				<motion.div
					initial={{ scale: 0.92, opacity: 0, y: 20 }}
					animate={{ scale: 1, opacity: 1, y: 0 }}
					exit={{ scale: 0.92, opacity: 0 }}
					transition={{ type: "spring", damping: 22, stiffness: 300 }}
					className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:h-auto sm:max-h-[95vh] sm:rounded-2xl"
				>
					{/* ── Screen Control Bar (Hidden on Print) ── */}
					<div className="flex shrink-0 flex-col items-center justify-between gap-3 bg-blue-900 px-4 py-3 text-white sm:flex-row sm:gap-4 sm:px-6 sm:py-4 print:hidden">
						<div className="flex w-full items-center gap-3 sm:w-auto">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white shadow-inner">
								<IndianRupee className="h-5 w-5 text-blue-200" />
							</div>
							<div>
								<div className="font-black text-base leading-none tracking-tight">
									Billing Checkout
								</div>
								<div className="mt-1 text-blue-300 text-xs">
									Invoice #{order.id} generated
								</div>
							</div>
						</div>

						{/* Format Selector Tabs */}
						<div className="flex w-full justify-center rounded-lg border border-blue-800 bg-blue-950/80 p-0.5 sm:w-auto">
							<button
								type="button"
								onClick={() => setPageSize("A4")}
								className={`flex-1 cursor-pointer rounded-md px-4 py-1.5 text-center font-bold text-xs transition-all sm:flex-none ${
									pageSize === "A4"
										? "bg-blue-800 text-white shadow-sm"
										: "text-blue-300 hover:text-white"
								}`}
							>
								A4 Sheet
							</button>
							<button
								type="button"
								onClick={() => setPageSize("80mm")}
								className={`flex-1 cursor-pointer rounded-md px-4 py-1.5 text-center font-bold text-xs transition-all sm:flex-none ${
									pageSize === "80mm"
										? "bg-blue-800 text-white shadow-sm"
										: "text-blue-300 hover:text-white"
								}`}
							>
								80mm Thermal
							</button>
						</div>

						{/* Top Actions */}
						<div className="flex w-full items-center justify-end gap-2 sm:w-auto">
							<Button
								variant="ghost"
								size="sm"
								className="gap-1.5 text-white hover:bg-blue-800"
								onClick={handlePrint}
							>
								<Printer className="h-4 w-4" />
								Print
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1.5 text-white hover:bg-blue-800"
								onClick={handleDownloadPDF}
							>
								<Download className="h-4 w-4" />
								PDF
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-blue-200 hover:bg-blue-800 hover:text-white"
								onClick={onNewSale}
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</div>

					<div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
						{/* ── Center-Aligned Interactive Preview Canvas ── */}
						<div className="flex h-[45vh] min-h-0 shrink-0 overflow-auto bg-slate-100 p-3 sm:p-6 md:h-auto md:flex-1 md:shrink print:bg-white print:p-0">
							<div className="m-auto flex min-h-full min-w-max items-center justify-center print:m-0 print:block">
								<motion.div
									id="printable-receipt"
									ref={receiptRef}
									layout
									animate={{
										width: pageSize === "A4" ? "210mm" : "80mm",
									}}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
									className={`paper-sheet mx-auto border border-slate-200 bg-white shadow-xl print:border-none print:shadow-none ${
										pageSize === "A4"
											? "p-[20mm] text-slate-800 text-sm"
											: "p-4 font-mono text-[11px] text-black leading-tight"
									}`}
									style={{ color: "#000" }}
								>
									{pageSize === "A4" ? (
										<div className="w-full text-left">
											{/* Top Accent Bar */}
											<div
												className="-mx-[20mm] -mt-[20mm] mb-8 h-2 w-full bg-blue-800"
												style={{ width: "calc(100% + 40mm)" }}
											/>

											{/* Header */}
											<div className="mb-6 flex items-start justify-between">
												<div className="flex items-center gap-3">
													<img
														src="/logo.jpg"
														alt={STORE.name}
														className="invoice-logo h-12 w-12 shrink-0 rounded-lg object-cover"
													/>
													<div>
														<h1 className="font-black text-2xl text-blue-900 tracking-tight">
															{STORE.name}
														</h1>
														<p className="mt-0.5 text-slate-500 text-xs">
															{STORE.address}
														</p>
														<p className="text-slate-500 text-xs">
															{STORE.city}
														</p>
													</div>
												</div>
												<div className="text-right">
													<div className="mb-1 font-bold text-[10px] text-blue-800 uppercase tracking-widest">
														Bill Invoice
													</div>
													<h2 className="font-black text-slate-900 text-xl">
														#{order.id}
													</h2>
													<p className="mt-1 text-slate-500 text-xs">
														{formattedDate}
													</p>
													<p className="mt-0.5 text-[10px] text-slate-400">
														Cashier: {order.cashierName || "Counter 1"}
													</p>
												</div>
											</div>

											{/* Meta & Status Card */}
											<div className="mb-6 flex w-full gap-4">
												<div className="w-2/3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 print:border-slate-300 print:bg-transparent">
													<div className="mb-2 font-bold text-blue-900 text-xs uppercase tracking-wider print:text-black">
														Customer Details
													</div>
													{order.customerName ||
													order.customerPhone ||
													order.shopName ? (
														<div className="space-y-1 text-slate-700 text-xs print:text-black">
															{order.customerName && (
																<div className="font-semibold text-slate-900 print:text-black">
																	{order.customerName}
																</div>
															)}
															{order.shopName && (
																<div>
																	<span className="text-slate-400 print:text-slate-600">
																		Shop:
																	</span>{" "}
																	{order.shopName}
																</div>
															)}
															{order.customerPhone && (
																<div>
																	<span className="text-slate-400 print:text-slate-600">
																		Phone:
																	</span>{" "}
																	{order.customerPhone}
																</div>
															)}
															{order.village && (
																<div>
																	<span className="text-slate-400 print:text-slate-600">
																		Village:
																	</span>{" "}
																	{order.village}
																</div>
															)}
															{order.address && (
																<div>
																	<span className="text-slate-400 print:text-slate-600">
																		Address:
																	</span>{" "}
																	{order.address}
																</div>
															)}
														</div>
													) : (
														<div className="text-slate-400 text-xs italic">
															Walk-in Customer
														</div>
													)}
												</div>
												<div className="flex w-1/3 flex-col items-end justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4 print:border-slate-300 print:bg-transparent">
													<span className="font-bold text-blue-900 text-xs uppercase tracking-wider print:text-black">
														Payment Status
													</span>
													<span
														className={`inline-flex items-center rounded-full border px-3 py-1 font-bold text-xs ${
															status.label === "PAID"
																? "border-green-200 bg-green-50 text-green-700 print:border-black print:text-black"
																: status.label === "PARTIAL"
																	? "border-yellow-200 bg-yellow-50 text-yellow-700 print:border-black print:text-black"
																	: "border-red-200 bg-red-50 text-red-700 print:border-black print:text-black"
														}`}
													>
														{status.label}
													</span>
												</div>
											</div>

											{/* Itemized Table */}
											<div className="mb-6 overflow-hidden rounded-xl border border-slate-200 print:border-black">
												<table className="w-full border-collapse text-xs">
													<thead>
														<tr className="bg-blue-800 text-left font-semibold text-white print:border-black print:border-b print:bg-transparent print:text-black">
															<th className="w-12 border-transparent border-b px-4 py-2.5 text-center print:border-black">
																#
															</th>
															<th className="border-transparent border-b px-4 py-2.5 print:border-black">
																Item Description
															</th>
															<th className="w-24 border-transparent border-b px-4 py-2.5 print:border-black">
																SKU
															</th>
															<th className="w-20 border-transparent border-b px-4 py-2.5 text-center print:border-black">
																Qty
															</th>
															<th className="w-24 border-transparent border-b px-4 py-2.5 text-right print:border-black">
																Unit Price
															</th>
															<th className="w-20 border-transparent border-b px-4 py-2.5 text-right print:border-black">
																Discount
															</th>
															<th className="w-28 border-transparent border-b px-4 py-2.5 text-right print:border-black">
																Total
															</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-slate-100 print:divide-black/20">
														{order.items.map((item, idx) => {
															const rate = Number.parseFloat(item.price);
															const lineTotal = rate * item.qty;
															return (
																<tr
																	key={idx}
																	className="transition-colors even:bg-slate-50/50 hover:bg-slate-50/30 print:even:bg-transparent"
																>
																	<td className="px-4 py-2.5 text-center font-medium text-slate-400 print:text-slate-800">
																		{idx + 1}
																	</td>
																	<td className="px-4 py-2.5 font-medium text-slate-800 print:text-black">
																		{item.name}
																	</td>
																	<td className="px-4 py-2.5 font-mono text-[10px] text-slate-500 print:text-slate-800">
																		SKU-{item.id}
																	</td>
																	<td className="px-4 py-2.5 text-center font-semibold text-slate-700 print:text-black">
																		{Number.isInteger(item.qty)
																			? item.qty
																			: item.qty.toFixed(3)}
																	</td>
																	<td className="px-4 py-2.5 text-right text-slate-600 print:text-black">
																		₹{rate.toFixed(2)}
																	</td>
																	<td className="px-4 py-2.5 text-right text-green-600 print:text-black">
																		-
																	</td>
																	<td className="px-4 py-2.5 text-right font-semibold text-slate-900 print:text-black">
																		₹{lineTotal.toFixed(2)}
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>

											{/* Summary Flex */}
											<div className="mb-8 flex w-full items-start gap-6">
												<div className="w-7/12 rounded-xl border border-slate-100 bg-slate-50 p-4 print:border-transparent print:bg-transparent">
													<div className="mb-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider print:text-black">
														Amount in Words
													</div>
													<div className="font-semibold text-slate-700 text-xs capitalize leading-relaxed print:text-black">
														{numberToWords(grandTotal)}
													</div>
												</div>
												<div className="w-5/12 space-y-2 text-xs">
													<div className="flex justify-between text-slate-500 print:text-black">
														<span>Subtotal</span>
														<span>₹{order.subtotal.toFixed(2)}</span>
													</div>
													{order.discount > 0 && (
														<div className="flex justify-between font-medium text-green-600 print:text-black">
															<span>
																Discount{" "}
																{order.couponCode
																	? `(${order.couponCode})`
																	: ""}
															</span>
															<span>− ₹{order.discount.toFixed(2)}</span>
														</div>
													)}
													{roundOff !== 0 && (
														<div className="flex justify-between text-slate-500 print:text-black">
															<span>Round-off</span>
															<span>
																{roundOff > 0 ? "+" : ""}₹{roundOff.toFixed(2)}
															</span>
														</div>
													)}
													<div className="my-2 h-px bg-slate-200 print:bg-black" />
													<div className="flex justify-between font-black text-blue-900 text-sm print:text-black">
														<span>Grand Total</span>
														<span>₹{grandTotal.toFixed(2)}</span>
													</div>
												</div>
											</div>

											{/* Footer */}
											<div className="mt-12 flex items-end justify-between border-slate-200 border-t pt-6 print:border-black">
												<div className="space-y-1.5 text-[10px] text-slate-400">
													<div className="font-bold text-slate-500 uppercase tracking-wide">
														Terms & Conditions
													</div>
													<p>
														• Goods once sold will not be taken back without
														valid receipt within 7 days.
													</p>
													<p>
														• This is a computer generated invoice and requires
														no physical signature.
													</p>
												</div>
												<div className="space-y-6 text-right">
													<div className="inline-block w-48 border-slate-300 border-b pb-1 text-center font-medium text-slate-500 text-xs italic">
														Authorized Signatory
													</div>
												</div>
											</div>
										</div>
									) : (
										<div className="mx-auto w-full max-w-[302px] text-center font-mono text-[11px] text-black leading-tight">
											{/* Centered Header */}
											<div className="mb-2 space-y-1">
												<h2 className="font-bold text-xs uppercase tracking-wide">
													{STORE.name}
												</h2>
												<p className="text-[10px]">{STORE.address}</p>
												<p className="text-[10px]">{STORE.city}</p>
												<p className="text-[10px]">PHONE: {STORE.phone}</p>
											</div>

											<div className="my-2 border-slate-900 border-t border-dashed" />

											{/* Meta Info */}
											<div className="space-y-0.5 text-left">
												<div>INVOICE: #{order.id}</div>
												<div>DATE: {formattedDate}</div>
												<div>CASHIER: {order.cashierName || "Counter 1"}</div>
												<div className="font-bold">STATUS: {status.label}</div>
											</div>

											{order.customerName && (
												<>
													<div className="my-2 border-slate-900 border-t border-dashed" />
													<div className="space-y-0.5 text-left">
														<div className="font-bold">BILL TO:</div>
														<div>NAME: {order.customerName}</div>
														{order.shopName && (
															<div>SHOP: {order.shopName}</div>
														)}
														{order.customerPhone && (
															<div>PHONE: {order.customerPhone}</div>
														)}
														{order.village && (
															<div>VILLAGE: {order.village}</div>
														)}
														{order.address && (
															<div>ADDRESS: {order.address}</div>
														)}
													</div>
												</>
											)}

											<div className="my-2 border-slate-900 border-t border-dashed" />

											{/* 3-Column Table */}
											<table className="w-full text-left text-[11px]">
												<thead>
													<tr className="border-slate-900 border-b border-dashed font-bold">
														<th className="py-1">ITEM</th>
														<th className="w-12 py-1 text-center">QTY</th>
														<th className="w-16 py-1 text-right">TOTAL</th>
													</tr>
												</thead>
												<tbody>
													{order.items.map((item, idx) => {
														const rate = Number.parseFloat(item.price);
														const lineTotal = rate * item.qty;
														return (
															<tr
																key={idx}
																className="border-slate-300 border-b border-dashed align-top last:border-b-0"
															>
																<td className="py-2">
																	<div className="font-bold leading-tight">
																		{item.name}
																	</div>
																	<div className="mt-0.5 pl-1 text-[10px] text-slate-600">
																		{Number.isInteger(item.qty)
																			? item.qty
																			: item.qty.toFixed(3)}{" "}
																		x Rs.{rate.toFixed(2)}
																	</div>
																</td>
																<td className="py-2 text-center align-middle">
																	{Number.isInteger(item.qty)
																		? item.qty
																		: item.qty.toFixed(3)}
																</td>
																<td className="py-2 text-right align-middle font-medium">
																	Rs.{lineTotal.toFixed(2)}
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>

											<div className="my-2 border-slate-900 border-t border-dashed" />

											{/* Summary */}
											<div className="space-y-1 text-left">
												<div className="flex justify-between">
													<span>SUBTOTAL:</span>
													<span>Rs.{order.subtotal.toFixed(2)}</span>
												</div>
												{order.discount > 0 && (
													<div className="flex justify-between">
														<span>DISCOUNT:</span>
														<span>-Rs.{order.discount.toFixed(2)}</span>
													</div>
												)}
												{roundOff !== 0 && (
													<div className="flex justify-between">
														<span>ROUND-OFF:</span>
														<span>
															{roundOff > 0 ? "+" : ""}Rs.{roundOff.toFixed(2)}
														</span>
													</div>
												)}
												<div className="my-1 border-slate-900 border-t border-dashed" />
												<div className="flex justify-between font-bold text-[11px]">
													<span>GRAND TOTAL:</span>
													<span>Rs.{grandTotal.toFixed(2)}</span>
												</div>
											</div>

											<div className="my-2 border-slate-900 border-t border-dashed" />

											{/* Footer */}
											<div className="space-y-0.5">
												<p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
												<p>Goods once sold will not be taken back</p>
												<p>without valid receipt within 7 days.</p>
											</div>
										</div>
									)}
								</motion.div>
							</div>
						</div>

						{/* ── Right Actions Panel ── */}
						<div className="flex w-full shrink-0 flex-col gap-3 border-slate-200 border-t bg-slate-50 p-4 md:w-64 md:overflow-y-auto md:border-t-0 md:border-l print:hidden">
							<div className="mb-1 font-bold text-slate-400 text-xs uppercase tracking-wider">
								Actions
							</div>

							<Button
								size="lg"
								className="h-12 w-full bg-blue-800 font-bold text-base text-white shadow-md hover:bg-blue-900"
								onClick={onNewSale}
							>
								<ShoppingBag className="mr-2 h-5 w-5" />
								New Sale
							</Button>

							<hr className="my-1 border-slate-200" />
							<div className="font-bold text-slate-400 text-xs uppercase tracking-wider">
								Print &amp; Share
							</div>

							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handlePrint}
							>
								<Printer className="h-4 w-4 text-blue-800" />
								Print Receipt
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handlePrint}
							>
								<RotateCcw className="h-4 w-4 text-blue-800" />
								Reprint
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handleDownloadPDF}
							>
								<Download className="h-4 w-4 text-blue-800" />
								Download PDF
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handleWhatsApp}
							>
								<MessageCircle className="h-4 w-4 text-green-600" />
								Send WhatsApp
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handleEmail}
							>
								<Mail className="h-4 w-4 text-blue-500" />
								Send Email
							</Button>

							<hr className="my-1 border-slate-200" />
							<div className="font-bold text-slate-400 text-xs uppercase tracking-wider">
								Invoice Actions
							</div>

							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handleDuplicate}
							>
								<Copy className="h-4 w-4 text-slate-500" />
								Duplicate Invoice
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handleReturn}
							>
								<ArrowLeftRight className="h-4 w-4 text-orange-500" />
								Return Items
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-slate-200 font-semibold text-slate-700 text-xs hover:bg-blue-50 hover:text-blue-900"
								onClick={handleExchange}
							>
								<ArrowLeftRight className="h-4 w-4 text-purple-500" />
								Exchange Items
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 border-red-200 font-semibold text-red-600 text-xs hover:bg-red-50 hover:text-red-700"
								onClick={handleCancel}
							>
								<XCircle className="h-4 w-4" />
								Cancel Invoice
							</Button>
						</div>
					</div>

					{/* ── Bottom Info Bar ── */}
					<div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-slate-200 border-t bg-slate-50 px-4 py-2 text-[10px] text-slate-400 sm:px-6 sm:py-3 sm:text-xs print:hidden">
						<span>
							Invoice #{order.id} • {formattedDate}
						</span>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
