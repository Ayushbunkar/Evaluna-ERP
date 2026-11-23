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
import { ArrowLeft, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingReachPage() {
	const trpc = useTRPC();
	const overviewQuery = trpc.instagram.getOverview.useQuery();
	const data = overviewQuery.data;

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild className="h-8 w-8">
					<Link href="/marketing/analytics">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Reach & Engagement Growth
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						Organic reach trajectory and impressions velocity across Meta channels
					</p>
				</div>
			</div>

			<Card className="rounded-xl border-border/70 shadow-xs">
				<CardHeader>
					<CardTitle className="text-base font-semibold">Total Accounts Reached: {data?.metrics.totalReach.toLocaleString()}</CardTitle>
					<CardDescription className="text-xs">
						Growth trajectory: {data?.metrics.reachChangePercent} vs previous cycle
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-64 flex items-end gap-2 pt-8 pb-4">
						{data?.reachTrend.map((pt) => (
							<div key={pt.date} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
								<div className="w-full bg-primary/80 rounded-t group-hover:bg-primary transition-all" style={{ height: `${(pt.reach / 2500) * 100}%` }} />
								<span className="text-[9px] text-muted-foreground truncate">{pt.date}</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
