"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ActivityIcon,
	BuildingIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	LandmarkIcon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function FinanceBankPage() {
	const trpc = useTRPC();
	const locale = useLocale();

	const {
		data: accounts,
		isLoading,
		error,
	} = trpc.finance.getBankAccounts.useQuery({});

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Bank Accounts
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Manage company bank accounts and cash balances
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/finance">
							<LandmarkIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
					<Button
						variant="default"
						className="text-xs shadow-sm sm:text-sm"
						onClick={() => alert("Add Account Dialog")}
					>
						<PlusIcon className="mr-1 h-3 w-3" /> Add Account
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="flex h-[200px] items-center justify-center">
					Loading accounts...
				</div>
			) : error ? (
				<div className="flex h-[200px] items-center justify-center text-red-500">
					Error loading accounts
				</div>
			) : !accounts || accounts.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No bank accounts configured.
				</div>
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left font-semibold">
									Account Name
								</TableHead>
								<TableHead className="text-left font-semibold">Bank</TableHead>
								<TableHead className="text-left font-semibold">Type</TableHead>
								<TableHead className="text-left font-semibold">
									Account No.
								</TableHead>
								<TableHead className="text-left text-right font-semibold">
									Current Balance
								</TableHead>
								<TableHead className="text-left font-semibold">
									Status
								</TableHead>
								<TableHead className="text-left font-semibold">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{accounts.map((acc: any) => (
								<TableRow key={acc.id}>
									<TableCell className="font-medium">{acc.name}</TableCell>
									<TableCell>{acc.bank_name}</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className="bg-slate-50 font-normal text-slate-700 capitalize"
										>
											{acc.type.replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell className="font-mono text-sm">
										{acc.account_number}
									</TableCell>
									<TableCell className="text-right font-medium text-green-600">
										{formatCurrency(Number(acc.current_balance), locale)}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${acc.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
										>
											{acc.status.charAt(0).toUpperCase() + acc.status.slice(1)}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => alert(`View account ${acc.id}`)}
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
		</PageTransition>
	);
}
