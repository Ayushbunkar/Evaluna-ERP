"use client";

import { useEffect } from "react";
import { usePerformanceMonitor } from "@/lib/performance-utils";

/**
 * Performance Monitor Component
 * Tracks component rendering performance and identifies bottlenecks
 */
export function PerformanceMonitor({
	componentName,
	children,
}: {
	componentName: string;
	children: React.ReactNode;
}) {
	// Track rendering performance
	usePerformanceMonitor(componentName);

	// Additional performance tracking in development
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			const startTime = performance.now();

			return () => {
				const endTime = performance.now();
				const renderTime = endTime - startTime;

				if (renderTime > 50) {
					console.warn(
						`[PERF WARNING] ${componentName} took ${renderTime.toFixed(2)}ms to render`,
					);
				} else {
					console.log(
						`[PERF] ${componentName} rendered in ${renderTime.toFixed(2)}ms`,
					);
				}
			};
		}
	}, [componentName]);

	return <>{children}</>;
}

/**
 * Route Prefetcher Component
 * Prefetches routes for faster navigation
 */
export function RoutePrefetcher({ href }: { href: string }) {
	useEffect(() => {
		// Prefetch the route when component mounts
		const prefetch = async () => {
			try {
				await fetch(href, {
					method: "HEAD",
					credentials: "same-origin",
				});
			} catch (error) {
				console.error(`Failed to prefetch ${href}:`, error);
			}
		};

		// Use requestIdleCallback for non-critical prefetching
		if ("requestIdleCallback" in window) {
			const handle = requestIdleCallback(prefetch, { timeout: 3000 });
			return () => cancelIdleCallback(handle);
		}
		prefetch();
	}, [href]);

	return null;
}
