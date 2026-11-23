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
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	ArrowLeft,
	Bookmark,
	Calendar,
	CheckCircle,
	Clock,
	Copy,
	Heart,
	HelpCircle,
	Image as ImageIcon,
	Instagram,
	Layers,
	MessageCircle,
	MoreHorizontal,
	Music2,
	Plus,
	Send,
	Share2,
	Smartphone,
	Sparkles,
	Upload,
	Video,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingCreatePostPage() {
	const router = useRouter();
	const trpc = useTRPC();

	const [postType, setPostType] = useState<
		"IMAGE" | "REEL" | "STORY" | "CAROUSEL"
	>("REEL");
	const [caption, setCaption] = useState(
		`🚀 Kirana dukaandar bhaiyo, Ghadi Detergent & Surf Excel par bulk wholesale slabs live ho chuke hain!\n\nEvaluna Smart Wholesale se order karein seedha apni dukaan ke liye:\n✅ Extra 4.5% slab discount on 20+ bags\n✅ Guaranteed genuine brand packaging\n✅ 24 ghante mein doorstep delivery across Bhopal & Berasia 🚚\n\nAbhi order confirm karein! 📲📦\n\n#KiranaSupply #WholesaleGrocery #FMCGDeals #BhopalWholesale #EvalunaERP`,
	);
	const [mediaUrls, setMediaUrls] = useState<string[]>([
		"https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
	]);
	const [newMediaInput, setNewMediaInput] = useState("");
	const [scheduledAt, setScheduledAt] = useState("");
	const [publishMode, setPublishMode] = useState<"NOW" | "SCHEDULE" | "DRAFT">("SCHEDULE");
	const [carouselIndex, setCarouselIndex] = useState(0);

	const accountsQuery = trpc.instagram.getAccounts.useQuery();
	const hashtagsQuery = trpc.instagram.getHashtags.useQuery();
	const campaignsQuery = trpc.instagram.getCampaigns.useQuery();

	const createMutation = trpc.instagram.createPost.useMutation({
		onSuccess: (post) => {
			toast.success(
				publishMode === "NOW"
					? "Post published to Instagram!"
					: publishMode === "SCHEDULE"
						? "Post scheduled successfully!"
						: "Draft saved!",
			);
			router.push("/marketing/posts");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create post.");
		},
	});

	const currentAccount = accountsQuery.data?.[0] || {
		id: 1,
		username: "evalunagroceries",
		profilePictureUrl:
			"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
	};

	// Counts
	const charCount = caption.length;
	const hashtagCount = (caption.match(/#\w+/g) || []).length;

	const handleAddMedia = () => {
		if (!newMediaInput.trim()) return;
		setMediaUrls([...mediaUrls, newMediaInput.trim()]);
		setNewMediaInput("");
	};

	const handleRemoveMedia = (index: number) => {
		setMediaUrls(mediaUrls.filter((_, i) => i !== index));
		if (carouselIndex >= mediaUrls.length - 1) {
			setCarouselIndex(Math.max(0, mediaUrls.length - 2));
		}
	};

	const handleInsertHashtags = (tags: string[]) => {
		const tagString = tags.join(" ");
		setCaption((prev) => `${prev}\n\n${tagString}`);
		toast.success(`Inserted ${tags.length} hashtags!`);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (mediaUrls.length === 0) {
			toast.error("Please add at least one image or video for this post.");
			return;
		}

		if (publishMode === "SCHEDULE" && !scheduledAt) {
			toast.error("Please select a valid scheduled date & time.");
			return;
		}

		createMutation.mutate({
			accountId: currentAccount.id,
			caption,
			postType,
			mediaUrls,
			thumbnailUrl: mediaUrls[0],
			status:
				publishMode === "NOW"
					? "PUBLISHED"
					: publishMode === "SCHEDULE"
						? "SCHEDULED"
						: "DRAFT",
			scheduledAt: publishMode === "SCHEDULE" ? scheduledAt : null,
		});
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Top Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="h-8 w-8 text-muted-foreground hover:text-foreground"
					>
						<Link href="/marketing/posts">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
							Create Instagram Post
						</h1>
						<p className="text-xs text-muted-foreground mt-0.5">
							Compose, preview on simulated mobile device, and publish via Meta Graph API
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						asChild
						className="h-8 gap-1.5 text-xs rounded-lg"
					>
						<Link href="/marketing/ai-assistant">
							<Sparkles className="h-3.5 w-3.5 text-purple-500" />
							Generate with AI
						</Link>
					</Button>
				</div>
			</div>

			{/* Main Grid: Left Composer (60%) | Right Live Mobile Preview (40%) */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
				{/* LEFT: Composer Controls (7 Cols) */}
				<form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
					{/* 1. Format Selection */}
					<Card className="rounded-xl border-border/70 shadow-xs">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">1. Select Content Format</CardTitle>
							<CardDescription className="text-xs">
								Choose official Instagram format specifications
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
								{[
									{ id: "REEL", label: "Reel", desc: "9:16 Vertical Video", icon: Video },
									{ id: "CAROUSEL", label: "Carousel", desc: "Up to 10 Slides", icon: Layers },
									{ id: "IMAGE", label: "Single Image", desc: "1:1 or 4:5 Feed", icon: ImageIcon },
									{ id: "STORY", label: "Story", desc: "24-Hour Ephemeral", icon: Smartphone },
								].map((item) => {
									const Icon = item.icon;
									const isSelected = postType === item.id;
									return (
										<button
											key={item.id}
											type="button"
											onClick={() => setPostType(item.id as any)}
											className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
												isSelected
													? "border-primary bg-primary/10 text-primary shadow-xs"
													: "border-border/70 bg-card hover:bg-muted text-foreground"
											}`}
										>
											<Icon
												className={`h-5 w-5 mb-1.5 ${
													isSelected ? "text-primary" : "text-muted-foreground"
												}`}
											/>
											<span className="font-bold text-xs">{item.label}</span>
											<span className="text-[10px] text-muted-foreground mt-0.5">
												{item.desc}
											</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* 2. Media Selector */}
					<Card className="rounded-xl border-border/70 shadow-xs">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-sm font-semibold">
										2. Media Assets ({mediaUrls.length})
									</CardTitle>
									<CardDescription className="text-xs">
										Add high-resolution image/video URLs or choose from library
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									type="button"
									asChild
									className="h-7 text-[11px]"
								>
									<Link href="/marketing/media">Browse Media Library</Link>
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{/* Current media thumbnails */}
							<div className="flex items-center gap-3 overflow-x-auto pb-2">
								{mediaUrls.map((url, i) => (
									<div
										key={url + i}
										className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-border group"
									>
										<img src={url} alt="" className="h-full w-full object-cover" />
										<button
											type="button"
											onClick={() => handleRemoveMedia(i)}
											className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
										>
											<X className="h-3 w-3" />
										</button>
										<span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
											#{i + 1}
										</span>
									</div>
								))}

								{postType === "CAROUSEL" && mediaUrls.length < 10 && (
									<div className="h-20 w-20 shrink-0 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-[10px] p-2 text-center">
										<Plus className="h-4 w-4 mb-0.5" />
										Add Slide
									</div>
								)}
							</div>

							{/* Add Media input */}
							<div className="flex gap-2">
								<Input
									placeholder="Paste image or video URL (https://...)"
									className="text-xs h-8"
									value={newMediaInput}
									onChange={(e) => setNewMediaInput(e.target.value)}
								/>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={handleAddMedia}
									className="h-8 text-xs shrink-0"
								>
									Add Asset
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* 3. Caption & Hashtag Inserter */}
					<Card className="rounded-xl border-border/70 shadow-xs">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold">3. Post Caption</CardTitle>
								<div className="flex items-center gap-3 text-[11px] text-muted-foreground">
									<span>
										Chars: <strong className={charCount > 2200 ? "text-destructive" : ""}>{charCount}</strong> / 2,200
									</span>
									<span>
										Hashtags: <strong className={hashtagCount > 30 ? "text-destructive" : ""}>{hashtagCount}</strong> / 30
									</span>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<Textarea
								placeholder="Write an engaging caption for your kirana retailers and customers..."
								className="min-h-[140px] text-xs resize-y leading-relaxed font-sans"
								value={caption}
								onChange={(e) => setCaption(e.target.value)}
								required
							/>

							{/* Hashtag Collections Quick-Insert */}
							{hashtagsQuery.data && hashtagsQuery.data.length > 0 && (
								<div className="space-y-1.5 pt-1 border-t border-border/50">
									<p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
										<Bookmark className="h-3 w-3" /> Quick Insert Hashtag Collections:
									</p>
									<div className="flex flex-wrap gap-1.5">
										{hashtagsQuery.data.map((col) => (
											<button
												key={col.id}
												type="button"
												onClick={() => handleInsertHashtags(col.hashtags || [])}
												className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
											>
												+ {col.name} ({col.hashtags?.length || 0})
											</button>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 4. Scheduling & Publishing */}
					<Card className="rounded-xl border-border/70 shadow-xs">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">
								4. Publishing Timing
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-3 gap-2">
								{[
									{ id: "NOW", label: "Publish Now", desc: "Immediately live" },
									{ id: "SCHEDULE", label: "Schedule Later", desc: "Select date & time" },
									{ id: "DRAFT", label: "Save as Draft", desc: "Review later" },
								].map((mode) => (
									<button
										key={mode.id}
										type="button"
										onClick={() => setPublishMode(mode.id as any)}
										className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
											publishMode === mode.id
												? "border-primary bg-primary/10 font-bold text-primary"
												: "border-border/70 bg-card hover:bg-muted"
										}`}
									>
										<div>{mode.label}</div>
										<div className="text-[10px] text-muted-foreground font-normal mt-0.5">
											{mode.desc}
										</div>
									</button>
								))}
							</div>

							{publishMode === "SCHEDULE" && (
								<div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-3">
									<Label htmlFor="sched-time" className="text-xs font-semibold">
										Scheduled Date & Time (IST)
									</Label>
									<Input
										id="sched-time"
										type="datetime-local"
										className="text-xs h-9"
										value={scheduledAt}
										onChange={(e) => setScheduledAt(e.target.value)}
										required
									/>
									<p className="text-[10px] text-muted-foreground">
										Auto-publishing is enabled for this verified Meta account.
									</p>
								</div>
							)}

							<div className="pt-2">
								<Button
									type="submit"
									disabled={createMutation.isPending}
									className="w-full h-10 text-xs font-semibold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-md shadow-pink-600/20 hover:opacity-95"
								>
									{createMutation.isPending
										? "Processing..."
										: publishMode === "NOW"
											? "🚀 Publish to Instagram Feed"
											: publishMode === "SCHEDULE"
												? "📅 Confirm Scheduled Post"
												: "💾 Save Draft"}
								</Button>
							</div>
						</CardContent>
					</Card>
				</form>

				{/* RIGHT: Realistic Instagram Live Mobile Phone Preview (5 Cols) */}
				<div className="lg:col-span-5 sticky top-20 flex flex-col items-center">
					<div className="w-full max-w-[360px] rounded-[40px] border-[10px] border-neutral-900 bg-black p-1 shadow-2xl ring-1 ring-border/50">
						{/* Phone Notch / Dynamic Island */}
						<div className="mx-auto h-5 w-28 rounded-b-2xl bg-neutral-900 mb-2 flex items-center justify-center">
							<div className="h-2 w-2 rounded-full bg-neutral-800 mr-2" />
							<div className="h-1.5 w-8 rounded-full bg-neutral-800" />
						</div>

						{/* Instagram App Chrome */}
						<div className="rounded-[30px] bg-card text-foreground overflow-hidden flex flex-col min-h-[580px]">
							{/* Top Bar */}
							<div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
								<div className="flex items-center gap-2">
									<img
										src={currentAccount.profilePictureUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"}
										alt=""
										className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
									/>
									<div>
										<p className="text-xs font-bold leading-tight flex items-center gap-1">
											{currentAccount.username}
											<span className="text-[10px] text-muted-foreground font-normal">• 1m</span>
										</p>
										<p className="text-[10px] text-muted-foreground">
											Bhopal, Madhya Pradesh
										</p>
									</div>
								</div>
								<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
							</div>

							{/* Post Media Display Area */}
							<div
								className={`relative w-full overflow-hidden bg-neutral-900 flex items-center justify-center ${
									postType === "STORY"
										? "aspect-[9/16]"
										: postType === "REEL"
											? "aspect-[4/5]"
											: "aspect-square"
								}`}
							>
								{mediaUrls.length > 0 ? (
									<img
										src={mediaUrls[carouselIndex] || mediaUrls[0]}
										alt=""
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="text-neutral-500 text-xs text-center p-4">
										No media added yet
									</div>
								)}

								{/* Reel audio indicator */}
								{postType === "REEL" && (
									<div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-medium text-white backdrop-blur-md">
										<Music2 className="h-3 w-3 animate-spin" />
										<span>Original Audio • Evaluna Groceries</span>
									</div>
								)}

								{/* Carousel slide indicators */}
								{postType === "CAROUSEL" && mediaUrls.length > 1 && (
									<>
										<div className="absolute top-2.5 right-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
											{carouselIndex + 1}/{mediaUrls.length}
										</div>
										<div className="absolute bottom-2 flex gap-1">
											{mediaUrls.map((_, idx) => (
												<button
													key={idx}
													type="button"
													onClick={() => setCarouselIndex(idx)}
													className={`h-1.5 rounded-full transition-all ${
														carouselIndex === idx
															? "w-4 bg-primary"
															: "w-1.5 bg-white/50"
													}`}
												/>
											))}
										</div>
									</>
								)}
							</div>

							{/* Action Buttons Row */}
							<div className="p-3 space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Heart className="h-5 w-5 text-foreground hover:text-rose-500 cursor-pointer transition-colors" />
										<MessageCircle className="h-5 w-5 text-foreground hover:text-primary cursor-pointer transition-colors" />
										<Share2 className="h-5 w-5 text-foreground hover:text-primary cursor-pointer transition-colors" />
									</div>
									<Bookmark className="h-5 w-5 text-foreground cursor-pointer" />
								</div>

								{/* Likes simulated */}
								<p className="text-[11px] font-bold text-foreground">
									Liked by shree_ram_kirana and 142 others
								</p>

								{/* Caption */}
								<div className="text-xs text-foreground leading-snug">
									<span className="font-bold mr-1.5">{currentAccount.username}</span>
									<span className="whitespace-pre-wrap">{caption || "Write your caption..."}</span>
								</div>

								<p className="text-[10px] text-muted-foreground pt-1">
									View all 18 comments
								</p>
							</div>
						</div>
					</div>

					<p className="text-[11px] text-muted-foreground mt-3 text-center">
						Simulated Instagram Mobile Frame (Scale: 1:1 Feed & Reels)
					</p>
				</div>
			</div>
		</div>
	);
}
