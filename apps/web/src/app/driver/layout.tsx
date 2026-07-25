"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  PackageCheckIcon,
  MapIcon,
  NavigationIcon,
  QrCodeIcon,
  KeyRoundIcon,
  BanknoteIcon,
  HistoryIcon,
  HeadphonesIcon
} from "lucide-react";

const driverNavItems: NavItem[] = [
  { href: "/driver", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/driver/assigned", labelKey: "assignedOrders", icon: PackageCheckIcon },
  { href: "/driver/route", labelKey: "todaysRoute", icon: MapIcon },
  { href: "/driver/navigation", labelKey: "navigation", icon: NavigationIcon },
  { href: "/driver/scan", labelKey: "scanQR", icon: QrCodeIcon },
  { href: "/driver/otp", labelKey: "otpVerification", icon: KeyRoundIcon },
  { href: "/driver/cash", labelKey: "cashCollection", icon: BanknoteIcon },
  { href: "/driver/history", labelKey: "deliveryHistory", icon: HistoryIcon },
  { href: "/driver/support", labelKey: "support", icon: HeadphonesIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Enforce a "mobile-like" max-width on desktop for the driver app experience
  return (
    <div className="bg-muted min-h-screen">
      <div className="max-w-md mx-auto bg-background min-h-screen shadow-2xl relative overflow-hidden border-x border-border/50">
        <AppLayoutWithBranch navItems={driverNavItems} namespace="nav" role="driver">
          {children}
        </AppLayoutWithBranch>
      </div>
    </div>
  );
}
