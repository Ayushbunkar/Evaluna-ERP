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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import {
	ArrowUpRight,
	Calendar,
	CheckCircle,
	Clock,
	Copy,
	ExternalLink,
	Eye,
	Filter,
	Grid,
	Heart,
	Layers,
	List,
	MessageCircle,
	MoreVertical,
	PenSquare,
	Play,
	Plus,
	Search,
	Share2,
	Table as TableIcon,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingAllPostsPage() {
	const [viewMode, setViewMode] = useState<"grid" | "table" | "list">("grid");
	const [statusTab, setStatusTab] = useState<
		"ALL" | "PUBLISHED" | "SCHEDULED" | "DRAFT" | "FAILED"
	>("ALL");
	const [postTypeFilter, setPostTypeFilter] = useState<
		"ALL" | "IMAGE" | "VIDEO" | "REEL" | "STORY" | "CAROUSEL"
	>("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPost, setSelectedPost] = useState<any | null>(null);
	const [detailModalOpen, setDetailModalOpen] = useState(false);

	const trpc = useTRPC();
	const postsQuery = trpc.instagram.getPosts.useQuery({
		status: statusTab,
		postType: postTypeFilter,
		search: searchQuery,
	});

	const publishNowMutation = trpc.instagram.publishNow.useMutation({
		onSuccess: () => {
			toast.success("Post published to Instagram!");
			setDetailModalOpen(false);
			postsQuery.refetch();
		},
	});

	const duplicateMutation = trpc.instagram.duplicatePost.useMutation({
		onSuccess: () => {
			toast.success("Post duplicated as draft!");
			postsQuery.refetch();
		},
	});

	const deleteMutation = trpc.instagram.deletePost.useMutation({
		onSuccess: () => {
			toast.success("Post removed.");
			setDetailModalOpen(false);
			postsQuery.refetch();
		},
	});

	const posts = postsQuery.data || [];

	const handleOpenDetail = (post: any) => {
		setSelectedPost(post);
		setDetailModalOpen(true);
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Top Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						All Posts & Content Feed
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Manage, schedule, preview, and review performance of all Instagram posts
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						size="sm"
						asChild
						className="h-8 gap-1.5 text-xs rounded-lg bg-primary text-primary-foreground shadow-xs"
					>
						<Link href="/marketing/create">
							<Plus className="h-3.5 w-3.5" />
							Create Post
						</Link>
					</Button>
				</div>
			</div>

			{/* Filters & View Switcher Bar */}
			<div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-xs">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					{/* Status Tabs */}
					<div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
						{(
							[
								{ id: "ALL", label: "All Posts" },
								{ id: "PUBLISHED", label: "Published" },
								{ id: "SCHEDULED", label: "Scheduled" },
								{ id: "DRAFT", label: "Drafts" },
							] as const
						).map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => setStatusTab(tab.id)}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
									statusTab === tab.id
										? "bg-primary text-primary-foreground shadow-xs"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Search & Format Filter & View Mode */}
					<div className="flex items-center gap-2 flex-wrap">
						{/* Search Bar */}
						<div className="relative min-w-[200px] flex-1 sm:flex-initial">
							<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								placeholder="Search captions, tags..."
								className="h-8 pl-8 text-xs rounded-lg"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Format Filter */}
						<select
							className="h-8 rounded-lg border border-border/70 bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							value={postTypeFilter}
							onChange={(e) => setPostTypeFilter(e.target.value as any)}
						>
							<option value="ALL">All Formats</option>
							<option value="REEL">Reels</option>
							<option value="CAROUSEL">Carousels</option>
							<option value="IMAGE">Single Image</option>
							<option value="STORY">Stories</option>
						</select>

						{/* View Switcher Buttons */}
						<div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5">
							<button
								type="button"
								onClick={() => setViewMode("grid")}
								className={`rounded-md p-1.5 transition-all ${
									viewMode === "grid"
										? "bg-card text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
								title="Grid View"
							>
								<Grid className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onClick={() => setViewMode("table")}
								className={`rounded-md p-1.5 transition-all ${
									viewMode === "table"
										? "bg-card text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
								title="Table View"
							>
								<TableIcon className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onClick={() => setViewMode("list")}
								className={`rounded-md p-1.5 transition-all ${
									viewMode === "list"
										? "bg-card text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
								title="List View"
							>
								<List className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Posts Render */}
			{posts.length === 0 ? (
				<Card className="rounded-xl border-border/70 shadow-xs py-12 text-center">
					<CardContent className="space-y-3">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
							<Layers className="h-6 w-6 text-muted-foreground" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">No posts found</h3>
						<p className="text-xs text-muted-foreground max-w-sm mx-auto">
							No posts matched your current filters. Try selecting a different tab or create a new post.
						</p>
						<Button size="sm" asChild className="h-8 text-xs">
							<Link href="/marketing/create">Create New Post</Link>
						</Button>
					</CardContent>
				</Card>
			) : viewMode === "grid" ? (
				/* Grid View */
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{posts.map((post) => (
						<Card
							key={post.id}
							onClick={() => handleOpenDetail(post)}
							className="group cursor-pointer overflow-hidden rounded-xl border-border/70 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
						>
							{/* Thumbnail frame */}
							<div className="relative aspect-square w-full overflow-hidden bg-muted">
								<img
									src={
										post.thumbnailUrl ||
										(post.mediaUrls && post.mediaUrls[0]) ||
										"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"
									}
									alt=""
									className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								{/* Type badge on top left */}
								<div className="absolute top-2.5 left-2.5">
									<Badge className="bg-black/70 text-white backdrop-blur-md text-[10px] font-semibold border-none">
										{post.postType}
									</Badge>
								</div>

								{/* Status badge on top right */}
								<div className="absolute top-2.5 right-2.5">
									<Badge
										variant={
											post.status === "PUBLISHED"
												? "default"
												: post.status === "SCHEDULED"
													? "secondary"
													: "outline"
										}
										className="text-[10px] font-semibold backdrop-blur-md"
									>
										{post.status}
									</Badge>
								</div>

								{/* Hover overlay stats */}
								{post.status === "PUBLISHED" && (
									<div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
										<div className="flex items-center gap-1 text-xs font-bold">
											<Heart className="h-4 w-4 fill-white" />
											{(post.likesCount || 0).toLocaleString()}
										</div>
										<div className="flex items-center gap-1 text-xs font-bold">
											<MessageCircle className="h-4 w-4 fill-white" />
											{post.commentsCount || 0}
										</div>
									</div>
								)}
							</div>

							<CardContent className="p-3 space-y-2">
								<p className="line-clamp-2 text-xs font-medium text-foreground">
									{post.caption || "No caption added"}
								</p>

								<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
									<span className="flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										{post.publishedAt
											? new Date(post.publishedAt).toLocaleDateString("en-IN", {
													month: "short",
													day: "numeric",
												})
											: post.scheduledAt
												? `Sched: ${new Date(post.scheduledAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
												: "Draft"}
									</span>

									{post.engagementRate && (
										<span className="font-semibold text-emerald-600 dark:text-emerald-400">
											{post.engagementRate}% eng.
										</span>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : viewMode === "table" ? (
				/* Table View */
				<div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
								<tr>
									<th className="p-3">Post</th>
									<th className="p-3">Format</th>
									<th className="p-3">Status</th>
									<th className="p-3">Date</th>
									<th className="p-3 text-right">Reach</th>
									<th className="p-3 text-right">Likes</th>
									<th className="p-3 text-right">Comments</th>
									<th className="p-3 text-right">Engagement</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{posts.map((post) => (
									<tr
										key={post.id}
										onClick={() => handleOpenDetail(post)}
										className="hover:bg-muted/30 cursor-pointer transition-colors"
									>
										<td className="p-3 flex items-center gap-3 min-w-[260px]">
											<img
												src={
													post.thumbnailUrl ||
													(post.mediaUrls && post.mediaUrls[0]) ||
													"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"
												}
												alt=""
												className="h-10 w-10 rounded-md object-cover ring-1 ring-border shrink-0"
											/>
											<span className="line-clamp-2 font-medium text-foreground">
												{post.caption || "Untitled post"}
											</span>
										</td>
										<td className="p-3">
											<Badge variant="outline" className="text-[10px]">
												{post.postType}
											</Badge>
										</td>
										<td className="p-3">
											<Badge
												variant={post.status === "PUBLISHED" ? "default" : "secondary"}
												className="text-[10px]"
											>
												{post.status}
											</Badge>
										</td>
										<td className="p-3 text-muted-foreground">
											{post.publishedAt
												? new Date(post.publishedAt).toLocaleDateString("en-IN")
												: post.scheduledAt
													? new Date(post.scheduledAt).toLocaleDateString("en-IN")
													: "Draft"}
										</td>
										<td className="p-3 text-right font-semibold">
											{(post.reachCount || 0).toLocaleString()}
										</td>
										<td className="p-3 text-right font-semibold">
											{(post.likesCount || 0).toLocaleString()}
										</td>
										<td className="p-3 text-right font-semibold">
											{post.commentsCount || 0}
										</td>
										<td className="p-3 text-right font-bold text-emerald-600">
											{post.engagementRate ? `${post.engagementRate}%` : "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			) : (
				/* List View */
				<div className="space-y-3">
					{posts.map((post) => (
						<div
							key={post.id}
							onClick={() => handleOpenDetail(post)}
							className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:border-primary/50 transition-all shadow-xs"
						>
							<div className="flex items-center gap-3">
								<img
									src={
										post.thumbnailUrl ||
										(post.mediaUrls && post.mediaUrls[0]) ||
										"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"
									}
									alt=""
									className="h-14 w-14 rounded-lg object-cover ring-1 ring-border shrink-0"
								/>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-[10px]">
											{post.postType}
										</Badge>
										<Badge
											variant={post.status === "PUBLISHED" ? "default" : "secondary"}
											className="text-[10px]"
										>
											{post.status}
										</Badge>
										<span className="text-[11px] text-muted-foreground">
											{post.publishedAt
												? `Published on ${new Date(post.publishedAt).toLocaleDateString("en-IN")}`
												: post.scheduledAt
													? `Scheduled for ${new Date(post.scheduledAt).toLocaleString("en-IN")}`
													: "Draft"}
										</span>
									</div>
									<p className="line-clamp-1 text-xs font-medium text-foreground mt-1">
										{post.caption || "No caption added"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-5 text-xs shrink-0 border-t border-border/40 pt-2 sm:border-0 sm:pt-0 justify-between sm:justify-end">
								<div>
									<p className="font-bold text-foreground">
										{(post.reachCount || 0).toLocaleString()}
									</p>
									<p className="text-[10px] text-muted-foreground">Reach</p>
								</div>
								<div>
									<p className="font-bold text-foreground">
										{(post.likesCount || 0).toLocaleString()}
									</p>
									<p className="text-[10px] text-muted-foreground">Likes</p>
								</div>
								<div>
									<p className="font-bold text-foreground">{post.commentsCount || 0}</p>
									<p className="text-[10px] text-muted-foreground">Comments</p>
								</div>
								<div>
									<p className="font-bold text-emerald-600">
										{post.engagementRate || "0.00"}%
									</p>
									<p className="text-[10px] text-muted-foreground">Engagement</p>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Post Detail & Actions Modal */}
			{selectedPost && (
				<Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
					<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="text-xs">
									{selectedPost.postType}
								</Badge>
								<Badge
									variant={selectedPost.status === "PUBLISHED" ? "default" : "secondary"}
									className="text-xs"
								>
									{selectedPost.status}
								</Badge>
							</div>
							<DialogTitle className="text-base mt-2">
								Post Details & Insights
							</DialogTitle>
							<DialogDescription className="text-xs">
								Instagram Post ID: {selectedPost.instagramPostId || `evaluna_${selectedPost.id}`}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 pt-2">
							{/* Preview Image / Carousel */}
							<div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted">
								<img
									src={
										selectedPost.thumbnailUrl ||
										(selectedPost.mediaUrls && selectedPost.mediaUrls[0]) ||
										"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
									}
									alt=""
									className="h-full w-full object-cover"
								/>
							</div>

							{/* Caption full */}
							<div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-1">
								<p className="text-[11px] font-semibold text-muted-foreground">Caption:</p>
								<p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
									{selectedPost.caption || "No caption"}
								</p>
							</div>

							{/* Metrics breakdown */}
							{selectedPost.status === "PUBLISHED" && (
								<div className="grid grid-cols-4 gap-2 rounded-xl border border-border/60 bg-card p-3 text-center text-xs">
									<div>
										<p className="font-bold text-foreground">
											{(selectedPost.reachCount || 0).toLocaleString()}
										</p>
										<p className="text-[10px] text-muted-foreground">Reach</p>
									</div>
									<div>
										<p className="font-bold text-foreground">
											{(selectedPost.impressionsCount || 0).toLocaleString()}
										</p>
										<p className="text-[10px] text-muted-foreground">Impressions</p>
									</div>
									<div>
										<p className="font-bold text-foreground">
											{(selectedPost.likesCount || 0).toLocaleString()}
										</p>
										<p className="text-[10px] text-muted-foreground">Likes</p>
									</div>
									<div>
										<p className="font-bold text-foreground">
											{selectedPost.commentsCount || 0}
										</p>
										<p className="text-[10px] text-muted-foreground">Comments</p>
									</div>
								</div>
							)}
						</div>

						<DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-border/60">
							<div className="flex gap-2 mr-auto">
								<Button
									variant="outline"
									size="sm"
									onClick={() => duplicateMutation.mutate({ id: selectedPost.id })}
									className="text-xs gap-1"
								>
									<Copy className="h-3.5 w-3.5" />
									Duplicate
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => deleteMutation.mutate({ id: selectedPost.id })}
									className="text-xs text-destructive hover:bg-destructive/10 gap-1"
								>
									<Trash2 className="h-3.5 w-3.5" />
									Delete
								</Button>
							</div>

							{selectedPost.status !== "PUBLISHED" && (
								<Button
									size="sm"
									onClick={() => publishNowMutation.mutate({ id: selectedPost.id })}
									disabled={publishNowMutation.isPending}
									className="text-xs bg-primary text-primary-foreground gap-1.5"
								>
									<CheckCircle className="h-3.5 w-3.5" />
									Publish to Instagram Now
								</Button>
							)}
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
