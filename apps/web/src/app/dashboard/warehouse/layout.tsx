"use client";

import {
	AlertTriangleIcon,
	BarChart3Icon,
	BoxesIcon,
	CheckSquareIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	LayersIcon,
	PackageIcon,
	QrCodeIcon,
	TagIcon,
	TruckIcon,
	UsersIcon,
	WarehouseIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";
import { useTRPC } from "@/lib/trpc/client";

export default function WarehouseWMSLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const trpc = useTRPC();

	// Dynamic stats for live queues
	const { data: stats } = trpc.warehouse.getOverviewStats.useQuery(
		{},
		{
			refetchInterval: 120000,
			refetchIntervalInBackground: false,
			refetchOnWindowFocus: false,
		},
	);

	const warehouseNavItems: NavItem[] = [
		{
			href: "/dashboard/warehouse",
			labelKey: "Dashboard",
			icon: WarehouseIcon,
		},
		{
			href: "/dashboard/warehouse/stock",
			labelKey: "Warehouse Stock",
			icon: BoxesIcon,
		},
		{
			href: "/dashboard/warehouse/receiving",
			labelKey: "Receiving",
			icon: TruckIcon,
			badge: stats?.receivingQueue,
		},
		{
			href: "/dashboard/warehouse/tasks",
			labelKey: "All Tasks",
			icon: ClipboardListIcon,
			badge: stats?.delayedTasks,
		},
		{
			href: "/dashboard/warehouse/put-away",
			labelKey: "Put-Away",
			icon: BoxesIcon,
			badge: stats?.putAwayQueue,
		},
		{
			href: "/dashboard/warehouse/picking",
			labelKey: "Picking Queue",
			icon: CheckSquareIcon,
			badge: stats?.pickingQueue,
		},
		{
			href: "/dashboard/warehouse/packing",
			labelKey: "Packing Queue",
			icon: PackageIcon,
			badge: stats?.packingQueue,
		},
		{
			href: "/dashboard/warehouse/batches",
			labelKey: "Batches & Expiry (FEFO)",
			icon: LayersIcon,
		},
		{
			href: "/dashboard/warehouse/discounts",
			labelKey: "Discount Offers",
			icon: TagIcon,
		},
		{
			href: "/dashboard/warehouse/upc-generator",
			labelKey: "UPC Generator",
			icon: QrCodeIcon,
		},
		{
			href: "/dashboard/warehouse/inspections",
			labelKey: "Inspections",
			icon: ClipboardListIcon,
		},
		{
			href: "/dashboard/warehouse/exceptions",
			labelKey: "Exceptions",
			icon: AlertTriangleIcon,
			badge: stats?.delayedTasks,
		},
		{
			href: "/dashboard/warehouse/audit-assignments",
			labelKey: "Audit Assignments",
			icon: ClipboardCheckIcon,
		},
		{
			href: "/dashboard/warehouse/my-audits",
			labelKey: "My Count Tasks",
			icon: CheckSquareIcon,
		},
		{
			href: "/dashboard/warehouse/reports",
			labelKey: "Variance & Loss Reports",
			icon: BarChart3Icon,
		},
		{
			href: "/dashboard/warehouse/workforce",
			labelKey: "Operators",
			icon: UsersIcon,
		},
		{
			href: "/dashboard/warehouse/analytics",
			labelKey: "WMS Analytics",
			icon: BarChart3Icon,
		},
	];

	return (
		<AppLayoutWithBranch
			navItems={warehouseNavItems}
			namespace="nav"
			role="warehouse_manager"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
