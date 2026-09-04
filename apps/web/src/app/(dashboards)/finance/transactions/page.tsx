"use client";

import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CheckCircle2Icon,
	ChevronLeftIcon,
	ChevronRightIcon,
	IndianRupee,
	SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function FinanceTransactionsPage() {
	const trpc = useTRPC();
	const locale = useLocale();

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const limit = 10;

	const { data, isLoading, error } = trpc.finance.getTransactions.useQuery({
		page,
		limit,
		search,
	});

	const transactions = data?.items || [];
	const totalPages = data?.pages || 1;

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Financial Transactions
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View all financial transactions
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/finance">
							<IndianRupee className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
				</div>
			</div>

			<div className="mb-4 flex max-w-sm items-center">
				<Input
					placeholder="Search description..."
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					className="w-full"
				/>
			</div>

			{isLoading ? (
				<div className="flex h-[200px] items-center justify-center">
					Loading...
				</div>
			) : error ? (
				<div className="flex h-[200px] items-center justify-center text-red-500">
					Error loading transactions
				</div>
			) : !transactions || transactions.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No transactions found
				</div>
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left font-semibold">Date</TableHead>
								<TableHead className="text-left font-semibold">Type</TableHead>
								<TableHead className="text-left font-semibold">
									Description
								</TableHead>
								<TableHead className="text-left font-semibold">
									Category
								</TableHead>
								<TableHead className="text-left font-semibold">
									Amount
								</TableHead>
								<TableHead className="text-left font-semibold">
									Status
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.map((tx: any) => (
								<TableRow key={tx.id}>
									<TableCell>{tx.date}</TableCell>
									<TableCell>
										<span
											className={`font-medium ${tx.type === "in" || tx.type === "credit" || tx.type === "income" ? "text-green-600" : "text-red-600"}`}
										>
											{tx.type}
										</span>
									</TableCell>
									<TableCell>{tx.description}</TableCell>
									<TableCell>{tx.category}</TableCell>
									<TableCell
										className={`font-medium ${tx.type === "in" || tx.type === "credit" || tx.type === "income" ? "text-green-600" : "text-red-600"}`}
									>
										{tx.type === "in" ||
										tx.type === "credit" ||
										tx.type === "income"
											? "+"
											: "-"}
										{formatCurrency(Number(tx.amount), locale)}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${tx.status === "completed" ? "bg-green-100 text-green-800" : tx.status === "pending" ? "bg-yellow-100 text-yellow-800" : tx.status === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
										>
											{tx.status}
										</span>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{!isLoading && !error && totalPages > 1 && (
				<div className="mt-4 flex items-center justify-end space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						<ChevronLeftIcon className="h-4 w-4" />
						Previous
					</Button>
					<span className="font-medium text-sm">
						Page {page} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
					>
						Next
						<ChevronRightIcon className="h-4 w-4" />
					</Button>
				</div>
			)}
		</PageTransition>
	);
}
