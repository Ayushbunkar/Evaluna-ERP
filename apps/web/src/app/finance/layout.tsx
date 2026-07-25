"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  LayoutDashboardIcon,
  WalletIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  CalculatorIcon,
  BookOpenIcon,
  LandmarkIcon,
  PieChartIcon,
  FileTextIcon
} from "lucide-react";

const financeNavItems: NavItem[] = [
  { href: "/finance", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/finance/cashbook", labelKey: "cashbook", icon: WalletIcon },
  { href: "/finance/income", labelKey: "income", icon: ArrowDownCircleIcon },
  { href: "/finance/expenses", labelKey: "expenses", icon: ArrowUpCircleIcon },
  { href: "/finance/gst", labelKey: "gst", icon: CalculatorIcon },
  { href: "/finance/ledger", labelKey: "ledger", icon: BookOpenIcon },
  { href: "/finance/bank", labelKey: "bank", icon: LandmarkIcon },
  { href: "/finance/pl", labelKey: "profitAndLoss", icon: PieChartIcon },
  { href: "/finance/reports", labelKey: "reports", icon: FileTextIcon },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={financeNavItems} namespace="nav" role="finance">
      {children}
    </AppLayoutWithBranch>
  );
}
