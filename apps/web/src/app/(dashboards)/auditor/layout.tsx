"use client";

import {
	ActivityIcon,
	BarChart3,
	Barcode,
	BookOpen,
	CheckSquare,
	ClipboardList,
	History,
	LayoutDashboard,
	Settings,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const auditorNavItems: NavItem[] = [
	{ href: "/auditor", labelKey: "Dashboard", icon: LayoutDashboard },
	{ href: "/auditor/tasks", labelKey: "Stock Audits", icon: ClipboardList },
	{ href: "/auditor/findings", labelKey: "Findings", icon: CheckSquare },
	{ href: "/auditor/upc", labelKey: "UPC Verification", icon: Barcode },
	{ href: "/auditor/receiving", labelKey: "Receiving", icon: BookOpen },
	{ href: "/auditor/placement", labelKey: "Placement", icon: ActivityIcon },
	{ href: "/auditor/history", labelKey: "Audit History", icon: History },
	{ href: "/auditor/reports", labelKey: "Reports", icon: BarChart3 },
	{ href: "/auditor/settings", labelKey: "Settings", icon: Settings },
];

export default function AuditorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={auditorNavItems}
			namespace="nav"
			role="auditor"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
