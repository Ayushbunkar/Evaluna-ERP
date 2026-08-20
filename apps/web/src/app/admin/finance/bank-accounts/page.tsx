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
import { ArrowLeftRightIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { trpc } from "@/lib/trpc/client";

const ACCOUNT_TYPES = ["bank", "cash", "card", "wallet", "petty_cash"];

function inr(n: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 2,
	}).format(n);
}

// PLACEHOLDER_CREATE
function CreateAccount({ onDone }: { onDone: () => void }) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [type, setType] = useState("bank");
	const [bankName, setBankName] = useState("");
	const [accountNumber, setAccountNumber] = useState("");
	const [ifsc, setIfsc] = useState("");
	const [opening, setOpening] = useState("");

	const create = trpc.bankAccounts.create.useMutation({
		onSuccess: () => {
			toast.success("Account created");
			setOpen(false);
			setName("");
			setBankName("");
			setAccountNumber("");
			setIfsc("");
			setOpening("");
			onDone();
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<PlusIcon className="mr-1 h-4 w-4" /> New Account
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>New bank / cash account</DialogTitle>
				</DialogHeader>
				<div className="grid gap-3 py-2">
					<div className="grid gap-1.5">
						<Label>Account name</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="grid gap-1.5">
						<Label>Type</Label>
						<Select value={type} onValueChange={setType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ACCOUNT_TYPES.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-1.5">
						<Label>Bank name</Label>
						<Input
							value={bankName}
							onChange={(e) => setBankName(e.target.value)}
						/>
					</div>
					<div className="grid gap-1.5">
						<Label>Account number</Label>
						<Input
							value={accountNumber}
							onChange={(e) => setAccountNumber(e.target.value)}
						/>
					</div>
					<div className="grid gap-1.5">
						<Label>IFSC</Label>
						<Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
					</div>
					<div className="grid gap-1.5">
						<Label>Opening balance (₹)</Label>
						<Input
							type="number"
							value={opening}
							onChange={(e) => setOpening(e.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={() => {
							if (!name.trim()) return toast.error("Account name required");
							create.mutate({
								account_name: name.trim(),
								account_type: type as never,
								bank_name: bankName.trim() || undefined,
								account_number: accountNumber.trim() || undefined,
								ifsc: ifsc.trim() || undefined,
								opening_balance: Number.parseFloat(opening) || 0,
							});
						}}
						disabled={create.isPending}
					>
						{create.isPending ? "Saving…" : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
// PLACEHOLDER_TRANSFER
function TransferMoney({
	accounts,
	onDone,
}: {
	accounts: Array<{ id: number; account_name: string }>;
	onDone: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [amount, setAmount] = useState("");
	const [desc, setDesc] = useState("");

	const transfer = trpc.bankAccounts.transfer.useMutation({
		onSuccess: () => {
			toast.success("Transfer complete");
			setOpen(false);
			setFrom("");
			setTo("");
			setAmount("");
			setDesc("");
			onDone();
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<ArrowLeftRightIcon className="mr-1 h-4 w-4" /> Transfer
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Move money between accounts</DialogTitle>
				</DialogHeader>
				<div className="grid gap-3 py-2">
					<div className="grid gap-1.5">
						<Label>From</Label>
						<Select value={from} onValueChange={setFrom}>
							<SelectTrigger>
								<SelectValue placeholder="Source account" />
							</SelectTrigger>
							<SelectContent>
								{accounts.map((a) => (
									<SelectItem key={a.id} value={String(a.id)}>
										{a.account_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-1.5">
						<Label>To</Label>
						<Select value={to} onValueChange={setTo}>
							<SelectTrigger>
								<SelectValue placeholder="Destination account" />
							</SelectTrigger>
							<SelectContent>
								{accounts.map((a) => (
									<SelectItem key={a.id} value={String(a.id)}>
										{a.account_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-1.5">
						<Label>Amount (₹)</Label>
						<Input
							type="number"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>
					<div className="grid gap-1.5">
						<Label>Note</Label>
						<Input value={desc} onChange={(e) => setDesc(e.target.value)} />
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={() => {
							const amt = Number.parseFloat(amount);
							if (!from || !to) return toast.error("Pick both accounts");
							if (from === to)
								return toast.error("Accounts must be different");
							if (!amt || amt <= 0) return toast.error("Enter a valid amount");
							transfer.mutate({
								from_account_id: Number(from),
								to_account_id: Number(to),
								amount: amt,
								description: desc.trim() || undefined,
							});
						}}
						disabled={transfer.isPending}
					>
						{transfer.isPending ? "Transferring…" : "Transfer"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
// PLACEHOLDER_PAGE
export default function BankAccountsPage() {
	const utils = trpc.useUtils();
	const { data: accounts, isLoading } = trpc.bankAccounts.list.useQuery({
		include_inactive: true,
	});

	function refresh() {
		utils.bankAccounts.list.invalidate();
		utils.bankAccounts.listTransfers.invalidate();
	}

	const list = accounts ?? [];
	const total = list.reduce((s, a) => s + Number(a.current_balance || 0), 0);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<h1 className="font-semibold text-2xl">Bank & Cash Accounts</h1>
				<PermissionGate domain="finance" action="write" fallback={null}>
					<div className="flex gap-2">
						<TransferMoney accounts={list} onDone={refresh} />
						<CreateAccount onDone={refresh} />
					</div>
				</PermissionGate>
			</div>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-muted-foreground text-xs">
						Total balance across accounts
					</CardTitle>
				</CardHeader>
				<CardContent className="font-semibold text-2xl">
					{inr(total)}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="space-y-2 p-4">
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className="h-10 w-full" />
							))}
						</div>
					) : list.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground text-sm">
							No accounts yet. Create one to start tracking balances.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Account</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Number</TableHead>
									<TableHead className="text-right">Balance</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{list.map((a) => (
									<TableRow key={a.id}>
										<TableCell className="font-medium">
											{a.account_name}
											{a.bank_name ? (
												<span className="block text-muted-foreground text-xs">
													{a.bank_name}
												</span>
											) : null}
										</TableCell>
										<TableCell className="text-xs capitalize">
											{a.account_type}
										</TableCell>
										<TableCell className="font-mono text-xs">
											{a.account_number_masked ?? "—"}
										</TableCell>
										<TableCell className="text-right font-medium">
											{inr(Number(a.current_balance))}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													a.status === "active" ? "default" : "secondary"
												}
											>
												{a.status}
											</Badge>
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
