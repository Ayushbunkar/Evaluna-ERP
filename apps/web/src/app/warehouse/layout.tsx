"use client";

import {
	ArrowLeftRightIcon,
	ClipboardCheckIcon,
	DownloadIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	MapIcon,
	PackageOpenIcon,
	PackageSearchIcon,
	RotateCcwIcon,
	ShieldAlertIcon,
	TimerIcon,
	UploadIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const warehouseNavItems: NavItem[] = [
	{
		href: "/warehouse",
		labelKey: "warehouseOverview",
		icon: LayoutDashboardIcon,
	},
	{ href: "/warehouse/receiving", labelKey: "receiving", icon: DownloadIcon },
	{ href: "/warehouse/putaway", labelKey: "putAway", icon: UploadIcon },
	{ href: "/warehouse/picking", labelKey: "picking", icon: PackageSearchIcon },
	{ href: "/warehouse/packing", labelKey: "packing", icon: PackageOpenIcon },
	{
		href: "/warehouse/transfers",
		labelKey: "transfers",
		icon: ArrowLeftRightIcon,
	},
	{ href: "/warehouse/audits", labelKey: "audits", icon: ClipboardCheckIcon },
	{ href: "/warehouse/returns", labelKey: "returns", icon: RotateCcwIcon },
	{ href: "/warehouse/damage", labelKey: "damage", icon: ShieldAlertIcon },
	{ href: "/warehouse/expiry", labelKey: "expiry", icon: TimerIcon },
	{ href: "/warehouse/locations", labelKey: "locations", icon: MapIcon },
	{ href: "/warehouse/reports", labelKey: "reports", icon: FileTextIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={warehouseNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
