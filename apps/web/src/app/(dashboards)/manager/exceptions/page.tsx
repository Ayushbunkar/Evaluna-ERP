"use client";

import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ExceptionsPage() {
	const trpc = useTRPC();

	// Query real exceptions/anomalies from actual database
	const { data: exceptions = [], isLoading } =
		trpc.manager.getExceptions.useQuery();

	return (
		<PageTransition className="space-y-6">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-red-600 text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					<AlertTriangleIcon className="h-6 w-6" />
					Urgent Exceptions Center
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					Overview and mitigate critical system anomalies, overdue tasks, or
					unresolved discrepancy escalations.
				</p>
			</div>

			<Card className="border-l-4 border-l-red-500 shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Active System Exceptions Log
					</CardTitle>
					<CardDescription>
						Live feed of discrepancies and operational blockages requiring
						manager intervention
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
										<th className="p-3 font-semibold">Anomaly ID</th>
										<th className="p-3 font-semibold">Title</th>
										<th className="p-3 font-semibold">Description</th>
										<th className="p-3 font-semibold">Severity</th>
										<th className="p-3 text-right font-semibold">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{exceptions.map((ex) => (
										<tr key={ex.id} className="hover:bg-slate-50/40">
											<td className="p-3 font-bold text-slate-900">
												ANM-#{ex.id}
											</td>
											<td className="p-3 font-bold text-slate-800 dark:text-slate-200">
												{ex.title}
											</td>
											<td className="max-w-sm break-words p-3 font-medium text-slate-500 leading-relaxed">
												{ex.description}
											</td>
											<td className="p-3">
												<Badge className="border border-red-200 bg-red-50 font-bold text-[9px] text-red-700 uppercase">
													{ex.severity}
												</Badge>
											</td>
											<td className="p-3 text-right">
												<Badge className="text-[10px] capitalize">
													{ex.status}
												</Badge>
											</td>
										</tr>
									))}
									{exceptions.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-12 text-center text-slate-400 text-xs"
											>
												All operational workflows are clear! No exceptions
												flagged.
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
