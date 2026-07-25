"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  Building2Icon,
  UsersIcon,
  ShieldCheckIcon,
  LineChartIcon,
  LifeBuoyIcon,
  DatabaseZapIcon,
  KeyIcon,
  SettingsIcon,
  HardDriveIcon,
  CreditCardIcon,
  FileTextIcon
} from "lucide-react";

const superAdminNavItems: NavItem[] = [
  { href: "/superadmin", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/superadmin/companies", labelKey: "companies", icon: Building2Icon },
  { href: "/superadmin/billing", labelKey: "billing", icon: CreditCardIcon },
  { href: "/superadmin/users", labelKey: "users", icon: UsersIcon },
  { href: "/superadmin/roles", labelKey: "roles", icon: ShieldCheckIcon },
  { href: "/superadmin/permissions", labelKey: "permissions", icon: KeyIcon },
  { href: "/superadmin/analytics", labelKey: "analytics", icon: LineChartIcon },
  { href: "/superadmin/health", labelKey: "systemHealth", icon: DatabaseZapIcon },
  { href: "/superadmin/support", labelKey: "support", icon: LifeBuoyIcon },
  { href: "/superadmin/audit-logs", labelKey: "auditLogs", icon: FileTextIcon },
  { href: "/superadmin/api-keys", labelKey: "apiKeys", icon: KeyIcon },
  { href: "/superadmin/backups", labelKey: "backups", icon: HardDriveIcon },
  { href: "/superadmin/settings", labelKey: "globalSettings", icon: SettingsIcon },
];

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={superAdminNavItems} namespace="nav" role="admin">
      {/* We use role='admin' to keep the styling similar for now, or 'superadmin' if we add styles for it later */}
      {children}
    </AppLayoutWithBranch>
  );
}
