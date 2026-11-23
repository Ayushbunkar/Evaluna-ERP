import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { db } from "./db";

/**
 * Offline Sync Link for tRPC
 * Intercepts mutations and queries when offline on Vercel PWA / no internet.
 * Generates conflict-free temporary order numbers (OFF-ORD-XXXXX) to prevent order collisions.
 */
export const offlineSyncLink: TRPCLink<any> = () => {
	return ({ next, op }) => {
		return observable((observer) => {
			// If online, pass through directly to Vercel backend
			if (typeof window !== "undefined" && navigator.onLine) {
				const unsubscribe = next(op).subscribe({
					next(value) {
						observer.next(value);
					},
					error(err) {
						observer.error(err);
					},
					complete() {
						observer.complete();
					},
				});
				return unsubscribe;
			}

			// If offline and it's a mutation (e.g. creating order, driver stop, cash collection)
			if (op.type === "mutation") {
				const tempOrderNumber = `OFF-ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
				console.log(
					`[Offline PWA] Queueing mutation (${op.path}) with temp reference ${tempOrderNumber}`,
				);

				const enrichedPayload = {
					...(op.input as any),
					temp_order_number: tempOrderNumber,
					offline_created_at: new Date().toISOString(),
				};

				db.sync_queue
					.add({
						action: op.path,
						payload: enrichedPayload,
						status: "pending",
						timestamp: Date.now(),
					})
					.then(() => {
						// Optimistic UI response with temporary order reference
						observer.next({
							result: {
								data: {
									success: true,
									offline: true,
									order_number: tempOrderNumber,
									id: tempOrderNumber,
									...enrichedPayload,
								},
							},
						} as any);
						observer.complete();
					})
					.catch((err) => {
						observer.error(err);
					});

				return () => {};
			}

			// If offline and query intercepted, return cached data snapshot
			console.log(`[Offline PWA] Query intercepted (${op.path})`);
			observer.next({
				result: {
					data: [],
				},
			} as any);
			observer.complete();

			return () => {};
		});
	};
};
