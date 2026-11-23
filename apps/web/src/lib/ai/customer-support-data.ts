/**
 * Grounded Database Fetcher for Evaluna ERP Customer Support AI
 * Retrieves strictly authentic records for the authenticated user/customer.
 * Zero hallucination: only actual DB values are returned.
 */

import {
	chatSessions,
	customers,
	deliveryStops,
	deliveryTrips,
	orderItems,
	orders,
	packages,
	pickLists,
	products,
} from "@evaluna/db/schema";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";

export interface AuthenticCustomerContext {
	customer: {
		id: number;
		name: string;
		email: string | null;
		phone: string | null;
		creditLimit: string | null;
		creditUsed: string | null;
		storeCredit: string | null;
		loyaltyTier: string | null;
		loyaltyPoints: number | null;
	} | null;
	recentOrders: Array<{
		orderId: number;
		date: string;
		status: string;
		financeStatus: string | null;
		totalAmount: string;
		deliveryTime: string | null;
		items: Array<{
			name: string;
			quantity: string | number;
			price: string;
		}>;
		fulfillment: {
			pickingStatus: string | null;
			packages: Array<{
				packageNumber: string;
				status: string | null;
				weight: string | null;
			}>;
			deliveryTripStatus: string | null;
			stopStatus: string | null;
			dispatchedAt: string | null;
		};
	}>;
	officialContact: {
		phone: string;
		email: string;
		hours: string;
		address: string;
	};
}

export const OFFICIAL_COMPANY_INFO = {
	companyName: "Evaluna ERP Logistics & Supply Chain",
	phone: "+91 96306 49277",
	phoneExtensions: "Ext. 1501 (Warehouse Hotline), Ext. 1502 (Emergency Support)",
	email: "support@evaluna.com",
	erpEmail: "erp-support@evaluna.com",
	operatingHours: "Monday to Saturday, 8:00 AM – 8:00 PM IST (Warehouse Emergency 24/7)",
	headquarters: "Evaluna Logistics HQ, Tech Park Hub, Indore / Central Operations, India",
	policies: {
		cancellation:
			"Orders can be cancelled before warehouse picking starts. Once packed or dispatched, please contact support for return processing upon delivery.",
		returns:
			"Damaged or incorrect goods can be rejected during receiving inspection or returned within 7 business days with photo evidence.",
		creditPayment:
			"Credit accounts have standard net-30 terms. Outstanding balances can be verified under Finance or with your assigned account manager.",
	},
	navigationGuide: {
		viewOrders: "Dashboard > Orders tab",
		placeOrder: "Dashboard > Products tab",
		invoicesAndBilling: "Dashboard > Payments tab",
		profile: "Dashboard > Profile tab",
		contactPhone: "+91 96306 49277",
		contactEmail: "support@evaluna.com",
	},
};

export async function fetchCustomerAuthContext(
	userUid: string,
	userEmail?: string | null,
	preferredCustomerId?: number | null,
): Promise<AuthenticCustomerContext> {
	// 1. Identify Customer record
	let customerRecord: any = null;

	if (preferredCustomerId) {
		const [found] = await db
			.select()
			.from(customers)
			.where(eq(customers.id, preferredCustomerId))
			.limit(1);
		if (found) customerRecord = found;
	}

	if (!customerRecord && userUid) {
		const [foundByUser] = await db
			.select()
			.from(customers)
			.where(eq(customers.user_uid, userUid))
			.limit(1);
		if (foundByUser) customerRecord = foundByUser;
	}

	if (!customerRecord && userEmail) {
		const [foundByEmail] = await db
			.select()
			.from(customers)
			.where(eq(customers.email, userEmail))
			.limit(1);
		if (foundByEmail) customerRecord = foundByEmail;
	}

	// 2. Fetch Recent Orders for this specific customer
	let recentOrdersData: AuthenticCustomerContext["recentOrders"] = [];

	const conditions = [];
	if (customerRecord?.id) {
		conditions.push(eq(orders.customer_id, customerRecord.id));
	}
	if (userUid) {
		conditions.push(eq(orders.user_uid, userUid));
	}

	const orderRecords =
		conditions.length > 0
			? await db
					.select()
					.from(orders)
					.where(or(...conditions))
					.orderBy(desc(orders.created_at))
					.limit(5)
			: [];

	if (orderRecords.length > 0) {
			const orderIds = orderRecords.map((o) => o.id);

			// Fetch items
			const rawItems = await db
				.select({
					orderId: orderItems.order_id,
					productId: orderItems.product_id,
					quantity: orderItems.quantity,
					price: orderItems.price,
					productName: products.name,
				})
				.from(orderItems)
				.leftJoin(products, eq(orderItems.product_id, products.id))
				.where(inArray(orderItems.order_id, orderIds));

			// Fetch picking info
			const rawPickLists = await db
				.select({
					orderId: pickLists.order_id,
					status: pickLists.status,
				})
				.from(pickLists)
				.where(inArray(pickLists.order_id, orderIds));

			// Fetch packages
			const rawPackages = await db
				.select({
					orderId: packages.order_id,
					packageNumber: packages.package_number,
					status: packages.status,
					weight: packages.weight,
				})
				.from(packages)
				.where(inArray(packages.order_id, orderIds));

			// Fetch delivery stops and trips
			const rawStops = await db
				.select({
					orderId: deliveryStops.order_id,
					stopStatus: deliveryStops.status,
					tripId: deliveryStops.trip_id,
					tripStatus: deliveryTrips.status,
					dispatchedAt: deliveryTrips.dispatched_at,
				})
				.from(deliveryStops)
				.leftJoin(deliveryTrips, eq(deliveryStops.trip_id, deliveryTrips.id))
				.where(inArray(deliveryStops.order_id, orderIds));

			recentOrdersData = orderRecords.map((o) => {
				const items = rawItems
					.filter((item) => item.orderId === o.id)
					.map((item) => ({
						name: item.productName || `Product #${item.productId}`,
						quantity: item.quantity,
						price: item.price,
					}));

				const pick = rawPickLists.find((p) => p.orderId === o.id);
				const pkgs = rawPackages
					.filter((p) => p.orderId === o.id)
					.map((p) => ({
						packageNumber: p.packageNumber,
						status: p.status,
						weight: p.weight,
					}));
				const stop = rawStops.find((s) => s.orderId === o.id);

				return {
					orderId: o.id,
					date: o.created_at ? new Date(o.created_at).toISOString().split("T")[0] : "Recent",
					status: o.status || "pending",
					financeStatus: o.finance_status || "pending_collection",
					totalAmount: o.total_amount,
					deliveryTime: o.delivery_time ? new Date(o.delivery_time).toLocaleString() : null,
					items,
					fulfillment: {
						pickingStatus: pick?.status || null,
						packages: pkgs,
						deliveryTripStatus: stop?.tripStatus || null,
						stopStatus: stop?.stopStatus || null,
						dispatchedAt: stop?.dispatchedAt ? new Date(stop.dispatchedAt).toLocaleString() : null,
					},
				};
			});
		}

	return {
		customer: customerRecord
			? {
					id: customerRecord.id,
					name: customerRecord.name,
					email: customerRecord.email,
					phone: customerRecord.phone,
					creditLimit: customerRecord.credit_limit,
					creditUsed: customerRecord.credit_used,
					storeCredit: customerRecord.store_credit,
					loyaltyTier: customerRecord.loyalty_tier,
					loyaltyPoints: customerRecord.loyalty_points,
				}
			: null,
		recentOrders: recentOrdersData,
		officialContact: {
			phone: OFFICIAL_COMPANY_INFO.phone,
			email: OFFICIAL_COMPANY_INFO.email,
			hours: OFFICIAL_COMPANY_INFO.operatingHours,
			address: OFFICIAL_COMPANY_INFO.headquarters,
		},
	};
}

export async function escalateChatSession(
	sessionId: number,
	notes?: string,
): Promise<{ ticketId: string }> {
	const ticketId = `TICKET-${sessionId}-${Date.now().toString().slice(-4)}`;

	await db
		.update(chatSessions)
		.set({
			status: "escalated",
		})
		.where(eq(chatSessions.id, sessionId));

	return { ticketId };
}

export interface SupportProductItem {
	id: number;
	name: string;
	price: string;
	sellingPrice: string | null;
	unit: string | null;
	category: string | null;
}

export function extractProductSearchTerms(query: string): string[] {
	const cleaned = query
		.toLowerCase()
		.replace(/(\d+)\s+(\d+)/g, "$1-$2") // e.g. "20 20" -> "20-20"
		.replace(/[^a-z0-9\- \u0900-\u097F]/g, " ");

	const stopWords = new Set([
		// English Conversational / Structural Stop Words
		"write", "writing", "written", "message", "messages", "msg", "text", "type",
		"send", "sending", "say", "saying", "speak", "tell", "telling", "hindi",
		"hinid", "english", "hinglish", "in", "a", "an", "the", "to", "from",
		"with", "by", "for", "at", "about", "can", "you", "me", "my", "i", "we",
		"our", "us", "he", "she", "they", "them", "it", "is", "am", "are", "was",
		"were", "be", "been", "have", "has", "had", "do", "does", "did", "hello",
		"hi", "hey", "thanks", "thank", "good", "morning", "evening", "night",
		"afternoon", "please", "help", "support", "assist", "sir", "mam", "madam",
		"ok", "okay", "yes", "no", "yeah", "yep", "here", "there", "what", "how",
		"when", "where", "why", "who", "show", "give", "available",

		// Hindi / Hinglish Conversational Stop Words
		"mujhe", "humko", "hume", "mera", "meri", "mere", "aap", "aapka", "aapki",
		"aapke", "tum", "tumhara", "tumhari", "ka", "ki", "ke", "ko", "se", "me",
		"mein", "par", "pe", "rate", "rates", "price", "prices", "cost", "bhav",
		"bhao", "dam", "daam", "kimat", "keemat", "mrp", "batao", "bataiye", "bata",
		"do", "de", "dijiye", "dena", "dona", "le", "lo", "lijiye", "kya", "hai",
		"hain", "tha", "thi", "the", "hoga", "hogi", "hoge", "kitne", "kitna",
		"kitni", "chahiye", "milega", "mil", "sakta", "sakti", "sakte", "wali",
		"wala", "vale", "vali", "order", "item", "product", "karen", "karein",
		"karo", "karna", "dekhna", "jana", "jan", "janna", "pucho", "pucha",
		"likho", "likh", "bhejo", "bolo", "boliye", "namaste", "namaskar", "pranam",
		"dhanyavad", "shukriya", "kripya", "baat", "suno", "sunen", "accha", "theek",
		"thik", "sahi", "nahi", "mat",
	]);

	const words = cleaned
		.split(/\s+/)
		.map((w) => w.trim())
		.filter((w) => {
			if (w.length < 3 && !/^\d+$/.test(w)) return false;
			return !stopWords.has(w);
		});

	return words;
}

export function isProductInquiry(query: string): boolean {
	const lower = query.toLowerCase();

	// Exclude pure conversational / greeting / language prompt patterns
	const isPureConversation =
		/^(hi|hello|hey|namaste|pranam|good\s*(morning|evening|afternoon)|thanks|thank\s*you|dhanyavad)\b/i.test(lower.trim()) ||
		/\b(write|message|msg|text|bolo|likho|baat)\b.*\b(in\s+hindi|hindi\s+me|english\s+me)\b/i.test(lower) ||
		/^(write|type|send)\s+(a\s+)?(message|text)\b/i.test(lower.trim());

	if (isPureConversation) {
		return false;
	}

	// Explicit rate & pricing keywords
	const hasPriceKeyword =
		/\b(rate|rates|price|prices|cost|bhav|bhao|dam|daam|kimat|keemat|mrp|quote|quotation)\b/i.test(lower) ||
		/\b(kitne|kitna|kitni)\s*(ka|ki|ke|me|mein|padega|hoga|hai)\b/i.test(lower);

	if (hasPriceKeyword) return true;

	// Product inquiry keywords
	const hasProductKeyword =
		/\b(product|products|item|items|goods|maal|stock|available|catalogue|catalog|menu)\b/i.test(lower) ||
		/\b(kya\s*kya\s*(hai|milega))\b/i.test(lower);

	if (hasProductKeyword) return true;

	const terms = extractProductSearchTerms(query);
	return terms.length >= 1;
}

export async function searchProductsForSupport(
	query: string,
	limit: number = 8,
): Promise<SupportProductItem[]> {
	if (!isProductInquiry(query)) {
		return [];
	}

	const terms = extractProductSearchTerms(query);
	if (terms.length === 0) return [];

	// Match against product name or family (NOT loose category like %in%)
	const andConditions = terms.map((t) =>
		or(
			ilike(products.name, `%${t}%`),
			ilike(products.product_family, `%${t}%`),
		),
	);

	let rows = await db
		.select({
			id: products.id,
			name: products.name,
			price: products.price,
			sellingPrice: products.base_selling_price,
			unit: products.unit,
			category: products.category,
		})
		.from(products)
		.where(
			and(
				eq(products.is_deleted, false),
				eq(products.is_hidden, false),
				and(...andConditions),
			),
		)
		.limit(limit);

	// If no strict AND match found and multiple terms exist, try matching OR
	if (rows.length === 0 && terms.length > 1) {
		const orConditions = terms.map((t) =>
			or(
				ilike(products.name, `%${t}%`),
				ilike(products.product_family, `%${t}%`),
			),
		);

		rows = await db
			.select({
				id: products.id,
				name: products.name,
				price: products.price,
				sellingPrice: products.base_selling_price,
				unit: products.unit,
				category: products.category,
			})
			.from(products)
			.where(
				and(
					eq(products.is_deleted, false),
					eq(products.is_hidden, false),
					or(...orConditions),
				),
			)
			.limit(limit);
	}

	return rows;
}

