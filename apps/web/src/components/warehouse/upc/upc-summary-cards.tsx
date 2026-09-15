"use client";

import { Card, CardContent } from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Activity,
	AlertCircle,
	CheckCircle2,
	CheckSquare,
	Package,
	QrCode,
	Users,
} from "lucide-react";

import { useTRPC } from "@/lib/trpc/client";

interface UpcStats {
	totalProducts: number;
	productsWithUpc: number;
	productsWithoutUpc: number;
	tasksAssigned: number;
	tasksInProgress: number;
	tasksCompleted: number;
	tasksPending: number;
}

interface UpcSummaryCardsProps {
	stats?: UpcStats;
	isLoading?: boolean;
}

export function UpcSummaryCards({ stats: propStats, isLoading: propLoading }: UpcSummaryCardsProps) {
	const trpc = useTRPC();
	const statsQuery = trpc.upc.getStats.useQuery(undefined, {
		enabled: !propStats,
	});

	const stats = propStats || statsQuery.data;
	const isLoading = propLoading !== undefined ? propLoading : statsQuery.isLoading;

	const cards = [
		{
			title: "Total Products",
			value: stats?.totalProducts ?? 0,
			subtitle: "Active catalog items",
			icon: Package,
			color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/40 dark:border-blue-900",
		},
		{
			title: "Products With UPC",
			value: stats?.productsWithUpc ?? 0,
			subtitle: `${stats?.totalProducts ? Math.round(((stats?.productsWithUpc ?? 0) / stats.totalProducts) * 100) : 0}% coverage`,
			icon: CheckCircle2,
			color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900",
		},
		{
			title: "Without UPC",
			value: stats?.productsWithoutUpc ?? 0,
			subtitle: "Require UPC generation",
			icon: AlertCircle,
			color: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/40 dark:border-amber-900",
		},
		{
			title: "Tasks Assigned",
			value: stats?.tasksAssigned ?? 0,
			subtitle: "Awaiting operator start",
			icon: Users,
			color: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900",
		},
		{
			title: "In Progress",
			value: stats?.tasksInProgress ?? 0,
			subtitle: "Active floor labeling",
			icon: Activity,
			color: "text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-950/40 dark:border-violet-900",
		},
		{
			title: "Tasks Completed",
			value: stats?.tasksCompleted ?? 0,
			subtitle: "Verified & labeled",
			icon: CheckSquare,
			color: "text-teal-600 bg-teal-50 border-teal-100 dark:bg-teal-950/40 dark:border-teal-900",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
			{cards.map((card) => {
				const Icon = card.icon;
				return (
					<Card key={card.title} className="border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md">
						<CardContent className="p-3.5 sm:p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
									{card.title}
								</span>
								<div className={`p-1.5 rounded-lg border ${card.color}`}>
									<Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
								</div>
							</div>
							{isLoading ? (
								<Skeleton className="h-7 w-16 mb-1" />
							) : (
								<div className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
									{card.value.toLocaleString()}
								</div>
							)}
							<p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
								{card.subtitle}
							</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export { UpcSummaryCards as UPCSummaryCards };
