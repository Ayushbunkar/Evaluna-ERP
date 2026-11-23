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
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Bot,
	Check,
	Clock,
	Copy,
	FileText,
	PenSquare,
	RefreshCw,
	Sparkles,
	Video,
	Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingAIAssistantPage() {
	const router = useRouter();
	const trpc = useTRPC();

	const [productOrTopic, setProductOrTopic] = useState(
		"Ghadi Detergent 500g & Surf Excel Wholesale Slabs",
	);
	const [contentType, setContentType] = useState<
		"REEL" | "CAROUSEL" | "IMAGE" | "STORY"
	>("REEL");
	const [tone, setTone] = useState<
		"HINDI_HINGLISH" | "PROFESSIONAL" | "URGENT_DEAL" | "EDUCATIONAL"
	>("HINDI_HINGLISH");
	const [targetAudience, setTargetAudience] = useState<
		"KIRANA_STORES" | "SUPERMARKETS" | "HORECA" | "GENERAL"
	>("KIRANA_STORES");

	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const aiMutation = trpc.instagram.generateAICaptions.useMutation({
		onSuccess: () => {
			toast.success("AI content suggestions generated!");
		},
	});

	const handleGenerate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!productOrTopic.trim()) {
			toast.error("Please specify a product or topic.");
			return;
		}

		aiMutation.mutate({
			productOrTopic: productOrTopic.trim(),
			contentType,
			tone,
			targetAudience,
		});
	};

	const results = aiMutation.data;

	const handleCopy = (text: string, key: string) => {
		navigator.clipboard.writeText(text);
		setCopiedKey(key);
		toast.success("Copied to clipboard!");
		setTimeout(() => setCopiedKey(null), 2000);
	};

	return (
		<div className="space-y-6 max-w-6xl mx-auto pb-12">
			{/* Top Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
							AI Content Assistant & Scriptwriter
						</h1>
						<Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">
							B2B Trained
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Generate viral retailer hooks, Hindi/Hinglish wholesale pitch captions, reel storyboards, and hashtags
					</p>
				</div>
			</div>

			{/* Generator Input Form */}
			<Card className="rounded-xl border-border/70 shadow-xs">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-semibold flex items-center gap-2">
						<Wand2 className="h-4 w-4 text-purple-500" />
						Content Generation Brief
					</CardTitle>
					<CardDescription className="text-xs">
						Fine-tune the output for your target kirana or supermarket buyer persona
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleGenerate} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="ai-topic" className="text-xs font-semibold">
								Product, Offer or Topic
							</Label>
							<Input
								id="ai-topic"
								placeholder="e.g. Fortune Sunflower Oil 15L Tin Bulk Rate, Sharbati Gehu Fresh Sacks..."
								className="text-xs h-9"
								value={productOrTopic}
								onChange={(e) => setProductOrTopic(e.target.value)}
								required
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Content Format</Label>
								<select
									className="w-full h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs font-medium text-foreground"
									value={contentType}
									onChange={(e) => setContentType(e.target.value as any)}
								>
									<option value="REEL">Instagram Reel (Video)</option>
									<option value="CAROUSEL">Multi-Slide Carousel</option>
									<option value="IMAGE">Single Feed Image</option>
									<option value="STORY">24h Story</option>
								</select>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Tone & Language</Label>
								<select
									className="w-full h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs font-medium text-foreground"
									value={tone}
									onChange={(e) => setTone(e.target.value as any)}
								>
									<option value="HINDI_HINGLISH">Hindi / Hinglish (Kirana Dukaan Focus)</option>
									<option value="PROFESSIONAL">Professional Corporate B2B</option>
									<option value="URGENT_DEAL">Urgent Flash Deal / FOMO</option>
									<option value="EDUCATIONAL">Educational Sourcing & Quality</option>
								</select>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Target Audience</Label>
								<select
									className="w-full h-9 rounded-lg border border-border/70 bg-card px-2.5 text-xs font-medium text-foreground"
									value={targetAudience}
									onChange={(e) => setTargetAudience(e.target.value as any)}
								>
									<option value="KIRANA_STORES">Kirana Stores & Retailers</option>
									<option value="SUPERMARKETS">Supermarkets & Malls</option>
									<option value="HORECA">Hotels, Restaurants & Caterers</option>
									<option value="GENERAL">General B2B Wholesale</option>
								</select>
							</div>
						</div>

						<div className="pt-2">
							<Button
								type="submit"
								disabled={aiMutation.isPending}
								className="w-full sm:w-auto h-9 text-xs px-5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-semibold shadow-md shadow-purple-600/20"
							>
								<Sparkles className={`h-3.5 w-3.5 mr-1.5 ${aiMutation.isPending ? "animate-spin" : ""}`} />
								{aiMutation.isPending ? "Generating Tailored Copy..." : "Generate Marketing Assets"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Results Display */}
			{results && (
				<div className="space-y-6 pt-2">
					{/* 1. Viral Hooks */}
					<Card className="rounded-xl border-border/70 shadow-xs">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-amber-500" />
								Attention-Grabbing Opening Hooks
							</CardTitle>
							<CardDescription className="text-xs">
								Use on the first 3 seconds of your Reel or in the carousel cover slide
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							{results.hooks.map((hook, i) => (
								<div
									key={i}
									className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs"
								>
									<span className="font-semibold text-foreground flex-1 pr-3">
										"{hook}"
									</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy(hook, `hook-${i}`)}
										className="h-7 text-xs gap-1"
									>
										{copiedKey === `hook-${i}` ? (
											<Check className="h-3 w-3 text-emerald-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
										Copy
									</Button>
								</div>
							))}
						</CardContent>
					</Card>

					{/* 2. Captions */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{results.captionOptions.map((opt, i) => (
							<Card key={i} className="rounded-xl border-border/70 shadow-xs flex flex-col justify-between">
								<CardHeader className="pb-2">
									<CardTitle className="text-xs font-bold text-foreground">
										Variant {i + 1}: {opt.title}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 flex-1 flex flex-col justify-between">
									<div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap flex-1 text-foreground">
										{opt.text}
									</div>

									<div className="pt-2 flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleCopy(opt.text, `cap-${i}`)}
											className="flex-1 h-7 text-xs gap-1"
										>
											{copiedKey === `cap-${i}` ? (
												<Check className="h-3 w-3 text-emerald-500" />
											) : (
												<Copy className="h-3 w-3" />
											)}
											Copy Caption
										</Button>

										<Button
											size="sm"
											asChild
											className="h-7 text-xs bg-primary text-primary-foreground gap-1"
										>
											<Link href={`/marketing/create`}>
												<PenSquare className="h-3 w-3" />
												Use
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* 3. Reel Script if applicable */}
					{results.reelScript && (
						<Card className="rounded-xl border-border/70 shadow-xs">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Video className="h-4 w-4 text-rose-500" />
									30-Second Reel Storyboard & Script
								</CardTitle>
								<CardDescription className="text-xs">
									Step-by-step video script for your warehouse & fulfillment team to shoot
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-xs">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
										<p className="font-bold text-foreground text-xs">🎣 Hook (0-3s)</p>
										<p className="text-muted-foreground">{results.reelScript.hook}</p>
									</div>
									<div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
										<p className="font-bold text-foreground text-xs">📦 Scene 1: Mandi vs Warehouse (3-12s)</p>
										<p className="text-muted-foreground">{results.reelScript.scene1}</p>
									</div>
									<div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
										<p className="font-bold text-foreground text-xs">📱 Scene 2: App Ordering (12-22s)</p>
										<p className="text-muted-foreground">{results.reelScript.scene2}</p>
									</div>
									<div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
										<p className="font-bold text-foreground text-xs">🚚 Call To Action (22-30s)</p>
										<p className="text-muted-foreground">{results.reelScript.callToAction}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* 4. Hashtags & CTAs */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Card className="rounded-xl border-border/70 shadow-xs">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs font-bold">Suggested Hashtags</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap gap-1.5">
									{results.suggestedHashtags.map((tag) => (
										<Badge key={tag} variant="secondary" className="text-xs">
											{tag}
										</Badge>
									))}
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleCopy(results.suggestedHashtags.join(" "), "tags")}
									className="w-full h-7 text-xs gap-1"
								>
									<Copy className="h-3 w-3" />
									Copy All Hashtags
								</Button>
							</CardContent>
						</Card>

						<Card className="rounded-xl border-border/70 shadow-xs">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs font-bold">High-Converting CTAs</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-xs">
								{results.ctas.map((cta, i) => (
									<div key={i} className="p-2 rounded bg-muted/30 flex items-center justify-between">
										<span className="font-medium text-foreground">{cta}</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCopy(cta, `cta-${i}`)}
											className="h-6 text-[10px]"
										>
											Copy
										</Button>
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}
