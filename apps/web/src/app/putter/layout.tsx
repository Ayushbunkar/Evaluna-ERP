"use client";

import {
	AlertTriangleIcon,
	CheckCircleIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	PackagePlusIcon,
	RotateCcwIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const putterNavItems: NavItem[] = [
	{ href: "/putter", labelKey: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/putter/tasks", labelKey: "Put Away Tasks", icon: PackagePlusIcon },
	{ href: "/putter/completed", labelKey: "Completed", icon: CheckCircleIcon },
	{ href: "/putter/exceptions", labelKey: "Exceptions", icon: AlertTriangleIcon },
	{ href: "/putter/returns", labelKey: "Returns", icon: RotateCcwIcon },
	{ href: "/putter/reports", labelKey: "Reports", icon: FileTextIcon },
];

export default function PutterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={putterNavItems}
			namespace="nav"
			role="putter"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
