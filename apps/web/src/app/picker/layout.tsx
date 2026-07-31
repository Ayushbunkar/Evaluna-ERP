"use client";

import {
	CheckCircleIcon,
	ClipboardListIcon,
	ClockIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	ListIcon,
	RotateCcwIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const pickerNavItems: NavItem[] = [
	{ href: "/picker", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/picker/pick-lists", labelKey: "pickLists", icon: ListIcon },
	{ href: "/picker/tasks", labelKey: "currentTask", icon: ClipboardListIcon },
	{ href: "/picker/completed", labelKey: "completed", icon: CheckCircleIcon },
	{ href: "/picker/pending", labelKey: "pending", icon: ClockIcon },
	{ href: "/picker/returns", labelKey: "returns", icon: RotateCcwIcon },
	{ href: "/picker/reports", labelKey: "reports", icon: FileTextIcon },
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
