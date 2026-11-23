import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// ── Instagram Accounts ────────────────────────────────────────────────────────
export const instagramAccounts = pgTable(
	"instagram_accounts",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id"),
		instagramUserId: varchar("instagram_user_id", { length: 255 }).notNull().unique(),
		username: varchar("username", { length: 255 }).notNull(),
		name: varchar("name", { length: 255 }),
		profilePictureUrl: text("profile_picture_url"),
		accountType: varchar("account_type", { length: 50 }).default("BUSINESS"), // BUSINESS, CREATOR, PERSONAL
		accessToken: text("access_token"),
		tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
		followersCount: integer("followers_count").default(0),
		followsCount: integer("follows_count").default(0),
		mediaCount: integer("media_count").default(0),
		isConnected: boolean("is_connected").default(true),
		lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		usernameIdx: index("ig_acc_username_idx").on(table.username),
		igUserIdIdx: index("ig_acc_user_id_idx").on(table.instagramUserId),
	}),
);

// ── Instagram Posts ───────────────────────────────────────────────────────────
export const instagramPosts = pgTable(
	"instagram_posts",
	{
		id: serial("id").primaryKey(),
		accountId: integer("account_id")
			.notNull()
			.references(() => instagramAccounts.id, { onDelete: "cascade" }),
		instagramPostId: varchar("instagram_post_id", { length: 255 }),
		caption: text("caption").default(""),
		postType: varchar("post_type", { length: 50 }).notNull().default("IMAGE"), // IMAGE, VIDEO, REEL, STORY, CAROUSEL
		mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
		thumbnailUrl: text("thumbnail_url"),
		status: varchar("status", { length: 50 }).notNull().default("DRAFT"), // DRAFT, SCHEDULED, PUBLISHED, FAILED
		scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		failureReason: text("failure_reason"),
		campaignId: integer("campaign_id"),
		likesCount: integer("likes_count").default(0),
		commentsCount: integer("comments_count").default(0),
		sharesCount: integer("shares_count").default(0),
		savesCount: integer("saves_count").default(0),
		reachCount: integer("reach_count").default(0),
		impressionsCount: integer("impressions_count").default(0),
		engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0.00"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		statusIdx: index("ig_posts_status_idx").on(table.status),
		accountIdx: index("ig_posts_account_idx").on(table.accountId),
		scheduledIdx: index("ig_posts_scheduled_idx").on(table.scheduledAt),
	}),
);

// ── Instagram Media Library ───────────────────────────────────────────────────
export const instagramMedia = pgTable(
	"instagram_media",
	{
		id: serial("id").primaryKey(),
		accountId: integer("account_id").references(() => instagramAccounts.id, {
			onDelete: "cascade",
		}),
		name: varchar("name", { length: 255 }).notNull(),
		fileUrl: text("file_url").notNull(),
		mediaType: varchar("media_type", { length: 50 }).notNull().default("IMAGE"), // IMAGE, VIDEO
		format: varchar("format", { length: 20 }).default("jpg"),
		sizeBytes: integer("size_bytes").default(0),
		folder: varchar("folder", { length: 100 }).default("General"),
		tags: jsonb("tags").$type<string[]>().default([]),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		accountMediaIdx: index("ig_media_account_idx").on(table.accountId),
		folderIdx: index("ig_media_folder_idx").on(table.folder),
	}),
);

// ── Instagram Hashtag Collections ─────────────────────────────────────────────
export const instagramHashtags = pgTable(
	"instagram_hashtags",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 255 }).notNull(),
		category: varchar("category", { length: 100 }).notNull().default("General"),
		hashtags: jsonb("hashtags").$type<string[]>().default([]),
		usageCount: integer("usage_count").default(0),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		categoryIdx: index("ig_hashtags_cat_idx").on(table.category),
	}),
);

// ── Instagram Campaigns ───────────────────────────────────────────────────────
export const instagramCampaigns = pgTable(
	"instagram_campaigns",
	{
		id: serial("id").primaryKey(),
		accountId: integer("account_id").references(() => instagramAccounts.id, {
			onDelete: "cascade",
		}),
		name: varchar("name", { length: 255 }).notNull(),
		objective: varchar("objective", { length: 100 }).notNull().default("Brand Awareness"),
		description: text("description"),
		status: varchar("status", { length: 50 }).notNull().default("ACTIVE"), // DRAFT, ACTIVE, COMPLETED, PAUSED
		startDate: timestamp("start_date", { withTimezone: true }),
		endDate: timestamp("end_date", { withTimezone: true }),
		budget: decimal("budget", { precision: 12, scale: 2 }).default("0.00"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		statusIdx: index("ig_campaign_status_idx").on(table.status),
	}),
);

// ── Instagram Comments ────────────────────────────────────────────────────────
export const instagramComments = pgTable(
	"instagram_comments",
	{
		id: serial("id").primaryKey(),
		postId: integer("post_id")
			.notNull()
			.references(() => instagramPosts.id, { onDelete: "cascade" }),
		instagramCommentId: varchar("instagram_comment_id", { length: 255 }),
		username: varchar("username", { length: 255 }).notNull(),
		userProfilePic: text("user_profile_pic"),
		text: text("text").notNull(),
		timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
		isReviewed: boolean("is_reviewed").default(false),
		isReplied: boolean("is_replied").default(false),
		replyText: text("reply_text"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		postIdIdx: index("ig_comments_post_idx").on(table.postId),
	}),
);

// ── Instagram Notifications ───────────────────────────────────────────────────
export const instagramNotifications = pgTable(
	"instagram_notifications",
	{
		id: serial("id").primaryKey(),
		type: varchar("type", { length: 50 }).notNull(), // POST_PUBLISHED, PUBLISH_FAILED, SCHEDULE_APPROACHING, TOKEN_EXPIRING, ENGAGEMENT
		title: varchar("title", { length: 255 }).notNull(),
		message: text("message").notNull(),
		isRead: boolean("is_read").default(false),
		link: text("link"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		isReadIdx: index("ig_notif_read_idx").on(table.isRead),
	}),
);

// ── Relations ─────────────────────────────────────────────────────────────────
export const instagramAccountsRelations = relations(instagramAccounts, ({ many }) => ({
	posts: many(instagramPosts),
	media: many(instagramMedia),
	campaigns: many(instagramCampaigns),
}));

export const instagramPostsRelations = relations(instagramPosts, ({ one, many }) => ({
	account: one(instagramAccounts, {
		fields: [instagramPosts.accountId],
		references: [instagramAccounts.id],
	}),
	comments: many(instagramComments),
}));

export const instagramCommentsRelations = relations(instagramComments, ({ one }) => ({
	post: one(instagramPosts, {
		fields: [instagramComments.postId],
		references: [instagramPosts.id],
	}),
}));
