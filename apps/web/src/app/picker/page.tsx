"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	AlertTriangle,
	CheckCircle,
	ClipboardList,
	Clock,
	Package,
	TrendingUp,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";

const StatCard = ({
	title,
	value,
	sub,
	icon: Icon,
	color,
}: {
	title: string;
	value: string | number;
	sub?: string;
	icon: any;
	color: string;
}) => (
	<AnimatedCard>
		<Card className="h-full border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
			<CardContent className="p-5">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{title}
						</p>
						<p className="mt-1 font-bold text-3xl">{value}</p>
						{sub && <p className="mt-1 text-muted-foreground text-xs">{sub}</p>}
					</div>
					<div className={`rounded-xl p-3 shadow-sm ${color}`}>
						<Icon className="h-6 w-6 text-white" />
					</div>
				</div>
			</CardContent>
		</Card>
	</AnimatedCard>
);

const statusColor = (s: string) => {
	const map: Record<string, string> = {
		Completed: "bg-green-500/20 text-green-400",
		"In Progress": "bg-blue-500/20 text-blue-400",
		Pending: "bg-yellow-500/20 text-yellow-400",
		Exception: "bg-red-500/20 text-red-400",
	};
	return map[s] || "bg-gray-500/20 text-gray-400";
};

export default function PickerDashboard() {
	const { data: stats, isLoading } =
		useTRPC().picker.getDashboardStats.useQuery(
			{},
			{ staleTime: 30_000, refetchOnWindowFocus: false },
		);

	return (
		<PageTransition>
			<div className="flex flex-col gap-6 p-1">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Picker Dashboard</h1>
				<p className="text-muted-foreground text-sm">
					Your picking tasks and performance for today
				</p>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="h-28 animate-pulse bg-muted/50" />
					))}
				</div>
			) : (
				<StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					<StaggerItem>
						<StatCard
							title="Assigned Today"
							value={stats?.assignedToday ?? 0}
							icon={ClipboardList}
							color="bg-blue-600"
						/>
					</StaggerItem>
					<StaggerItem>
						<StatCard
							title="Completed"
							value={stats?.completed ?? 0}
							icon={CheckCircle}
							color="bg-green-600"
						/>
					</StaggerItem>
					<StaggerItem>
						<StatCard
							title="Pending"
							value={stats?.pending ?? 0}
							icon={Clock}
							color="bg-yellow-600"
						/>
					</StaggerItem>
					<StaggerItem>
						<StatCard
							title="Exceptions"
							value={stats?.exceptions ?? 0}
							icon={AlertTriangle}
							color="bg-red-600"
						/>
					</StaggerItem>
					<StaggerItem>
						<StatCard
							title="Items Picked"
							value={stats?.totalItemsPicked ?? 0}
							icon={Package}
							color="bg-purple-600"
						/>
					</StaggerItem>
					<StaggerItem>
						<StatCard
							title="Accuracy"
							value={`${stats?.pickAccuracy ?? 0}%`}
							icon={TrendingUp}
							color="bg-teal-600"
						/>
					</StaggerItem>
				</StaggerList>
			)}

			<AnimatedCard>
				<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
					<CardHeader>
						<CardTitle className="text-base">Recent Activity</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="border-border/50 border-b">
									<tr className="text-left text-muted-foreground">
										{[
											"Pick List",
											"Order",
											"Items",
											"Area",
											"Status",
											"Time",
										].map((h) => (
											<th key={h} className="px-4 py-3 font-medium">
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{(stats?.recentTasks ?? []).map((task: any, i: number) => (
										<tr
											key={i}
											className="border-border/30 border-b transition-colors hover:bg-muted/30 last:border-0"
										>
											<td className="px-4 py-3 font-medium font-mono text-blue-400">
												{task.id}
											</td>
											<td className="px-4 py-3">{task.order}</td>
											<td className="px-4 py-3 font-medium">{task.items}</td>
											<td className="px-4 py-3">{task.area}</td>
											<td className="px-4 py-3">
												<span
													className={`rounded-full px-2.5 py-1 font-bold tracking-wider text-[10px] uppercase shadow-sm ${statusColor(task.status)}`}
												>
													{task.status}
												</span>
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{task.time}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</AnimatedCard>
		</div>
		</PageTransition>
	);
}
