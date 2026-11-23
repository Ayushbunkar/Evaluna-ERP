"use client";

import { useEffect, useRef } from "react";
import { useTRPC } from "@/lib/trpc/client";

/**
 * Hook to subscribe the customer dashboard and catalog to real-time stock events
 * via Server-Sent Events (SSE), immediately invalidating queries upon any inventory updates.
 */
export function useRealtimeStock() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (typeof window === "undefined" || !("EventSource" in window)) return;

		let eventSource: EventSource | null = null;
		let isMounted = true;

		function connect() {
			if (!isMounted) return;

			try {
				eventSource = new EventSource("/api/customer/stock-events");

				const handleUpdate = () => {
					utils.customer.browseProducts.invalidate();
					utils.customer.getCart.invalidate();
				};

				eventSource.addEventListener("stock_update", handleUpdate);
				eventSource.onmessage = handleUpdate;

				eventSource.onerror = () => {
					if (eventSource) {
						eventSource.close();
						eventSource = null;
					}
					if (isMounted) {
						retryTimerRef.current = setTimeout(connect, 4000);
					}
				};
			} catch {
				// Fallback to polling via refetchInterval
			}
		}

		connect();

		return () => {
			isMounted = false;
			if (retryTimerRef.current) {
				clearTimeout(retryTimerRef.current);
			}
			if (eventSource) {
				eventSource.close();
			}
		};
	}, [utils]);
}
