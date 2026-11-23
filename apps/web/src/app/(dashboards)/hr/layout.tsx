"use client";

import {
	Banknote,
	CalendarDays,
	Clock,
	FileBarChart,
	FileText,
	LayoutDashboard,
	Users,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const hrNavItems: NavItem[] = [
	{ href: "/hr", labelKey: "Dashboard", icon: LayoutDashboard },
	{ href: "/hr/employees", labelKey: "Employees", icon: Users },
	{ href: "/hr/attendance", labelKey: "Attendance", icon: Clock },
	{ href: "/hr/payroll", labelKey: "Payroll", icon: Banknote },
	{ href: "/hr/leave", labelKey: "Leave Management", icon: CalendarDays },
	{ href: "/hr/payslips", labelKey: "Payslips", icon: FileText },
	{ href: "/hr/reports", labelKey: "Reports", icon: FileBarChart },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
	return (
		<AppLayoutWithBranch navItems={hrNavItems} namespace="nav" role="hr">
			{children}
		</AppLayoutWithBranch>
	);
}
