"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  ListTodoIcon,
  PackageCheckIcon,
  AlertOctagonIcon
} from "lucide-react";

const pickerNavItems: NavItem[] = [
  { href: "/picker", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/picker/pick-lists", labelKey: "pick-lists", icon: ListTodoIcon },
  { href: "/picker/orders", labelKey: "orders", icon: PackageCheckIcon },
  { href: "/picker/exceptions", labelKey: "exceptions", icon: AlertOctagonIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={pickerNavItems} namespace="nav" role="picker">
      {children}
    </AppLayoutWithBranch>
  );
}