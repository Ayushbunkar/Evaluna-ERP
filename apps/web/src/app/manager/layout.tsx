"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  PackageIcon,
  WarehouseIcon,
  CreditCardIcon,
  UsersIcon,
  ShoppingBagIcon,
  TruckIcon,
  BanknoteIcon,
  ClockIcon,
  FileTextIcon,
  WalletIcon,
  ReceiptIcon
} from "lucide-react";

const managerNavItems: NavItem[] = [
  { href: "/manager", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/manager/orders", labelKey: "orders", icon: ShoppingBagIcon },
  { href: "/manager/purchase-returns", labelKey: "purchaseReturns", icon: ReceiptIcon },
  { href: "/manager/warehouse", labelKey: "warehouse", icon: WarehouseIcon },
  { href: "/manager/inventory", labelKey: "inventory", icon: PackageIcon },
  { href: "/manager/billing", labelKey: "billing", icon: CreditCardIcon },
  { href: "/manager/delivery", labelKey: "delivery", icon: TruckIcon },
  { href: "/manager/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/manager/staff", labelKey: "staff", icon: UsersIcon },
  { href: "/manager/attendance", labelKey: "attendance", icon: ClockIcon },
  { href: "/manager/expenses", labelKey: "expenses", icon: ReceiptIcon },
  { href: "/manager/cash-book", labelKey: "cashbook", icon: WalletIcon },
  { href: "/manager/reports", labelKey: "reports", icon: FileTextIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={managerNavItems} namespace="nav" role="manager">
      {children}
    </AppLayoutWithBranch>
  );
}
