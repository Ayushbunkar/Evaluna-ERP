"use client";

import { Shell } from "@/components/shared/layouts/shell";
import { type NavigationItem } from "@/components/shared/layouts/sidebar-base";
import {
  LayoutDashboard,
  BarChart3,
  GitBranch,
  Users,
  Shield,
  Package,
  Tags,
  Briefcase,
  Truck,
  Building,
  Activity,
  ShoppingCart,
  ArrowRightLeft,
  Calendar,
  Wallet,
  Calculator,
  FileText,
  History,
  Bell,
  Settings,
  DatabaseBackup,
  RefreshCw,
  Gauge,
  Lock,
  HeartPulse,
} from "lucide-react";

const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { name: "Overview", href: "/admin" },
      { name: "Analytics", href: "/admin/analytics" },
      { name: "Performance", href: "/admin/performance" },
      { name: "Branch Compare", href: "/admin/branch-compare" },
    ],
  },
  {
    name: "Catalog",
    icon: Package,
    items: [
      { name: "Products", href: "/admin/products" },
      { name: "Inventory", href: "/admin/inventory" },
      { name: "Warehouse", href: "/admin/warehouse" },
    ],
  },
  {
    name: "Trading",
    icon: ShoppingCart,
    items: [
      { name: "Sales & POS", href: "/admin/sales" },
      { name: "Purchases", href: "/admin/purchases" },
      { name: "Returns", href: "/admin/returns" },
    ],
  },
  {
    name: "People",
    icon: Users,
    items: [
      { name: "Customers", href: "/admin/customers" },
      { name: "Suppliers", href: "/admin/suppliers" },
      { name: "System Users", href: "/admin/users" },
      { name: "HR & Payroll", href: "/admin/hr" },
    ],
  },
  {
    name: "Finance",
    icon: Wallet,
    items: [
      { name: "Accounting", href: "/admin/accounting" },
      { name: "GST & Taxes", href: "/admin/gst" },
      { name: "Reports", href: "/admin/reports" },
    ],
  },
  {
    name: "System",
    icon: Settings,
    items: [
      { name: "General Settings", href: "/admin/settings" },
      { name: "Branches", href: "/admin/branches" },
      { name: "Roles & Permissions", href: "/admin/roles" },
      { name: "Security", href: "/admin/security" },
      { name: "Audit Logs", href: "/admin/audit-logs" },
      { name: "Backups", href: "/admin/backups" },
      { name: "Sync Monitor", href: "/admin/sync" },
      { name: "System Health", href: "/admin/health" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Shell navigation={ADMIN_NAVIGATION} title="Admin Center" roleContext="Administrator">
      {children}
    </Shell>
  );
}