"use client";

import {
	AlertCircleIcon,
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
	XCircleIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";
import { trpc } from "@/lib/trpc/client";

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { data: pendingData } = trpc.orders.getPendingCount.useQuery(
		undefined,
		{ refetchInterval: 15000 },
	);

	const pendingCount = typeof pendingData === "number" ? pendingData : (pendingData?.count ?? 0);

	const salesNavItems: NavItem[] = [
		{ href: "/sales", labelKey: "dashboard", icon: LayoutDashboardIcon },
		{ href: "/sales/pos", labelKey: "pos", icon: ShoppingCartIcon },
		{ href: "/sales/orders", labelKey: "orders", icon: ShoppingBagIcon },
		{
			href: "/sales/orders/review",
			labelKey: "customerOrders",
			icon: ClipboardListIcon,
			badge: pendingCount > 0 ? pendingCount : undefined,
		},
		{ href: "/sales/orders/cancelled", labelKey: "cancelledOrders", icon: XCircleIcon },
		{ href: "/sales/shortages", labelKey: "shortages", icon: AlertCircleIcon },
		{ href: "/sales/customers", labelKey: "customers", icon: UsersIcon },
		{ href: "/sales/returns", labelKey: "salesReturns", icon: ReceiptTextIcon },
		{ href: "/sales/hold-bills", labelKey: "holdBills", icon: PauseCircleIcon },
		{ href: "/sales/targets", labelKey: "targets", icon: TargetIcon },
		{ href: "/sales/settings", labelKey: "settings", icon: SettingsIcon },
	];

	return (
		<AppLayoutWithBranch navItems={salesNavItems} namespace="nav" role="sales">
			{children}
		</AppLayoutWithBranch>
	);
}
