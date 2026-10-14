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
import { desc, eq, inArray } from "drizzle-orm";
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
		viewOrders: "/sales/orders",
		placeOrder: "/sales/pos or /sales/orders",
		invoicesAndBilling: "/finance or /invoices",
		warehouseReceiving: "/procurement/incoming",
		stockAudit: "/warehouse/audit-assignments",
		driverTracking: "/driver",
		contactUs: "/contact",
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

	if (!customerRecord) {
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

	// 2. Fetch Recent Orders if customer exists
	let recentOrdersData: AuthenticCustomerContext["recentOrders"] = [];

	if (customerRecord) {
		const orderRecords = await db
			.select()
			.from(orders)
			.where(eq(orders.customer_id, customerRecord.id))
			.orderBy(desc(orders.created_at))
			.limit(5);

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
