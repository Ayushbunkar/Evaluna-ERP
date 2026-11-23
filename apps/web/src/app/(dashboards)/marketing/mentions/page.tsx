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
	Heart,
	Instagram,
	MessageCircle,
	Sparkles,
	Tag,
} from "lucide-react";
import React from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingMentionsPage() {
	const trpc = useTRPC();
	const mentionsQuery = trpc.instagram.getMentions.useQuery();

	const mentions = mentionsQuery.data || [];

	return (
		<div className="space-y-6 max-w-5xl mx-auto">
			<div>
				<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
					Brand Mentions & Tagged Feed
				</h1>
				<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
					Track stories, reels, and posts mentioning @evalunagroceries across central MP
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{mentions.map((item) => (
					<Card key={item.id} className="rounded-xl border-border/70 overflow-hidden shadow-xs">
						<div className="relative aspect-video w-full bg-muted">
							<img src={item.mediaUrl} alt="" className="h-full w-full object-cover" />
							<div className="absolute top-2.5 left-2.5">
								<Badge className="bg-black/70 text-white backdrop-blur-md text-[10px]">
									{item.type.replace("_", " ")}
								</Badge>
							</div>
						</div>

						<CardContent className="p-4 space-y-3">
							<div className="flex items-center gap-2.5">
								<img
									src={item.userProfilePic}
									alt=""
									className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
								/>
								<div className="flex-1 min-w-0">
									<p className="font-bold text-xs text-foreground truncate">
										@{item.username}
									</p>
									<p className="text-[10px] text-muted-foreground">
										{new Date(item.timestamp).toLocaleDateString("en-IN", {
											month: "short",
											day: "numeric",
										})}
									</p>
								</div>
							</div>

							<p className="text-xs text-foreground font-medium line-clamp-3">
								{item.caption}
							</p>

							<div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
								<div className="flex items-center gap-3">
									<span className="flex items-center gap-1">
										<Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
										{item.likes}
									</span>
									<span className="flex items-center gap-1">
										<MessageCircle className="h-3.5 w-3.5" />
										{item.comments}
									</span>
								</div>

								<Badge variant="outline" className="text-[10px]">
									Verified Partner
								</Badge>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
