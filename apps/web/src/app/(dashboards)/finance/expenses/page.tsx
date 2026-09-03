"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Input } from "@evaluna/ui/components/input";
import {
	ActivityIcon,
	FileTextIcon,
	SearchIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	PlusIcon,
	WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@evaluna/ui/components/badge";

export default function FinanceExpensesPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const limit = 10;
	
	const {
		data,
		isLoading,
		error,
	} = trpc.finance.getExpenses.useQuery({ page, limit, search });

	const expenses = data?.items || [];
	const totalPages = data?.pages || 1;

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Expense Management
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Track and manage operational expenses
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/finance">
							<WalletCardsIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
					<Button variant="default" className="text-xs shadow-sm sm:text-sm" onClick={() => alert("Add Expense Dialog")}>
						<PlusIcon className="mr-1 h-3 w-3" /> Record Expense
					</Button>
				</div>
			</div>
			
			<div className="mb-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
				<Input 
					placeholder="Search expenses..." 
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					className="w-full sm:max-w-sm"
				/>
				{/* Category filter would go here */}
			</div>

			{isLoading ? (
				<div className="flex h-[200px] items-center justify-center">
					Loading expenses...
				</div>
			) : error ? (
				<div className="flex h-[200px] items-center justify-center text-red-500">
					Error loading expenses
				</div>
			) : !expenses || expenses.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No expenses found matching the criteria.
				</div>
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left font-semibold">Date</TableHead>
								<TableHead className="text-left font-semibold">Category</TableHead>
								<TableHead className="text-left font-semibold">Description</TableHead>
								<TableHead className="text-left font-semibold">Amount</TableHead>
								<TableHead className="text-left font-semibold">Status</TableHead>
								<TableHead className="text-left font-semibold">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{expenses.map((exp: any) => (
								<TableRow key={exp.id}>
									<TableCell>{exp.date}</TableCell>
									<TableCell>
										<Badge variant="outline" className="font-normal capitalize bg-slate-50 text-slate-700">
											{exp.category}
										</Badge>
									</TableCell>
									<TableCell className="max-w-[200px] truncate">{exp.notes}</TableCell>
									<TableCell className="font-medium text-red-600">
										{formatCurrency(Number(exp.amount), locale)}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${exp.payment_status === "paid" || exp.payment_status === "completed" ? "bg-green-100 text-green-800" : exp.payment_status === "pending" || exp.payment_status === "unpaid" ? "bg-yellow-100 text-yellow-800" : exp.payment_status === "rejected" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
										>
											{exp.payment_status.charAt(0).toUpperCase() + exp.payment_status.slice(1)}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => alert(`View expense ${exp.id}`)}
										>
											<SearchIcon className="mr-1 h-3 w-3" /> View
										</Button>
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
						onClick={() => setPage(p => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						<ChevronLeftIcon className="h-4 w-4" />
						Previous
					</Button>
					<span className="text-sm font-medium">Page {page} of {totalPages}</span>
					<Button 
						variant="outline" 
						size="sm" 
						onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
