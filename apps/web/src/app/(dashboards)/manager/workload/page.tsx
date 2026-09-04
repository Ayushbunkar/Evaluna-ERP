"use client";

import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { AlertTriangleIcon, BarChart3Icon, Loader2Icon } from "lucide-react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function WorkloadPage() {
	const trpc = useTRPC();

	// Query real workload stats
	const { data: workload = [], isLoading } =
		trpc.manager.getWorkload.useQuery();

	return (
		<PageTransition className="space-y-6">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					<BarChart3Icon className="h-6 w-6 text-blue-600" />
					Team Workload Balancing
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					Monitor current assigned, in-progress, completed, and overdue tasks to
					balance employee work utilization.
				</p>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Workforce Load Balancing Sheet
					</CardTitle>
					<CardDescription>
						Identify over-allocated or under-utilized staff based on open SLA
						targets
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
										<th className="p-3 font-semibold">Name</th>
										<th className="p-3 font-semibold">Assigned (Open)</th>
										<th className="p-3 font-semibold">In Progress</th>
										<th className="p-3 font-semibold">Overdue Tasks</th>
										<th className="p-3 text-right font-semibold">
											Fulfillment Capacity
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{workload.map((wl) => {
										const totalActive = wl.assigned + wl.inProgress;
										const allocationStatus =
											totalActive >= 4
												? "overloaded"
												: totalActive >= 1
													? "optimal"
													: "underutilized";

										return (
											<tr key={wl.id} className="hover:bg-slate-50/40">
												<td className="p-3 font-bold text-slate-900 dark:text-slate-100">
													{wl.name}
												</td>
												<td className="p-3 font-medium font-semibold text-blue-600">
													{wl.assigned} tasks
												</td>
												<td className="p-3 font-medium font-semibold text-amber-600">
													{wl.inProgress} active
												</td>
												<td className="flex items-center gap-1 p-3 font-medium font-semibold text-red-600">
													{wl.overdue > 0 && (
														<AlertTriangleIcon className="h-3.5 w-3.5" />
													)}
													{wl.overdue} overdue
												</td>
												<td className="p-3 text-right">
													<Badge
														className={`font-bold text-[10px] capitalize tracking-wide ${
															allocationStatus === "overloaded"
																? "border border-red-200 bg-red-50 text-red-700"
																: allocationStatus === "optimal"
																	? "border border-green-200 bg-green-50 text-green-700"
																	: "border border-slate-200 bg-slate-50 text-slate-600"
														}`}
													>
														{allocationStatus}
													</Badge>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
