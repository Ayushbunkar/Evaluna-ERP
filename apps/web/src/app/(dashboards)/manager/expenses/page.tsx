"use client";

import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { CreditCardIcon, Loader2Icon } from "lucide-react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ExpensesPage() {
	const trpc = useTRPC();

	// Query real employee expenses
	const { data: expenses = [], isLoading } =
		trpc.manager.getExpenses.useQuery();

	return (
		<PageTransition className="space-y-6">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					<CreditCardIcon className="h-6 w-6 text-blue-600" />
					Team Expense Claims
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					Track in-progress, approved, and paid out reimbursement claims
					submitted by your team.
				</p>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Operational Expense Claims List
					</CardTitle>
					<CardDescription>
						Real-time view of claims, categories, and payment statuses
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b text-slate-500">
										<th className="p-3 font-semibold">Claim ID</th>
										<th className="p-3 font-semibold">Category</th>
										<th className="p-3 font-semibold">Amount</th>
										<th className="p-3 font-semibold">Status</th>
										<th className="p-3 font-semibold">Created At</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{expenses.map((exp) => (
										<tr key={exp.id} className="hover:bg-slate-50/40">
											<td className="p-3 font-bold text-slate-900">
												EXP-#{exp.id}
											</td>
											<td className="p-3 font-medium capitalize">
												{exp.custom_category_name || "General"}
											</td>
											<td className="p-3 font-bold text-slate-900 dark:text-slate-100">
												₹{Number.parseFloat(exp.amount).toLocaleString()}
											</td>
											<td className="p-3">
												<Badge
													className="text-[10px] capitalize"
													variant={
														exp.status === "paid" ? "default" : "outline"
													}
												>
													{exp.status}
												</Badge>
											</td>
											<td className="p-3 text-slate-500">
												{exp.expense_date
													? new Date(exp.expense_date).toLocaleDateString()
													: ""}
											</td>
										</tr>
									))}
									{expenses.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-12 text-center text-slate-400 text-xs"
											>
												No team expense claims logged.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
