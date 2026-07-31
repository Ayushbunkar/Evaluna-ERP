import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { db } from "./db";

export const offlineSyncLink: TRPCLink<any> = () => {
	return ({ next, op }) => {
		return observable((observer) => {
			// If we are online, just pass through
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

			// If we are offline and it's a mutation, queue it
			if (op.type === "mutation") {
				console.log("Offline mode: Queueing mutation", op.path);

				db.sync_queue
					.add({
						action: op.path,
						payload: op.input,
						status: "pending",
						timestamp: Date.now(),
					})
					.then(() => {
						// Fake a success response to keep the UI optimistic
						observer.next({
							result: {
								data: { success: true, offline: true, ...(op.input as any) },
							},
						} as any);
						observer.complete();
					})
					.catch((err) => {
						observer.error(err);
					});

				return () => {};
			}

			// If it's a query and we are offline, try to resolve from Dexie cache if possible
			console.log("Offline mode: Query intercepted", op.path);
			observer.next({
				result: {
					data: [], // Ideally this resolves from Dexie tables based on op.path
				},
			} as any);
			observer.complete();

			return () => {};
		});
	};
};
