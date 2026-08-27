// @ts-nocheck
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
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CashBookPage() {
	const [open, setOpen] = useState(false);
	const [type, setType] = useState<"in" | "out">("in");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: summary, isLoading: loadingSummary } =
		trpc.cashbook.getDailySummary.useQuery({});
	const { data: ledger, isLoading: loadingLedger } =
		trpc.cashbook.getLedger.useQuery({ limit: 100 });

	const addEntry = trpc.cashbook.addEntry.useMutation({
		onSuccess: () => {
			toast.success("Cash entry added");
			setOpen(false);
			setAmount("");
			setDescription("");
			queryClient.invalidateQueries({
				queryKey: [["cashbook", "getDailySummary"]],
			});
			queryClient.invalidateQueries({ queryKey: [["cashbook", "getLedger"]] });
		},
		onError: (err) => toast.error(err.message),
	});

	const handleSave = () => {
		if (!amount || Number.isNaN(Number.parseFloat(amount)))
			return toast.error("Valid amount required");
		if (!description) return toast.error("Description required");

		addEntry.mutate({
			amount: Number.parseFloat(amount),
			type,
			description,
			category: "manual",
			user_uid: "current-user", // In a real app, from auth context
		});
	};

	return (
		<PageTransition className="flex flex-col gap-6 p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Daily Cashbook</h1>
					<p className="text-muted-foreground text-sm">
						Manage register cash flows and track expenses.
					</p>
				</div>
				<div className="flex gap-2">
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button
								onClick={() => setType("in")}
								className="bg-emerald-600 text-white shadow-emerald-900/20 shadow-lg hover:bg-emerald-700"
							>
								<ArrowDownRight className="mr-2 h-4 w-4" /> Cash In
							</Button>
						</DialogTrigger>
						<DialogTrigger asChild>
							<Button
								onClick={() => setType("out")}
								variant="destructive"
								className="shadow-lg shadow-red-900/20"
							>
								<ArrowUpRight className="mr-2 h-4 w-4" /> Cash Out
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>
									Add Cash {type === "in" ? "In" : "Out"}
								</DialogTitle>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label>Amount</Label>
									<Input
										type="number"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										placeholder="0.00"
										className="text-lg"
									/>
								</div>
								<div className="grid gap-2">
									<Label>Description</Label>
									<Input
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Reason for cash entry"
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={handleSave}
									disabled={addEntry.isPending}
									className="w-full"
								>
									{addEntry.isPending ? "Saving..." : "Save Entry"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<StaggerList className="grid gap-4 md:grid-cols-3" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Daily Cash In
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
									<ArrowDownRight className="h-4 w-4 text-emerald-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-emerald-500">
									â‚¹{summary?.totalIn?.toFixed(2) || "0.00"}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									Sales: â‚¹{summary?.sales?.toFixed(2) || "0.00"}
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Daily Cash Out
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
									<ArrowUpRight className="h-4 w-4 text-red-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-red-500">
									â‚¹{summary?.totalOut?.toFixed(2) || "0.00"}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									Expenses: â‚¹{summary?.expenses?.toFixed(2) || "0.00"}
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Net Daily Flow
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
									<Wallet className="h-4 w-4 text-blue-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-blue-500">
									â‚¹{summary?.net?.toFixed(2) || "0.00"}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									Net movement today
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<Card className="flex-1 border-border/50 bg-card/50 shadow-sm">
				<CardHeader>
					<CardTitle>Recent Transactions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left text-sm">
							<thead>
								<tr className="border-border/50 border-b text-muted-foreground">
									<th className="py-3 font-medium">Date & Time</th>
									<th className="font-medium">Type</th>
									<th className="font-medium">Category</th>
									<th className="font-medium">Description</th>
									<th className="text-right font-medium">Amount</th>
								</tr>
							</thead>
							<tbody>
								{ledger?.items?.map((tx) => (
									<tr
										key={tx.id}
										className="border-border/30 border-b transition-colors last:border-0 hover:bg-muted/30"
									>
										<td className="whitespace-nowrap py-3 text-muted-foreground">
											{format(new Date(tx.created_at || new Date()), "PP p")}
										</td>
										<td>
											<span
												className={`rounded-full px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider ${tx.type === "in" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
											>
												{tx.type}
											</span>
										</td>
										<td className="text-muted-foreground capitalize">
											{tx.category || "manual"}
										</td>
										<td className="max-w-[200px] truncate font-medium">
											{tx.description || "-"}
										</td>
										<td
											className={`text-right font-bold ${tx.type === "in" ? "text-emerald-600" : "text-red-600"}`}
										>
											{tx.type === "in" ? "+" : "-"}â‚¹
											{Number(tx.amount).toFixed(2)}
										</td>
									</tr>
								))}
								{(!ledger?.items || ledger.items.length === 0) && (
									<tr>
										<td
											colSpan={5}
											className="py-12 text-center text-muted-foreground"
										>
											<Wallet className="mx-auto mb-3 h-12 w-12 opacity-20" />
											<p>No recent cash transactions today</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</PageTransition>
	);
}





