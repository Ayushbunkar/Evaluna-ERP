"use client";

import {
	BarChart,
	ClipboardCheck,
	Hourglass,
	LayoutDashboardIcon,
	PackageCheck,
	Target,
	Undo2,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const pickerNavItems: NavItem[] = [
	{ href: "/picker", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/picker/pick-lists", labelKey: "pickLists", icon: ClipboardCheck },
	{ href: "/picker/tasks", labelKey: "currentTask", icon: Target },
	{ href: "/picker/completed", labelKey: "completed", icon: PackageCheck },
	{ href: "/picker/pending", labelKey: "pending", icon: Hourglass },
	{ href: "/picker/returns", labelKey: "returns", icon: Undo2 },
	{ href: "/picker/reports", labelKey: "reports", icon: BarChart },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={pickerNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
