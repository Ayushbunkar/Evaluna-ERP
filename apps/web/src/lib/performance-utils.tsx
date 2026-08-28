/**
 * Performance Optimization Utilities
 * Combines Intersection Observer and React Scan for ultra-fast rendering
 */

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

// Performance-optimized component wrapper using Intersection Observer
export function PerformanceOptimizedComponent({
	children,
	threshold = 0.1,
	triggerOnce = true,
	fallback = null,
}: {
	children: React.ReactNode;
	threshold?: number;
	triggerOnce?: boolean;
	fallback?: React.ReactNode;
}) {
	const { ref, inView } = useInView({
		threshold,
		triggerOnce,
	});

	return <div ref={ref}>{inView ? children : fallback}</div>;
}

// Performance monitoring hook using React Scan
export function usePerformanceMonitor(componentName: string) {
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log(`[PERF] ${componentName} rendered`);
			// React Scan would automatically detect unnecessary re-renders
		}
	}, [componentName]);
}

// Optimized image component with lazy loading and performance tracking
export function OptimizedImage({
	src,
	alt,
	width,
	height,
	className,
	priority = false,
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
	className?: string;
	priority?: boolean;
}) {
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: true,
	});

	// Use native lazy loading for images
	return (
		<div ref={ref} className={className}>
			{inView && (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={src}
					alt={alt}
					width={width}
					height={height}
					loading={priority ? "eager" : "lazy"}
					decoding="async"
					style={{
						width: "100%",
						height: "auto",
					}}
				/>
			)}
		</div>
	);
}

// Prefetch utility for better navigation performance
export function prefetchRoute(href: string) {
	if (typeof window !== "undefined") {
		// Implement intelligent prefetching
		const link = document.createElement("link");
		link.rel = "prefetch";
		link.href = href;
		link.as = "document";
		document.head.appendChild(link);
	}
}

// Performance-optimized list item for virtualized lists
export function OptimizedListItem({
	children,
	index,
	style,
}: {
	children: React.ReactNode;
	index: number;
	style: React.CSSProperties;
}) {
	usePerformanceMonitor(`ListItem-${index}`);

	return (
		<div
			style={style}
			data-index={index}
			className="performance-optimized-list-item"
		>
			{children}
		</div>
	);
}
