"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { motion } from "framer-motion";
import {
	AlertCircleIcon,
	CalendarIcon,
	IndianRupeeIcon,
	PlusIcon,
	ReceiptIcon,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const statusBadge = (status: string | null | undefined) => {
	if (status === "approved")
		return (
			<Badge className="border-green-200 bg-green-100 text-green-800">
				Approved
			</Badge>
		);
	if (status === "rejected")
		return (
			<Badge className="border-red-200 bg-red-100 text-red-800">Rejected</Badge>
		);
	return (
		<Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
			Pending
		</Badge>
	);
};

export default function ExpensesPage() {
	const { data, isLoading } = trpc.expenses.list.useQuery({ limit: 50 });

	const items = data?.items ?? [];
	const total = items.reduce(
		(acc, e) => acc + Number.parseFloat(e.amount ?? "0"),
		0,
	);
	const thisWeek = items
		.slice(0, Math.min(7, items.length))
		.reduce((acc, e) => acc + Number.parseFloat(e.amount ?? "0"), 0);
	const pending = items.filter(
		(e) => (e as any).status === "pending" || !(e as any).status,
	);

	const kpis = [
		{
			label: "Total This Month",
			value: `₹${total.toLocaleString("en-IN")}`,
			icon: IndianRupeeIcon,
			color: "text-foreground",
			bg: "bg-zinc-100 dark:bg-zinc-800",
		},
		{
			label: "This Week",
			value: `₹${thisWeek.toLocaleString("en-IN")}`,
			icon: CalendarIcon,
			color: "text-foreground",
			bg: "bg-zinc-100 dark:bg-zinc-800",
		},
		{
			label: "Pending Approval",
			value: pending.length.toString(),
			icon: AlertCircleIcon,
			color: "text-foreground",
			bg: "bg-zinc-100 dark:bg-zinc-800",
		},
		{
			label: "Total Entries",
			value: items.length.toString(),
			icon: ReceiptIcon,
			color: "text-foreground",
			bg: "bg-zinc-100 dark:bg-zinc-800",
		},
	];

	return (
		<motion.div
			className="container space-y-4 sm:space-y-6 p-4 sm:p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h1 className="font-bold text-2xl sm:text-3xl tracking-tight">
						Expenses
					</h1>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
						Track all business expenses and reimbursements
					</p>
				</div>
				<Link href="/admin/expenses/create">
					<Button className="gap-1 sm:gap-2 text-xs sm:text-sm">
						<PlusIcon className="h-4 w-4" />
						Add Expense
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				{kpis.map((kpi, i) => (
					<motion.div
						key={kpi.label}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.07 }}
					>
					<Card className="border-0 shadow-sm">
							<CardContent className="pt-4 sm:pt-6">
								<div className="flex items-center gap-2 sm:gap-3">
									<div className={`${kpi.bg} rounded-lg p-2`}>
										<kpi.icon className={`h-5 w-5 ${kpi.color}`} />
									</div>
									<div>
										<p className="text-muted-foreground text-xs sm:text-sm">{kpi.label}</p>
										{isLoading ? (
											<Skeleton className="mt-1 h-5 sm:h-6 w-16 sm:w-20" />
										) : (
											<p className="font-bold text-lg sm:text-xl">{kpi.value}</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>

			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg">
						<ReceiptIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
						Expense Records
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(6)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-xs sm:text-sm">ID</TableHead>
									<TableHead className="text-xs sm:text-sm">Date</TableHead>
									<TableHead className="text-xs sm:text-sm">Category</TableHead>
									<TableHead className="text-xs sm:text-sm">Description</TableHead>
									<TableHead className="text-xs sm:text-sm">Amount</TableHead>
									<TableHead className="text-xs sm:text-sm">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="py-8 sm:py-10 text-center text-muted-foreground text-xs sm:text-sm"
									>
										No expenses found. Record your first expense.
										</TableCell>
									</TableRow>
								) : (
									items.map((expense) => (
										<TableRow key={expense.id} className="hover:bg-muted/30">
											<TableCell className="font-medium font-mono text-xs sm:text-sm">
												EXP-{expense.id}
											</TableCell>
											<TableCell className="text-xs sm:text-sm">
												{expense.created_at
													? new Date(expense.created_at).toLocaleDateString(
															"en-IN",
														)
													: "—"}
											</TableCell>
											<TableCell className="capitalize text-xs sm:text-sm">
												{expense.expense_category ?? "General"}
											</TableCell>
											<TableCell className="max-w-xs truncate text-xs sm:text-sm">
												{expense.description ?? "—"}
											</TableCell>
											<TableCell className="font-semibold text-red-600 text-xs sm:text-sm">
												₹
												{Number.parseFloat(
													expense.amount ?? "0",
												).toLocaleString("en-IN")}
											</TableCell>
											<TableCell>
												{statusBadge((expense as any).status)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
