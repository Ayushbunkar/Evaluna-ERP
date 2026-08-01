"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Activity, Megaphone, Plus, Ticket } from "lucide-react";
import Link from "next/link";
import { PageTransition, StaggerList } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function MarketingDashboard() {
	const { data: campaigns, isLoading: campaignsLoading } =
		trpc.marketing.listCampaigns.useQuery(undefined, {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		});
	const { data: coupons, isLoading: couponsLoading } =
		trpc.marketing.listCoupons.useQuery(undefined, {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		});

	const activeCampaignsCount =
		campaigns?.filter((c) => c.status === "active").length || 0;
	const totalCampaignsCount = campaigns?.length || 0;

	const activeCouponsCount = coupons?.filter((c) => c.is_active).length || 0;
	const totalCouponsCount = coupons?.length || 0;

	return (
		<PageTransition className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Marketing Dashboard
					</h1>
					<p className="mt-1 text-muted-foreground">
						Manage your campaigns, audiences, and promotional coupons.
					</p>
				</div>
			</div>

			<StaggerList className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Campaigns
						</CardTitle>
						<Megaphone className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{campaignsLoading ? "-" : totalCampaignsCount}
						</div>
						<p className="text-muted-foreground text-xs">
							{activeCampaignsCount} active right now
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Active Coupons
						</CardTitle>
						<Ticket className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{couponsLoading ? "-" : activeCouponsCount}
						</div>
						<p className="text-muted-foreground text-xs">
							Out of {totalCouponsCount} total coupons
						</p>
					</CardContent>
				</Card>

				<Card className="col-span-1 flex flex-col justify-center md:col-span-2">
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-sm">Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						<Button asChild variant="default" className="min-w-[120px] flex-1">
							<Link href="/admin/marketing/campaigns/new">
								<Plus className="mr-2 h-4 w-4" /> New Campaign
							</Link>
						</Button>
						<Button
							asChild
							variant="secondary"
							className="min-w-[120px] flex-1"
						>
							<Link href="/admin/marketing/coupons">
								<Ticket className="mr-2 h-4 w-4" /> Manage Coupons
							</Link>
						</Button>
					</CardContent>
				</Card>
			</StaggerList>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" /> Recent Campaigns
						</CardTitle>
						<CardDescription>
							Latest marketing campaigns and their status
						</CardDescription>
					</CardHeader>
					<CardContent>
						{campaignsLoading ? (
							<p className="text-muted-foreground text-sm">
								Loading campaigns...
							</p>
						) : campaigns && campaigns.length > 0 ? (
							<div className="space-y-4">
								{campaigns.slice(0, 5).map((campaign) => (
									<div
										key={campaign.id}
										className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
									>
										<div>
											<p className="font-medium">{campaign.name}</p>
											<p className="text-muted-foreground text-xs">
												{campaign.type} • {campaign.channel}
											</p>
										</div>
										<div className="rounded-md bg-secondary px-2 py-1 text-sm capitalize">
											{campaign.status}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								No campaigns found.
							</p>
						)}
						<div className="mt-4">
							<Button asChild variant="outline" className="w-full">
								<Link href="/admin/marketing/campaigns">
									View All Campaigns
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
