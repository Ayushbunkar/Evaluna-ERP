"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeftIcon,
	CheckCircle2Icon,
	PhoneIcon,
	PlusIcon,
	SaveIcon,
	Trash2Icon,
	UserIcon,
	MapPinIcon,
	AlertCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

type Line = {
	productId: number;
	name: string;
	unit: string | null;
	quantity: number;
	price: number;
};

export default function CustomerOrderReviewPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params.id);

	const {
		data: order,
		isLoading,
		error,
	} = trpc.orders.getForReview.useQuery(
		{ id },
		{ enabled: Number.isFinite(id) },
	);
	const { data: catalog } = trpc.products.list.useQuery();

	const [lines, setLines] = useState<Line[]>([]);
	const [discount, setDiscount] = useState(0);
	const [addProductId, setAddProductId] = useState<string>("");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const seeded = useRef(false);

	// Seed editable lines from the stored order once.
	useEffect(() => {
		if (order && !seeded.current) {
			setLines(
				order.items.map((it) => ({
					productId: it.productId as number,
					name: it.name,
					unit: it.unit,
					quantity: it.quantity,
					price:
						Number(it.price) > 0
							? Number(it.price)
							: Number(it.suggestedPrice ?? 0),
				})),
			);
			setDiscount(Number(order.discountAmount ?? 0));
			seeded.current = true;
		}
	}, [order]);

	const subtotal = useMemo(
		() => lines.reduce((a, l) => a + l.price * l.quantity, 0),
		[lines],
	);
	const total = Math.max(0, subtotal - discount);
	const locked = order?.locked || order?.status === "confirmed";

	const setLine = (pid: number, patch: Partial<Line>) =>
		setLines((prev) =>
			prev.map((l) => (l.productId === pid ? { ...l, ...patch } : l)),
		);
	const removeLine = (pid: number) =>
		setLines((prev) => prev.filter((l) => l.productId !== pid));

	const addProduct = () => {
		const pid = Number(addProductId);
		if (!pid) return;
		if (lines.some((l) => l.productId === pid)) {
			toast.info("That product is already in the order.");
			return;
		}
		const prod = catalog?.find((p) => p.id === pid);
		if (!prod) return;
		setLines((prev) => [
			...prev,
			{
				productId: pid,
				name: prod.name,
				unit: null,
				quantity: 1,
				price: prod.baseSellingPrice ?? 0,
			},
		]);
		setAddProductId("");
	};

	const saveDraft = trpc.orders.updateReviewItems.useMutation({
		onSuccess: () => {
			toast.success("Order draft updated successfully.");
			utils.orders.getForReview.invalidate({ id });
			utils.orders.listPendingReview.invalidate();
			utils.orders.getPendingCount.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const confirm = trpc.orders.confirmOrder.useMutation({
		onSuccess: (res) => {
			toast.success(`Order confirmed! Invoice ${res.invoiceNo} generated.`);
			utils.orders.listPendingReview.invalidate();
			utils.orders.getPendingCount.invalidate();
			setConfirmOpen(false);
			router.push("/sales/orders/review");
		},
		onError: (e) => {
			setConfirmOpen(false);
			toast.error(e.message);
		},
	});

	if (isLoading)
		return (
			<div className="py-12 text-center text-muted-foreground text-sm">
				Loading order details…
			</div>
		);

	if (error || !order)
		return (
			<div className="space-y-4">
				<Link
					href="/sales/orders/review"
					className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
				>
					<ArrowLeftIcon className="h-4 w-4" /> Back to orders queue
				</Link>
				<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
					{error?.message ?? "Order not found."}
				</div>
			</div>
		);

	const unpricedCount = lines.filter((l) => l.price <= 0).length;
	const canConfirm = !locked && lines.length > 0 && unpricedCount === 0;

	const handleSave = () =>
		saveDraft.mutate({
			id,
			items: lines.map((l) => ({
				productId: l.productId,
				quantity: l.quantity,
				price: l.price,
			})),
			discountAmount: discount,
		});

	const handleConfirm = () =>
		confirm.mutate({
			id,
			items: lines.map((l) => ({
				productId: l.productId,
				quantity: l.quantity,
				price: l.price,
			})),
			discountAmount: discount,
		});

	return (
		<div className="space-y-6">
			{/* Back Link & Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Link
						href="/sales/orders/review"
						className="inline-flex items-center gap-1 font-medium text-primary text-sm hover:underline mb-2"
					>
						<ArrowLeftIcon className="h-4 w-4" /> Back to Queue
					</Link>
					<div className="flex items-center gap-3">
						<h1 className="font-mono font-bold text-2xl tracking-tight">
							{order.orderRef}
						</h1>
						{locked ? (
							<Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
								Confirmed & Invoiced
							</Badge>
						) : (
							<Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
								Review In Progress
							</Badge>
						)}
					</div>
				</div>

				{/* Prominent Call Customer Button */}
				{order.customer?.phone && (
					<Button
						asChild
						size="lg"
						className="gap-2 bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-700"
					>
						<a href={`tel:${order.customer.phone}`}>
							<PhoneIcon className="h-5 w-5" />
							Call Customer ({order.customer.phone})
						</a>
					</Button>
				)}
			</div>

			{/* Customer Details Card */}
			<Card className="border-border/50 bg-gradient-to-r from-card via-card to-primary/5">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<UserIcon className="h-4 w-4 text-primary" />
						Customer Information
					</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<p className="font-semibold text-foreground text-sm">
							{order.customer?.name}
						</p>
						<p className="text-muted-foreground text-xs">Customer Name</p>
					</div>

					<div>
						<p className="font-mono font-medium text-foreground text-sm">
							{order.customer?.phone || "No phone available"}
						</p>
						<p className="text-muted-foreground text-xs">Contact Number</p>
					</div>

					<div>
						<div className="flex items-center gap-1 font-medium text-foreground text-sm">
							<MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />
							<span className="truncate">{order.customer?.address || "No address provided"}</span>
						</div>
						<p className="text-muted-foreground text-xs">Delivery Address</p>
					</div>
				</CardContent>
			</Card>

			{/* Unpriced warning banner */}
			{!locked && unpricedCount > 0 && (
				<div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
					<AlertCircleIcon className="h-4 w-4 shrink-0 text-amber-600" />
					<span>
						{unpricedCount} line item(s) have ₹0.00 price. Enter valid prices before confirming the order.
					</span>
				</div>
			)}

			{/* Line Items Table Card */}
			<Card className="border-border/50">
				<CardHeader>
					<CardTitle className="text-base">Line Items & Pricing</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="hidden rounded-lg bg-muted/50 px-4 py-2 font-medium text-muted-foreground text-xs sm:grid sm:grid-cols-[1fr_100px_140px_120px_40px] sm:gap-4">
						<span>Product</span>
						<span>Quantity</span>
						<span>Unit Price (₹)</span>
						<span className="text-right">Line Total</span>
						<span className="sr-only">Actions</span>
					</div>

					{lines.map((l) => (
						<div
							key={l.productId}
							className="flex flex-col gap-3 rounded-lg border border-border/40 p-3 sm:grid sm:grid-cols-[1fr_100px_140px_120px_40px] sm:items-center sm:gap-4 sm:border-0 sm:border-b sm:p-0 sm:pb-3 last:border-0"
						>
							<div className="min-w-0">
								<p className="font-medium text-foreground text-sm">{l.name}</p>
								{l.unit && (
									<p className="text-muted-foreground text-xs">Unit: {l.unit}</p>
								)}
							</div>

							<div>
								<Label className="text-xs sm:sr-only">Quantity</Label>
								<Input
									type="number"
									min={1}
									value={l.quantity}
									disabled={locked}
									onChange={(e) =>
										setLine(l.productId, {
											quantity: Math.max(1, Number(e.target.value) || 1),
										})
									}
									className="h-9"
								/>
							</div>

							<div>
								<Label className="text-xs sm:sr-only">Price (₹)</Label>
								<Input
									type="number"
									min={0}
									step="0.01"
									value={l.price}
									disabled={locked}
									placeholder="Enter price"
									onChange={(e) =>
										setLine(l.productId, {
											price: Math.max(0, Number(e.target.value) || 0),
										})
									}
									className={`h-9 ${l.price <= 0 ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
								/>
							</div>

							<div className="flex items-center justify-between sm:justify-end">
								<span className="text-muted-foreground text-xs sm:hidden">Line Total:</span>
								<span className="font-semibold text-foreground text-sm">
									₹{(l.price * l.quantity).toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>

							{!locked && (
								<button
									type="button"
									onClick={() => removeLine(l.productId)}
									className="self-end text-muted-foreground transition-colors hover:text-destructive sm:self-center"
									title="Remove item"
								>
									<Trash2Icon className="h-4 w-4" />
								</button>
							)}
						</div>
					))}

					{/* Add Extra Item Row */}
					{!locked && (
						<div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-center">
							<Select value={addProductId} onValueChange={setAddProductId}>
								<SelectTrigger className="h-9 flex-1">
									<SelectValue placeholder="Add another product to order…" />
								</SelectTrigger>
								<SelectContent>
									{(catalog ?? []).map((p) => (
										<SelectItem key={p.id} value={String(p.id)}>
											{p.name} {p.baseSellingPrice ? `(Base: ₹${p.baseSellingPrice})` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								size="sm"
								onClick={addProduct}
								disabled={!addProductId}
								className="gap-1 sm:w-auto"
							>
								<PlusIcon className="h-4 w-4" /> Add Item
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Order Summary & Actions */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Card className="border-border/50">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Order Notes / Staff Info</CardTitle>
					</CardHeader>
					<CardContent className="text-muted-foreground text-xs space-y-1">
						<p>• Verify prices verbally with the customer before confirming.</p>
						<p>• Once confirmed, pricing becomes visible on Customer Portal.</p>
						<p>• Stock will be reserved and an invoice generated automatically.</p>
					</CardContent>
				</Card>

				<Card className="border-border/50">
					<CardContent className="space-y-3 p-4 text-sm">
						<div className="flex justify-between font-medium">
							<span className="text-muted-foreground">Subtotal</span>
							<span>
								₹{subtotal.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>

						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">Discount (₹)</span>
							<Input
								type="number"
								min={0}
								step="0.01"
								value={discount}
								disabled={locked}
								onChange={(e) =>
									setDiscount(Math.max(0, Number(e.target.value) || 0))
								}
								className="h-8 w-32 text-right"
							/>
						</div>

						<div className="flex justify-between border-border/40 border-t pt-2 font-bold text-base text-foreground">
							<span>Final Total</span>
							<span className="text-primary font-mono text-lg">
								₹{total.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Bottom Action Bar */}
			{!locked && (
				<div className="flex flex-wrap items-center justify-end gap-3 pt-2">
					<Button
						variant="outline"
						onClick={handleSave}
						disabled={saveDraft.isPending || lines.length === 0}
						className="gap-2"
					>
						<SaveIcon className="h-4 w-4" />
						{saveDraft.isPending ? "Saving Draft…" : "Save Draft"}
					</Button>

					<Button
						onClick={() => setConfirmOpen(true)}
						disabled={!canConfirm}
						className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
					>
						<CheckCircle2Icon className="h-4 w-4" />
						Confirm & Generate Invoice
					</Button>
				</div>
			)}

			{/* Confirm Order Dialog */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg">Confirm Customer Order?</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 py-2 text-sm">
						<p className="text-muted-foreground">
							Are you sure you want to finalize order <strong className="font-mono text-foreground">{order.orderRef}</strong> for <strong className="text-foreground">{order.customer?.name}</strong>?
						</p>
						<div className="rounded-lg bg-muted/60 p-3 space-y-1.5 text-xs">
							<div className="flex justify-between">
								<span>Line Items:</span>
								<span className="font-semibold">{lines.length} items</span>
							</div>
							<div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border/40">
								<span>Total Invoice Amount:</span>
								<span className="text-emerald-600 font-mono">
									₹{total.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						</div>
						<p className="text-muted-foreground text-xs">
							This will reserve stock, issue the final invoice, and make prices visible on the customer portal.
						</p>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={confirm.isPending}
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							{confirm.isPending ? "Confirming & Invoicing…" : "Confirm Order"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
