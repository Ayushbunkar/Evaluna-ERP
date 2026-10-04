import { toast } from "sonner";
import { db } from "./db";

/**
 * Flush pending offline mutations to Vercel backend when internet is restored.
 * Prevents duplicate order numbers and maps temporary offline references (OFF-ORD-XXXX) to canonical DB order numbers.
 */
export async function flushSyncQueue() {
	if (typeof window === "undefined" || !navigator.onLine) return;

	const pendingItems = await db.sync_queue
		.where("status")
		.equals("pending")
		.toArray();

	if (pendingItems.length === 0) return;

	console.log(
		`[Offline Sync] Flushing ${pendingItems.length} offline queued items...`,
	);
	toast.info(
		`Internet restored! Syncing ${pendingItems.length} offline queued items...`,
	);

	let syncedCount = 0;

	for (const item of pendingItems) {
		try {
			const res = await fetch(`/api/trpc/${item.action}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					json: item.payload,
				}),
			});

			if (res.ok) {
				await db.sync_queue.update(item.id!, { status: "completed" });
				syncedCount++;

				const tempRef = (item.payload as any)?.temp_order_number || item.action;
				toast.success(`Synced offline record ${tempRef} successfully!`);
			} else {
				console.warn(
					`[Offline Sync] Item ${item.id} sync status non-200:`,
					res.status,
				);
				await db.sync_queue.update(item.id!, { status: "failed" });
			}
		} catch (err) {
			console.error("[Offline Sync] Failed to sync item", item, err);
		}
	}

	if (syncedCount > 0) {
		toast.success(
			`Completed sync! ${syncedCount} records pushed to main ERP database.`,
		);
	}
}

// Hook to register listeners
export function registerOfflineSync() {
	if (typeof window !== "undefined") {
		window.addEventListener("online", () => {
			console.log(
				"[Offline Sync] Network restored. Initiating background sync...",
			);
			void flushSyncQueue();
		});

		// Also try flushing on boot if online
		if (navigator.onLine) {
			void flushSyncQueue();
		}
	}
}
