"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  DollarSignIcon,
  PackageIcon,
  UsersIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  ReceiptTextIcon,
  FileTextIcon,
  Building2Icon,
  ArrowLeftRightIcon,
  ClockIcon,
  BanknoteIcon,
  ShieldCheckIcon,
  HeartIcon,
  MegaphoneIcon,
} from "lucide-react";

const adminNavItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/cashier", labelKey: "cashier", icon: DollarSignIcon },
  { href: "/admin/products", labelKey: "products", icon: PackageIcon },
  { href: "/admin/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/admin/suppliers", labelKey: "suppliers", icon: UsersIcon },
  { href: "/admin/orders", labelKey: "orders", icon: ShoppingBagIcon },
  { href: "/admin/payment-methods", labelKey: "paymentMethods", icon: CreditCardIcon },
  { href: "/admin/pos", labelKey: "pos", icon: ShoppingCartIcon },
  { href: "/admin/purchases", labelKey: "purchases", icon: ShoppingBagIcon },
  { href: "/admin/purchase-returns", labelKey: "purchase-returns", icon: ReceiptTextIcon },
  { href: "/admin/cash-book", labelKey: "cashbook", icon: DollarSignIcon },
  { href: "/admin/reports", labelKey: "reports", icon: FileTextIcon },
  { href: "/admin/branches", labelKey: "branches", icon: Building2Icon },
  { href: "/admin/transfers", labelKey: "transfers", icon: ArrowLeftRightIcon },
  { href: "/admin/staff", labelKey: "staff", icon: UsersIcon },
  { href: "/admin/attendance", labelKey: "attendance", icon: ClockIcon },
  { href: "/admin/payroll", labelKey: "payroll", icon: BanknoteIcon },
  { href: "/admin/permissions", labelKey: "permissions", icon: ShieldCheckIcon },
  { href: "/admin/loyalty", labelKey: "loyalty", icon: HeartIcon },
  { href: "/admin/marketing", labelKey: "marketing", icon: MegaphoneIcon },
  { href: "/admin/expenses", labelKey: "expenses", icon: DollarSignIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={adminNavItems} namespace="nav">
      {children}
    </AppLayoutWithBranch>
  );
}
