"use client";

import {
	BarChart3Icon,
	LayoutDashboardIcon,
	TruckIcon,
	UsersIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";
import { useTRPC } from "@/lib/trpc/client";

export default function ProcurementLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const trpc = useTRPC();

	const { data: pos } = trpc.warehouse.getReceivingPOs.useQuery();
	const { data: suppliersList } = trpc.suppliers.list.useQuery();

	const pendingPOsCount = pos?.filter((p: any) => p.status === "pending").length;

	const procurementNavItems: NavItem[] = [
		{
			href: "/dashboard/procurement",
			labelKey: "Dashboard",
			icon: LayoutDashboardIcon,
		},
		{
			href: "/dashboard/procurement/suppliers",
			labelKey: "Suppliers",
			icon: UsersIcon,
			badge: suppliersList?.length,
		},
		{
			href: "/dashboard/procurement/purchase-orders",
			labelKey: "Purchase Orders",
			icon: TruckIcon,
			badge: pendingPOsCount,
		},
		{
			href: "/dashboard/procurement/analytics",
			labelKey: "Analytics",
			icon: BarChart3Icon,
		},
	];

	return (
		<AppLayoutWithBranch
			navItems={procurementNavItems}
			namespace="nav"
			role="procurement"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
