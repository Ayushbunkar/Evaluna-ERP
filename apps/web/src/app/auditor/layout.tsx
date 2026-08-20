"use client";

import {
	BellIcon,
	ClipboardListIcon,
	FileSearchIcon,
	HistoryIcon,
	LayoutDashboardIcon,
	MapPinnedIcon,
	PackageCheckIcon,
	ScanBarcodeIcon,
	TagIcon,
	TruckIcon,
	WarehouseIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const auditorNavItems: NavItem[] = [
	{ href: "/auditor", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{
		href: "/auditor/receiving",
		labelKey: "receivingInspection",
		icon: PackageCheckIcon,
	},
	{ href: "/auditor/upc", labelKey: "upc", icon: ScanBarcodeIcon },
	{
		href: "/auditor/inventory-audit",
		labelKey: "inventoryAudit",
		icon: WarehouseIcon,
	},
	{ href: "/auditor/placement", labelKey: "placement", icon: MapPinnedIcon },
	{ href: "/auditor/findings", labelKey: "findings", icon: FileSearchIcon },
	{ href: "/auditor/price-audit", labelKey: "priceAudit", icon: TagIcon },
	{ href: "/auditor/route-audit", labelKey: "routeAudit", icon: TruckIcon },
	{ href: "/auditor/tasks", labelKey: "tasks", icon: ClipboardListIcon },
	{
		href: "/auditor/notifications",
		labelKey: "notifications",
		icon: BellIcon,
	},
	{ href: "/auditor/audit-logs", labelKey: "auditLogs", icon: HistoryIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={auditorNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
