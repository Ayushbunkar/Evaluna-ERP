"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Header,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ActivityIcon,
	BanknoteIcon,
	CheckCircle2Icon,
	SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function FinanceTransactionsPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: transactions,
		isLoading,
		error,
	} = trpc.finance.getTransactions.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading transactions
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Financial Transactions
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View all financial transactions
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Financial Activity
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/finance">
							<BanknoteIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
				</div>
			</div>

			{!transactions || transactions.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No transactions found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHeader className="text-left">Date</TableHeader>
								<TableHeader className="text-left">Type</TableHeader>
								<TableHeader className="text-left">Amount</TableHeader>
								<TableHeader className="text-left">Description</TableHeader>
								<TableHeader className="text-left">Status</TableHeader>
								<TableHeader className="text-left">Actions</TableHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.map((tx) => (
								<TableRow key={tx.id}>
									<TableCell>{tx.date}</TableCell>
									<TableCell>{tx.type}</TableCell>
									<TableCell>
										{formatCurrency(Number(tx.amount), locale)}
									</TableCell>
									<TableCell>{tx.description}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${tx.status === "completed" ? "bg-green-100 text-green-800" : tx.status === "pending" ? "bg-yellow-100 text-yellow-800" : tx.status === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
										>
											{tx.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View transaction ${tx.id}`)}
										>
											<SearchIcon className="mr-1 h-3 w-3" /> View
										</Button>
										{tx.status === "pending" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => alert(`Process transaction ${tx.id}`)}
											>
												<CheckCircle2Icon className="mr-1 h-3 w-3" /> Process
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</PageTransition>
	);
}
