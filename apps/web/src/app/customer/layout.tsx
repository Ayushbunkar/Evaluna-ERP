"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  ReceiptIcon,
  HeartIcon,
  GiftIcon,
  WalletIcon,
  MapPinIcon,
  RotateCcwIcon,
  HeadphonesIcon,
  UserIcon
} from "lucide-react";

const customerNavItems: NavItem[] = [
  { href: "/customer", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/customer/orders", labelKey: "orders", icon: ShoppingBagIcon },
  { href: "/customer/invoices", labelKey: "invoices", icon: ReceiptIcon },
  { href: "/customer/wishlist", labelKey: "wishlist", icon: HeartIcon },
  { href: "/customer/loyalty", labelKey: "loyaltyPoints", icon: GiftIcon },
  { href: "/customer/wallet", labelKey: "wallet", icon: WalletIcon },
  { href: "/customer/addresses", labelKey: "addresses", icon: MapPinIcon },
  { href: "/customer/returns", labelKey: "returns", icon: RotateCcwIcon },
  { href: "/customer/support", labelKey: "support", icon: HeadphonesIcon },
  { href: "/customer/profile", labelKey: "profile", icon: UserIcon }
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={customerNavItems} namespace="nav" role="customer">
      {children}
    </AppLayoutWithBranch>
  );
}
