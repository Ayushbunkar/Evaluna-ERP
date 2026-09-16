"use client";

import {
	CheckSquareIcon,
	ClockIcon,
	FileBarChartIcon,
	LayoutDashboardIcon,
	PlaySquareIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const pickerNavItems: NavItem[] = [
	{ href: "/picker", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/picker/pending", labelKey: "pendingPicks", icon: ClockIcon },
	{ href: "/picker/active", labelKey: "activePicks", icon: PlaySquareIcon },
	{ href: "/picker/completed", labelKey: "completedPicks", icon: CheckSquareIcon },
	{ href: "/picker/reports", labelKey: "reports", icon: FileBarChartIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch
			navItems={pickerNavItems}
			namespace="nav"
			role="picker"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
