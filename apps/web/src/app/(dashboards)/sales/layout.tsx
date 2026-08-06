"use client";

import {
	IndianRupeeIcon,
	LayoutDashboardIcon,
	ReceiptTextIcon,
	ShoppingBagIcon,
	ShoppingCartIcon,
	UsersIcon,
	TargetIcon,
	SettingsIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const salesNavItems: NavItem[] = [
	{ href: "/sales", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/sales/pos", labelKey: "pos", icon: ShoppingCartIcon },
	{ href: "/sales/orders", labelKey: "orders", icon: ShoppingBagIcon },
	{ href: "/sales/customers", labelKey: "customers", icon: UsersIcon },
	{ href: "/sales/returns", labelKey: "salesReturns", icon: ReceiptTextIcon },
	{ href: "/sales/cashbook", labelKey: "cashbook", icon: IndianRupeeIcon },
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
		<AppLayoutWithBranch navItems={salesNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
