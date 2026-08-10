"use client";

import {
	BarChart,
	ClipboardCheck,
	LayoutDashboardIcon,
	ShieldCheck,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const checkerNavItems: NavItem[] = [
	{ href: "/checker", labelKey: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/checker/verify", labelKey: "Verify Packages", icon: ShieldCheck },
	{
		href: "/checker/history",
		labelKey: "Checking History",
		icon: ClipboardCheck,
	},
	{ href: "/checker/reports", labelKey: "Reports", icon: BarChart },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={checkerNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
