"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { Play, RefreshCw } from "lucide-react";
import { AnimatedCard, PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const priorityColor = (p: string) => {
	if (p === "High")
		return "bg-red-500/20 text-red-400 border border-red-500/30";
	if (p === "Medium")
		return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
	return "bg-green-500/20 text-green-400 border border-green-500/30";
};

const statusColor = (s: string) => {
	if (s === "Completed") return "bg-green-500/20 text-green-400";
	if (s === "In Progress") return "bg-blue-500/20 text-blue-400";
	if (s === "Exception") return "bg-red-500/20 text-red-400";
	return "bg-yellow-500/20 text-yellow-400";
};

export default function PickListsPage() {
	const {
		data: pickLists,
		isLoading,
		refetch,
	} = useTRPC().picker.getPickLists.useQuery({});

	return (
		<PageTransition>
			<div className="flex flex-col gap-6 p-1">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl tracking-tight">Pick Lists</h1>
						<p className="text-muted-foreground text-sm">
							All active and completed picking tasks
						</p>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => refetch()}
						className="gap-2"
					>
						<RefreshCw className="h-4 w-4" /> Refresh
					</Button>
				</div>
				<AnimatedCard>
					<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all">
						<CardContent className="p-0">
							{isLoading ? (
								<div className="p-8 text-center text-muted-foreground">
									Loading pick lists...
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="border-border/50 border-b">
											<tr className="text-left text-muted-foreground">
												{[
													"List ID",
													"Order ID",
													"Priority",
													"Items",
													"Assigned To",
													"Area/Zone",
													"Est. Time",
													"Status",
													"Action",
												].map((h) => (
													<th
														key={h}
														className="whitespace-nowrap px-4 py-3 font-medium"
													>
														{h}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{(pickLists ?? []).map((row: any, i: number) => (
												<tr
													key={i}
													className="border-border/30 border-b transition-colors hover:bg-muted/30"
												>
													<td className="px-4 py-3 font-bold font-mono text-blue-400">
														{row.id}
													</td>
													<td className="px-4 py-3 font-mono text-muted-foreground">
														{row.order_id}
													</td>
													<td className="px-4 py-3">
														<span
															className={`rounded-full px-2 py-1 font-semibold text-xs ${priorityColor(row.priority)}`}
														>
															{row.priority}
														</span>
													</td>
													<td className="px-4 py-3 font-bold">
														{row.items_count}
													</td>
													<td className="px-4 py-3">{row.assigned_to}</td>
													<td className="rounded bg-muted/20 px-4 py-3 font-mono text-xs">
														{row.area}
													</td>
													<td className="px-4 py-3 text-muted-foreground">
														{row.estimated_time}
													</td>
													<td className="px-4 py-3">
														<span
															className={`rounded-full px-2 py-1 font-medium text-xs ${statusColor(row.status)}`}
														>
															{row.status}
														</span>
													</td>
													<td className="px-4 py-3">
														{row.status === "Pending" && (
															<Button
																size="sm"
																className="h-7 gap-1 bg-blue-600 text-white text-xs hover:bg-blue-700"
															>
																<Play className="h-3 w-3" /> Start
															</Button>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</AnimatedCard>
			</div>
		</PageTransition>
	);
}
