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
	const paid = order.payments.reduce((a, p) => a + Number.parseFloat(p.amount), 0);
	if (paid >= order.total - 0.01) return { label: "PAID", color: "bg-green-100 text-green-700 border-green-300" };
	if (paid > 0) return { label: "PARTIAL", color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
	return { label: "UNPAID", color: "bg-red-100 text-red-700 border-red-300" };
};

export function SaleCompletionScreen({ order, storeInfo, onNewSale }: SaleCompletionScreenProps) {
	const receiptRef = useRef<HTMLDivElement>(null);

	const store = storeInfo ?? {
		name: "Evaluna Supermarket",
		address: "123 Retail Ave, Commerce City",
		phone: "+91 98765 43210",
		gst: "29ABCDE1234F1Z5",
	};

	const totalPaid = order.payments.reduce((a, p) => a + Number.parseFloat(p.amount), 0);
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
		toast.info("Return items: Please go to Invoice History → Select this invoice → Return.");
	};

	const handleExchange = () => {
		toast.info("Exchange items: Please go to Invoice History → Select this invoice → Exchange.");
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
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			>
				<motion.div
					initial={{ scale: 0.92, opacity: 0, y: 20 }}
					animate={{ scale: 1, opacity: 1, y: 0 }}
					exit={{ scale: 0.92, opacity: 0 }}
					transition={{ type: "spring", damping: 22, stiffness: 300 }}
					className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden"
				>
					{/* ── Header ── */}
					<div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white shrink-0">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
								<CheckCircle2 className="h-6 w-6" />
							</div>
							<div>
								<div className="font-bold text-lg leading-tight">Sale Completed</div>
								<div className="text-green-100 text-sm">Invoice #{order.id} generated successfully</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.color}`}>
								{status.label}
							</span>
						</div>
					</div>

					<div className="flex min-h-0 flex-1 overflow-hidden">
						{/* ── Left: Receipt Preview ── */}
						<div className="flex flex-col flex-1 min-h-0 border-r">
							<ScrollArea className="flex-1">
								<div ref={receiptRef} className="p-6 print:p-2">
									{/* Store Header */}
									<div className="text-center mb-5">
										<h2 className="font-bold text-xl text-gray-900">{store.name}</h2>
										<p className="text-gray-500 text-sm">{store.address}</p>
										<p className="text-gray-500 text-sm">📞 {store.phone}</p>
										{store.gst && <p className="text-gray-400 text-xs mt-1">GSTIN: {store.gst}</p>}
									</div>

									<hr className="border-dashed border-gray-300 my-4" />

									{/* Invoice Meta */}
									<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
										<div className="text-gray-500">Invoice No.</div>
										<div className="text-right font-semibold text-gray-800">#{order.id}</div>
										<div className="text-gray-500">Date & Time</div>
										<div className="text-right text-gray-800">{formattedDate}</div>
										<div className="text-gray-500">Cashier</div>
										<div className="text-right text-gray-800">{order.cashierName || "Counter 1"}</div>
										{order.customerName && (
											<>
												<div className="text-gray-500">Customer</div>
												<div className="text-right text-gray-800">{order.customerName}</div>
											</>
										)}
										{order.couponCode && (
											<>
												<div className="text-gray-500">Coupon</div>
												<div className="text-right font-medium text-green-600">{order.couponCode}</div>
											</>
										)}
									</div>

									<hr className="border-dashed border-gray-300 my-4" />

									{/* Item Table */}
									<table
										className="w-full text-sm mb-2"
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
											<tr className="border-b border-dashed border-gray-300 text-xs text-gray-400 uppercase tracking-wide">
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
														className="border-b border-gray-100 last:border-0"
													>
														<td
															className="py-2 pr-2 text-gray-800 leading-snug"
															style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
														>
															{item.name}
														</td>
														<td className="py-2 text-center align-top text-gray-600">
															{Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(3)}
														</td>
														<td className="py-2 text-right align-top text-gray-600">
															₹{rate.toFixed(2)}
														</td>
														<td className="py-2 text-right align-top text-green-600">—</td>
														<td className="py-2 text-right align-top font-medium text-gray-900">
															₹{lineTotal.toFixed(2)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>

									<hr className="border-dashed border-gray-300 my-4" />

									{/* Summary */}
									<div className="space-y-1.5 text-sm">
										<div className="flex justify-between text-gray-600">
											<span>Subtotal</span>
											<span>₹{order.subtotal.toFixed(2)}</span>
										</div>
										{order.discount > 0 && (
											<div className="flex justify-between text-green-600">
												<span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
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
												<span>{roundOff > 0 ? "+" : ""}₹{roundOff.toFixed(2)}</span>
											</div>
										)}
										<hr className="border-gray-200 my-2" />
										<div className="flex justify-between font-bold text-base text-gray-900">
											<span>Grand Total</span>
											<span>₹{grandTotal.toFixed(2)}</span>
										</div>
									</div>

									<hr className="border-dashed border-gray-300 my-4" />

									{/* Payment */}
									<div className="space-y-1.5 text-sm">
										<div className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Payment Details</div>
										{order.payments.map((p, i) => (
											<div key={i} className="flex justify-between text-gray-700">
												<span>{PAYMENT_METHOD_LABELS[p.methodId] ?? "Payment"}</span>
												<span>₹{Number.parseFloat(p.amount).toFixed(2)}</span>
											</div>
										))}
										{change > 0 && (
											<div className="flex justify-between text-blue-600 font-medium">
												<span>Change Returned</span>
												<span>₹{change.toFixed(2)}</span>
											</div>
										)}
										{balanceDue > 0 && (
											<div className="flex justify-between text-red-600 font-semibold">
												<span>Balance Due</span>
												<span>₹{balanceDue.toFixed(2)}</span>
											</div>
										)}
									</div>

									<hr className="border-dashed border-gray-300 my-5" />

									<div className="text-center text-gray-400 text-xs space-y-1">
										<p className="font-medium text-gray-600">Thank you for shopping!</p>
										<p>Goods once sold will not be taken back</p>
										<p>without valid receipt within 7 days</p>
									</div>
								</div>
							</ScrollArea>
						</div>

						{/* ── Right: Actions Panel ── */}
						<div className="w-64 shrink-0 flex flex-col p-4 gap-3 bg-gray-50/80">
							<div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Actions</div>

							{/* Primary Action */}
							<Button
								size="lg"
								className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-base h-12 shadow-md"
								onClick={onNewSale}
							>
								<ShoppingBag className="mr-2 h-5 w-5" />
								New Sale
							</Button>

							<hr className="border-gray-200 my-1" />
							<div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Print & Share</div>

							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handlePrint}>
								<Printer className="h-4 w-4 text-gray-500" />
								Print Receipt
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handlePrint}>
								<RotateCcw className="h-4 w-4 text-gray-500" />
								Reprint
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleDownloadPDF}>
								<Download className="h-4 w-4 text-gray-500" />
								Download PDF
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleWhatsApp}>
								<MessageCircle className="h-4 w-4 text-green-500" />
								Send WhatsApp
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleEmail}>
								<Mail className="h-4 w-4 text-blue-500" />
								Send Email
							</Button>

							<hr className="border-gray-200 my-1" />
							<div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Invoice Actions</div>

							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleDuplicate}>
								<Copy className="h-4 w-4 text-gray-500" />
								Duplicate Invoice
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleReturn}>
								<ArrowLeftRight className="h-4 w-4 text-orange-500" />
								Return Items
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleExchange}>
								<ArrowLeftRight className="h-4 w-4 text-purple-500" />
								Exchange Items
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
								onClick={handleCancel}
							>
								<XCircle className="h-4 w-4" />
								Cancel Invoice
							</Button>

							<hr className="border-gray-200 my-1" />
							<Button
								variant="ghost"
								className="w-full justify-start gap-2 text-sm text-gray-500"
								onClick={() => toast.info(`Invoice #${order.id} details in order history.`)}
							>
								<FileText className="h-4 w-4" />
								View Details
							</Button>
						</div>
					</div>

					{/* ── Footer ── */}
					<div className="shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t text-xs text-gray-400">
						<span>Invoice #{order.id} • {formattedDate}</span>
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center gap-1">
								<span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
								Stock updated
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
								Ledger recorded
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
								Audit logged
							</span>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
