"use client";

import {
	Building2,
	CreditCard,
	LayoutDashboard,
	Settings,
	Users,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const superadminNavItems: NavItem[] = [
	{ href: "/superadmin", labelKey: "dashboard", icon: LayoutDashboard },
	{ href: "/superadmin/companies", labelKey: "companies", icon: Building2 },
	{ href: "/superadmin/users", labelKey: "users", icon: Users },
	{ href: "/superadmin/billing", labelKey: "billing", icon: CreditCard },
	{ href: "/superadmin/settings", labelKey: "settings", icon: Settings },
];

export default function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={superadminNavItems}
			namespace="nav"
			role="superadmin"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
