"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  SearchIcon,
  FileTextIcon,
  ActivityIcon,
  ShieldAlertIcon
} from "lucide-react";

const auditorNavItems: NavItem[] = [
  { href: "/auditor", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/auditor/inventory", labelKey: "inventory", icon: SearchIcon },
  { href: "/auditor/reports", labelKey: "reports", icon: FileTextIcon },
  { href: "/auditor/discrepancies", labelKey: "monitoring", icon: ShieldAlertIcon },
  { href: "/auditor/logs", labelKey: "activity", icon: ActivityIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={auditorNavItems} namespace="nav">
      {children}
    </AppLayoutWithBranch>
  );
}
