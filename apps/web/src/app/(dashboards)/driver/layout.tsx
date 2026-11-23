"use client";

import {
	Headphones,
	History,
	IndianRupee,
	LayoutDashboard,
	Navigation,
	QrCode,
	Truck,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const driverNavItems: NavItem[] = [
	{ href: "/driver", labelKey: "Dashboard", icon: LayoutDashboard },
	{ href: "/driver/van-stock", labelKey: "My Van Stock", icon: Truck },
	{ href: "/driver/route", labelKey: "Route Navigation", icon: Navigation },
	{
		href: "/driver/delivery",
		labelKey: "Live Delivery & Bill",
		icon: IndianRupee,
	},
	{
		href: "/driver/scanner",
		labelKey: "Scan Package / Bill",
		icon: QrCode,
	},
	{ href: "/driver/history", labelKey: "Delivery History", icon: History },
	{ href: "/driver/vehicle", labelKey: "Vehicle Status", icon: Truck },
	{ href: "/driver/support", labelKey: "Support & Dispatch", icon: Headphones },
];

export default function DriverLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={driverNavItems}
			namespace="nav"
			role="driver"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
