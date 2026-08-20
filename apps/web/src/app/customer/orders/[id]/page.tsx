"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { ArrowLeftIcon, CheckCircle2Icon, FileTextIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

const STATUS_STEPS = [
	{ key: "pending_review", label: "Submitted" },
	{ key: "under_review", label: "Under Review" },
	{ key: "confirmed", label: "Confirmed" },
];

const STATUS_LABELS: Record<string, string> = {
	pending_review: "Awaiting review",
	under_review: "Being reviewed",
	confirmed: "Confirmed",
	completed: "Completed",
	cancelled: "Cancelled",
};

function stepIndex(status: string | null | undefined) {
	if (status === "completed" || status === "confirmed") return 2;
	if (status === "under_review") return 1;
	return 0;
}

export default function CustomerOrderDetailPage() {
	const trpc = useTRPC();
	const params = useParams<{ id: string }>();
	const id = Number(params.id);
	const [showInvoice, setShowInvoice] = useState(false);

	const { data: order, isLoading, error } = trpc.customer.getMyOrder.useQuery(
		{ id },
		{ enabled: Number.isFinite(id) },
	);
	const { data: invoice } = trpc.customer.getMyInvoice.useQuery(
		{ id },
		{ enabled: showInvoice && Number.isFinite(id) },
	);

	if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;
	if (error || !order)
		return (
			<div className="space-y-4">
				<Link
					href="/customer/orders"
					className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
				>
					<ArrowLeftIcon className="h-4 w-4" /> Back to orders
				</Link>
				<p className="text-destructive text-sm">
					{error?.message ?? "Order not found."}
				</p>
			</div>
		);

	const active = stepIndex(order.status);
	const priceVisible = order.priceVisible;

	return (
		<div className="space-y-6">
			<Link
				href="/customer/orders"
				className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
			>
				<ArrowLeftIcon className="h-4 w-4" /> Back to orders
			</Link>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">{order.orderRef}</h1>
					<p className="text-muted-foreground text-sm">
						{order.date ? new Date(order.date).toLocaleString() : "—"}
					</p>
				</div>
				<span className="rounded-full bg-muted px-3 py-1 font-medium text-sm">
					{STATUS_LABELS[order.status ?? ""] ?? order.status}
				</span>
			</div>

			{/* Progress */}
			<Card className="border-border/50">
				<CardContent className="flex items-center justify-between gap-2 p-4">
					{STATUS_STEPS.map((s, i) => (
						<div key={s.key} className="flex flex-1 flex-col items-center gap-1">
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
									i <= active
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground"
								}`}
							>
								{i <= active ? <CheckCircle2Icon className="h-4 w-4" /> : i + 1}
							</div>
							<span className="text-center text-[11px] text-muted-foreground">
								{s.label}
							</span>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Items */}
			<Card className="border-border/50">
				<CardHeader>
					<CardTitle className="text-base">Items</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{order.items.map((it) => (
						<div
							key={it.id}
							className="flex items-center justify-between border-border/40 border-b py-2 text-sm last:border-0"
						>
							<div>
								<p className="font-medium">{it.name}</p>
								<p className="text-muted-foreground text-xs">
									Qty: {it.quantity}
									{it.unit ? ` ${it.unit}` : ""}
								</p>
							</div>
							{priceVisible && it.lineTotal != null ? (
								<span className="font-medium">
									₹{it.lineTotal.toLocaleString("en-IN")}
								</span>
							) : (
								<span className="text-muted-foreground text-xs">
									Pending pricing
								</span>
							)}
						</div>
					))}

					{priceVisible && order.total != null ? (
						<div className="flex items-center justify-between pt-2 font-semibold">
							<span>Total</span>
							<span>₹{order.total.toLocaleString("en-IN")}</span>
						</div>
					) : (
						<p className="rounded-md bg-muted/60 p-2 text-muted-foreground text-xs">
							Pricing will appear here once our team confirms your order.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Invoice (only once confirmed) */}
			{priceVisible && (
				<Card className="border-border/50">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-base">Invoice</CardTitle>
						{!showInvoice && (
							<Button
								size="sm"
								variant="outline"
								className="gap-2"
								onClick={() => setShowInvoice(true)}
							>
								<FileTextIcon className="h-4 w-4" /> View Invoice
							</Button>
						)}
					</CardHeader>
					{showInvoice && invoice && (
						<CardContent className="space-y-3 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Invoice No.</span>
								<span className="font-medium">{invoice.invoiceNo}</span>
							</div>
							<div className="space-y-1">
								{invoice.items.map((it, idx) => (
									<div key={idx} className="flex justify-between">
										<span>
											{it.name} × {it.quantity}
										</span>
										<span>₹{it.lineTotal.toLocaleString("en-IN")}</span>
									</div>
								))}
							</div>
							<div className="space-y-1 border-border/40 border-t pt-2 text-muted-foreground">
								<Row label="Subtotal" value={invoice.subtotal} />
								{invoice.discount > 0 && (
									<Row label="Discount" value={-invoice.discount} />
								)}
								{invoice.cgst > 0 && <Row label="CGST" value={invoice.cgst} />}
								{invoice.sgst > 0 && <Row label="SGST" value={invoice.sgst} />}
								{invoice.igst > 0 && <Row label="IGST" value={invoice.igst} />}
							</div>
							<div className="flex justify-between border-border/40 border-t pt-2 font-semibold text-base text-foreground">
								<span>Total</span>
								<span>₹{invoice.total.toLocaleString("en-IN")}</span>
							</div>
							<p className="text-muted-foreground text-xs">
								Payment status: {invoice.paymentStatus}
							</p>
						</CardContent>
					)}
				</Card>
			)}
		</div>
	);
}

function Row({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex justify-between">
			<span>{label}</span>
			<span>₹{value.toLocaleString("en-IN")}</span>
		</div>
	);
}
