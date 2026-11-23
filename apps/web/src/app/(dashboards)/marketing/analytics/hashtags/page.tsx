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
import { ArrowLeft, Hash } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingHashtagAnalyticsPage() {
	const trpc = useTRPC();
	const analyticsQuery = trpc.instagram.getAnalytics.useQuery();
	const data = analyticsQuery.data;

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
						Hashtag Performance Analytics
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						Analysis of which hashtag clusters drive the highest impressions and lead acquisition
					</p>
				</div>
			</div>

			<Card className="rounded-xl border-border/70 shadow-xs">
				<CardHeader>
					<CardTitle className="text-base font-semibold">Top Performing Wholesale Tags</CardTitle>
					<CardDescription className="text-xs">
						Based on organic reach generated per post tag
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="divide-y divide-border/50">
						{data?.hashtagAnalytics.map((h) => (
							<div key={h.tag} className="py-3 flex items-center justify-between text-xs">
								<div className="flex items-center gap-2">
									<Hash className="h-4 w-4 text-primary" />
									<span className="font-bold text-foreground text-sm">{h.tag}</span>
									<span className="text-muted-foreground text-[11px] ml-2">({h.uses} posts)</span>
								</div>
								<div className="flex items-center gap-6">
									<div>
										<p className="font-bold text-foreground">{h.reach.toLocaleString()}</p>
										<p className="text-[10px] text-muted-foreground">Total Reach</p>
									</div>
									<div className="text-right">
										<Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">
											{h.engagement}
										</Badge>
										<p className="text-[10px] text-muted-foreground mt-0.5">Avg Eng.</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
