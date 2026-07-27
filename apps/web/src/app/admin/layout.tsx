"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  Building2Icon,
  PackageIcon,
  WarehouseIcon,
  CreditCardIcon,
  UsersIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ReceiptTextIcon,
  TruckIcon,
  LandmarkIcon,
  BanknoteIcon,
  ClockIcon,
  FileTextIcon,
  SettingsIcon,
  WalletIcon,
  BarChart3Icon,
  RotateCcwIcon,
  UserCheckIcon,
} from "lucide-react";

const companyAdminNavItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/branches", labelKey: "branches", icon: Building2Icon },
  { href: "/admin/inventory", labelKey: "inventory", icon: PackageIcon },
  { href: "/admin/warehouse", labelKey: "warehouse", icon: WarehouseIcon },
  { href: "/admin/sales", labelKey: "sales", icon: ShoppingCartIcon },
  { href: "/admin/billing", labelKey: "billing", icon: CreditCardIcon },
  { href: "/admin/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/admin/suppliers", labelKey: "suppliers", icon: UserCheckIcon },
  { href: "/admin/purchases", labelKey: "purchases", icon: ShoppingBagIcon },
  { href: "/admin/purchase-returns", labelKey: "purchaseReturns", icon: RotateCcwIcon },
  { href: "/admin/delivery", labelKey: "delivery", icon: TruckIcon },
  { href: "/admin/finance", labelKey: "finance", icon: LandmarkIcon },
  { href: "/admin/cash-book", labelKey: "cashbook", icon: WalletIcon },
  { href: "/admin/expenses", labelKey: "expenses", icon: ReceiptTextIcon },
  { href: "/admin/staff", labelKey: "staff", icon: UsersIcon },
  { href: "/admin/attendance", labelKey: "attendance", icon: ClockIcon },
  { href: "/admin/payroll", labelKey: "payroll", icon: BanknoteIcon },
  { href: "/admin/salary", labelKey: "salary", icon: BanknoteIcon },
  { href: "/admin/reports", labelKey: "reports", icon: FileTextIcon },
  { href: "/admin/monitoring", labelKey: "monitoring", icon: BarChart3Icon },
  { href: "/admin/settings", labelKey: "settings", icon: SettingsIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={companyAdminNavItems} namespace="nav" role="admin">
      {children}
    </AppLayoutWithBranch>
  );
}
