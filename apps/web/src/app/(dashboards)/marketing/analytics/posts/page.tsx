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
import { ArrowLeft, ArrowUpRight, Flame, Heart, MessageCircle, Share2, TrendingUp } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingPostPerformancePage() {
	const trpc = useTRPC();
	const postsQuery = trpc.instagram.getPosts.useQuery({
		status: "PUBLISHED",
	});

	const posts = postsQuery.data || [];

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
						Post Performance Analytics
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						In-depth engagement metrics, impressions, and viral reach for each published post
					</p>
				</div>
			</div>

			<div className="space-y-4">
				{posts.map((post) => (
					<Card key={post.id} className="rounded-xl border-border/70 shadow-xs overflow-hidden">
						<div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
							<div className="flex items-center gap-3.5">
								<img
									src={
										post.thumbnailUrl ||
										(post.mediaUrls && post.mediaUrls[0]) ||
										"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"
									}
									alt=""
									className="h-16 w-16 rounded-xl object-cover ring-1 ring-border shrink-0"
								/>
								<div>
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-[10px]">
											{post.postType}
										</Badge>
										<span className="text-[11px] text-muted-foreground">
											Published {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN") : ""}
										</span>
									</div>
									<p className="font-medium text-xs text-foreground mt-1 line-clamp-2 max-w-xl">
										{post.caption}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-4 gap-4 text-center text-xs shrink-0 border-t sm:border-0 pt-2 sm:pt-0 w-full sm:w-auto">
								<div>
									<p className="font-bold text-foreground">{(post.reachCount || 0).toLocaleString()}</p>
									<p className="text-[10px] text-muted-foreground">Reach</p>
								</div>
								<div>
									<p className="font-bold text-foreground">{(post.impressionsCount || 0).toLocaleString()}</p>
									<p className="text-[10px] text-muted-foreground">Views</p>
								</div>
								<div>
									<p className="font-bold text-foreground">{(post.likesCount || 0).toLocaleString()}</p>
									<p className="text-[10px] text-muted-foreground">Likes</p>
								</div>
								<div>
									<Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">
										{post.engagementRate || "8.5"}%
									</Badge>
									<p className="text-[10px] text-muted-foreground mt-0.5">Eng. Rate</p>
								</div>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}
