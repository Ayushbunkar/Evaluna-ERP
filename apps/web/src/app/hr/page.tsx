"use client";

import {
	Card,
	CardContent,
} from "@evaluna/ui/components/card";
import {
	UsersIcon,
	UserCheckIcon,
	BanknoteIcon,
	UserMinusIcon,
	TrendingUpIcon,
	ClockIcon,
	BriefcaseIcon,
	CalendarIcon
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

function KPICard({
	title,
	value,
	icon: Icon,
	trend,
	trendValue,
	trendIsPositive,
}: {
	title: string;
	value: string | number;
	icon: any;
	trend?: string;
	trendValue?: string;
	trendIsPositive?: boolean;
}) {
	return (
		<Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-xl transition-all hover:shadow-md">
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="rounded-xl bg-primary/10 p-3 text-primary">
						<Icon className="h-6 w-6" />
					</div>
					{trendValue && (
						<div className={`font-medium text-sm ${trendIsPositive ? 'text-green-600' : 'text-red-600'}`}>
							{trendIsPositive ? "↑" : "↓"} {trendValue}
						</div>
					)}
				</div>
				<div className="mt-4">
					<p className="font-medium text-muted-foreground text-sm capitalize">{title.replace(/([A-Z])/g, " $1").trim()}</p>
					<h3 className="mt-1 font-bold text-2xl tracking-tight">{value}</h3>
					{trend && (
						<p className="mt-2 text-muted-foreground text-xs">{trend}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function HrDashboard() {
	const { data: stats, isLoading } = useTRPC().hr.getDashboardStats.useQuery(
		{},
		{ staleTime: 30_000, refetchOnWindowFocus: false },
	);

	const getIconForKey = (key: string) => {
		switch(key) {
			case 'totalEmployees': return UsersIcon;
			case 'presentToday': return UserCheckIcon;
			case 'onLeave': return CalendarIcon;
			case 'payrollPending': return ClockIcon;
			case 'newHiresThisMonth': return BriefcaseIcon;
			case 'attritionRate': return UserMinusIcon;
			case 'openPositions': return BriefcaseIcon;
			case 'avgSalary': return BanknoteIcon;
			default: return TrendingUpIcon;
		}
	};

	return (
		<div className="space-y-6 p-4">
			<h1 className="font-bold text-3xl capitalize">HR Dashboard</h1>
			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
					{[1,2,3,4,5,6,7,8].map(i => (
						<Card key={i} className="h-[140px] bg-muted/20" />
					))}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{stats &&
						Object.entries(stats).map(([key, value]) => {
							if (Array.isArray(value)) return null;
							let displayValue: string | number = value as any;
							if (key === 'avgSalary') {
								displayValue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));
							}
							if (key === 'attritionRate') {
								displayValue = `${value}%`;
							}
							return (
								<KPICard
									key={key}
									title={key}
									value={displayValue}
									icon={getIconForKey(key)}
								/>
							);
						})}
				</div>
			)}
		</div>
	);
}
