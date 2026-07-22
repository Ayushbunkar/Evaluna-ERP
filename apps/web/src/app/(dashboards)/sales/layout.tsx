"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  UsersIcon,
  ShoppingBagIcon,
  ReceiptTextIcon,
  DollarSignIcon
} from "lucide-react";

const salesNavItems: NavItem[] = [
  { href: "/sales", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/sales/pos", labelKey: "pos", icon: ShoppingCartIcon },
  { href: "/sales/orders", labelKey: "orders", icon: ShoppingBagIcon },
  { href: "/sales/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/sales/returns", labelKey: "purchase-returns", icon: ReceiptTextIcon },
  { href: "/sales/cashbook", labelKey: "cashbook", icon: DollarSignIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={salesNavItems} namespace="nav" role="sales">
      {children}
    </AppLayoutWithBranch>
  );
}