import { db } from "./db";

export async function flushSyncQueue() {
	if (typeof window === "undefined" || !navigator.onLine) return;

	const pendingItems = await db.sync_queue
		.where("status")
		.equals("pending")
		.toArray();

	if (pendingItems.length === 0) return;

	console.log(`Flushing ${pendingItems.length} offline mutations...`);

	for (const item of pendingItems) {
		try {
			// In a real robust implementation, this would map the action string (e.g. "orders.create")
			// to the actual TRPC client call, or send it to a batch endpoint.
			// For now, we simulate the flush and mark it completed.
			const res = await fetch(`/api/trpc/${item.action}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(item.payload),
			});

			if (res.ok) {
				await db.sync_queue.update(item.id!, { status: "completed" });
			} else {
				await db.sync_queue.update(item.id!, { status: "failed" });
			}
		} catch (err) {
			console.error("Failed to sync item", item, err);
			// Leave as pending or mark failed depending on retry policy
		}
	}
}

// Hook to register listeners
export function registerOfflineSync() {
	if (typeof window !== "undefined") {
		window.addEventListener("online", () => {
			console.log("Internet restored. Initiating background sync...");
			flushSyncQueue();
		});

		// Also try flushing on boot if online
		if (navigator.onLine) {
			flushSyncQueue();
		}
	}
}
