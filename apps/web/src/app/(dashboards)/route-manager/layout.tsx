"use client";

import {
	AlertTriangle,
	FileBarChart,
	LayoutDashboard,
	Truck,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const routeManagerNavItems: NavItem[] = [
	{
		href: "/route-manager/dashboard",
		labelKey: "Dashboard",
		icon: LayoutDashboard,
	},
	{ href: "/route-manager/trips", labelKey: "Active Trips", icon: Truck },
	{
		href: "/route-manager/deviations",
		labelKey: "Route Deviations",
		icon: AlertTriangle,
	},
	{
		href: "/route-manager/reports",
		labelKey: "Reports",
		icon: FileBarChart,
	},
];

export default function RouteManagerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={routeManagerNavItems}
			namespace="nav"
			role="route-manager"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
