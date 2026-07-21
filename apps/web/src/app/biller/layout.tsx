"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  ReceiptIcon,
  CreditCardIcon,
  HeartIcon,
  UsersIcon
} from "lucide-react";

const billerNavItems: NavItem[] = [
  { href: "/biller", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/biller/invoices", labelKey: "invoices", icon: ReceiptIcon },
  { href: "/biller/payments", labelKey: "payments", icon: CreditCardIcon },
  { href: "/biller/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/biller/loyalty", labelKey: "loyalty", icon: HeartIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={billerNavItems} namespace="nav">
      {children}
    </AppLayoutWithBranch>
  );
}
