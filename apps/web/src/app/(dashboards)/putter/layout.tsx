"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  PackageOpenIcon,
  MapPinIcon,
  ArrowDownToLineIcon
} from "lucide-react";

const putterNavItems: NavItem[] = [
  { href: "/putter", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/putter/receiving", labelKey: "receiving", icon: PackageOpenIcon },
  { href: "/putter/putaways", labelKey: "putaways", icon: ArrowDownToLineIcon },
  { href: "/putter/locations", labelKey: "locations", icon: MapPinIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={putterNavItems} namespace="nav" role="putter">
      {children}
    </AppLayoutWithBranch>
  );
}