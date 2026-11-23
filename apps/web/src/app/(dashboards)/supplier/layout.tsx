"use client";

import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	User,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const supplierNavItems: NavItem[] = [
	{
		href: "/supplier/dashboard",
		labelKey: "Dashboard",
		icon: LayoutDashboard,
	},
	{ href: "/supplier/products", labelKey: "Products", icon: Package },
	{ href: "/supplier/orders", labelKey: "Orders", icon: ShoppingCart },
	{ href: "/supplier/profile", labelKey: "Profile", icon: User },
];

export default function SupplierLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={supplierNavItems}
			namespace="nav"
			role="supplier"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
