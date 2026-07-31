"use client";

import {
	BanIcon,
	ClipboardListIcon,
	ClockIcon,
	FileTextIcon,
	HistoryIcon,
	LayoutDashboardIcon,
	PackageXIcon,
	RotateCwIcon,
	SearchXIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const auditorNavItems: NavItem[] = [
	{ href: "/auditor", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{
		href: "/auditor/pending",
		labelKey: "pendingAudits",
		icon: ClipboardListIcon,
	},
	{ href: "/auditor/cycle-count", labelKey: "cycleCount", icon: RotateCwIcon },
	{ href: "/auditor/damage", labelKey: "damage", icon: PackageXIcon },
	{ href: "/auditor/expiry", labelKey: "expiry", icon: ClockIcon },
	{ href: "/auditor/missing", labelKey: "missingProducts", icon: SearchXIcon },
	{ href: "/auditor/pna", labelKey: "pna", icon: BanIcon },
	{ href: "/auditor/history", labelKey: "auditHistory", icon: HistoryIcon },
	{ href: "/auditor/reports", labelKey: "reports", icon: FileTextIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={auditorNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
