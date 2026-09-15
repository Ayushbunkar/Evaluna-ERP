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
import { ActivityIcon, BanknoteIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
	}).format(amount);
}

export default function HRPayrollPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: payrollRecords,
		isLoading,
		error,
	} = trpc.hr.getPayroll.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
				Failed to load payroll.
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Payroll Records
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View and manage payroll
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> HR Activities
					</Button>
				</div>
			</div>

			{!payrollRecords || payrollRecords.length === 0 ? (
				<div className="mt-6 flex h-[200px] items-center justify-center rounded-lg border text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No payroll records found
				</div>
			) : (
				<div className="mt-6 overflow-x-auto rounded-lg border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">ID</TableHead>
								<TableHead className="text-left">Employee</TableHead>
								<TableHead className="text-left">Month</TableHead>
								<TableHead className="text-left">Amount</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payrollRecords.map((rec) => (
								<TableRow key={rec.id}>
									<TableCell>{rec.id}</TableCell>
									<TableCell>{rec.employee_name}</TableCell>
									<TableCell>{rec.month}</TableCell>
									<TableCell>
										{formatCurrency(Number(rec.net_payable))}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${rec.status === "paid" ? "bg-green-100 text-green-800" : rec.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
										>
											{rec.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										{rec.status === "pending" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => alert(`Process payroll ${rec.id}`)}
											>
												<BanknoteIcon className="mr-1 h-3 w-3" /> Process
											</Button>
										)}
										{rec.status !== "pending" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => alert(`View payroll ${rec.id}`)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> View
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
