"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  PackageCheckIcon,
  ArrowRightLeftIcon,
  ListIcon
} from "lucide-react";

const pickerNavItems: NavItem[] = [
  { href: "/picker", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/picker/pick-lists", labelKey: "pickLists", icon: ListIcon },
  { href: "/picker/dispatch", labelKey: "dispatch", icon: PackageCheckIcon },
  { href: "/picker/transfers", labelKey: "transfers", icon: ArrowRightLeftIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={pickerNavItems} namespace="nav">
      {children}
    </AppLayoutWithBranch>
  );
}
