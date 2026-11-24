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
	const retryCountRef = useRef(0);

	useEffect(() => {
		if (typeof window === "undefined" || !("EventSource" in window)) return;

		let eventSource: EventSource | null = null;
		let isMounted = true;

		function connect() {
			if (!isMounted) return;

			// Limit retries to 3 attempts with exponential backoff; if SSE is unavailable,
			// TRPC polling (refetchInterval: 5000) seamlessly handles live stock updates without console spam.
			if (retryCountRef.current >= 3) {
				return;
			}

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
					retryCountRef.current += 1;
					if (isMounted && retryCountRef.current < 3) {
						const delay = Math.min(12000, 3000 * Math.pow(2, retryCountRef.current - 1));
						retryTimerRef.current = setTimeout(connect, delay);
					}
				};

				eventSource.onopen = () => {
					retryCountRef.current = 0;
				};
			} catch {
				// Fallback silently to TRPC query polling
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
