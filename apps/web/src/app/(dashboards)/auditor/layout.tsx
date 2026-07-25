"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  ClipboardCheckIcon,
  AlertTriangleIcon,
  FileCheckIcon,
  CheckSquareIcon,
  BellIcon,
  FileTextIcon
} from "lucide-react";

const auditorNavItems: NavItem[] = [
  { href: "/auditor", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/auditor/audits", labelKey: "audits", icon: ClipboardCheckIcon },
  { href: "/auditor/discrepancies", labelKey: "discrepancies", icon: AlertTriangleIcon },
  { href: "/auditor/verifications", labelKey: "verifications", icon: FileCheckIcon },
  { href: "/auditor/approvals", labelKey: "approvals", icon: CheckSquareIcon },
  { href: "/auditor/reports", labelKey: "reports", icon: FileTextIcon },
  { href: "/auditor/notifications", labelKey: "notifications", icon: BellIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={auditorNavItems} namespace="nav" role="auditor">
      {children}
    </AppLayoutWithBranch>
  );
}