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
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Activity,
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	BarChart2,
	Calendar,
	CheckCircle,
	Clock,
	ExternalLink,
	Eye,
	Flame,
	Heart,
	Layers,
	LineChart,
	MessageCircle,
	MousePointerClick,
	PenSquare,
	RefreshCw,
	Send,
	Share2,
	Sparkles,
	TrendingUp,
	Users,
	Video,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingOverviewPage() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "6m">("30d");
	const trpc = useTRPC();

	const overviewQuery = trpc.instagram.getOverview.useQuery({
		timeRange,
	});

	const syncMutation = trpc.instagram.syncAccount.useMutation({
		onSuccess: () => {
			toast.success("Instagram account synced with Meta Graph API!");
			overviewQuery.refetch();
		},
		onError: () => {
			toast.error("Failed to sync account.");
		},
	});

	const data = overviewQuery.data;
	const metrics = data?.metrics;
	const account = data?.account;

	const handleSync = () => {
		if (account?.id) {
			syncMutation.mutate({ id: account.id });
		}
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Top Bar: Title & Filter Controls */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
							Marketing Overview
						</h1>
						<Badge
							variant="outline"
							className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium"
						>
							Live Meta Sync
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Real-time Instagram Business performance, audience growth, and campaign analytics
					</p>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					{/* Time Range Pills */}
					<div className="inline-flex items-center rounded-lg border border-border/70 bg-card p-1 shadow-xs">
						{(["7d", "30d", "90d", "6m"] as const).map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setTimeRange(r)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
									timeRange === r
										? "bg-primary text-primary-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{r.toUpperCase()}
							</button>
						))}
					</div>

					{/* Sync Button */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleSync}
						disabled={syncMutation.isPending}
						className="h-8 gap-1.5 text-xs rounded-lg border-border/70 shadow-xs"
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
						/>
						Sync Now
					</Button>

					<Button
						size="sm"
						asChild
						className="h-8 gap-1.5 text-xs rounded-lg bg-primary text-primary-foreground shadow-xs"
					>
						<Link href="/marketing/create">
							<PenSquare className="h-3.5 w-3.5" />
							Create Post
						</Link>
					</Button>
				</div>
			</div>

			{/* Meta Graph API Account Banner */}
			{account && (
				<div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
					<div className="flex items-center gap-3.5">
						<img
							src={account.profilePictureUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"}
							alt={account.username}
							className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
						/>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="font-bold text-sm text-foreground">
									@{account.username}
								</h2>
								<Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
									{account.accountType}
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground mt-0.5">
								{account.name} • Central India Wholesale Grocery Network
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4 text-xs text-muted-foreground divide-x divide-border/60">
						<div>
							<span className="font-semibold text-foreground text-sm">
								{(account.followersCount || 14820).toLocaleString()}
							</span>{" "}
							Followers
						</div>
						<div className="pl-4">
							<span className="font-semibold text-foreground text-sm">
								{account.mediaCount || 86}
							</span>{" "}
							Posts
						</div>
						<div className="pl-4">
							<span className="font-semibold text-foreground text-sm">
								{account.followsCount || 312}
							</span>{" "}
							Following
						</div>
					</div>
				</div>
			)}

			{/* 12 Metric KPI Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
				{/* 1. Followers */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Total Followers</span>
							<Users className="h-4 w-4 text-blue-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.totalFollowers.toLocaleString() || "14,820"}
							</span>
							<span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
								<ArrowUpRight className="h-3 w-3 mr-0.5" />
								{metrics?.followersChangePercent || "+12.4%"}
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							+342 new kirana accounts this month
						</p>
					</CardContent>
				</Card>

				{/* 2. Total Reach */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Total Reach</span>
							<Flame className="h-4 w-4 text-amber-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.totalReach.toLocaleString() || "41,200"}
							</span>
							<span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
								<ArrowUpRight className="h-3 w-3 mr-0.5" />
								{metrics?.reachChangePercent || "+24.8%"}
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Unique retail accounts reached
						</p>
					</CardContent>
				</Card>

				{/* 3. Total Impressions */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Impressions</span>
							<Eye className="h-4 w-4 text-purple-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.totalImpressions.toLocaleString() || "53,400"}
							</span>
							<span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
								<ArrowUpRight className="h-3 w-3 mr-0.5" />
								{metrics?.impressionsChangePercent || "+19.1%"}
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Total content views across feed & reels
						</p>
					</CardContent>
				</Card>

				{/* 4. Avg Engagement Rate */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Avg Engagement</span>
							<Activity className="h-4 w-4 text-rose-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.avgEngagementRate || "8.62%"}
							</span>
							<span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
								<ArrowUpRight className="h-3 w-3 mr-0.5" />
								{metrics?.engagementRateChange || "+1.2%"}
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Industry B2B benchmark: 3.4%
						</p>
					</CardContent>
				</Card>

				{/* 5. Profile Visits */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Profile Visits</span>
							<Users className="h-4 w-4 text-cyan-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.profileVisits.toLocaleString() || "3,840"}
							</span>
							<span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
								<ArrowUpRight className="h-3 w-3 mr-0.5" />
								{metrics?.profileVisitsChangePercent || "+8.2%"}
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Retailers exploring business bio
						</p>
					</CardContent>
				</Card>

				{/* 6. Website / App Clicks */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Website / App Taps</span>
							<MousePointerClick className="h-4 w-4 text-emerald-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.websiteTaps.toLocaleString() || "920"}
							</span>
							<span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
								<ArrowUpRight className="h-3 w-3 mr-0.5" />
								{metrics?.websiteTapsChangePercent || "+15.7%"}
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Direct catalog & signup conversions
						</p>
					</CardContent>
				</Card>

				{/* 7. Total Likes */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Total Likes</span>
							<Heart className="h-4 w-4 text-pink-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.totalLikes.toLocaleString() || "2,830"}
							</span>
							<span className="text-[11px] font-medium text-muted-foreground">
								Reels & Posts
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Organic engagement across Bhopal & MP
						</p>
					</CardContent>
				</Card>

				{/* 8. Total Comments & Inquiries */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Comments & Leads</span>
							<MessageCircle className="h-4 w-4 text-indigo-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.totalComments || "166"}
							</span>
							<Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]">
								92% Replied
							</Badge>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Price & delivery inquiries
						</p>
					</CardContent>
				</Card>

				{/* 9. Shares */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Post Shares</span>
							<Share2 className="h-4 w-4 text-teal-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.totalShares || "370"}
							</span>
							<span className="text-[11px] font-semibold text-emerald-600">
								+31% viral
							</span>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Shared to WhatsApp kirana groups
						</p>
					</CardContent>
				</Card>

				{/* 10. Content In Pipeline */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Scheduled Queue</span>
							<Clock className="h-4 w-4 text-orange-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.scheduledCount || "2"} Posts
							</span>
							<Badge variant="outline" className="text-[10px]">
								Auto-Publish On
							</Badge>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Next: Tomorrow at 11:00 AM
						</p>
					</CardContent>
				</Card>

				{/* 11. Drafts */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Draft Posts</span>
							<Layers className="h-4 w-4 text-stone-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								{metrics?.draftCount || "1"}
							</span>
							<Button variant="link" size="sm" asChild className="p-0 h-auto text-xs">
								<Link href="/marketing/posts?status=DRAFT">View Drafts</Link>
							</Button>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Unpublished concepts ready for review
						</p>
					</CardContent>
				</Card>

				{/* 12. Active Campaigns */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Active Campaigns</span>
							<Flame className="h-4 w-4 text-red-500" />
						</div>
						<div className="mt-2 flex items-baseline justify-between">
							<span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
								2 Active
							</span>
							<Badge className="bg-primary/10 text-primary text-[10px]">
								₹70,000 Budget
							</Badge>
						</div>
						<p className="text-[10px] text-muted-foreground mt-1">
							Monsoon Bonanza & Sourcing Trust
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Row: Follower Growth & Reach Impressions */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Follower Growth Chart */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<div>
							<CardTitle className="text-base font-semibold">
								Followers Growth & Net Gain
							</CardTitle>
							<CardDescription className="text-xs">
								Tracking cumulative followers and daily new kirana shop joins
							</CardDescription>
						</div>
						<Badge variant="outline" className="text-xs">
							{timeRange.toUpperCase()}
						</Badge>
					</CardHeader>
					<CardContent className="pt-4">
						{data?.followerTrend ? (
							<div className="space-y-4">
								{/* Visual SVG chart representation */}
								<div className="h-52 w-full flex items-end gap-2 pt-6 pb-2">
									{data.followerTrend.map((pt, i) => {
										const maxF = Math.max(...data.followerTrend.map((p) => p.followers));
										const minF = Math.min(...data.followerTrend.map((p) => p.followers)) - 50;
										const heightPercent = Math.max(
											15,
											Math.min(100, ((pt.followers - minF) / (maxF - minF)) * 100),
										);

										return (
											<div
												key={pt.date}
												className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
											>
												{/* Tooltip on hover */}
												<div className="absolute -top-12 z-20 hidden rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-md group-hover:block whitespace-nowrap">
													<p className="font-bold">{pt.followers.toLocaleString()} followers</p>
													<p className="text-[9px] text-emerald-400">+{pt.netGain} new</p>
												</div>

												{/* Bar */}
												<div
													style={{ height: `${heightPercent}%` }}
													className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary transition-all duration-300 group-hover:from-primary/50 group-hover:to-primary"
												/>
												<span className="text-[9px] text-muted-foreground truncate max-w-[36px]">
													{pt.date}
												</span>
											</div>
										);
									})}
								</div>

								<div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
									<div className="flex items-center gap-2">
										<span className="h-2 w-2 rounded-full bg-primary" />
										<span>Followers Curve</span>
									</div>
									<span className="font-semibold text-foreground">
										Net Gain: +342 accounts
									</span>
								</div>
							</div>
						) : (
							<Skeleton className="h-52 w-full rounded-lg" />
						)}
					</CardContent>
				</Card>

				{/* Reach vs Impressions Comparison */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<div>
							<CardTitle className="text-base font-semibold">
								Reach vs. Impressions
							</CardTitle>
							<CardDescription className="text-xs">
								Organic visibility across Feed, Reels, and Stories
							</CardDescription>
						</div>
						<Badge variant="outline" className="text-xs">
							Daily Trend
						</Badge>
					</CardHeader>
					<CardContent className="pt-4">
						{data?.reachTrend ? (
							<div className="space-y-4">
								<div className="h-52 w-full flex items-end gap-2 pt-6 pb-2">
									{data.reachTrend.map((pt) => {
										const maxImp = Math.max(
											...data.reachTrend.map((p) => p.impressions),
										);
										const reachH = Math.max(
											15,
											Math.min(100, (pt.reach / maxImp) * 100),
										);
										const impH = Math.max(
											20,
											Math.min(100, (pt.impressions / maxImp) * 100),
										);

										return (
											<div
												key={pt.date}
												className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
											>
												<div className="absolute -top-12 z-20 hidden rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-md group-hover:block whitespace-nowrap">
													<p>Reach: {pt.reach.toLocaleString()}</p>
													<p>Impressions: {pt.impressions.toLocaleString()}</p>
												</div>

												<div className="flex w-full items-end gap-1 h-full justify-center">
													<div
														style={{ height: `${reachH}%` }}
														className="w-1/2 rounded-t-sm bg-rose-500/80 transition-all group-hover:bg-rose-500"
													/>
													<div
														style={{ height: `${impH}%` }}
														className="w-1/2 rounded-t-sm bg-purple-500/80 transition-all group-hover:bg-purple-500"
													/>
												</div>
												<span className="text-[9px] text-muted-foreground truncate max-w-[36px]">
													{pt.date}
												</span>
											</div>
										);
									})}
								</div>

								<div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-1.5">
											<span className="h-2 w-2 rounded-full bg-rose-500" />
											<span>Reach ({metrics?.totalReach.toLocaleString()})</span>
										</div>
										<div className="flex items-center gap-1.5">
											<span className="h-2 w-2 rounded-full bg-purple-500" />
											<span>Impressions ({metrics?.totalImpressions.toLocaleString()})</span>
										</div>
									</div>
									<span className="font-semibold text-emerald-600">
										+24.8% vs last month
									</span>
								</div>
							</div>
						) : (
							<Skeleton className="h-52 w-full rounded-lg" />
						)}
					</CardContent>
				</Card>
			</div>

			{/* Best Performing Content & Audience Heatmap */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Top Posts (2 Cols) */}
				<Card className="rounded-xl border-border/70 shadow-xs lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<div>
							<CardTitle className="text-base font-semibold">
								Top Performing Content
							</CardTitle>
							<CardDescription className="text-xs">
								Posts generating highest retail engagement, shares & order inquiries
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild className="text-xs">
							<Link href="/marketing/posts">
								View All Posts <ArrowRight className="h-3.5 w-3.5 ml-1" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="space-y-3">
						{data?.topPosts && data.topPosts.length > 0 ? (
							data.topPosts.map((post) => (
								<div
									key={post.id}
									className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/30"
								>
									<div className="flex items-center gap-3">
										<img
											src={post.thumbnailUrl || (post.mediaUrls && post.mediaUrls[0]) || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"}
											alt=""
											className="h-14 w-14 rounded-lg object-cover ring-1 ring-border shrink-0"
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className="text-[10px] font-semibold uppercase tracking-wider"
												>
													{post.postType}
												</Badge>
												<span className="text-[11px] text-muted-foreground">
													{post.publishedAt
														? new Date(post.publishedAt).toLocaleDateString("en-IN", {
																month: "short",
																day: "numeric",
															})
														: "Recently Published"}
												</span>
											</div>
											<p className="truncate text-xs font-medium text-foreground mt-1 max-w-md">
												{post.caption || "No caption"}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-4 text-xs shrink-0 justify-between sm:justify-end border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
										<div className="text-center">
											<p className="font-bold text-foreground">
												{(post.reachCount || 0).toLocaleString()}
											</p>
											<p className="text-[10px] text-muted-foreground">Reach</p>
										</div>
										<div className="text-center">
											<p className="font-bold text-foreground">
												{(post.likesCount || 0).toLocaleString()}
											</p>
											<p className="text-[10px] text-muted-foreground">Likes</p>
										</div>
										<div className="text-center">
											<p className="font-bold text-foreground">
												{post.commentsCount || 0}
											</p>
											<p className="text-[10px] text-muted-foreground">Comments</p>
										</div>
										<div className="text-center pl-2">
											<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-xs">
												{post.engagementRate || "8.5"}%
											</Badge>
										</div>
									</div>
								</div>
							))
						) : (
							<p className="text-xs text-muted-foreground py-6 text-center">
								No published posts found.
							</p>
						)}
					</CardContent>
				</Card>

				{/* Audience Active Hours Heatmap (1 Col) */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-base font-semibold">
							Best Time to Post
						</CardTitle>
						<CardDescription className="text-xs">
							Kirana store owner activity heatmap (Peak hours: 9-11 AM & 6-8 PM)
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{data?.heatmapData ? (
							<div className="space-y-2">
								{data.heatmapData.map((d) => (
									<div key={d.day} className="flex items-center gap-2">
										<span className="w-8 text-[11px] font-semibold text-muted-foreground">
											{d.day}
										</span>
										<div className="grid grid-cols-24 gap-0.5 flex-1 h-4">
											{d.hours.map((h) => {
												let bgClass = "bg-muted/40";
												if (h.score > 75) bgClass = "bg-primary";
												else if (h.score > 55) bgClass = "bg-primary/70";
												else if (h.score > 30) bgClass = "bg-primary/40";
												else if (h.score > 15) bgClass = "bg-primary/20";

												return (
													<div
														key={h.hour}
														title={`${d.day} ${h.hour}:00 - Activity: ${h.score}%`}
														className={`rounded-xs transition-transform hover:scale-125 hover:z-10 cursor-pointer ${bgClass}`}
													/>
												);
											})}
										</div>
									</div>
								))}

								<div className="flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-border/50">
									<span>12 AM</span>
									<span>6 AM</span>
									<span className="font-semibold text-primary">12 PM (Peak)</span>
									<span>6 PM</span>
									<span>11 PM</span>
								</div>

								<div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground mt-3 flex items-start gap-2">
									<Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
									<span>
										<strong>Pro Tip:</strong> Schedule bulk grocery deals on Tuesday and Friday mornings at 9:30 AM for maximum retailer order conversions.
									</span>
								</div>
							</div>
						) : (
							<Skeleton className="h-48 w-full rounded-lg" />
						)}
					</CardContent>
				</Card>
			</div>

			{/* Quick Action Tools Bar */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Link
					href="/marketing/create"
					className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
							<PenSquare className="h-5 w-5" />
						</div>
						<div>
							<h3 className="font-semibold text-xs text-foreground sm:text-sm">
								Post Composer
							</h3>
							<p className="text-[11px] text-muted-foreground">
								Live Instagram mobile preview
							</p>
						</div>
					</div>
					<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
				</Link>

				<Link
					href="/marketing/ai-assistant"
					className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
							<Sparkles className="h-5 w-5" />
						</div>
						<div>
							<h3 className="font-semibold text-xs text-foreground sm:text-sm">
								AI Assistant
							</h3>
							<p className="text-[11px] text-muted-foreground">
								Generate viral hooks & reel scripts
							</p>
						</div>
					</div>
					<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
				</Link>

				<Link
					href="/marketing/planner"
					className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
							<Calendar className="h-5 w-5" />
						</div>
						<div>
							<h3 className="font-semibold text-xs text-foreground sm:text-sm">
								Content Planner
							</h3>
							<p className="text-[11px] text-muted-foreground">
								Drag-to-reschedule calendar
							</p>
						</div>
					</div>
					<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
				</Link>

				<Link
					href="/marketing/comments"
					className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
							<MessageCircle className="h-5 w-5" />
						</div>
						<div>
							<h3 className="font-semibold text-xs text-foreground sm:text-sm">
								Comments & Leads
							</h3>
							<p className="text-[11px] text-muted-foreground">
								Moderate inquiries & fast reply
							</p>
						</div>
					</div>
					<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
				</Link>
			</div>
		</div>
	);
}
