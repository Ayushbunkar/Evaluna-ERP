"use client";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { useTRPC } from "@/lib/trpc/client";
import { AnimatedCard, PageTransition } from "@/lib/animations";

export default function ShelfReturnsPage() {
	const { data, isLoading } = useTRPC().picker.getReturns.useQuery({});

	return (
		<PageTransition>
		<div className="flex flex-col gap-6 p-1">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Shelf Returns</h1>
				<p className="text-muted-foreground text-sm">
					Items to be placed back on the shelf
				</p>
			</div>
			<AnimatedCard>
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
											"Return ID",
											"Product",
											"SKU",
											"Qty",
											"Put to Location",
											"Reason",
											"Status",
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
											<td className="px-4 py-3 font-bold font-mono text-orange-400">
												{row.id}
											</td>
											<td className="px-4 py-3 font-medium">{row.product}</td>
											<td className="px-4 py-3 font-mono text-muted-foreground text-xs">
												{row.sku}
											</td>
											<td className="px-4 py-3 font-bold">{row.qty}</td>
											<td className="px-4 py-3 font-mono text-xs">
												{row.location}
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{row.reason}
											</td>
											<td className="px-4 py-3">
												<span
													className={`rounded-full px-2 py-1 font-medium text-xs ${row.status === "Placed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
												>
													{row.status}
												</span>
											</td>
											<td className="px-4 py-3">
												{row.status === "Pending" && (
													<Button
														size="sm"
														className="h-7 bg-green-600 text-white text-xs hover:bg-green-700"
													>
														Place
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
