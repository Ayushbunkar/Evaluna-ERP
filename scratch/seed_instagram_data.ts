import { db } from "../apps/web/src/lib/db";
import {
	instagramAccounts,
	instagramCampaigns,
	instagramComments,
	instagramHashtags,
	instagramMedia,
	instagramNotifications,
	instagramPosts,
} from "../packages/db/src/schema/instagram-marketing";
import { eq } from "drizzle-orm";

async function main() {
	console.log("Seeding Instagram Marketing Data...");

	// 1. Create or get primary account
	const existingAccounts = await db
		.select()
		.from(instagramAccounts)
		.where(eq(instagramAccounts.username, "evalunagroceries"));

	let accountId: number;

	if (existingAccounts.length === 0) {
		const [acc] = await db
			.insert(instagramAccounts)
			.values({
				instagramUserId: "ig_evaluna_99881122",
				username: "evalunagroceries",
				name: "Evaluna Smart Wholesale Grocery",
				profilePictureUrl:
					"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
				accountType: "BUSINESS",
				accessToken: "EAAJ...meta_graph_api_token_verified",
				tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000), // 60 days
				followersCount: 14820,
				followsCount: 312,
				mediaCount: 86,
				isConnected: true,
				lastSyncedAt: new Date(),
			})
			.returning();
		accountId = acc.id;
		console.log(`Created account: @${acc.username} (ID: ${acc.id})`);
	} else {
		accountId = existingAccounts[0].id;
		console.log(`Using existing account: @${existingAccounts[0].username} (ID: ${accountId})`);
	}

	// 2. Seed Campaigns
	const existingCampaigns = await db
		.select()
		.from(instagramCampaigns)
		.where(eq(instagramCampaigns.accountId, accountId));

	let campaignId1: number;
	let campaignId2: number;

	if (existingCampaigns.length === 0) {
		const [c1] = await db
			.insert(instagramCampaigns)
			.values({
				accountId,
				name: "Monsoon Kirana Wholesale Bonanza",
				objective: "Lead Generation & App Installs",
				description:
					"Targeting kirana and supermarket owners in Bhopal, Berasia, and Vidisha with bulk slab discount promotions.",
				status: "ACTIVE",
				startDate: new Date(Date.now() - 14 * 24 * 3600 * 1000),
				endDate: new Date(Date.now() + 16 * 24 * 3600 * 1000),
				budget: "45000.00",
			})
			.returning();

		const [c2] = await db
			.insert(instagramCampaigns)
			.values({
				accountId,
				name: "Direct Sourcing Trust & Quality Q4",
				objective: "Brand Awareness",
				description:
					"Showcasing Evaluna's automated warehouse, cold-storage, and 100% genuine brand sourcing guarantee.",
				status: "ACTIVE",
				startDate: new Date(Date.now() - 7 * 24 * 3600 * 1000),
				endDate: new Date(Date.now() + 23 * 24 * 3600 * 1000),
				budget: "25000.00",
			})
			.returning();

		campaignId1 = c1.id;
		campaignId2 = c2.id;
		console.log("Seeded campaigns");
	} else {
		campaignId1 = existingCampaigns[0].id;
		campaignId2 = existingCampaigns[1]?.id || existingCampaigns[0].id;
	}

	// 3. Seed Posts
	const existingPosts = await db
		.select()
		.from(instagramPosts)
		.where(eq(instagramPosts.accountId, accountId));

	if (existingPosts.length === 0) {
		// Published Reel
		const [post1] = await db
			.insert(instagramPosts)
			.values({
				accountId,
				instagramPostId: "ig_post_17982001",
				caption: `🚀 Super Saver FMCG Wholesale Deals This Week! 📦\n\nKirana owners, maximize your margin this month with unbeatable bulk slab discounts on high-velocity items:\n✔️ Ghadi Detergent 500g / 1kg Slabs\n✔️ Surf Excel Easy Wash\n✔️ Vim Dishwash Bar & Liquid\n\nOrder directly on the Evaluna Partner App for doorstep 24-hr delivery in Central MP! 🚚✨\n\n#KiranaSupply #WholesaleGrocery #FMCGDeals #BhopalWholesale #EvalunaERP #RetailIndia`,
				postType: "REEL",
				mediaUrls: [
					"https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
				],
				thumbnailUrl:
					"https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
				status: "PUBLISHED",
				publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
				campaignId: campaignId1,
				likesCount: 1420,
				commentsCount: 89,
				sharesCount: 230,
				savesCount: 312,
				reachCount: 18400,
				impressionsCount: 24100,
				engagementRate: "9.45",
			})
			.returning();

		// Published Carousel
		const [post2] = await db
			.insert(instagramPosts)
			.values({
				accountId,
				instagramPostId: "ig_post_17982002",
				caption: `📊 Top 5 High-Margin Staples for Kirana Stores in MP! Swipe to see the bulk margin breakdown ➡️\n\n1️⃣ MP Sharbati Gehu (A-grade cleaned)\n2️⃣ Chana Dal & Moong Mogar Premium\n3️⃣ Kolam & Basmati Rice Slabs\n4️⃣ Cold-Pressed Mustard & Refined Soyabean Oil\n5️⃣ Poha (Indori Motta & Thin)\n\nComment "PRICE" to receive our live B2B rate list directly on WhatsApp! 📲\n\n#B2BGrocery #KiranaBusiness #StaplesWholesale #MadhyaPradesh #EvalunaPvtLtd`,
				postType: "CAROUSEL",
				mediaUrls: [
					"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
					"https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80",
					"https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80",
				],
				thumbnailUrl:
					"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
				status: "PUBLISHED",
				publishedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
				campaignId: campaignId1,
				likesCount: 870,
				commentsCount: 45,
				sharesCount: 92,
				savesCount: 154,
				reachCount: 11200,
				impressionsCount: 15300,
				engagementRate: "8.25",
			})
			.returning();

		// Published Image
		const [post3] = await db
			.insert(instagramPosts)
			.values({
				accountId,
				instagramPostId: "ig_post_17982003",
				caption: `🌾 Fresh harvest Sharbati Gehu & MP Basmati stock arrived at our Berasia Regional Fulfillment Center!\n\nEvery sack goes through dual-stage sorting & moisture testing to guarantee zero stone, zero husk quality. Direct from farmers to your retail shelves.\n\nSame-day dispatch available for orders booked before 1 PM! 🚚📦\n\n#WheatWholesale #GrainSupply #EvalunaWarehouse #Berasia #BhopalGrocery`,
				postType: "IMAGE",
				mediaUrls: [
					"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
				],
				thumbnailUrl:
					"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80",
				status: "PUBLISHED",
				publishedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
				campaignId: campaignId2,
				likesCount: 540,
				commentsCount: 32,
				sharesCount: 48,
				savesCount: 88,
				reachCount: 8400,
				impressionsCount: 10200,
				engagementRate: "6.90",
			})
			.returning();

		// Published Story
		await db.insert(instagramPosts).values({
			accountId,
			instagramPostId: "ig_post_17982004",
			caption: `⚡ Flash Wholesale Deal: Fortune Sunflower Oil 15L Tin @ ₹1,340! Valid till 6 PM today only ⏳🔥 Tap the link in bio to book!`,
			postType: "STORY",
			mediaUrls: [
				"https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=800&q=80",
			],
			thumbnailUrl:
				"https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=400&q=80",
			status: "PUBLISHED",
			publishedAt: new Date(Date.now() - 10 * 3600 * 1000),
			likesCount: 120,
			commentsCount: 14,
			sharesCount: 35,
			savesCount: 18,
			reachCount: 3200,
			impressionsCount: 3800,
			engagementRate: "5.84",
		});

		// Scheduled Reel
		await db.insert(instagramPosts).values({
			accountId,
			caption: `Behind the Scenes at Evaluna Central Warehouse 📦✨\n\nWatch our barcode-driven pick & pack workflow that ensures 99.8% order accuracy and lightning-fast van dispatch. Say goodbye to missing items and damaged goods.\n\n#WarehouseLogistics #SupplyChainIndia #SmartFulfillment #EvalunaTech`,
			postType: "REEL",
			mediaUrls: [
				"https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80",
			],
			thumbnailUrl:
				"https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80",
			status: "SCHEDULED",
			scheduledAt: new Date(Date.now() + 24 * 3600 * 1000), // tomorrow
			campaignId: campaignId2,
		});

		// Scheduled Carousel
		await db.insert(instagramPosts).values({
			accountId,
			caption: `🌧️ Monsoon Kirana Care Guide: 4 simple tips to protect bulk pulses, spices, and flours from moisture and pests.\n\nProtect your inventory and save profits with these storage hygiene protocols! 🛡️🛒\n\n#RetailTips #KiranaCare #InventoryManagement #EvalunaPartners`,
			postType: "CAROUSEL",
			mediaUrls: [
				"https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
				"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
			],
			thumbnailUrl:
				"https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
			status: "SCHEDULED",
			scheduledAt: new Date(Date.now() + 48 * 3600 * 1000), // 2 days later
			campaignId: campaignId1,
		});

		// Draft Post
		await db.insert(instagramPosts).values({
			accountId,
			caption: `Festive Pre-Booking Open! 🪔 Bulk almonds, cashews, raisins & confectionery for Diwali/wedding season at wholesale factory prices.`,
			postType: "CAROUSEL",
			mediaUrls: [
				"https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80",
			],
			thumbnailUrl:
				"https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&q=80",
			status: "DRAFT",
		});

		// Add Comments to Post 1 & 2
		await db.insert(instagramComments).values([
			{
				postId: post1.id,
				username: "shree_ram_kirana_bhopal",
				userProfilePic:
					"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
				text: "Bhaiya Ghadi 1kg ka 50 bag ka rate kya milega? Vidisha delivery possible hai kya?",
				isReviewed: true,
				isReplied: true,
				replyText:
					"Namaste Ramesh ji! Vidisha mein daily delivery available hai. 50 bags par additional 3.5% slab discount milega. Details WhatsApp kar di hain!",
				timestamp: new Date(Date.now() - 36 * 3600 * 1000),
			},
			{
				postId: post1.id,
				username: "gupta_supermarket",
				userProfilePic:
					"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
				text: "Minimum order quantity kitni hai bulk discount ke liye?",
				isReviewed: false,
				isReplied: false,
				timestamp: new Date(Date.now() - 6 * 3600 * 1000),
			},
			{
				postId: post2.id,
				username: "anand_stores_berasia",
				userProfilePic:
					"https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80",
				text: "PRICE",
				isReviewed: true,
				isReplied: true,
				replyText: "Anand ji, humne WhatsApp par updated rate card send kar diya hai. Check karein!",
				timestamp: new Date(Date.now() - 20 * 3600 * 1000),
			},
		]);

		console.log("Seeded posts and comments");
	}

	// 4. Seed Media Library
	const existingMedia = await db
		.select()
		.from(instagramMedia)
		.where(eq(instagramMedia.accountId, accountId));

	if (existingMedia.length === 0) {
		await db.insert(instagramMedia).values([
			{
				accountId,
				name: "Ghadi Detergent Promo Banner",
				fileUrl:
					"https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
				mediaType: "IMAGE",
				format: "jpg",
				sizeBytes: 1024 * 720,
				folder: "FMCG Products",
				tags: ["Detergent", "Ghadi", "Offers", "Bulk"],
			},
			{
				accountId,
				name: "Wheat Grains Sorting Cleaned",
				fileUrl:
					"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
				mediaType: "IMAGE",
				format: "jpg",
				sizeBytes: 1024 * 950,
				folder: "Staples & Grains",
				tags: ["Wheat", "Sharbati", "Quality", "Farmers"],
			},
			{
				accountId,
				name: "Rice Varieties Showcase",
				fileUrl:
					"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
				mediaType: "IMAGE",
				format: "jpg",
				sizeBytes: 1024 * 840,
				folder: "Staples & Grains",
				tags: ["Rice", "Basmati", "Bulk"],
			},
			{
				accountId,
				name: "Warehouse Dispatch Operations Video",
				fileUrl:
					"https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80",
				mediaType: "VIDEO",
				format: "mp4",
				sizeBytes: 1024 * 1024 * 18,
				folder: "Warehouse & Operations",
				tags: ["Warehouse", "Dispatch", "Logistics", "Reel"],
			},
			{
				accountId,
				name: "Edible Oils Storage Tanks",
				fileUrl:
					"https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=800&q=80",
				mediaType: "IMAGE",
				format: "jpg",
				sizeBytes: 1024 * 610,
				folder: "Edible Oils",
				tags: ["Oil", "Fortune", "MustardOil", "Tins"],
			},
			{
				accountId,
				name: "Spices & Dry Fruits Assortment",
				fileUrl:
					"https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80",
				mediaType: "IMAGE",
				format: "jpg",
				sizeBytes: 1024 * 880,
				folder: "Spices & Dryfruits",
				tags: ["Dryfruits", "Spices", "Festive"],
			},
		]);
		console.log("Seeded media library");
	}

	// 5. Seed Hashtag Collections
	const existingHashtags = await db.select().from(instagramHashtags);
	if (existingHashtags.length === 0) {
		await db.insert(instagramHashtags).values([
			{
				name: "Kirana & Retailers India",
				category: "Retailers",
				hashtags: [
					"#kirana",
					"#wholesale",
					"#fmcg",
					"#kiranaowner",
					"#retailindia",
					"#grocerystore",
					"#retailbusiness",
					"#b2bgrocery",
					"#dukaan",
					"#smartretail",
				],
				usageCount: 28,
			},
			{
				name: "Grocery Wholesale Deals",
				category: "Offers",
				hashtags: [
					"#groceries",
					"#wholesaleprice",
					"#bestdeals",
					"#bulkbuy",
					"#dailyneeds",
					"#staples",
					"#evalunagroceries",
					"#discounts",
					"#kiranamarket",
				],
				usageCount: 42,
			},
			{
				name: "Central MP Regional Hub",
				category: "Location",
				hashtags: [
					"#bhopal",
					"#mpbusiness",
					"#berasia",
					"#vidisha",
					"#indore",
					"#madhyapradesh",
					"#smartbhopal",
					"#indianretail",
				],
				usageCount: 35,
			},
			{
				name: "Supply Chain & Logistics",
				category: "Operations",
				hashtags: [
					"#warehouse",
					"#logistics",
					"#fastdelivery",
					"#doorstepdelivery",
					"#stockup",
					"#supplychainindia",
					"#inventory",
				],
				usageCount: 19,
			},
		]);
		console.log("Seeded hashtag collections");
	}

	// 6. Seed Notifications
	const existingNotifs = await db.select().from(instagramNotifications);
	if (existingNotifs.length === 0) {
		await db.insert(instagramNotifications).values([
			{
				type: "POST_PUBLISHED",
				title: "Reel Published Successfully",
				message:
					'Your Reel "Super Saver FMCG Wholesale Deals This Week!" was published to Instagram.',
				isRead: false,
				link: "/marketing/posts",
				createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
			},
			{
				type: "ENGAGEMENT",
				title: "High Engagement Spike Detected",
				message:
					'Reel "Super Saver FMCG Deals" crossed 18,000 views with 9.45% engagement rate!',
				isRead: false,
				link: "/marketing/analytics/posts",
				createdAt: new Date(Date.now() - 24 * 3600 * 1000),
			},
			{
				type: "SCHEDULE_APPROACHING",
				title: "Post Scheduled for Tomorrow",
				message:
					'Reel "Behind the Scenes at Evaluna Central Warehouse" will publish tomorrow at 11:00 AM.',
				isRead: true,
				link: "/marketing/planner",
				createdAt: new Date(Date.now() - 12 * 3600 * 1000),
			},
			{
				type: "TOKEN_EXPIRING",
				title: "Meta Graph API Token Active",
				message:
					"Long-lived User Access Token is active and valid for the next 58 days.",
				isRead: true,
				link: "/marketing/settings",
				createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
			},
		]);
		console.log("Seeded notifications");
	}

	console.log("Instagram Marketing seeding completed successfully!");
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Seeding error:", err);
		process.exit(1);
	});
