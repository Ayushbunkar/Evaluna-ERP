"use client";

import {
	CreditCardIcon,
	LayoutDashboardIcon,
	PackageIcon,
	ShoppingBagIcon,
	UserIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const customerNavItems: NavItem[] = [
	{ href: "/customer", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{
		href: "/customer/products",
		labelKey: "productsPlaceOrder",
		icon: PackageIcon,
	},
	{ href: "/customer/orders", labelKey: "orders", icon: ShoppingBagIcon },
	{ href: "/customer/payments", labelKey: "payments", icon: CreditCardIcon },
	{ href: "/customer/profile", labelKey: "customerProfile", icon: UserIcon },
];

export default function CustomerLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch
			navItems={customerNavItems}
			namespace="nav"
			role="customer"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
