"use client";

import {
	AlertTriangleIcon,
	CheckCircleIcon,
	DownloadIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	PackagePlusIcon,
	RotateCcwIcon,
	XCircleIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const putterNavItems: NavItem[] = [
	{ href: "/putter", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/putter/receiving", labelKey: "receiving", icon: DownloadIcon },
	{ href: "/putter/put-away", labelKey: "putAway", icon: PackagePlusIcon },
	{
		href: "/putter/missing",
		labelKey: "missingStock",
		icon: AlertTriangleIcon,
	},
	{ href: "/putter/returns", labelKey: "saleReturn", icon: RotateCcwIcon },
	{ href: "/putter/damage", labelKey: "damageRaise", icon: XCircleIcon },
	{ href: "/putter/completed", labelKey: "completed", icon: CheckCircleIcon },
	{ href: "/putter/reports", labelKey: "reports", icon: FileTextIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={putterNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
