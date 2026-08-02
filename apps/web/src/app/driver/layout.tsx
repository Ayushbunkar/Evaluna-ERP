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
	// Enforce a "mobile-like" max-width on desktop for the driver app experience
	return (
		<div className="min-h-screen bg-muted">
			<div className="relative mx-auto min-h-screen max-w-md overflow-hidden border-border/50 border-x bg-background shadow-2xl">
				<AppLayoutWithBranch navItems={driverNavItems} namespace="nav">
					{children}
				</AppLayoutWithBranch>
			</div>
		</div>
	);
}
