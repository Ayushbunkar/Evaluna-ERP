"use client";

import {
	CreditCardIcon,
	FileMinusIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	MonitorSmartphoneIcon,
	ReceiptTextIcon,
	TicketIcon,
	Undo2Icon,
	UsersIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const billingNavItems: NavItem[] = [
	{ href: "/billing", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/billing/pos", labelKey: "pos", icon: MonitorSmartphoneIcon },
	{ href: "/billing/bills", labelKey: "bills", icon: ReceiptTextIcon },
	{ href: "/billing/returns", labelKey: "returns", icon: Undo2Icon },
	{
		href: "/billing/credit-notes",
		labelKey: "creditNotes",
		icon: FileMinusIcon,
	},
	{ href: "/billing/customers", labelKey: "customers", icon: UsersIcon },
	{ href: "/billing/coupons", labelKey: "coupons", icon: TicketIcon },
	{ href: "/billing/payments", labelKey: "payments", icon: CreditCardIcon },
	{ href: "/billing/reports", labelKey: "reports", icon: FileTextIcon },
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={billingNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
