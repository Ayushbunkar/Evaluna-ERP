"use client";

import {
	ArchiveIcon,
	LayoutDashboardIcon,
	TruckIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const loaderNavItems: NavItem[] = [
	{ href: "/loader", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/loader/loading", labelKey: "loadingQueue", icon: TruckIcon },
	{ href: "/loader/history", labelKey: "loadingHistory", icon: ArchiveIcon },
];

export default function LoaderLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch
			navItems={loaderNavItems}
			namespace="nav"
			role="loader"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
