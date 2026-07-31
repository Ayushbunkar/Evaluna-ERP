"use client";

import { Card, CardContent } from "@evaluna/ui/components/card";
import { useTRPC } from "@/lib/trpc/client";

export default function CompletedPicksPage() {
	const { data, isLoading } = useTRPC().picker.getCompleted.useQuery({});

	return (
		<div className="flex flex-col gap-6 p-1">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Completed Picks</h1>
				<p className="text-muted-foreground text-sm">
					History of all completed picking tasks
				</p>
			</div>
			<Card className="border-border/50 bg-card/50">
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
											"Pick ID",
											"Order ID",
											"Items",
											"Time Taken",
											"Completed By",
											"Date",
											"Accuracy",
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
											<td className="px-4 py-3 font-bold font-mono text-blue-400">
												{row.id}
											</td>
											<td className="px-4 py-3 font-mono text-muted-foreground">
												{row.order_id}
											</td>
											<td className="px-4 py-3 font-bold">{row.items}</td>
											<td className="px-4 py-3">{row.time_taken}</td>
											<td className="px-4 py-3">{row.completed_by}</td>
											<td className="px-4 py-3 text-muted-foreground">
												{row.date}
											</td>
											<td className="px-4 py-3">
												<span
													className={`font-bold ${row.accuracy === 100 ? "text-green-400" : row.accuracy >= 95 ? "text-yellow-400" : "text-red-400"}`}
												>
													{row.accuracy}%
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
