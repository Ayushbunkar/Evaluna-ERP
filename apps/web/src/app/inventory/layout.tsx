"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  PackageIcon,
  TagsIcon,
  TagIcon,
  LayersIcon,
  BoxesIcon,
  TimerIcon,
  AlertTriangleIcon,
  ArrowLeftRightIcon,
  BarcodeIcon,
  Settings2Icon,
  FileTextIcon
} from "lucide-react";

const inventoryNavItems: NavItem[] = [
  { href: "/inventory", labelKey: "inventoryOverview", icon: PackageIcon },
  { href: "/inventory/categories", labelKey: "categories", icon: TagsIcon },
  { href: "/inventory/brands", labelKey: "brands", icon: TagIcon },
  { href: "/inventory/batches", labelKey: "batches", icon: LayersIcon },
  { href: "/inventory/stock", labelKey: "stock", icon: BoxesIcon },
  { href: "/inventory/expiry", labelKey: "expiry", icon: TimerIcon },
  { href: "/inventory/low-stock", labelKey: "lowStock", icon: AlertTriangleIcon },
  { href: "/inventory/transfers", labelKey: "transfers", icon: ArrowLeftRightIcon },
  { href: "/inventory/barcode", labelKey: "barcode", icon: BarcodeIcon },
  { href: "/inventory/adjustments", labelKey: "adjustments", icon: Settings2Icon },
  { href: "/inventory/reports", labelKey: "reports", icon: FileTextIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={inventoryNavItems} namespace="nav" role="inventory">
      {children}
    </AppLayoutWithBranch>
  );
}
