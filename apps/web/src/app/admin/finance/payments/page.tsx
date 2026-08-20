"use client";

import { Badge } from "@evaluna/ui/components/badge";
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
	DialogTrigger,
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
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { trpc } from "@/lib/trpc/client";

const PAYMENT_TYPES = [
	{ value: "expense", label: "Expense (money out)" },
	{ value: "payment", label: "Payment (money out)" },
	{ value: "income", label: "Income (money in)" },
	{ value: "receipt", label: "Receipt (money in)" },
	{ value: "refund", label: "Refund (money out)" },
];
const OTHER = "__other__";
const OUT_TYPES = new Set(["expense", "payment", "refund"]);

function inr(n: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 2,
	}).format(n);
}

function QuickAddPayment({ onDone }: { onDone: () => void }) {
	const [open, setOpen] = useState(false);
	const [paymentType, setPaymentType] = useState("expense");
	const [categoryId, setCategoryId] = useState<string>("");
	const [customName, setCustomName] = useState("");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");
	const [paidBy, setPaidBy] = useState("");
	const [bankAccountId, setBankAccountId] = useState<string>("");
	const [reference, setReference] = useState("");

	const { data: categories } = trpc.payments.listCategories.useQuery();
	const { data: accounts } = trpc.bankAccounts.list.useQuery();

	const create = trpc.payments.create.useMutation({
		onSuccess: () => {
			toast.success("Payment recorded");
			setOpen(false);
			reset();
			onDone();
		},
		onError: (e) => toast.error(e.message),
	});

	function reset() {
		setPaymentType("expense");
		setCategoryId("");
		setCustomName("");
		setAmount("");
		setDescription("");
		setPaidBy("");
		setBankAccountId("");
		setReference("");
	}

	function submit() {
		const amt = Number.parseFloat(amount);
		if (!amt || Number.isNaN(amt) || amt <= 0)
			return toast.error("Enter a valid amount");
		const isOther = categoryId === OTHER;
		if (!isOther && !categoryId && !customName.trim())
			return toast.error("Pick a category or choose Other and name it");
		if (isOther && !customName.trim())
			return toast.error("Describe the custom category");
		create.mutate({
			payment_type: paymentType as never,
			category_id: isOther || !categoryId ? undefined : Number(categoryId),
			custom_category_name: isOther ? customName.trim() : undefined,
			amount: amt,
			description: description.trim() || undefined,
			paid_by: paidBy.trim() || undefined,
			bank_account_id: bankAccountId ? Number(bankAccountId) : undefined,
			reference_number: reference.trim() || undefined,
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<PlusIcon className="mr-1 h-4 w-4" /> Record Payment
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Record a payment</DialogTitle>
				</DialogHeader>
				<div className="grid gap-3 py-2">
					<div className="grid gap-1.5">
						<Label>Type</Label>
						<Select value={paymentType} onValueChange={setPaymentType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAYMENT_TYPES.map((t) => (
									<SelectItem key={t.value} value={t.value}>
										{t.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-1.5">
						<Label>Category</Label>
						<Select value={categoryId} onValueChange={setCategoryId}>
							<SelectTrigger>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{(categories ?? []).map((c) => (
									<SelectItem key={c.id} value={String(c.id)}>
										{c.name}
									</SelectItem>
								))}
								<SelectItem value={OTHER}>Other / Miscellaneous</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{categoryId === OTHER && (
						<div className="grid gap-1.5">
							<Label>Custom category</Label>
							<Input
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								placeholder="e.g. Emergency courier"
							/>
						</div>
					)}
					<div className="grid gap-1.5">
						<Label>Amount (₹)</Label>
						<Input
							type="number"
							inputMode="decimal"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="1500"
						/>
					</div>
					<div className="grid gap-1.5">
						<Label>Description</Label>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g. Petrol for delivery van"
						/>
					</div>
					{/* PLACEHOLDER_DIALOG_JSX2 */}
					<div className="grid gap-1.5">
						<Label>Paid by</Label>
						<Input
							value={paidBy}
							onChange={(e) => setPaidBy(e.target.value)}
							placeholder="Person who paid (optional)"
						/>
					</div>
					<div className="grid gap-1.5">
						<Label>From account</Label>
						<Select value={bankAccountId} onValueChange={setBankAccountId}>
							<SelectTrigger>
								<SelectValue placeholder="Cash / account (optional)" />
							</SelectTrigger>
							<SelectContent>
								{(accounts ?? []).map((a) => (
									<SelectItem key={a.id} value={String(a.id)}>
										{a.account_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-1.5">
						<Label>Reference no.</Label>
						<Input
							value={reference}
							onChange={(e) => setReference(e.target.value)}
							placeholder="Bill / UPI ref (optional)"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={create.isPending}
					>
						Cancel
					</Button>
					<Button onClick={submit} disabled={create.isPending}>
						{create.isPending ? "Saving…" : "Save payment"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function PaymentsPage() {
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("");
	const utils = trpc.useUtils();

	const { data: stats } = trpc.payments.stats.useQuery();
	const { data, isLoading } = trpc.payments.list.useQuery({
		search: search.trim() || undefined,
		payment_type: typeFilter || undefined,
		limit: 50,
		offset: 0,
	});
	const voidPayment = trpc.payments.void.useMutation({
		onSuccess: () => {
			toast.success("Payment voided");
			utils.payments.list.invalidate();
			utils.payments.stats.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	function refresh() {
		utils.payments.list.invalidate();
		utils.payments.stats.invalidate();
	}

	const items = data?.items ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<h1 className="font-semibold text-2xl">Payments</h1>
				<PermissionGate domain="finance" action="write" fallback={null}>
					<QuickAddPayment onDone={refresh} />
				</PermissionGate>
			</div>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-xs">
							Money Out
						</CardTitle>
					</CardHeader>
					<CardContent className="font-semibold text-lg">
						{inr(stats?.totalOut ?? 0)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-xs">
							Money In
						</CardTitle>
					</CardHeader>
					<CardContent className="font-semibold text-lg">
						{inr(stats?.totalIn ?? 0)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-xs">
							This Month
						</CardTitle>
					</CardHeader>
					<CardContent className="font-semibold text-lg">
						{inr(stats?.thisMonth ?? 0)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-xs">
							Total Records
						</CardTitle>
					</CardHeader>
					<CardContent className="font-semibold text-lg">
						{stats?.count ?? 0}
					</CardContent>
				</Card>
			</div>

			{/* PLACEHOLDER_TABLE */}
			<div className="flex flex-col gap-2 sm:flex-row">
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by number, description, reference…"
					className="sm:max-w-xs"
				/>
				<Select
					value={typeFilter || "all"}
					onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}
				>
					<SelectTrigger className="sm:w-48">
						<SelectValue placeholder="All types" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All types</SelectItem>
						{PAYMENT_TYPES.map((t) => (
							<SelectItem key={t.value} value={t.value}>
								{t.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Card>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="space-y-2 p-4">
							{[...Array(6)].map((_, i) => (
								<Skeleton key={i} className="h-10 w-full" />
							))}
						</div>
					) : items.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground text-sm">
							No payments yet. Record your first one.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Number</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Description</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((p) => (
									<TableRow key={p.id}>
										<TableCell className="font-mono text-xs">
											{p.payment_number}
										</TableCell>
										<TableCell className="whitespace-nowrap text-xs">
											{p.payment_date
												? new Date(p.payment_date).toLocaleDateString("en-IN")
												: "—"}
										</TableCell>
										<TableCell>
											{p.category?.name ??
												p.custom_category_name ??
												"—"}
										</TableCell>
										<TableCell className="max-w-[240px] truncate">
											{p.description ?? "—"}
										</TableCell>
										<TableCell
											className={`text-right font-medium ${OUT_TYPES.has(p.payment_type) ? "text-red-600" : "text-green-600"}`}
										>
											{OUT_TYPES.has(p.payment_type) ? "−" : "+"}
											{inr(Number(p.amount))}
										</TableCell>
										<TableCell className="text-right">
											{p.status === "void" ? (
												<Badge variant="secondary">Void</Badge>
											) : (
												<PermissionGate
													domain="finance"
													action="write"
													fallback={null}
												>
													<Button
														size="sm"
														variant="ghost"
														disabled={voidPayment.isPending}
														onClick={() => voidPayment.mutate({ id: p.id })}
													>
														Void
													</Button>
												</PermissionGate>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
