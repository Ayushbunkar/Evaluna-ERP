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
import { ArrowLeft, MapPin, Users2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingAudiencePage() {
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
						Audience Insights & Demographics
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						Understand the profile, location, and behavior of B2B retail grocery partners
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader>
						<CardTitle className="text-base font-semibold">City Distribution</CardTitle>
						<CardDescription className="text-xs">Central India Retail Corridor</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{data?.demographics.topCities.map((c) => (
							<div key={c.city} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20">
								<span className="font-semibold text-xs flex items-center gap-2">
									<MapPin className="h-3.5 w-3.5 text-primary" />
									{c.city}
								</span>
								<Badge variant="outline" className="text-xs">{c.percentage}% of audience</Badge>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader>
						<CardTitle className="text-base font-semibold">Age Brackets</CardTitle>
						<CardDescription className="text-xs">Kirana owner age distribution</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{data?.demographics.ageGroups.map((a) => (
							<div key={a.bracket} className="space-y-1">
								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">{a.bracket} Years</span>
									<span className="font-bold text-foreground">{a.percentage}%</span>
								</div>
								<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
									<div style={{ width: `${a.percentage * 2}%` }} className="h-full bg-primary rounded-full" />
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
