"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Activity,
	ArrowRight,
	ArrowUpRight,
	BarChart3,
	Flame,
	Hash,
	TrendingUp,
	Users2,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingAnalyticsOverviewPage() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "6m">("30d");
	const trpc = useTRPC();
	const analyticsQuery = trpc.instagram.getAnalytics.useQuery({
		timeRange,
	});

	const data = analyticsQuery.data;

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Top Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Analytics & Intelligence Hub
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Comprehensive insights into audience demographics, content formats, reach, and viral engagement
					</p>
				</div>

				{/* Quick Sub-navigation */}
				<div className="flex items-center gap-1.5 flex-wrap">
					<Button variant="outline" size="sm" asChild className="h-8 text-xs">
						<Link href="/marketing/analytics/posts">Post Performance</Link>
					</Button>
					<Button variant="outline" size="sm" asChild className="h-8 text-xs">
						<Link href="/marketing/analytics/audience">Audience</Link>
					</Button>
					<Button variant="outline" size="sm" asChild className="h-8 text-xs">
						<Link href="/marketing/analytics/reach">Reach & Eng.</Link>
					</Button>
					<Button variant="outline" size="sm" asChild className="h-8 text-xs">
						<Link href="/marketing/analytics/hashtags">Hashtags</Link>
					</Button>
				</div>
			</div>

			{/* Post Format Performance Breakdown */}
			<Card className="rounded-xl border-border/70 shadow-xs">
				<CardHeader className="pb-3">
					<CardTitle className="text-base font-semibold">
						Performance by Content Format
					</CardTitle>
					<CardDescription className="text-xs">
						Comparing average reach and engagement across Reels, Carousels, Static Posts, and Stories
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{data?.postTypePerformance.map((item) => (
							<div
								key={item.type}
								className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3"
							>
								<div className="flex items-center justify-between">
									<span className="font-bold text-sm text-foreground">{item.type}</span>
									<Badge variant="outline" className="text-[10px]">
										{item.totalPosts} Published
									</Badge>
								</div>

								<div className="space-y-1">
									<div className="flex justify-between text-xs">
										<span className="text-muted-foreground">Avg. Reach</span>
										<span className="font-bold text-foreground">
											{item.avgReach.toLocaleString()}
										</span>
									</div>
									<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
										<div
											style={{ width: `${(item.avgReach / 15000) * 100}%` }}
											className="h-full bg-primary rounded-full"
										/>
									</div>
								</div>

								<div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
									<span className="text-muted-foreground">Engagement:</span>
									<span className="font-bold text-emerald-600">
										{item.avgEngagement}%
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Demographics & Geographic Split */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Age Groups & Gender */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-base font-semibold">
							Retailer Age & Gender Demographics
						</CardTitle>
						<CardDescription className="text-xs">
							Verified business accounts engaging with wholesale catalog
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Gender Split */}
						<div className="space-y-2">
							<p className="font-semibold text-xs text-foreground">Gender Split</p>
							{data?.demographics.gender.map((g) => (
								<div key={g.label} className="space-y-1">
									<div className="flex justify-between text-xs">
										<span className="text-muted-foreground">{g.label}</span>
										<span className="font-bold text-foreground">{g.value}%</span>
									</div>
									<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
										<div
											style={{ width: `${g.value}%` }}
											className="h-full bg-blue-500 rounded-full"
										/>
									</div>
								</div>
							))}
						</div>

						{/* Age Bracket */}
						<div className="space-y-2 pt-3 border-t border-border/50">
							<p className="font-semibold text-xs text-foreground">Age Brackets</p>
							<div className="grid grid-cols-5 gap-2 text-center">
								{data?.demographics.ageGroups.map((a) => (
									<div key={a.bracket} className="rounded-lg bg-muted/40 p-2">
										<p className="text-xs font-bold text-foreground">{a.percentage}%</p>
										<p className="text-[10px] text-muted-foreground mt-0.5">{a.bracket}</p>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Top Cities in MP Regional Network */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-base font-semibold">
							Top Regional Hubs (Central MP)
						</CardTitle>
						<CardDescription className="text-xs">
							Geographic concentration of wholesale grocery buyers
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{data?.demographics.topCities.map((c) => (
							<div key={c.city} className="space-y-1">
								<div className="flex justify-between text-xs">
									<span className="font-semibold text-foreground">{c.city}</span>
									<span className="font-bold text-primary">{c.percentage}%</span>
								</div>
								<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
									<div
										style={{ width: `${c.percentage * 2}%` }}
										className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
									/>
								</div>
							</div>
						))}

						<div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 mt-4">
							💡 <strong>Insight:</strong> 68% of active accounts are located along the Berasia-Bhopal-Vidisha logistics corridor, aligning perfectly with van delivery routes.
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
