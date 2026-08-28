"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Progress } from "@evaluna/ui/components/progress";
import { CalendarIcon, TargetIcon, TrendingUpIcon } from "lucide-react";
import { useLocale } from "next-intl";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function TargetsPage() {
	const locale = useLocale();
	const { data: orders, isLoading: isOrdersLoading } =
		trpc.orders.list.useQuery();
	const { data: me, isLoading: isMeLoading } = trpc.staff.me.useQuery();

	// Calculate current month's sales
	const now = new Date();
	const currentMonthSales = (orders || []).reduce((acc, order) => {
		const orderDate = new Date(order.created_at || new Date());
		if (
			orderDate.getMonth() === now.getMonth() &&
			orderDate.getFullYear() === now.getFullYear() &&
			order.status !== "cancelled"
		) {
			return acc + Number(order.total_amount || 0);
		}
		return acc;
	}, 0);

	const monthlyTarget = Number.parseFloat(me?.monthly_sales_target || "0"); // Dynamically fetched target from Manager/Admin
	const targetToUse = monthlyTarget > 0 ? monthlyTarget : 500000; // Fallback to 5Lakhs if 0 for demo purposes
	const progressPercentage = Math.min(
		Math.round((currentMonthSales / targetToUse) * 100),
		100,
	);

	return (
		<PageTransition className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pb-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sales Targets</h1>
					<p className="mt-1 text-muted-foreground">
						Monitor your team's sales targets and performance.
					</p>
				</div>
			</div>

			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
									<TargetIcon className="h-6 w-6 text-blue-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Monthly Target
									</p>
									<h3 className="font-bold text-2xl">
										{formatCurrency(targetToUse, locale)}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
									<TrendingUpIcon className="h-6 w-6 text-emerald-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Achieved (This Month)
									</p>
									<h3 className="font-bold text-2xl text-emerald-600">
										{formatCurrency(currentMonthSales, locale)}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
									<CalendarIcon className="h-6 w-6 text-purple-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Remaining Days
									</p>
									<h3 className="font-bold text-2xl">
										{new Date(
											now.getFullYear(),
											now.getMonth() + 1,
											0,
										).getDate() - now.getDate()}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<AnimatedCard delay={0.3}>
				<Card>
					<CardHeader>
						<CardTitle>Current Month Progress</CardTitle>
						<CardDescription>
							Visual overview of your target achievement for{" "}
							{now.toLocaleString("default", { month: "long" })}.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-between font-medium text-sm">
							<span>{progressPercentage}% Achieved</span>
							<span>
								{formatCurrency(
									targetToUse - currentMonthSales > 0
										? targetToUse - currentMonthSales
										: 0,
									locale,
								)}{" "}
								Remaining
							</span>
						</div>
						<Progress value={progressPercentage} className="h-4" />

						{progressPercentage >= 100 && (
							<div className="mt-4 rounded-md bg-emerald-50 p-4 text-emerald-700">
								ðŸŽ‰ Congratulations! You have achieved your monthly sales
								target!
							</div>
						)}
					</CardContent>
				</Card>
			</AnimatedCard>
		</PageTransition>
	);
}
