"use client";

import {
	BanknoteIcon,
	CarIcon,
	FileSignatureIcon,
	LayoutDashboardIcon,
	MapIcon,
	MapPinIcon,
	MessageSquareIcon,
	PackageCheckIcon,
	RadioIcon,
	SettingsIcon,
	TrendingUpIcon,
	UndoIcon,
	UserCheckIcon,
	XCircleIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const deliveryNavItems: NavItem[] = [
	{ href: "/delivery", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{
		href: "/delivery/todays-deliveries",
		labelKey: "todaysDeliveries",
		icon: PackageCheckIcon,
	},
	{ href: "/delivery/assign", labelKey: "assignOrders", icon: MapPinIcon },
	{ href: "/delivery/drivers", labelKey: "drivers", icon: UserCheckIcon },
	{ href: "/delivery/vehicles", labelKey: "vehicles", icon: CarIcon },
	{ href: "/delivery/routes", labelKey: "routes", icon: MapIcon },
	{ href: "/delivery/live", labelKey: "liveTracking", icon: RadioIcon },
	{ href: "/delivery/failed", labelKey: "failedDeliveries", icon: XCircleIcon },
	{ href: "/delivery/returned", labelKey: "returnedOrders", icon: UndoIcon },
	{ href: "/delivery/cash", labelKey: "cashCollection", icon: BanknoteIcon },
	{
		href: "/delivery/pod",
		labelKey: "proofOfDelivery",
		icon: FileSignatureIcon,
	},
	{
		href: "/delivery/feedback",
		labelKey: "customerFeedback",
		icon: MessageSquareIcon,
	},
	{
		href: "/delivery/performance",
		labelKey: "performance",
		icon: TrendingUpIcon,
	},
	{ href: "/delivery/settings", labelKey: "settings", icon: SettingsIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={deliveryNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
