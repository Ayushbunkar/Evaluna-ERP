"use client";

import {
	BanknoteIcon,
	HeadphonesIcon,
	HistoryIcon,
	KeyRoundIcon,
	LayoutDashboardIcon,
	MapIcon,
	NavigationIcon,
	PackageCheckIcon,
	QrCodeIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const driverNavItems: NavItem[] = [
	{ href: "/driver", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/driver/map", labelKey: "liveTracking", icon: MapIcon },
	/* 
	TODO: Pages not built yet
	{
		href: "/driver/assigned",
		labelKey: "assignedOrders",
		icon: PackageCheckIcon,
	},
	{ href: "/driver/route", labelKey: "todaysRoute", icon: MapIcon },
	{ href: "/driver/navigation", labelKey: "navigation", icon: NavigationIcon },
	{ href: "/driver/scan", labelKey: "scanQR", icon: QrCodeIcon },
	{ href: "/driver/otp", labelKey: "otpVerification", icon: KeyRoundIcon },
	{ href: "/driver/cash", labelKey: "cashCollection", icon: BanknoteIcon },
	{ href: "/driver/history", labelKey: "deliveryHistory", icon: HistoryIcon },
	{ href: "/driver/support", labelKey: "support", icon: HeadphonesIcon },
	*/
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={driverNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
