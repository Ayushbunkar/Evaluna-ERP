"use client";

import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function LenisPageChangeHandler() {
	const pathname = usePathname();
	const lenis = useLenis();

	// Handle Next.js route transitions
	useEffect(() => {
		if (!lenis) return;
		// Recalculate dimensions on route change
		lenis.resize();
		// If navigating to a standard page without hash, reset scroll position instantly
		if (typeof window !== "undefined" && !window.location.hash) {
			lenis.scrollTo(0, { immediate: true });
		}
	}, [pathname, lenis]);

	return null;
}

// Routes where internal overflow containers handle scrolling and window scroll is fixed (h-screen overflow-hidden)
const DASHBOARD_PREFIXES = [
	"/admin",
	"/auditor",
	"/manager",
	"/hr",
	"/finance",
	"/warehouse",
	"/procurement",
	"/driver",
	"/picker",
	"/packer",
	"/loader",
	"/putter",
	"/sales",
	"/customer",
	"/checker",
	"/superadmin",
	"/supplier",
	"/route-manager",
	"/inventory",
	"/biller",
	"/delivery",
	"/settings",
	"/profile",
	"/attendance",
	"/tasks",
	"/dashboard",
];

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isDashboard = pathname
		? DASHBOARD_PREFIXES.some((prefix) => pathname.startsWith(prefix))
		: false;

	// In dashboards with fixed-height app shell layouts, native browser scroll
	// provides optimal 120Hz scrolling without intercepting wheel events over tables & lists.
	if (isDashboard) {
		return <>{children}</>;
	}

	return (
		<ReactLenis
			root
			options={{
				// Use pure continuous lerp damping (omitting duration) so discrete mouse wheel clicks accumulate into one unbroken fluid flow
				lerp: 0.08,
				wheelMultiplier: 0.95,
				touchMultiplier: 1,
				smoothWheel: true,
				// Zero performance lag on touch devices: keep native touch physics
				syncTouch: false,
				allowNestedScroll: true,
				stopInertiaOnNavigate: true,
				autoResize: true,
				anchors: true,
				prevent: (node) => {
					// Prevent hijacking inside modals, dialogs, dropdowns, Radix ScrollAreas, range inputs, tables, or data-lenis-prevent
					return (
						node.hasAttribute("data-lenis-prevent") ||
						Boolean(node.closest("[data-lenis-prevent]")) ||
						Boolean(node.closest("[role=\"dialog\"]")) ||
						Boolean(node.closest("[data-radix-scroll-area-viewport]")) ||
						Boolean(node.closest("input[type=\"range\"]")) ||
						Boolean(node.closest("table")) ||
						Boolean(node.closest("main")) ||
						Boolean(node.closest(".overflow-y-auto")) ||
						Boolean(node.closest(".overflow-auto")) ||
						Boolean(node.closest(".overflow-x-auto"))
					);
				},
			}}
		>
			<LenisPageChangeHandler />
			{children}
		</ReactLenis>
	);
}


