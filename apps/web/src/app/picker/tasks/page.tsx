"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { CheckCircle2, MapPin, ScanLine } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

export default function CurrentTaskPage() {
	const { data, isLoading } = useTRPC().picker.getCurrentTask.useQuery({});

	if (isLoading)
		return (
			<div className="p-8 text-center text-muted-foreground">
				Loading current task...
			</div>
		);

	const task = data?.task;
	const items = data?.items ?? [];
	const pct = task
		? Math.round((task.picked_items / task.total_items) * 100)
		: 0;

	return (
		<div className="flex flex-col gap-6 p-1">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Current Task</h1>
				<p className="text-muted-foreground text-sm">
					Your active pick list — scan items to complete
				</p>
			</div>

			{task && (
				<Card className="border-border/50 bg-gradient-to-r from-blue-900/30 to-blue-800/20">
					<CardContent className="p-5">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-xs">
									Active Pick List
								</p>
								<h2 className="font-bold text-blue-400 text-xl">{task.id}</h2>
								<p className="text-muted-foreground text-sm">
									Order:{" "}
									<span className="font-medium text-foreground">
										{task.order_id}
									</span>{" "}
									&nbsp;|&nbsp; Zone:{" "}
									<span className="font-medium text-foreground">
										{task.area}
									</span>
								</p>
							</div>
							<div className="text-right">
								<p className="font-bold text-4xl text-blue-400">{pct}%</p>
								<p className="text-muted-foreground text-xs">
									{task.picked_items} / {task.total_items} items
								</p>
							</div>
						</div>
						<div className="h-2 w-full rounded-full bg-muted/40">
							<div
								className="h-2 rounded-full bg-blue-500 transition-all"
								style={{ width: `${pct}%` }}
							/>
						</div>
					</CardContent>
				</Card>
			)}

			<Card className="border-border/50 bg-card/50">
				<CardHeader className="p-4 pb-0">
					<CardTitle className="text-base">Items to Pick</CardTitle>
				</CardHeader>
				<CardContent className="mt-3 p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-border/50 border-b">
								<tr className="text-left text-muted-foreground">
									{[
										"#",
										"Product Name",
										"SKU",
										"Location",
										"Qty Required",
										"Qty Picked",
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
								{items.map((item: any) => (
									<tr
										key={item.id}
										className={`border-border/30 border-b transition-colors ${item.status === "Picked" ? "opacity-60" : "hover:bg-muted/30"}`}
									>
										<td className="px-4 py-3 text-muted-foreground">
											{item.id}
										</td>
										<td className="px-4 py-3 font-medium">{item.product}</td>
										<td className="px-4 py-3 font-mono text-muted-foreground text-xs">
											{item.sku}
										</td>
										<td className="px-4 py-3">
											<span className="flex w-fit items-center gap-1 rounded bg-muted/30 px-2 py-1 font-mono text-xs">
												<MapPin className="h-3 w-3 text-blue-400" />
												{item.location}
											</span>
										</td>
										<td className="px-4 py-3 font-bold">{item.qty_required}</td>
										<td className="px-4 py-3 font-bold text-green-400">
											{item.qty_picked}
										</td>
										<td className="px-4 py-3">
											{item.status === "Picked" ? (
												<span className="flex items-center gap-1 text-green-400 text-xs">
													<CheckCircle2 className="h-4 w-4" /> Picked
												</span>
											) : (
												<span className="text-xs text-yellow-400">Pending</span>
											)}
										</td>
										<td className="px-4 py-3">
											{item.status !== "Picked" && (
												<Button
													size="xs"
													className="h-7 gap-1 bg-blue-600 text-white text-xs hover:bg-blue-700"
												>
													<ScanLine className="h-3 w-3" /> Scan
												</Button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
