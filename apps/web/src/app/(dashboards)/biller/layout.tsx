"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  ReceiptIcon,
  UsersIcon,
  TagIcon,
  CreditCardIcon,
  UndoIcon,
  ShoppingCartIcon
} from "lucide-react";

const billerNavItems: NavItem[] = [
  { href: "/biller", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/biller/pos", labelKey: "pos", icon: ShoppingCartIcon },
  { href: "/biller/billing", labelKey: "billing", icon: ReceiptIcon },
  { href: "/biller/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/biller/discounts", labelKey: "discounts", icon: TagIcon },
  { href: "/biller/payments", labelKey: "payments", icon: CreditCardIcon },
  { href: "/biller/returns", labelKey: "returns", icon: UndoIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={billerNavItems} namespace="nav" role="biller">
      {children}
    </AppLayoutWithBranch>
  );
}