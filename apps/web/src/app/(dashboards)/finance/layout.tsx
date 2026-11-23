"use client";

import {
	CalendarCheckIcon,
	ChartNoAxesCombinedIcon,
	IndianRupeeIcon,
	LandmarkIcon,
	LayoutDashboardIcon,
	ReceiptIndianRupeeIcon,
	ShieldCheckIcon,
	TruckIcon,
	UsersIcon,
	WalletCardsIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";
import { useTRPC } from "@/lib/trpc/client";

export default function FinanceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const trpc = useTRPC();

	// Dynamic stats for live finance indicators
	const { data: stats } = trpc.finance.getDashboardStats.useQuery(
		{},
		{
			refetchInterval: 30000,
			refetchIntervalInBackground: false,
			refetchOnWindowFocus: true,
		},
	);

	const financeNavItems: NavItem[] = [
		{
			href: "/finance",
			labelKey: "Dashboard",
			icon: LayoutDashboardIcon,
		},
		{
			href: "/finance/invoices",
			labelKey: "Invoices",
			icon: ReceiptIndianRupeeIcon,
			badge: (stats as any)?.unpaidInvoices,
		},
		{
			href: "/finance/payments",
			labelKey: "Payments",
			icon: IndianRupeeIcon,
		},
		{
			href: "/finance/cashbook",
			labelKey: "Cash Book",
			icon: LandmarkIcon,
		},
		{
			href: "/finance/bank-accounts",
			labelKey: "Bank Accounts",
			icon: LandmarkIcon,
		},
		{
			href: "/finance/customer-ledgers",
			labelKey: "Customer Ledgers",
			icon: UsersIcon,
		},
		{
			href: "/finance/supplier-ledgers",
			labelKey: "Supplier Ledgers",
			icon: TruckIcon,
		},
		{
			href: "/finance/expenses",
			labelKey: "Expense Approvals",
			icon: WalletCardsIcon,
			badge: (stats as any)?.pendingExpenses,
		},
		{
			href: "/finance/payroll",
			labelKey: "Salary & Payroll",
			icon: CalendarCheckIcon,
		},
		{
			href: "/finance/reports",
			labelKey: "Financial Reports",
			icon: ChartNoAxesCombinedIcon,
		},
		{
			href: "/finance/tax",
			labelKey: "Tax & GST",
			icon: ShieldCheckIcon,
		},
	];

	return (
		<AppLayoutWithBranch
			navItems={financeNavItems}
			namespace="nav"
			role="finance"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
