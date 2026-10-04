import Dexie, { type Table } from "dexie";
import { db as syncDb } from "./offline/db";

export interface OfflineProduct {
	id: number;
	name: string;
	price: string;
	sku?: string;
	barcode?: string;
	category?: string;
	stock?: number;
}

export interface OfflineCustomer {
	id: number;
	name: string;
	phone?: string;
	address?: string;
}

export interface OfflineOrder {
	id?: number;
	clientTempId: string;
	customerId?: number;
	customerName: string;
	items: {
		productId: number;
		productName: string;
		quantity: number;
		unitPrice: number;
	}[];
	totalAmount: number;
	paymentMethod: string;
	createdAt: string;
	synced: boolean;
}

export interface OfflineDriverStop {
	id?: number;
	clientTempId: string;
	tripId: number;
	stopId: number;
	customerName: string;
	status: "DELIVERED" | "FAILED";
	collectedAmount?: number;
	paymentMethod?: string;
	notes?: string;
	timestamp: string;
	synced: boolean;
}

class EvalunaOfflineDatabase extends Dexie {
	products!: Table<OfflineProduct, number>;
	customers!: Table<OfflineCustomer, number>;
	offlineOrders!: Table<OfflineOrder, number>;
	offlineDriverStops!: Table<OfflineDriverStop, number>;

	constructor() {
		super("EvalunaERP_OfflineDB");
		this.version(1).stores({
			products: "id, name, barcode, sku",
			customers: "id, name, phone",
			offlineOrders: "++id, clientTempId, synced, createdAt",
			offlineDriverStops: "++id, clientTempId, tripId, stopId, synced",
		});
	}
}

export const offlineDb = new EvalunaOfflineDatabase();

/**
 * Save pending POS Order to Offline Outbox Queue
 */
export async function queueOfflineOrder(
	orderData: Omit<OfflineOrder, "synced">,
) {
	return await offlineDb.offlineOrders.add({
		...orderData,
		synced: false,
	});
}

/**
 * Save pending Driver Delivery Stop Confirmation to Offline Queue
 */
export async function queueOfflineDriverStop(
	stopData: Omit<OfflineDriverStop, "synced">,
) {
	return await offlineDb.offlineDriverStops.add({
		...stopData,
		synced: false,
	});
}

/**
 * Get count of un-synced offline records
 */
export async function getPendingOfflineQueueCount() {
	try {
		const pendingSyncQueue = await syncDb.sync_queue
			.where("status")
			.equals("pending")
			.count();
		const pendingOrders = await offlineDb.offlineOrders
			.where("synced")
			.equals(0)
			.count();
		const pendingStops = await offlineDb.offlineDriverStops
			.where("synced")
			.equals(0)
			.count();
		return pendingSyncQueue + pendingOrders + pendingStops;
	} catch {
		return 0;
	}
}
