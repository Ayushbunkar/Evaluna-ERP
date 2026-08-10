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
import { useRef } from "react";
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
	couponCode?: string;
}

interface SaleCompletionScreenProps {
	order: CompletedOrder;
	storeInfo?: {
		name: string;
		address: string;
		phone: string;
		gst?: string;
	};
	onNewSale: () => void;
}

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
	storeInfo,
	onNewSale,
}: SaleCompletionScreenProps) {
	const receiptRef = useRef<HTMLDivElement>(null);

	const store = storeInfo ?? {
		name: "Evaluna Supermarket",
		address: "123 Retail Ave, Commerce City",
		phone: "+91 98765 43210",
		gst: "29ABCDE1234F1Z5",
	};

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
		window.print();
	};

	const handleDownloadPDF = () => {
		toast.info("PDF download coming soon!");
	};

	const handleWhatsApp = () => {
		const text = encodeURIComponent(
			`🧾 Invoice #${order.id}\n${store.name}\n\nItems: ${order.items.length}\nTotal: ₹${order.total.toFixed(2)}\nStatus: ${status.label}\n\nThank you for shopping!`,
		);
		window.open(`https://wa.me/?text=${text}`, "_blank");
	};

	const handleEmail = () => {
		const subject = encodeURIComponent(`Invoice #${order.id} - ${store.name}`);
		const body = encodeURIComponent(
			`Dear Customer,\n\nYour invoice #${order.id} has been generated.\nTotal: ₹${order.total.toFixed(2)}\nDate: ${formattedDate}\n\nThank you for shopping at ${store.name}!`,
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
						<div className="flex min-h-0 flex-1 flex-col border-r">
							<ScrollArea className="flex-1">
								<div
									ref={receiptRef}
									id="printable-receipt"
									className="p-6 print:mx-auto print:w-[80mm] print:p-0"
								>
									{/* Store Header */}
									<div className="mb-5 text-center">
										<h2 className="font-bold text-gray-900 text-xl">
											{store.name}
										</h2>
										<p className="text-gray-500 text-sm">{store.address}</p>
										<p className="text-gray-500 text-sm">📞 {store.phone}</p>
										{store.gst && (
											<p className="mt-1 text-gray-400 text-xs">
												GSTIN: {store.gst}
											</p>
										)}
									</div>

									<hr className="my-4 border-gray-300 border-dashed" />

									{/* Invoice Meta */}
									<div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
										<div className="text-gray-500">Invoice No.</div>
										<div className="text-right font-semibold text-gray-800">
											#{order.id}
										</div>
										<div className="text-gray-500">Date & Time</div>
										<div className="text-right text-gray-800">
											{formattedDate}
										</div>
										<div className="text-gray-500">Cashier</div>
										<div className="text-right text-gray-800">
											{order.cashierName || "Counter 1"}
										</div>
										{order.customerName && (
											<>
												<div className="text-gray-500">Customer</div>
												<div className="text-right text-gray-800">
													{order.customerName}
												</div>
											</>
										)}
										{order.couponCode && (
											<>
												<div className="text-gray-500">Coupon</div>
												<div className="text-right font-medium text-green-600">
													{order.couponCode}
												</div>
											</>
										)}
									</div>

									<hr className="my-4 border-gray-300 border-dashed" />

									{/* Item Table */}
									<table
										className="mb-2 w-full text-sm"
										style={{ tableLayout: "fixed" }}
									>
										<colgroup>
											<col style={{ width: "44%" }} />
											<col style={{ width: "10%" }} />
											<col style={{ width: "16%" }} />
											<col style={{ width: "14%" }} />
											<col style={{ width: "16%" }} />
										</colgroup>
										<thead>
											<tr className="border-gray-300 border-b border-dashed text-gray-400 text-xs uppercase tracking-wide">
												<th className="py-2 text-left font-medium">Item</th>
												<th className="py-2 text-center font-medium">Qty</th>
												<th className="py-2 text-right font-medium">Rate</th>
												<th className="py-2 text-right font-medium">Disc.</th>
												<th className="py-2 text-right font-medium">Total</th>
											</tr>
										</thead>
										<tbody>
											{order.items.map((item, idx) => {
												const rate = Number.parseFloat(item.price);
												const lineTotal = rate * item.qty;
												return (
													<tr
														key={item.id ?? idx}
														className="border-gray-100 border-b last:border-0"
													>
														<td
															className="py-2 pr-2 text-gray-800 leading-snug"
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
														<td className="py-2 text-right align-top text-green-600">
															—
														</td>
														<td className="py-2 text-right align-top font-medium text-gray-900">
															₹{lineTotal.toFixed(2)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>

									<hr className="my-4 border-gray-300 border-dashed" />

									{/* Summary */}
									<div className="space-y-1.5 text-sm">
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
										<div className="flex justify-between text-gray-600">
											<span>GST (incl.)</span>
											<span className="text-gray-400">Incl. in price</span>
										</div>
										{roundOff !== 0 && (
											<div className="flex justify-between text-gray-500">
												<span>Round-off</span>
												<span>
													{roundOff > 0 ? "+" : ""}₹{roundOff.toFixed(2)}
												</span>
											</div>
										)}
										<hr className="my-2 border-gray-200" />
										<div className="flex justify-between font-bold text-base text-gray-900">
											<span>Grand Total</span>
											<span>₹{grandTotal.toFixed(2)}</span>
										</div>
									</div>

									<hr className="my-4 border-gray-300 border-dashed" />

									{/* Payment */}
									<div className="space-y-1.5 text-sm">
										<div className="mb-2 font-medium text-gray-400 text-xs uppercase tracking-wide">
											Payment Details
										</div>
										{order.payments.map((p, i) => (
											<div
												key={i}
												className="flex justify-between text-gray-700"
											>
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

									<hr className="my-5 border-gray-300 border-dashed" />

									<div className="space-y-1 text-center text-gray-400 text-xs">
										<p className="font-medium text-gray-600">
											Thank you for shopping!
										</p>
										<p>Goods once sold will not be taken back</p>
										<p>without valid receipt within 7 days</p>
									</div>
								</div>
							</ScrollArea>
						</div>

						{/* ── Right: Actions Panel ── */}
						<div className="flex w-64 shrink-0 flex-col gap-3 bg-gray-50/80 p-4">
							<div className="mb-1 font-semibold text-gray-400 text-xs uppercase tracking-wide">
								Actions
							</div>

							{/* Primary Action */}
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
								Print & Share
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

							<hr className="my-1 border-gray-200" />
							<Button
								variant="ghost"
								className="w-full justify-start gap-2 text-gray-500 text-sm"
								onClick={() =>
									toast.info(`Invoice #${order.id} details in order history.`)
								}
							>
								<FileText className="h-4 w-4" />
								View Details
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

				<style
					dangerouslySetInnerHTML={{
						__html: `
						@media print {
							body * {
								visibility: hidden;
							}
							#printable-receipt, #printable-receipt * {
								visibility: visible;
							}
							
							/* Reset parent containers to prevent cropping */
							body, html, .fixed, .overflow-hidden, [data-radix-scroll-area-viewport] {
								position: static !important;
								overflow: visible !important;
								max-height: none !important;
								height: auto !important;
								transform: none !important;
							}

							#printable-receipt {
								position: absolute;
								left: 50%;
								transform: translateX(-50%) !important;
								top: 0;
								width: 80mm;
								margin: 0;
								padding: 10px !important;
							}
							@page {
								margin: 0;
							}
						}
					`,
					}}
				/>
			</motion.div>
		</AnimatePresence>
	);
}
