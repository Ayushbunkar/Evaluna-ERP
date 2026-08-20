"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
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
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from "lucide-react";
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

	const { data: order, isLoading, error } = trpc.orders.getForReview.useQuery(
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
			toast.success("Draft saved.");
			utils.orders.getForReview.invalidate({ id });
			utils.orders.listPendingReview.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const confirm = trpc.orders.confirmOrder.useMutation({
		onSuccess: (res) => {
			toast.success(`Order confirmed. Invoice ${res.invoiceNo} generated.`);
			utils.orders.listPendingReview.invalidate();
			setConfirmOpen(false);
			router.push("/sales/orders/review");
		},
		onError: (e) => {
			setConfirmOpen(false);
			toast.error(e.message);
		},
	});

	// PLACEHOLDER_REVIEW_JSX

	if (isLoading)
		return <p className="text-muted-foreground text-sm">Loading…</p>;
	if (error || !order)
		return (
			<div className="space-y-4">
				<Link
					href="/sales/orders/review"
					className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
				>
					<ArrowLeftIcon className="h-4 w-4" /> Back
				</Link>
				<p className="text-destructive text-sm">
					{error?.message ?? "Order not found."}
				</p>
			</div>
		);

	const priced = lines.every((l) => l.price > 0);
	const canConfirm = !locked && lines.length > 0 && priced;

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
		<div className="space-y-5">
			<Link
				href="/sales/orders/review"
				className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
			>
				<ArrowLeftIcon className="h-4 w-4" /> Back to inbox
			</Link>

			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						{order.orderRef}
					</h1>
					<p className="text-muted-foreground text-sm">
						{order.customer?.name}
						{order.customer?.phone ? ` · ${order.customer.phone}` : ""}
					</p>
					{order.customer?.address && (
						<p className="text-muted-foreground text-xs">
							{order.customer.address}
						</p>
					)}
				</div>
				{locked && (
					<span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700 text-sm dark:bg-green-900/40 dark:text-green-300">
						Confirmed
					</span>
				)}
			</div>

			<Card className="border-border/50">
				<CardHeader>
					<CardTitle className="text-base">Line Items & Pricing</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{lines.map((l) => (
						<div
							key={l.productId}
							className="grid grid-cols-[1fr_auto] items-center gap-3 border-border/40 border-b pb-3 last:border-0 sm:grid-cols-[1fr_90px_120px_auto]"
						>
							<div className="min-w-0">
								<p className="truncate font-medium text-sm">{l.name}</p>
								<p className="text-muted-foreground text-xs">
									Line: ₹{(l.price * l.quantity).toLocaleString("en-IN")}
								</p>
							</div>
							<div>
								<Label className="sr-only">Qty</Label>
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
									className="h-8"
								/>
							</div>
							<div>
								<Label className="sr-only">Unit price</Label>
								<Input
									type="number"
									min={0}
									step="0.01"
									value={l.price}
									disabled={locked}
									placeholder="Price"
									onChange={(e) =>
										setLine(l.productId, {
											price: Math.max(0, Number(e.target.value) || 0),
										})
									}
									className="h-8"
								/>
							</div>
							{!locked && (
								<button
									type="button"
									onClick={() => removeLine(l.productId)}
									className="justify-self-end text-muted-foreground hover:text-destructive"
								>
									<Trash2Icon className="h-4 w-4" />
								</button>
							)}
						</div>
					))}

					{!locked && (
						<div className="flex items-center gap-2 pt-1">
							<Select value={addProductId} onValueChange={setAddProductId}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Add a product…" />
								</SelectTrigger>
								<SelectContent>
									{(catalog ?? []).map((p) => (
										<SelectItem key={p.id} value={String(p.id)}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								size="sm"
								onClick={addProduct}
								disabled={!addProductId}
							>
								<PlusIcon className="mr-1 h-4 w-4" /> Add
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="border-border/50">
				<CardContent className="space-y-2 p-4 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Subtotal</span>
						<span>₹{subtotal.toLocaleString("en-IN")}</span>
					</div>
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">Discount</span>
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
					<div className="flex justify-between border-border/40 border-t pt-2 font-semibold text-base">
						<span>Total</span>
						<span>₹{total.toLocaleString("en-IN")}</span>
					</div>
				</CardContent>
			</Card>

			{!locked && (
				<div className="flex flex-wrap justify-end gap-2">
					<Button
						variant="outline"
						onClick={handleSave}
						disabled={saveDraft.isPending || lines.length === 0}
					>
						{saveDraft.isPending ? "Saving…" : "Save Draft"}
					</Button>
					<Button
						onClick={() => setConfirmOpen(true)}
						disabled={!canConfirm}
						title={
							!priced ? "All items must have a price before confirming" : ""
						}
					>
						Confirm & Generate Bill
					</Button>
				</div>
			)}

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm order {order.orderRef}?</DialogTitle>
					</DialogHeader>
					<div className="space-y-2 text-sm">
						<p className="text-muted-foreground">
							This finalizes the order, deducts stock, and generates the
							invoice. Pricing becomes visible to the customer. This cannot be
							undone.
						</p>
						<div className="flex justify-between font-semibold">
							<span>Total</span>
							<span>₹{total.toLocaleString("en-IN")}</span>
						</div>
					</div>
					<DialogFooter>
						<Button variant="secondary" onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleConfirm} disabled={confirm.isPending}>
							{confirm.isPending ? "Confirming…" : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
