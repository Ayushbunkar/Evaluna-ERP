"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  FileCheckIcon,
  ReceiptIcon,
  BanknoteIcon,
  RotateCcwIcon,
  PackageIcon,
  HeadphonesIcon
} from "lucide-react";

const supplierNavItems: NavItem[] = [
  { href: "/supplier", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/supplier/purchase-orders", labelKey: "purchaseOrders", icon: ShoppingCartIcon },
  { href: "/supplier/grn", labelKey: "grn", icon: FileCheckIcon },
  { href: "/supplier/invoices", labelKey: "invoices", icon: ReceiptIcon },
  { href: "/supplier/payments", labelKey: "payments", icon: BanknoteIcon },
  { href: "/supplier/returns", labelKey: "returns", icon: RotateCcwIcon },
  { href: "/supplier/products", labelKey: "products", icon: PackageIcon },
  { href: "/supplier/support", labelKey: "support", icon: HeadphonesIcon }
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={supplierNavItems} namespace="nav" role="supplier">
      {children}
    </AppLayoutWithBranch>
  );
}
