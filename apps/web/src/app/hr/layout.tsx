"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarIcon,
  CalendarOffIcon,
  BanknoteIcon,
  CreditCardIcon,
  TrendingUpIcon,
  UserPlusIcon,
  FileTextIcon
} from "lucide-react";

const hrNavItems: NavItem[] = [
  { href: "/hr", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/hr/employees", labelKey: "employees", icon: UsersIcon },
  { href: "/hr/attendance", labelKey: "attendance", icon: CalendarIcon },
  { href: "/hr/leave", labelKey: "leave", icon: CalendarOffIcon },
  { href: "/hr/salary", labelKey: "salary", icon: BanknoteIcon },
  { href: "/hr/payroll", labelKey: "payroll", icon: CreditCardIcon },
  { href: "/hr/performance", labelKey: "performance", icon: TrendingUpIcon },
  { href: "/hr/recruitment", labelKey: "recruitment", icon: UserPlusIcon },
  { href: "/hr/reports", labelKey: "reports", icon: FileTextIcon }
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={hrNavItems} namespace="nav" role="hr">
      {children}
    </AppLayoutWithBranch>
  );
}
