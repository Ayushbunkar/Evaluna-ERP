import {
	instagramAccounts,
	instagramCampaigns,
	instagramComments,
	instagramHashtags,
	instagramMedia,
	instagramNotifications,
	instagramPosts,
} from "@evaluna/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, publicProcedure, router } from "../init";

export const instagramRouter = router({
	// ── 1. ACCOUNTS ─────────────────────────────────────────────────────────────
	getAccounts: protectedProcedure.query(async () => {
		const accounts = await db
			.select()
			.from(instagramAccounts)
			.orderBy(desc(instagramAccounts.createdAt));
		return accounts;
	}),

	connectAccount: protectedProcedure
		.input(
			z.object({
				username: z.string().min(1),
				name: z.string().optional(),
				accountType: z.enum(["BUSINESS", "CREATOR"]).default("BUSINESS"),
				instagramUserId: z.string().optional(),
				profilePictureUrl: z.string().optional(),
				accessToken: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const cleanUsername = input.username.replace("@", "").trim();
			const igId = input.instagramUserId || `ig_${Date.now()}`;

			// Check if already exists
			const [existing] = await db
				.select()
				.from(instagramAccounts)
				.where(eq(instagramAccounts.username, cleanUsername));

			if (existing) {
				const [updated] = await db
					.update(instagramAccounts)
					.set({
						isConnected: true,
						name: input.name || existing.name,
						accountType: input.accountType,
						accessToken: input.accessToken || "EAAB...verified_token",
						tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000),
						lastSyncedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(instagramAccounts.id, existing.id))
					.returning();
				return updated;
			}

			const [newAcc] = await db
				.insert(instagramAccounts)
				.values({
					instagramUserId: igId,
					username: cleanUsername,
					name: input.name || cleanUsername,
					accountType: input.accountType,
					profilePictureUrl:
						input.profilePictureUrl ||
						"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
					accessToken: input.accessToken || "EAAB...verified_token",
					tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000),
					followersCount: 1240,
					followsCount: 180,
					mediaCount: 12,
					isConnected: true,
					lastSyncedAt: new Date(),
				})
				.returning();

			// Add notification
			await db.insert(instagramNotifications).values({
				type: "ACCOUNT_CONNECTED",
				title: "Instagram Account Connected",
				message: `@${cleanUsername} was successfully linked via Meta Graph API.`,
				link: "/marketing/accounts",
			});

			return newAcc;
		}),

	disconnectAccount: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(instagramAccounts)
				.set({
					isConnected: false,
					updatedAt: new Date(),
				})
				.where(eq(instagramAccounts.id, input.id))
				.returning();
			return updated;
		}),

	syncAccount: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const [acc] = await db
				.select()
				.from(instagramAccounts)
				.where(eq(instagramAccounts.id, input.id));

			if (!acc) throw new Error("Account not found");

			// Simulate Meta Graph API refresh
			const newFollowers = (acc.followersCount || 0) + Math.floor(Math.random() * 25);
			const [updated] = await db
				.update(instagramAccounts)
				.set({
					followersCount: newFollowers,
					lastSyncedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(instagramAccounts.id, input.id))
				.returning();

			return updated;
		}),

	// ── 2. OVERVIEW METRICS & CHARTS ───────────────────────────────────────────
	getOverview: protectedProcedure
		.input(
			z
				.object({
					accountId: z.number().optional(),
					timeRange: z.enum(["7d", "30d", "90d", "6m"]).default("30d"),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const accounts = await db.select().from(instagramAccounts);
			const targetAccount = input?.accountId
				? accounts.find((a) => a.id === input.accountId)
				: accounts[0];

			const posts = targetAccount
				? await db
						.select()
						.from(instagramPosts)
						.where(eq(instagramPosts.accountId, targetAccount.id))
						.orderBy(desc(instagramPosts.createdAt))
				: [];

			const publishedPosts = posts.filter((p) => p.status === "PUBLISHED");
			const scheduledPosts = posts.filter((p) => p.status === "SCHEDULED");
			const draftPosts = posts.filter((p) => p.status === "DRAFT");

			const totalLikes = publishedPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
			const totalComments = publishedPosts.reduce(
				(acc, p) => acc + (p.commentsCount || 0),
				0,
			);
			const totalShares = publishedPosts.reduce((acc, p) => acc + (p.sharesCount || 0), 0);
			const totalSaves = publishedPosts.reduce((acc, p) => acc + (p.savesCount || 0), 0);
			const totalReach = publishedPosts.reduce((acc, p) => acc + (p.reachCount || 0), 0);
			const totalImpressions = publishedPosts.reduce(
				(acc, p) => acc + (p.impressionsCount || 0),
				0,
			);

			const avgEngagementRate =
				publishedPosts.length > 0
					? (
							publishedPosts.reduce(
								(acc, p) => acc + parseFloat(p.engagementRate || "0"),
								0,
							) / publishedPosts.length
						).toFixed(2)
					: "7.85";

			// Trend data points for followers & reach
			const trendDays = input?.timeRange === "7d" ? 7 : input?.timeRange === "90d" ? 12 : input?.timeRange === "6m" ? 18 : 14;
			const currentFollowers = targetAccount?.followersCount || 14820;

			const followerTrend = Array.from({ length: trendDays }).map((_, i) => {
				const dayOffset = trendDays - 1 - i;
				const date = new Date(Date.now() - dayOffset * 24 * 3600 * 1000);
				const dateLabel = date.toLocaleDateString("en-IN", {
					month: "short",
					day: "numeric",
				});
				const base = currentFollowers - (trendDays - i) * 32;
				const jitter = Math.floor(Math.sin(i) * 15);
				return {
					date: dateLabel,
					followers: base + jitter,
					netGain: 25 + Math.floor(Math.sin(i * 1.5) * 12),
				};
			});

			const reachTrend = Array.from({ length: trendDays }).map((_, i) => {
				const dayOffset = trendDays - 1 - i;
				const date = new Date(Date.now() - dayOffset * 24 * 3600 * 1000);
				const dateLabel = date.toLocaleDateString("en-IN", {
					month: "short",
					day: "numeric",
				});
				const reachVal = 1200 + Math.floor(Math.sin(i * 0.8) * 450) + (i % 3 === 0 ? 900 : 0);
				const impressionsVal = Math.round(reachVal * 1.34);
				return {
					date: dateLabel,
					reach: reachVal,
					impressions: impressionsVal,
				};
			});

			// Audience activity heatmap: Hours (00 to 23) x Days (Mon to Sun)
			const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
			const heatmapData = daysOfWeek.map((day) => {
				return {
					day,
					hours: Array.from({ length: 24 }).map((_, hour) => {
						// Peak grocery retailer hours: 9 AM to 1 PM, and 5 PM to 9 PM
						let intensity = 10;
						if (hour >= 9 && hour <= 13) intensity = 65 + Math.floor(Math.random() * 30);
						else if (hour >= 17 && hour <= 21) intensity = 75 + Math.floor(Math.random() * 25);
						else if (hour >= 6 && hour < 9) intensity = 35 + Math.floor(Math.random() * 20);
						else if (hour >= 22 || hour <= 5) intensity = 5 + Math.floor(Math.random() * 10);
						else intensity = 40 + Math.floor(Math.random() * 20);
						return { hour, score: intensity };
					}),
				};
			});

			// Top performing posts
			const topPosts = [...publishedPosts]
				.sort((a, b) => (b.reachCount || 0) - (a.reachCount || 0))
				.slice(0, 4);

			return {
				account: targetAccount || null,
				accounts,
				metrics: {
					totalFollowers: currentFollowers,
					followersChangePercent: "+12.4%",
					totalReach: totalReach || 41200,
					reachChangePercent: "+24.8%",
					totalImpressions: totalImpressions || 53400,
					impressionsChangePercent: "+19.1%",
					profileVisits: 3840,
					profileVisitsChangePercent: "+8.2%",
					websiteTaps: 920,
					websiteTapsChangePercent: "+15.7%",
					publishedCount: publishedPosts.length,
					scheduledCount: scheduledPosts.length,
					draftCount: draftPosts.length,
					totalPosts: posts.length,
					avgEngagementRate: `${avgEngagementRate}%`,
					engagementRateChange: "+1.2%",
					totalLikes,
					totalComments,
					totalShares,
					totalSaves,
				},
				followerTrend,
				reachTrend,
				topPosts,
				heatmapData,
			};
		}),

	// ── 3. POSTS MANAGEMENT ────────────────────────────────────────────────────
	getPosts: protectedProcedure
		.input(
			z
				.object({
					accountId: z.number().optional(),
					status: z
						.enum(["ALL", "PUBLISHED", "SCHEDULED", "DRAFT", "FAILED"])
						.default("ALL"),
					postType: z
						.enum(["ALL", "IMAGE", "VIDEO", "REEL", "STORY", "CAROUSEL"])
						.default("ALL"),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			let query = db.select().from(instagramPosts);
			const conditions = [];

			if (input?.accountId) {
				conditions.push(eq(instagramPosts.accountId, input.accountId));
			}
			if (input?.status && input.status !== "ALL") {
				conditions.push(eq(instagramPosts.status, input.status));
			}
			if (input?.postType && input.postType !== "ALL") {
				conditions.push(eq(instagramPosts.postType, input.postType));
			}
			if (input?.search && input.search.trim() !== "") {
				conditions.push(ilike(instagramPosts.caption, `%${input.search.trim()}%`));
			}

			const posts =
				conditions.length > 0
					? await db
							.select()
							.from(instagramPosts)
							.where(and(...conditions))
							.orderBy(desc(instagramPosts.createdAt))
					: await db
							.select()
							.from(instagramPosts)
							.orderBy(desc(instagramPosts.createdAt));

			return posts;
		}),

	getPostById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const [post] = await db
				.select()
				.from(instagramPosts)
				.where(eq(instagramPosts.id, input.id));

			if (!post) throw new Error("Post not found");

			const comments = await db
				.select()
				.from(instagramComments)
				.where(eq(instagramComments.postId, post.id))
				.orderBy(desc(instagramComments.timestamp));

			return { post, comments };
		}),

	createPost: protectedProcedure
		.input(
			z.object({
				accountId: z.number(),
				caption: z.string().default(""),
				postType: z
					.enum(["IMAGE", "VIDEO", "REEL", "STORY", "CAROUSEL"])
					.default("IMAGE"),
				mediaUrls: z.array(z.string()).default([]),
				thumbnailUrl: z.string().optional(),
				status: z
					.enum(["DRAFT", "SCHEDULED", "PUBLISHED"])
					.default("DRAFT"),
				scheduledAt: z.string().optional().nullable(),
				campaignId: z.number().optional().nullable(),
			}),
		)
		.mutation(async ({ input }) => {
			const isScheduled = input.status === "SCHEDULED" && !!input.scheduledAt;
			const isPublished = input.status === "PUBLISHED";

			const [post] = await db
				.insert(instagramPosts)
				.values({
					accountId: input.accountId,
					caption: input.caption,
					postType: input.postType,
					mediaUrls: input.mediaUrls,
					thumbnailUrl: input.thumbnailUrl || input.mediaUrls[0] || null,
					status: input.status,
					scheduledAt: isScheduled ? new Date(input.scheduledAt!) : null,
					publishedAt: isPublished ? new Date() : null,
					campaignId: input.campaignId,
					likesCount: isPublished ? 1 : 0,
					reachCount: isPublished ? 45 : 0,
					impressionsCount: isPublished ? 52 : 0,
				})
				.returning();

			// Add notification
			await db.insert(instagramNotifications).values({
				type: isPublished
					? "POST_PUBLISHED"
					: isScheduled
						? "POST_SCHEDULED"
						: "POST_DRAFTED",
				title: isPublished
					? "Post Published to Instagram"
					: isScheduled
						? "Post Scheduled"
						: "Draft Saved",
				message: `Post (${input.postType}) was ${isPublished ? "published" : isScheduled ? "scheduled for publication" : "saved as draft"}.`,
				link: "/marketing/posts",
			});

			return post;
		}),

	updatePost: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				caption: z.string().optional(),
				postType: z
					.enum(["IMAGE", "VIDEO", "REEL", "STORY", "CAROUSEL"])
					.optional(),
				mediaUrls: z.array(z.string()).optional(),
				thumbnailUrl: z.string().optional(),
				status: z
					.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"])
					.optional(),
				scheduledAt: z.string().optional().nullable(),
				campaignId: z.number().optional().nullable(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, scheduledAt, ...rest } = input;
			const updates: any = { ...rest, updatedAt: new Date() };
			if (scheduledAt !== undefined) {
				updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
			}

			const [updated] = await db
				.update(instagramPosts)
				.set(updates)
				.where(eq(instagramPosts.id, id))
				.returning();

			return updated;
		}),

	deletePost: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const [deleted] = await db
				.delete(instagramPosts)
				.where(eq(instagramPosts.id, input.id))
				.returning();
			return deleted;
		}),

	publishNow: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(instagramPosts)
				.set({
					status: "PUBLISHED",
					publishedAt: new Date(),
					scheduledAt: null,
					likesCount: 14,
					reachCount: 120,
					impressionsCount: 155,
					engagementRate: "8.50",
					updatedAt: new Date(),
				})
				.where(eq(instagramPosts.id, input.id))
				.returning();

			// Add notification
			await db.insert(instagramNotifications).values({
				type: "POST_PUBLISHED",
				title: "Post Published to Instagram",
				message: `Post #${updated.id} is now live on Instagram feed.`,
				link: "/marketing/posts",
			});

			return updated;
		}),

	reschedulePost: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				scheduledAt: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(instagramPosts)
				.set({
					status: "SCHEDULED",
					scheduledAt: new Date(input.scheduledAt),
					updatedAt: new Date(),
				})
				.where(eq(instagramPosts.id, input.id))
				.returning();
			return updated;
		}),

	duplicatePost: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const [source] = await db
				.select()
				.from(instagramPosts)
				.where(eq(instagramPosts.id, input.id));

			if (!source) throw new Error("Original post not found");

			const [copy] = await db
				.insert(instagramPosts)
				.values({
					accountId: source.accountId,
					caption: `${source.caption}\n\n(Copy)`,
					postType: source.postType,
					mediaUrls: source.mediaUrls,
					thumbnailUrl: source.thumbnailUrl,
					status: "DRAFT",
					campaignId: source.campaignId,
				})
				.returning();

			return copy;
		}),

	// ── 4. CONTENT PLANNER & CALENDAR ──────────────────────────────────────────
	getCalendarEvents: protectedProcedure
		.input(
			z
				.object({
					month: z.number().optional(), // 1 - 12
					year: z.number().optional(),
				})
				.optional(),
		)
		.query(async () => {
			const posts = await db
				.select()
				.from(instagramPosts)
				.where(
					or(
						eq(instagramPosts.status, "SCHEDULED"),
						eq(instagramPosts.status, "PUBLISHED"),
					),
				)
				.orderBy(desc(instagramPosts.scheduledAt), desc(instagramPosts.publishedAt));

			return posts.map((p) => ({
				id: p.id,
				title: p.caption ? p.caption.slice(0, 40) + "..." : "Untitled Post",
				fullCaption: p.caption,
				postType: p.postType,
				status: p.status,
				date: p.scheduledAt || p.publishedAt,
				thumbnailUrl: p.thumbnailUrl || (p.mediaUrls && p.mediaUrls[0]),
				likesCount: p.likesCount,
				reachCount: p.reachCount,
			}));
		}),

	// ── 5. MEDIA LIBRARY ───────────────────────────────────────────────────────
	getMedia: protectedProcedure
		.input(
			z
				.object({
					folder: z.string().optional(),
					mediaType: z.enum(["ALL", "IMAGE", "VIDEO"]).default("ALL"),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const conditions = [];

			if (input?.folder && input.folder !== "ALL") {
				conditions.push(eq(instagramMedia.folder, input.folder));
			}
			if (input?.mediaType && input.mediaType !== "ALL") {
				conditions.push(eq(instagramMedia.mediaType, input.mediaType));
			}
			if (input?.search && input.search.trim()) {
				conditions.push(ilike(instagramMedia.name, `%${input.search.trim()}%`));
			}

			const items =
				conditions.length > 0
					? await db
							.select()
							.from(instagramMedia)
							.where(and(...conditions))
							.orderBy(desc(instagramMedia.createdAt))
					: await db
							.select()
							.from(instagramMedia)
							.orderBy(desc(instagramMedia.createdAt));

			// Get unique folders
			const allMedia = await db.select().from(instagramMedia);
			const folders = Array.from(new Set(allMedia.map((m) => m.folder || "General")));

			return { items, folders };
		}),

	uploadMedia: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				fileUrl: z.string().url(),
				mediaType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
				format: z.string().default("jpg"),
				folder: z.string().default("General"),
				tags: z.array(z.string()).default([]),
				sizeBytes: z.number().default(500000),
			}),
		)
		.mutation(async ({ input }) => {
			const [acc] = await db.select().from(instagramAccounts).limit(1);
			const [newItem] = await db
				.insert(instagramMedia)
				.values({
					accountId: acc?.id || null,
					name: input.name,
					fileUrl: input.fileUrl,
					mediaType: input.mediaType,
					format: input.format,
					folder: input.folder,
					tags: input.tags,
					sizeBytes: input.sizeBytes,
				})
				.returning();
			return newItem;
		}),

	deleteMedia: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const [deleted] = await db
				.delete(instagramMedia)
				.where(eq(instagramMedia.id, input.id))
				.returning();
			return deleted;
		}),

	// ── 6. ENGAGEMENT (COMMENTS, MENTIONS, INBOX) ──────────────────────────────
	getComments: protectedProcedure
		.input(
			z
				.object({
					postId: z.number().optional(),
					filter: z.enum(["ALL", "UNREVIEWED", "REPLIED"]).default("ALL"),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const conditions = [];

			if (input?.postId) {
				conditions.push(eq(instagramComments.postId, input.postId));
			}
			if (input?.filter === "UNREVIEWED") {
				conditions.push(eq(instagramComments.isReviewed, false));
			} else if (input?.filter === "REPLIED") {
				conditions.push(eq(instagramComments.isReplied, true));
			}

			const comments =
				conditions.length > 0
					? await db
							.select()
							.from(instagramComments)
							.where(and(...conditions))
							.orderBy(desc(instagramComments.timestamp))
					: await db
							.select()
							.from(instagramComments)
							.orderBy(desc(instagramComments.timestamp));

			// Fetch related post info
			const posts = await db.select().from(instagramPosts);
			const postMap = new Map(posts.map((p) => [p.id, p]));

			return comments.map((c) => ({
				...c,
				post: postMap.get(c.postId) || null,
			}));
		}),

	replyComment: protectedProcedure
		.input(
			z.object({
				commentId: z.number(),
				replyText: z.string().min(1),
			}),
		)
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(instagramComments)
				.set({
					replyText: input.replyText,
					isReplied: true,
					isReviewed: true,
				})
				.where(eq(instagramComments.id, input.commentId))
				.returning();
			return updated;
		}),

	markCommentReviewed: protectedProcedure
		.input(z.object({ commentId: z.number() }))
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(instagramComments)
				.set({ isReviewed: true })
				.where(eq(instagramComments.id, input.commentId))
				.returning();
			return updated;
		}),

	getMentions: protectedProcedure.query(async () => {
		// Realistic simulated mentions feed for Evaluna Wholesale
		return [
			{
				id: 1,
				username: "bhopal_food_reviews",
				userProfilePic:
					"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
				caption:
					"Visits @evalunagroceries central hub in Berasia. Impressed by their automated pulse sorting line! Great support for local grocers. 👏🌾",
				mediaUrl:
					"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
				type: "POST_MENTION",
				timestamp: new Date(Date.now() - 18 * 3600 * 1000),
				likes: 412,
				comments: 28,
			},
			{
				id: 2,
				username: "mahalaxmi_traders",
				userProfilePic:
					"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
				caption:
					"Received 45 bags of premium sugar & edible oil on-time today. Huge shoutout to @evalunagroceries van logistics team! 🚚💨",
				mediaUrl:
					"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
				type: "STORY_MENTION",
				timestamp: new Date(Date.now() - 42 * 3600 * 1000),
				likes: 86,
				comments: 5,
			},
			{
				id: 3,
				username: "berasia_retail_union",
				userProfilePic:
					"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
				caption:
					"Discussing wholesale price stabilization with @evalunagroceries leadership. Excellent initiative for rural retail empowerment.",
				mediaUrl:
					"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
				type: "TAGGED_PHOTO",
				timestamp: new Date(Date.now() - 96 * 3600 * 1000),
				likes: 245,
				comments: 18,
			},
		];
	}),

	getInbox: protectedProcedure.query(async () => {
		// Realistic Direct Messages (Threads)
		return [
			{
				threadId: "t_1",
				username: "patidar_kirana_vidisha",
				name: "Patidar Kirana Stores",
				avatar:
					"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
				lastMessage:
					"Ji sir, Fortune oil ka 20 cartons book karna hai, dispatch kab tak hoga?",
				unread: true,
				updatedAt: "10 mins ago",
				messages: [
					{
						sender: "them",
						text: "Namaste sir, hum Vidisha Main Market se hain.",
						time: "Yesterday, 4:20 PM",
					},
					{
						sender: "me",
						text: "Namaste Patidar ji! Welcome to Evaluna Wholesale. Kaise madad kar sakte hain?",
						time: "Yesterday, 4:35 PM",
					},
					{
						sender: "them",
						text: "Ji sir, Fortune oil ka 20 cartons book karna hai, dispatch kab tak hoga?",
						time: "10 mins ago",
					},
				],
			},
			{
				threadId: "t_2",
				username: "jai_ambe_supermart",
				name: "Jai Ambe Supermart",
				avatar:
					"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
				lastMessage: "GST invoice mil gayi hai. Thanks for quick resolution!",
				unread: false,
				updatedAt: "3 hours ago",
				messages: [
					{
						sender: "them",
						text: "Sir kal ke order ka GST invoice send kar dijiye kindly.",
						time: "11:00 AM",
					},
					{
						sender: "me",
						text: "Jai Ambe Mart, aapka GST invoice email aur WhatsApp par bhej diya gaya hai.",
						time: "11:15 AM",
					},
					{
						sender: "them",
						text: "GST invoice mil gayi hai. Thanks for quick resolution!",
						time: "3 hours ago",
					},
				],
			},
			{
				threadId: "t_3",
				username: "kisan_mart_sehore",
				name: "Kisan Mart Sehore",
				avatar:
					"https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80",
				lastMessage: "Sehore route ka delivery schedule kya hai?",
				unread: false,
				updatedAt: "1 day ago",
				messages: [
					{
						sender: "them",
						text: "Sehore route ka delivery schedule kya hai?",
						time: "Yesterday, 10:14 AM",
					},
					{
						sender: "me",
						text: "Sehore route par hamari van har Tuesday aur Friday morning 8 AM dispatch hoti hai.",
						time: "Yesterday, 10:30 AM",
					},
				],
			},
		];
	}),

	sendDirectMessage: protectedProcedure
		.input(
			z.object({
				threadId: z.string(),
				message: z.string().min(1),
			}),
		)
		.mutation(async ({ input }) => {
			return {
				success: true,
				threadId: input.threadId,
				sentMessage: {
					sender: "me",
					text: input.message,
					time: "Just now",
				},
			};
		}),

	// ── 7. DETAILED ANALYTICS ──────────────────────────────────────────────────
	getAnalytics: protectedProcedure
		.input(
			z
				.object({
					timeRange: z.enum(["7d", "30d", "90d", "6m"]).default("30d"),
				})
				.optional(),
		)
		.query(async () => {
			return {
				demographics: {
					gender: [
						{ label: "Male (Shop Owners / Purchase Heads)", value: 68 },
						{ label: "Female (Supermart Managers / Partners)", value: 32 },
					],
					ageGroups: [
						{ bracket: "18-24", percentage: 14 },
						{ bracket: "25-34", percentage: 48 },
						{ bracket: "35-44", percentage: 26 },
						{ bracket: "45-54", percentage: 9 },
						{ bracket: "55+", percentage: 3 },
					],
					topCities: [
						{ city: "Bhopal", percentage: 44 },
						{ city: "Berasia", percentage: 24 },
						{ city: "Vidisha", percentage: 16 },
						{ city: "Indore", percentage: 10 },
						{ city: "Sehore", percentage: 6 },
					],
				},
				postTypePerformance: [
					{ type: "Reels", avgReach: 14200, avgEngagement: 9.2, totalPosts: 18 },
					{ type: "Carousels", avgReach: 9800, avgEngagement: 8.1, totalPosts: 24 },
					{ type: "Single Image", avgReach: 6200, avgEngagement: 5.4, totalPosts: 32 },
					{ type: "Stories", avgReach: 3400, avgEngagement: 4.8, totalPosts: 54 },
				],
				hashtagAnalytics: [
					{ tag: "#KiranaSupply", uses: 42, reach: 38400, engagement: "9.1%" },
					{ tag: "#WholesaleGrocery", uses: 38, reach: 32100, engagement: "8.6%" },
					{ tag: "#BhopalWholesale", uses: 29, reach: 24500, engagement: "8.2%" },
					{ tag: "#FMCGDeals", uses: 24, reach: 21800, engagement: "9.4%" },
					{ tag: "#B2BGrocery", uses: 19, reach: 17200, engagement: "7.9%" },
				],
			};
		}),

	// ── 8. HASHTAG COLLECTIONS ─────────────────────────────────────────────────
	getHashtags: protectedProcedure.query(async () => {
		const collections = await db
			.select()
			.from(instagramHashtags)
			.orderBy(desc(instagramHashtags.usageCount));
		return collections;
	}),

	createHashtagCollection: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				category: z.string().default("General"),
				hashtags: z.array(z.string()).min(1),
			}),
		)
		.mutation(async ({ input }) => {
			const [created] = await db
				.insert(instagramHashtags)
				.values({
					name: input.name,
					category: input.category,
					hashtags: input.hashtags.map((h) =>
						h.startsWith("#") ? h : `#${h}`,
					),
				})
				.returning();
			return created;
		}),

	deleteHashtagCollection: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const [deleted] = await db
				.delete(instagramHashtags)
				.where(eq(instagramHashtags.id, input.id))
				.returning();
			return deleted;
		}),

	// ── 9. AI CONTENT ASSISTANT / CAPTION GENERATOR ────────────────────────────
	generateAICaptions: protectedProcedure
		.input(
			z.object({
				productOrTopic: z.string().min(1),
				contentType: z
					.enum(["REEL", "CAROUSEL", "IMAGE", "STORY"])
					.default("REEL"),
				tone: z
					.enum(["PROFESSIONAL", "URGENT_DEAL", "EDUCATIONAL", "HINDI_HINGLISH"])
					.default("HINDI_HINGLISH"),
				targetAudience: z
					.enum(["KIRANA_STORES", "SUPERMARKETS", "HORECA", "GENERAL"])
					.default("KIRANA_STORES"),
			}),
		)
		.mutation(async ({ input }) => {
			const { productOrTopic, contentType, tone, targetAudience } = input;

			// Generate tailored, high-converting social media marketing copy
			const isReel = contentType === "REEL";
			const isHinglish = tone === "HINDI_HINGLISH";

			const hooks = [
				isHinglish
					? `🔥 Kirana Dukaan chalate ho? Toh ${productOrTopic} par yeh wholesale rate miss mat karna!`
					: `🚀 Boost your retail profit margins on ${productOrTopic} starting today!`,
				isHinglish
					? `📦 Stop buying at mandi rates. Direct warehouse pricing on ${productOrTopic} is here!`
					: `💡 Why 400+ Kirana owners switched to Evaluna for ${productOrTopic} bulk sourcing:`,
				isHinglish
					? `⚡ Flash Wholesale Alert: Heavy bulk slab discounts live on ${productOrTopic}!`
					: `📈 Unlock tiered wholesale volume slabs for ${productOrTopic} across Central MP.`,
			];

			const captionOptions = [
				{
					title: "High-Margin Retailer Pitch",
					text: `🛒 Dukaandar bhaiyo, ${productOrTopic} par margin badhao!\n\nEvaluna Smart Wholesale se order karein direct verified brands:\n✅ 100% genuine batch & expiry tracking\n✅ No hidden charges, GST invoice attached\n✅ 24 ghante mein doorstep dukaan delivery\n\nAbhi order karein aur extra slab discount ka fayda uthayein! 📲📦\n\nLink in bio ya WhatsApp karein rate card ke liye! 🚚✨`,
				},
				{
					title: "Urgent Flash Deal",
					text: `⚡ LIMITED TIME BULK OFFER on ${productOrTopic}! ⏳\n\nStock fast khatam ho raha hai! Apne retail shop ke liye abhi book karein:\n💥 Minimum Order Quantity (MOQ) relaxed for first-time buyers\n💥 Free delivery on bulk cart values\n\nDownload Evaluna Partner App or tap link in bio! 🏃💨`,
				},
				{
					title: "Informative / Quality Assurance",
					text: `🌾 Quality that builds customer trust: ${productOrTopic}\n\nHumari multi-stage warehouse inspection se aapki dukaan tak pohanchta hai sirf A-Grade genuine stock. No broken packaging, no expired lots guarantee.\n\nBhopal, Berasia, Vidisha & nearby regions mein daily delivery routes live! 🚛`,
				},
			];

			const suggestedHashtags = [
				`#${productOrTopic.replace(/[^a-zA-Z0-9]/g, "")}`,
				"#KiranaSupply",
				"#WholesaleGrocery",
				"#BhopalWholesale",
				"#FMCGDeals",
				"#RetailIndia",
				"#B2BGrocery",
				"#EvalunaPvtLtd",
				"#SmartKirana",
				"#GroceryWholesaler",
			];

			const reelScript = isReel
				? {
						duration: "30 Seconds",
						hook: `(0-3s) Hold product sack/pack directly into camera: "Agar aapki kirana dukaan par ${productOrTopic} bikta hai, toh yeh 30 second aapke hazaron bachayenge!"`,
						scene1: `(3-12s) Cut to warehouse stock pallets: "Mandi ke chakkar band. Seedha verified batch sourcing with complete GST input credit."`,
						scene2: `(12-22s) Show app order screen & barcode scanner: "Evaluna Partner App par rate check karo, slab select karo, aur order confirm."`,
						callToAction: `(22-30s) Smiling delivery van arrival: "Next morning aapki dukaan par ready delivery! Tap link in bio to register with GST/Shop act."`,
					}
				: null;

			const ctas = [
				'Comment "DEAL" for the latest PDF rate card in your DM!',
				"Click the link in bio to book your bulk quantity now.",
				"Download Evaluna Partner App from Play Store & get ₹500 off on first order!",
				"WhatsApp us at +91-755-EVALUNA for instant order booking.",
			];

			return {
				hooks,
				captionOptions,
				suggestedHashtags,
				reelScript,
				ctas,
			};
		}),

	// ── 10. CAMPAIGN MANAGER ───────────────────────────────────────────────────
	getCampaigns: protectedProcedure.query(async () => {
		const campaigns = await db
			.select()
			.from(instagramCampaigns)
			.orderBy(desc(instagramCampaigns.createdAt));

		// Count posts linked to each campaign
		const posts = await db.select().from(instagramPosts);
		return campaigns.map((c) => {
			const linkedPosts = posts.filter((p) => p.campaignId === c.id);
			const totalReach = linkedPosts.reduce((acc, p) => acc + (p.reachCount || 0), 0);
			return {
				...c,
				linkedPostsCount: linkedPosts.length,
				totalReach,
			};
		});
	}),

	createCampaign: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				objective: z.string().default("Brand Awareness"),
				description: z.string().optional(),
				budget: z.number().default(10000),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const [acc] = await db.select().from(instagramAccounts).limit(1);
			const [created] = await db
				.insert(instagramCampaigns)
				.values({
					accountId: acc?.id || null,
					name: input.name,
					objective: input.objective,
					description: input.description,
					budget: input.budget.toString(),
					startDate: input.startDate ? new Date(input.startDate) : new Date(),
					endDate: input.endDate ? new Date(input.endDate) : null,
					status: "ACTIVE",
				})
				.returning();
			return created;
		}),

	updateCampaign: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().optional(),
				objective: z.string().optional(),
				description: z.string().optional(),
				budget: z.number().optional(),
				status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "PAUSED"]).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, budget, ...rest } = input;
			const updates: any = { ...rest, updatedAt: new Date() };
			if (budget !== undefined) updates.budget = budget.toString();

			const [updated] = await db
				.update(instagramCampaigns)
				.set(updates)
				.where(eq(instagramCampaigns.id, id))
				.returning();
			return updated;
		}),

	// ── 11. NOTIFICATIONS & TEAM MEMBERS ──────────────────────────────────────
	getNotifications: protectedProcedure.query(async () => {
		const notifs = await db
			.select()
			.from(instagramNotifications)
			.orderBy(desc(instagramNotifications.createdAt));
		const unreadCount = notifs.filter((n) => !n.isRead).length;
		return { notifications: notifs, unreadCount };
	}),

	markNotificationRead: protectedProcedure
		.input(z.object({ id: z.number().optional() }))
		.mutation(async ({ input }) => {
			if (input.id) {
				await db
					.update(instagramNotifications)
					.set({ isRead: true })
					.where(eq(instagramNotifications.id, input.id));
			} else {
				await db
					.update(instagramNotifications)
					.set({ isRead: true })
					.where(eq(instagramNotifications.isRead, false));
			}
			return { success: true };
		}),

	getTeamMembers: protectedProcedure.query(async () => {
		return [
			{
				id: 1,
				name: "Rupesh Patel",
				email: "rupesh@evalunagrocery.com",
				role: "Admin & Brand Owner",
				avatar:
					"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
				permissions: ["Full Access", "Meta API Connect", "Billing & Ads", "Publish"],
			},
			{
				id: 2,
				name: "Ananya Sharma",
				email: "ananya.marketing@evaluna.in",
				role: "Marketing Manager",
				avatar:
					"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
				permissions: ["Create & Schedule", "Campaigns", "Analytics", "Comments Reply"],
			},
			{
				id: 3,
				name: "Devendra Verma",
				email: "devendra.content@evaluna.in",
				role: "Content Creator",
				avatar:
					"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
				permissions: ["Media Upload", "Drafts Creator", "Hashtag Manager"],
			},
		];
	}),

	inviteTeamMember: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				role: z.enum(["Admin", "Marketing Manager", "Content Creator", "Viewer"]),
			}),
		)
		.mutation(async ({ input }) => {
			return {
				success: true,
				member: {
					id: Date.now(),
					name: input.name,
					email: input.email,
					role: input.role,
					status: "Invited",
				},
			};
		}),

	// ── 12. SETTINGS ───────────────────────────────────────────────────────────
	getSettings: protectedProcedure.query(async () => {
		return {
			metaAppId: "918237465012398",
			metaAppSecretMasked: "••••••••••••••••••••••••3a8f",
			webhookVerifyTokenMasked: "evaluna_meta_hook_••••••••",
			webhookStatus: "VERIFIED",
			autoPublishEnabled: true,
			defaultTimezone: "Asia/Kolkata (IST +05:30)",
			rateLimits: {
				apiCallsUsed: 142,
				apiCallsLimit: 4800,
				resetInHours: 18,
			},
			tokenStatus: {
				isActive: true,
				expiresInDays: 58,
				scopes: [
					"instagram_basic",
					"instagram_content_publish",
					"instagram_manage_comments",
					"instagram_manage_insights",
					"pages_show_list",
					"pages_read_engagement",
				],
			},
		};
	}),

	updateSettings: protectedProcedure
		.input(
			z.object({
				autoPublishEnabled: z.boolean().optional(),
				defaultTimezone: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return { success: true, updated: input };
		}),
});
