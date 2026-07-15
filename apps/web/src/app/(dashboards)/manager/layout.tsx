"use client";

import { Shell } from "@/components/shared/layouts/shell";
import { type NavigationItem } from "@/components/shared/layouts/sidebar-base";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  Boxes,
  Briefcase,
  Wallet,
  CreditCard,
  FileText,
  Bell,
  LineChart,
  Truck
} from "lucide-react";

const MANAGER_NAVIGATION: NavigationItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { name: "Overview", href: "/manager" },
      { name: "Daily Sales", href: "/manager/sales" },
      { name: "Notifications", href: "/manager/notifications" },
    ],
  },
  {
    name: "Operations",
    icon: ShoppingCart,
    items: [
      { name: "Quick Billing", href: "/manager/billing" },
      { name: "Orders", href: "/manager/orders" },
      { name: "Cash Book", href: "/manager/cashbook" },
      { name: "Expenses", href: "/manager/expenses" },
    ],
  },
  {
    name: "Inventory",
    icon: Package,
    items: [
      { name: "Stock Management", href: "/manager/inventory" },
      { name: "Warehouse", href: "/manager/warehouse" },
    ],
  },
  {
    name: "People",
    icon: Users,
    items: [
      { name: "Customers", href: "/manager/customers" },
      { name: "Staff", href: "/manager/staff" },
    ],
  },
  {
    name: "Analytics",
    icon: LineChart,
    items: [
      { name: "Reports", href: "/manager/reports" },
    ],
  },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Shell navigation={MANAGER_NAVIGATION} title="Manager Dashboard" roleContext="Branch Manager">
      {children}
    </Shell>
  );
}