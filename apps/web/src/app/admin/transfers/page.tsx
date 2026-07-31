"use client";

import {
	ArrowLeftRight,
	ArrowRight,
	Check,
	Plus,
	Truck,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

export default function TransfersPage() {
	const { data: transfers, isLoading } = trpc.transfers.list.useQuery();
	const { data: branches } = trpc.branches.list.useQuery();
	const { data: products } = trpc.products.list.useQuery({ limit: 100 });
	const utils = trpc.useUtils();

	const [createOpen, setCreateOpen] = useState(false);
	const [form, setForm] = useState({
		from_branch_id: 0,
		to_branch_id: 0,
		product_id: 0,
		quantity: 1,
	});

	const createTransfer = trpc.transfers.create.useMutation({
		onSuccess: () => {
			toast.success("Transfer initiated! Stock deducted from sender.");
			setCreateOpen(false);
			setForm({
				from_branch_id: 0,
				to_branch_id: 0,
				product_id: 0,
				quantity: 1,
			});
			utils.transfers.list.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const receiveTransfer = trpc.transfers.receive.useMutation({
		onSuccess: () => {
			toast.success("Transfer received! Stock added to your branch.");
			utils.transfers.list.invalidate();
		},
	});

	const cancelTransfer = trpc.transfers.cancel.useMutation({
		onSuccess: () => {
			toast.success("Transfer cancelled. Stock returned to sender.");
			utils.transfers.list.invalidate();
		},
	});

	const getBranchName = (id: number) =>
		branches?.find((b: any) => b.id === id)?.name || `Branch #${id}`;
	const getProductName = (id: number) => {
		const productItems = products?.items || products;
		if (Array.isArray(productItems)) {
			return (
				productItems.find((p: any) => p.id === id)?.name || `Product #${id}`
			);
		}
		return `Product #${id}`;
	};

	if (isLoading) return <div className="p-8">Loading transfers...</div>;

	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			in_transit: "bg-blue-100 text-blue-800",
			received: "bg-green-100 text-green-800",
			cancelled: "bg-red-100 text-red-800",
			pending: "bg-yellow-100 text-yellow-800",
		};
		return (
			<span
				className={`rounded px-2 py-1 font-semibold text-xs capitalize ${styles[status] || "bg-gray-100 text-gray-800"}`}
			>
				{status?.replace("_", " ") || "pending"}
			</span>
		);
	};

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Inter-Branch Transfers</h1>
					<p className="text-muted-foreground">
						Move inventory between your branches with full audit trail
					</p>
				</div>
				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" /> New Transfer
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Initiate Stock Transfer</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div>
								<Label>From Branch</Label>
								<select
									className="w-full rounded border px-3 py-2 text-sm"
									value={form.from_branch_id}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											from_branch_id: Number.parseInt(e.target.value, 10),
										}))
									}
								>
									<option value={0}>Select sender...</option>
									{branches?.map((b: any) => (
										<option key={b.id} value={b.id}>
											{b.name}
										</option>
									))}
								</select>
							</div>
							<div className="flex justify-center">
								<ArrowRight className="h-5 w-5 text-muted-foreground" />
							</div>
							<div>
								<Label>To Branch</Label>
								<select
									className="w-full rounded border px-3 py-2 text-sm"
									value={form.to_branch_id}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											to_branch_id: Number.parseInt(e.target.value, 10),
										}))
									}
								>
									<option value={0}>Select receiver...</option>
									{branches
										?.filter((b: any) => b.id !== form.from_branch_id)
										.map((b: any) => (
											<option key={b.id} value={b.id}>
												{b.name}
											</option>
										))}
								</select>
							</div>
							<div>
								<Label>Product</Label>
								<select
									className="w-full rounded border px-3 py-2 text-sm"
									value={form.product_id}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											product_id: Number.parseInt(e.target.value, 10),
										}))
									}
								>
									<option value={0}>Select product...</option>
									{(Array.isArray(products)
										? products
										: products?.items || []
									).map((p: any) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<Label>Quantity</Label>
								<Input
									type="number"
									min={1}
									value={form.quantity}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											quantity: Number.parseInt(e.target.value, 10) || 1,
										}))
									}
								/>
							</div>
							<Button
								onClick={() => createTransfer.mutate(form)}
								disabled={
									!form.from_branch_id ||
									!form.to_branch_id ||
									!form.product_id ||
									createTransfer.isPending
								}
							>
								<Truck className="mr-2 h-4 w-4" /> Send Transfer
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Transfer History</CardTitle>
					<CardDescription>
						All inter-branch stock movements with audit trail
					</CardDescription>
				</CardHeader>
				<CardContent>
					<table className="w-full border-collapse text-left text-sm">
						<thead>
							<tr className="border-b">
								<th className="py-2">ID</th>
								<th>From</th>
								<th />
								<th>To</th>
								<th>Product</th>
								<th className="text-right">Qty</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{transfers?.map((t: any) => (
								<tr
									key={t.id}
									className="border-b last:border-0 hover:bg-muted/50"
								>
									<td className="py-3 font-mono text-xs">#{t.id}</td>
									<td className="font-medium">
										{getBranchName(t.from_branch_id)}
									</td>
									<td>
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</td>
									<td className="font-medium">
										{getBranchName(t.to_branch_id)}
									</td>
									<td>{getProductName(t.product_id)}</td>
									<td className="text-right font-semibold">{t.quantity}</td>
									<td>{getStatusBadge(t.status)}</td>
									<td>
										{(t.status === "pending" || t.status === "in_transit") && (
											<div className="flex gap-1">
												<Button
													size="sm"
													variant="outline"
													className="h-7 text-xs"
													onClick={() => receiveTransfer.mutate({ id: t.id })}
												>
													<Check className="mr-1 h-3 w-3" /> Receive
												</Button>
												<Button
													size="sm"
													variant="ghost"
													className="h-7 text-red-600 text-xs"
													onClick={() => cancelTransfer.mutate({ id: t.id })}
												>
													<X className="mr-1 h-3 w-3" /> Cancel
												</Button>
											</div>
										)}
										{t.status === "received" && (
											<span className="text-green-600 text-xs">Completed</span>
										)}
										{t.status === "cancelled" && (
											<span className="text-red-500 text-xs">Cancelled</span>
										)}
									</td>
								</tr>
							))}
							{(!transfers || transfers.length === 0) && (
								<tr>
									<td
										colSpan={8}
										className="py-8 text-center text-muted-foreground"
									>
										<ArrowLeftRight className="mx-auto mb-3 h-10 w-10 opacity-30" />
										No transfers yet. Click "New Transfer" to move stock between
										branches.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	);
}
