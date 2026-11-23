"use client";

import {
	ArrowRightLeft,
	FileBarChart,
	Layers,
	LayoutDashboard,
	Package,
	SlidersHorizontal,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const inventoryNavItems: NavItem[] = [
	{ href: "/inventory/dashboard", labelKey: "Dashboard", icon: LayoutDashboard },
	{ href: "/inventory/stock", labelKey: "Stock Levels", icon: Package },
	{ href: "/inventory/batches", labelKey: "Product Batches", icon: Layers },
	{
		href: "/inventory/adjustments",
		labelKey: "Stock Adjustments",
		icon: SlidersHorizontal,
	},
	{
		href: "/inventory/conversions",
		labelKey: "Pack/Loose Conversions",
		icon: ArrowRightLeft,
	},
	{ href: "/inventory/reports", labelKey: "Reports", icon: FileBarChart },
];

export default function InventoryLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={inventoryNavItems}
			namespace="nav"
			role="inventory"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
