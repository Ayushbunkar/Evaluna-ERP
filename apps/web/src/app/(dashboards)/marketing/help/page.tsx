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
	ExternalLink,
	HelpCircle,
	Instagram,
	MessageCircle,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default function MarketingHelpPage() {
	return (
		<div className="space-y-6 max-w-4xl mx-auto pb-12">
			<div>
				<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
					Help & Support Documentation
				</h1>
				<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
					Step-by-step guides for connecting Meta accounts, resolving publishing errors, and maximizing kirana reach
				</p>
			</div>

			<div className="space-y-4">
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader>
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<ShieldCheck className="h-5 w-5 text-emerald-500" />
							How to Connect an Instagram Business Account
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
						<ol className="list-decimal pl-5 space-y-2">
							<li>
								<strong className="text-foreground">Convert to Professional Account:</strong> In the Instagram mobile app, navigate to Settings &gt; Account &gt; Switch to Professional Account and choose <strong>Business</strong>.
							</li>
							<li>
								<strong className="text-foreground">Link a Facebook Page:</strong> Meta Graph API requires an Instagram Business account to be linked to a Facebook Page administered by you in Meta Business Suite.
							</li>
							<li>
								<strong className="text-foreground">Connect in Evaluna Marketing:</strong> Navigate to <Link href="/marketing/accounts" className="text-primary underline">My Accounts</Link>, click "Connect Instagram Account", and enter your handle.
							</li>
							<li>
								<strong className="text-foreground">Token Verification:</strong> The system automatically exchanges your OAuth code for a 60-day Long-Lived User Access Token and verifies publishing permissions.
							</li>
						</ol>
					</CardContent>
				</Card>

				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader>
						<CardTitle className="text-base font-semibold">
							Frequently Asked Questions (FAQ)
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-xs">
						<div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
							<p className="font-semibold text-foreground">Why can't personal accounts be connected?</p>
							<p className="text-muted-foreground">
								Meta does not allow third-party publishing or insights access on Personal Instagram accounts. Only Business or Creator profiles are supported by official Meta Graph APIs.
							</p>
						</div>

						<div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
							<p className="font-semibold text-foreground">What media dimensions work best for Reels?</p>
							<p className="text-muted-foreground">
								Use 1080 x 1920 pixels (9:16 aspect ratio), MP4 container, H.264 video codec, and up to 60 seconds duration for optimal organic distribution.
							</p>
						</div>

						<div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
							<p className="font-semibold text-foreground">How often should a wholesale grocery brand post?</p>
							<p className="text-muted-foreground">
								We recommend 3-4 Reels per week highlighting price comparisons and new stock arrivals, plus daily 24h Stories for flash wholesale discounts and price slabs.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
