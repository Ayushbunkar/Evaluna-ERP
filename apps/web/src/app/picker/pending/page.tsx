"use client";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { FadeIn, PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const priorityColor = (p: string) => {
	if (p === "High") return "bg-red-500/20 text-red-400";
	if (p === "Medium") return "bg-yellow-500/20 text-yellow-400";
	return "bg-green-500/20 text-green-400";
};

export default function PendingQueuePage() {
	const { data, isLoading } = useTRPC().picker.getPending.useQuery({});

	return (
		<PageTransition>
			<div className="flex flex-col gap-6 p-1">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Pending Queue</h1>
					<p className="text-muted-foreground text-sm">
						Upcoming pick tasks waiting to be started
					</p>
				</div>
				<FadeIn>
					<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all">
						<CardContent className="p-0">
							{isLoading ? (
								<div className="p-8 text-center text-muted-foreground">
									Loading...
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="border-border/50 border-b">
											<tr className="text-left text-muted-foreground">
												{[
													"Queue #",
													"Order ID",
													"Priority",
													"Items",
													"Assigned To",
													"Waiting Since",
													"Expected By",
													"Action",
												].map((h) => (
													<th key={h} className="px-4 py-3 font-medium">
														{h}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{(data ?? []).map((row: any, i: number) => (
												<tr
													key={i}
													className="border-border/30 border-b hover:bg-muted/30"
												>
													<td className="px-4 py-3 font-bold text-muted-foreground">
														#{row.queue_no}
													</td>
													<td className="px-4 py-3 font-bold font-mono text-blue-400">
														{row.order_id}
													</td>
													<td className="px-4 py-3">
														<span
															className={`rounded-full px-2 py-1 font-semibold text-xs ${priorityColor(row.priority)}`}
														>
															{row.priority}
														</span>
													</td>
													<td className="px-4 py-3 font-bold">{row.items}</td>
													<td className="px-4 py-3">
														{row.assigned_to === "Unassigned" ? (
															<span className="text-red-400">Unassigned</span>
														) : (
															row.assigned_to
														)}
													</td>
													<td className="px-4 py-3 text-muted-foreground">
														{row.waiting_since}
													</td>
													<td className="px-4 py-3 text-yellow-400">
														{row.expected_by}
													</td>
													<td className="px-4 py-3">
														<Button
															size="sm"
															className="h-7 bg-blue-600 text-white text-xs hover:bg-blue-700"
														>
															Assign
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</FadeIn>
			</div>
		</PageTransition>
	);
}
