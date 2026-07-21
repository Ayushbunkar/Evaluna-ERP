import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  DollarSignIcon,
  PackageIcon,
  UsersIcon,
  ShoppingBagIcon,
  ClockIcon,
  FileTextIcon,
  ReceiptTextIcon
} from "lucide-react";

const managerNavItems: NavItem[] = [
  { href: "/manager", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/manager/cashier", labelKey: "cashier", icon: DollarSignIcon },
  { href: "/manager/products", labelKey: "products", icon: PackageIcon },
  { href: "/manager/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/manager/orders", labelKey: "orders", icon: ShoppingBagIcon },
  { href: "/manager/purchases", labelKey: "purchases", icon: ShoppingBagIcon },
  { href: "/manager/purchase-returns", labelKey: "purchase-returns", icon: ReceiptTextIcon },
  { href: "/manager/cash-book", labelKey: "cashbook", icon: DollarSignIcon },
  { href: "/manager/reports", labelKey: "reports", icon: FileTextIcon },
  { href: "/manager/staff", labelKey: "staff", icon: UsersIcon },
  { href: "/manager/attendance", labelKey: "attendance", icon: ClockIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={managerNavItems} namespace="nav">
      {children}
    </AppLayoutWithBranch>
  );
}
