"use client";

import {
	BarChart3Icon,
	Building2Icon,
	DatabaseZapIcon,
	FileTextIcon,
	HardDriveIcon,
	LayoutDashboardIcon,
	SettingsIcon,
	ShieldCheckIcon,
	ShieldIcon,
	UsersIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const superAdminNavItems: NavItem[] = [
	{ href: "/superadmin", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/superadmin/branches", labelKey: "branches", icon: Building2Icon },
	{ href: "/superadmin/companies", labelKey: "companies", icon: Building2Icon },
	{ href: "/superadmin/users", labelKey: "users", icon: UsersIcon },
	{ href: "/superadmin/roles", labelKey: "roles", icon: ShieldCheckIcon },
	{
		href: "/superadmin/client-management",
		labelKey: "clientManagement",
		icon: ShieldIcon,
	},
	{
		href: "/superadmin/permissions",
		labelKey: "permissions",
		icon: ShieldCheckIcon,
	},
	{
		href: "/superadmin/master-data",
		labelKey: "Master Data",
		icon: DatabaseZapIcon,
	},
	{
		href: "/superadmin/dashboard-builder",
		labelKey: "Dashboard Builder",
		icon: LayoutDashboardIcon,
	},
	{
		href: "/superadmin/health",
		labelKey: "systemHealth",
		icon: DatabaseZapIcon,
	},
	{ href: "/superadmin/audit-logs", labelKey: "auditLogs", icon: FileTextIcon },
	{ href: "/superadmin/backups", labelKey: "backups", icon: HardDriveIcon },
	{
		href: "/superadmin/monitoring",
		labelKey: "monitoring",
		icon: BarChart3Icon,
	},
	{ href: "/superadmin/settings", labelKey: "settings", icon: SettingsIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={superAdminNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
