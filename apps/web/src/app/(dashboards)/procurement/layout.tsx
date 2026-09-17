"use client";

import {
	BarChart3Icon,
	ClipboardListIcon,
	LayoutDashboardIcon,
	TruckIcon,
	UsersIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const procurementNavItems: NavItem[] = [
	{
		href: "/procurement",
		labelKey: "dashboard",
		icon: LayoutDashboardIcon,
	},
	{
		href: "/procurement/purchase-orders",
		labelKey: "purchaseOrders",
		icon: ClipboardListIcon,
	},
	{
		href: "/procurement/suppliers",
		labelKey: "suppliers",
		icon: UsersIcon,
	},
	{
		href: "/procurement/analytics",
		labelKey: "analytics",
		icon: BarChart3Icon,
	},
	{
		href: "/procurement/incoming",
		labelKey: "incomingInventory",
		icon: TruckIcon,
	},
];

export default function ProcurementLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch
			navItems={procurementNavItems}
			namespace="nav"
			role="procurement"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
