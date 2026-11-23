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
import {
	CheckCircle,
	CheckCircle2,
	Clock,
	CornerDownRight,
	Filter,
	MessageCircle,
	Send,
	ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingCommentsPage() {
	const [filter, setFilter] = useState<"ALL" | "UNREVIEWED" | "REPLIED">("ALL");
	const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

	const trpc = useTRPC();
	const commentsQuery = trpc.instagram.getComments.useQuery({
		filter,
	});

	const replyMutation = trpc.instagram.replyComment.useMutation({
		onSuccess: () => {
			toast.success("Reply published to Instagram comment!");
			commentsQuery.refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to post reply.");
		},
	});

	const reviewMutation = trpc.instagram.markCommentReviewed.useMutation({
		onSuccess: () => {
			toast.success("Comment marked as reviewed.");
			commentsQuery.refetch();
		},
	});

	const comments = commentsQuery.data || [];

	const handleSendReply = (commentId: number) => {
		const text = replyInputs[commentId];
		if (!text?.trim()) {
			toast.error("Please enter reply text.");
			return;
		}

		replyMutation.mutate({
			commentId,
			replyText: text.trim(),
		});

		setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
	};

	return (
		<div className="space-y-6 max-w-5xl mx-auto">
			{/* Top Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Comments & Inquiries Moderation
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Reply to retailer inquiries, answer MOQ questions, and convert leads into orders
					</p>
				</div>

				{/* Filter Tabs */}
				<div className="inline-flex items-center rounded-lg border border-border/70 bg-card p-1 shadow-xs">
					{(
						[
							{ id: "ALL", label: "All Comments" },
							{ id: "UNREVIEWED", label: "Pending Review" },
							{ id: "REPLIED", label: "Replied" },
						] as const
					).map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setFilter(tab.id)}
							className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
								filter === tab.id
									? "bg-primary text-primary-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Comments List */}
			<div className="space-y-4">
				{comments.length === 0 ? (
					<Card className="rounded-xl border-border/70 py-12 text-center shadow-xs">
						<CardContent className="space-y-2">
							<CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
							<p className="font-semibold text-foreground text-sm">
								All caught up! No comments pending moderation.
							</p>
							<p className="text-xs text-muted-foreground">
								New customer questions on your reels and feed will appear here instantly.
							</p>
						</CardContent>
					</Card>
				) : (
					comments.map((comment) => (
						<Card
							key={comment.id}
							className={`rounded-xl border shadow-xs transition-all ${
								comment.isReviewed
									? "border-border/70 bg-card"
									: "border-primary/40 bg-primary/5"
							}`}
						>
							<CardContent className="p-4 space-y-3">
								{/* Header: User & Post reference */}
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center gap-3">
										<img
											src={
												comment.userProfilePic ||
												"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
											}
											alt=""
											className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
										/>
										<div>
											<p className="font-bold text-xs text-foreground">
												@{comment.username}
											</p>
											<p className="text-[10px] text-muted-foreground">
												{comment.timestamp
													? new Date(comment.timestamp).toLocaleDateString("en-IN", {
															month: "short",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})
													: "Recent"}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{!comment.isReviewed && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => reviewMutation.mutate({ commentId: comment.id })}
												className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
											>
												Mark Reviewed
											</Button>
										)}
										<Badge
											variant={comment.isReplied ? "default" : "secondary"}
											className="text-[10px]"
										>
											{comment.isReplied ? "Replied" : "Pending Reply"}
										</Badge>
									</div>
								</div>

								{/* Comment Text */}
								<p className="text-xs text-foreground font-medium pl-13">
									"{comment.text}"
								</p>

								{/* Post thumbnail & reference */}
								{comment.post && (
									<div className="flex items-center gap-2.5 rounded-lg bg-muted/40 p-2 text-xs ml-13">
										<img
											src={
												comment.post.thumbnailUrl ||
												"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80"
											}
											alt=""
											className="h-8 w-8 rounded object-cover ring-1 ring-border"
										/>
										<span className="line-clamp-1 text-[11px] text-muted-foreground flex-1">
											On Post: {comment.post.caption}
										</span>
									</div>
								)}

								{/* Existing Reply if any */}
								{comment.isReplied && comment.replyText && (
									<div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 ml-13 text-xs">
										<CornerDownRight className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
										<div className="flex-1">
											<span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] mr-1.5">
												Evaluna Wholesale:
											</span>
											<span className="text-foreground">{comment.replyText}</span>
										</div>
									</div>
								)}

								{/* Reply input */}
								{!comment.isReplied && (
									<div className="flex gap-2 ml-13 pt-1">
										<Input
											placeholder="Write a quick wholesale price reply..."
											className="text-xs h-8"
											value={replyInputs[comment.id] || ""}
											onChange={(e) =>
												setReplyInputs((prev) => ({
													...prev,
													[comment.id]: e.target.value,
												}))
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleSendReply(comment.id);
											}}
										/>
										<Button
											size="sm"
											onClick={() => handleSendReply(comment.id)}
											disabled={replyMutation.isPending}
											className="h-8 text-xs gap-1 bg-primary text-primary-foreground shrink-0"
										>
											<Send className="h-3 w-3" />
											Reply
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
