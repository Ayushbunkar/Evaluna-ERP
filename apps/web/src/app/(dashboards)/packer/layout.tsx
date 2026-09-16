"use client";

import {
	ArchiveIcon,
	FileBarChartIcon,
	LayoutDashboardIcon,
	PackageIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const packerNavItems: NavItem[] = [
	{ href: "/packer", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/packer/pending", labelKey: "pendingPacking", icon: PackageIcon },
	{ href: "/packer/history", labelKey: "packingHistory", icon: ArchiveIcon },
	{ href: "/packer/reports", labelKey: "reports", icon: FileBarChartIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch
			navItems={packerNavItems}
			namespace="nav"
			role="packer"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
