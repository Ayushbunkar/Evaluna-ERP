"use client";

import {
	ImageIcon,
	IndianRupee,
	LayoutDashboard,
	MapPin,
	Settings,
	Truck,
	Users,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const adminNavItems: NavItem[] = [
	{ href: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
	{ href: "/admin/products", labelKey: "Product Images", icon: ImageIcon },
	{ href: "/admin/employees", labelKey: "employees", icon: Users },
	{ href: "/admin/finance", labelKey: "finance", icon: IndianRupee },
	{ href: "/admin/users", labelKey: "users", icon: Users },
	{ href: "/admin/suppliers", labelKey: "suppliers", icon: Truck },
	{ href: "/admin/customers", labelKey: "customers", icon: Users },
	{ href: "/admin/branches", labelKey: "branches", icon: MapPin },
	{ href: "/admin/settings", labelKey: "settings", icon: Settings },
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={adminNavItems}
			namespace="nav"
			role="admin"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
