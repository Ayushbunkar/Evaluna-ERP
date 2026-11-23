"use client";

import {
	AlertTriangle,
	BarChart3,
	Calendar,
	CheckSquare,
	Clock,
	FileBarChart,
	FileCheck,
	History,
	IndianRupee,
	LayoutDashboard,
	Settings,
	Truck,
	UserCheck,
	Users,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const managerNavItems: NavItem[] = [
	{ href: "/manager", labelKey: "Dashboard", icon: LayoutDashboard },
	{
		href: "/manager/van-stock-planning",
		labelKey: "Van Stock Planning",
		icon: Truck,
	},
	{
		href: "/manager/van-verification",
		labelKey: "Van Verification & Assign",
		icon: CheckSquare,
	},
	{
		href: "/manager/dispatch-approval",
		labelKey: "Final Dispatch Approval",
		icon: FileCheck,
	},
	{
		href: "/manager/van-return-verification",
		labelKey: "Van Return Verification",
		icon: History,
	},
	{ href: "/manager/cashbook", labelKey: "Cash Book", icon: IndianRupee },
	{
		href: "/manager/suppliers",
		labelKey: "Supplier Management",
		icon: Users,
	},
	{ href: "/manager/staff", labelKey: "Staff Management", icon: UserCheck },
	{
		href: "/manager/shifts",
		labelKey: "Shifts & Attendance",
		icon: Clock,
	},
	{
		href: "/manager/audit-loss",
		labelKey: "Audit & Loss",
		icon: AlertTriangle,
	},
	{
		href: "/manager/reports/financial",
		labelKey: "Financial Reports",
		icon: FileBarChart,
	},
	{
		href: "/manager/reports/variance",
		labelKey: "Variance Reports",
		icon: BarChart3,
	},
	{
		href: "/manager/reports/audit",
		labelKey: "Audit Reports",
		icon: Calendar,
	},
	{ href: "/manager/settings", labelKey: "Settings", icon: Settings },
];

export default function ManagerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppLayoutWithBranch
			navItems={managerNavItems}
			namespace="nav"
			role="manager"
		>
			{children}
		</AppLayoutWithBranch>
	);
}
