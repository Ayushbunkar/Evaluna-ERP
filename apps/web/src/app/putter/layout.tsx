"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  PackagePlusIcon,
  BoxIcon,
  AlertTriangleIcon
} from "lucide-react";

const putterNavItems: NavItem[] = [
  { href: "/putter", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/putter/receiving", labelKey: "receiving", icon: PackagePlusIcon },
  { href: "/putter/putaway", labelKey: "putaway", icon: BoxIcon },
  { href: "/putter/damages", labelKey: "damages", icon: AlertTriangleIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={putterNavItems} namespace="nav">
      {children}
    </AppLayoutWithBranch>
  );
}
