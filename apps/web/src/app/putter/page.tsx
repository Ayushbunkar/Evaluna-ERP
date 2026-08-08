"use client";

import {
	Card,
	CardContent,
} from "@evaluna/ui/components/card";
import { useTRPC } from "@/lib/trpc/client";
import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	CartesianGrid,
} from "recharts";
import { Package } from "lucide-react";

export default function PutterDashboard() {
	const { data: stats, isLoading } =
		useTRPC().putter.getDashboardStats.useQuery(
			{},
			{ staleTime: 30_000, refetchOnWindowFocus: false },
		);

	return (
		<div className="space-y-6 p-4">
			<h1 className="font-bold text-3xl capitalize">putter Dashboard</h1>
			{isLoading ? (
				<p>Loading stats...</p>
			) : (
				<div className="space-y-6">
					<div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
						{stats &&
							Object.entries(stats).map(([key, value]) => {
								if (Array.isArray(value)) return null;
								const title = key.replace(/([A-Z])/g, " $1").trim();
								const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
								return (
									<Card
										key={key}
										className="h-full border-border bg-card shadow-sm rounded-xl transition-all hover:shadow-md"
									>
										<CardContent className="p-5 flex flex-col justify-between">
											<div className="flex items-start justify-between">
												<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/80">
													<Package className="h-6 w-6 text-foreground" />
												</div>
											</div>
											<div className="mt-6 space-y-1">
												<p className="font-medium text-muted-foreground text-sm">
													{formattedTitle}
												</p>
												<p className="font-bold text-3xl tracking-tight">{value as any}</p>
											</div>
										</CardContent>
									</Card>
								);
							})}
					</div>

					{stats?.chartData && stats.chartData.length > 0 && (
						<Card className="border-border bg-card shadow-sm rounded-xl transition-all hover:shadow-md">
							<CardContent className="p-6">
								<h2 className="text-xl font-bold mb-6">Receiving & Put Away Trend (Last 7 Days)</h2>
								<div className="h-[300px] w-full">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={stats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
											<XAxis 
												dataKey="date" 
												axisLine={false}
												tickLine={false}
												tick={{ fill: "hsl(var(--muted-foreground))" }}
												dy={10}
											/>
											<YAxis 
												axisLine={false}
												tickLine={false}
												tick={{ fill: "hsl(var(--muted-foreground))" }}
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "hsl(var(--card))",
													border: "1px solid hsl(var(--border))",
													borderRadius: "0.5rem",
													boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
												}}
											/>
											<Line 
												type="monotone" 
												dataKey="received" 
												name="Received"
												stroke="hsl(var(--primary))" 
												strokeWidth={3} 
												dot={{ r: 4, strokeWidth: 2 }}
												activeDot={{ r: 6 }} 
											/>
											<Line 
												type="monotone" 
												dataKey="putAway" 
												name="Put Away"
												stroke="hsl(var(--muted-foreground))" 
												strokeWidth={3}
												dot={{ r: 4, strokeWidth: 2 }}
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}
		</div>
	);
}
