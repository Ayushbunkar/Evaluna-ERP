"use client";

import {
	BarChart,
	Box,
	LayoutDashboardIcon,
	PackageSearch,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const packerNavItems: NavItem[] = [
	{ href: "/packer", labelKey: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/packer/pack", labelKey: "Pack Items", icon: Box },
	{ href: "/packer/history", labelKey: "Packing History", icon: PackageSearch },
	{ href: "/packer/reports", labelKey: "Reports", icon: BarChart },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={packerNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
