"use client";

import {
	DollarSignIcon,
	LayoutDashboardIcon,
	ReceiptTextIcon,
	ShoppingBagIcon,
	ShoppingCartIcon,
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
	{ href: "/sales/customers", labelKey: "customers", icon: UsersIcon },
	{ href: "/sales/returns", labelKey: "salesReturns", icon: ReceiptTextIcon },
	{ href: "/sales/cashbook", labelKey: "cashbook", icon: DollarSignIcon },
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
