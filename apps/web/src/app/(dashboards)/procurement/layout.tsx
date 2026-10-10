"use client";

import {
	BarChart3Icon,
	ClipboardListIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	ReceiptIcon,
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
		labelKey: "Dashboard",
		icon: LayoutDashboardIcon,
	},
	{
		href: "/procurement/requests",
		labelKey: "Purchase Requests",
		icon: FileTextIcon,
	},
	{
		href: "/procurement/purchase-orders",
		labelKey: "Purchase Orders",
		icon: ClipboardListIcon,
	},
	{
		href: "/procurement/invoices",
		labelKey: "Supplier Invoices",
		icon: ReceiptIcon,
	},
	{
		href: "/procurement/suppliers",
		labelKey: "Suppliers",
		icon: UsersIcon,
	},
	{
		href: "/procurement/incoming",
		labelKey: "Warehouse Receiving",
		icon: TruckIcon,
	},
	{
		href: "/procurement/analytics",
		labelKey: "Analytics",
		icon: BarChart3Icon,
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
