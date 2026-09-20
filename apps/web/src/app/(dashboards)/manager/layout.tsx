"use client";

import {
	AlertTriangle,
	BarChart3,
	Bell,
	Calendar,
	CheckSquare,
	Clock,
	CreditCard,
	FileBarChart,
	FileCheck,
	Hexagon,
	History,
	IndianRupee,
	LayoutDashboard,
	Settings,
	TrendingUp,
	Truck,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@evaluna/ui/components/button";

export default function ManagerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navItems = [
		{ href: "/manager", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/manager/dispatch", label: "Assign Route", icon: Truck },
		{ href: "/manager/team", label: "My Team", icon: Users },
		{
			href: "/manager/staff-profiles",
			label: "Staff Profiles",
			icon: UserCheck,
		},
		{
			href: "/manager/approvals",
			label: "Expense Approvals",
			icon: CheckSquare,
		},
		{
			href: "/manager/payroll",
			label: "Payroll Approvals",
			icon: IndianRupee,
		},
		{
			href: "/manager/leave",
			label: "Leave Approvals",
			icon: Calendar,
		},
		{ href: "/manager/attendance", label: "Staff Attendance", icon: Clock },
		{ href: "/manager/commissions", label: "Commissions", icon: TrendingUp },
		{ href: "/manager/credit-limits", label: "Credit Limits", icon: CreditCard },
		{ href: "/manager/e-way-bills", label: "E-Way Bills", icon: FileCheck },
		{
			href: "/manager/escalations",
			label: "Escalations & Holds",
			icon: AlertTriangle,
		},
		{ href: "/manager/activity", label: "Activity Log", icon: History },
		{ href: "/manager/notifications", label: "Notifications", icon: Bell },
		{ href: "/manager/reports", label: "Reports", icon: FileBarChart },
		{ href: "/manager/settings", label: "Settings", icon: Settings },
	];

	const sidebarContent = (
		<div className="flex h-full flex-col bg-white dark:bg-slate-950">
			{/* Brand */}
			<div className="flex h-14 flex-shrink-0 items-center justify-between border-slate-100 border-b px-6 dark:border-slate-900">
				<Link
					href="/"
					className="flex items-center space-x-2.5"
					onClick={() => setMobileMenuOpen(false)}
				>
					<img
						src="/logo.jpg"
						alt="Evaluna ERP"
						className="h-7 w-7 rounded-lg object-cover shadow-sm ring-1 ring-border/50"
					/>
					<span className="font-bold text-base text-slate-900 dark:text-slate-100">
						Evaluna Manager
					</span>
				</Link>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-slate-400 hover:text-slate-600 md:hidden"
					onClick={() => setMobileMenuOpen(false)}
					aria-label="Close sidebar"
				>
					<X className="h-5 w-5" />
				</Button>
			</div>

			{/* Scrollable Navigation */}
			<nav className="flex-1 overflow-y-auto py-3">
				<ul className="space-y-1 px-3">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									onClick={(e) => {
										setMobileMenuOpen(false);
										router.push(item.href);
									}}
									className={`flex items-center rounded-lg px-3 py-2.5 font-semibold text-sm transition-all cursor-pointer select-none active:scale-[0.98] ${
										isActive
											? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
											: "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/40"
									}`}
								>
									<Icon
										className={`mr-3 h-4 w-4 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}
									/>
									<span className="truncate">{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</div>
	);

	return (
		<div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
			{/* Desktop Persistent Sidebar */}
			<aside className="hidden h-full w-64 flex-shrink-0 flex-col border-slate-200 border-r bg-white md:flex dark:border-slate-800 dark:bg-slate-950">
				{sidebarContent}
			</aside>

			{/* Mobile Drawer Overlay */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-50 flex md:hidden">
					<div
						className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
						onClick={() => setMobileMenuOpen(false)}
						aria-label="Close backdrop"
					/>
					<div className="relative z-10 h-full w-72 max-w-[85vw] border-slate-800 border-r bg-white shadow-2xl dark:bg-slate-950">
						{sidebarContent}
					</div>
				</div>
			)}

			{/* Main Content Area */}
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				{/* Header */}
				<DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

				{/* Scrollable Workspace Viewport */}
				<main className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-6 dark:bg-slate-900">
					<div className="mx-auto w-full max-w-7xl min-w-0">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
