"use client";

import {
	ClipboardListIcon,
	IndianRupeeIcon,
	LayoutDashboardIcon,
	PauseCircleIcon,
	ReceiptTextIcon,
	SettingsIcon,
	ShoppingBagIcon,
	ShoppingCartIcon,
	TargetIcon,
	UsersIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const salesNavItems: NavItem[] = [
	{ href: "/sales", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/sales/pos", labelKey: "pos", icon: ShoppingCartIcon },
	{ href: "/sales/orders", labelKey: "orders", icon: ShoppingBagIcon },
	{
		href: "/sales/orders/review",
		labelKey: "customerOrders",
		icon: ClipboardListIcon,
	},
	{ href: "/sales/customers", labelKey: "customers", icon: UsersIcon },
	{ href: "/sales/returns", labelKey: "salesReturns", icon: ReceiptTextIcon },
	{ href: "/sales/cashbook", labelKey: "cashbook", icon: IndianRupeeIcon },
	{ href: "/sales/hold-bills", labelKey: "holdBills", icon: PauseCircleIcon },
	// Newly Added Missing Pages
	{ href: "/sales/targets", labelKey: "targets", icon: TargetIcon },
	{ href: "/sales/settings", labelKey: "settings", icon: SettingsIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={salesNavItems} namespace="nav" role="sales">
			{children}
		</AppLayoutWithBranch>
	);
}
