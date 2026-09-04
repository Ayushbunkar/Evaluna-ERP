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
	LayoutDashboard,
	Settings,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function ManagerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	const navItems = [
		{ href: "/manager", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/manager/team", label: "My Team", icon: Users },
		{ href: "/manager/tasks", label: "Tasks", icon: CheckSquare },
		{ href: "/manager/approvals", label: "Approvals", icon: FileCheck },
		{ href: "/manager/attendance", label: "Attendance", icon: Clock },
		{ href: "/manager/leave", label: "Leave", icon: Calendar },
		{ href: "/manager/expenses", label: "Expenses", icon: CreditCard },
		{ href: "/manager/performance", label: "Performance", icon: TrendingUp },
		{ href: "/manager/workload", label: "Workload", icon: BarChart3 },
		{ href: "/manager/exceptions", label: "Exceptions", icon: AlertTriangle },
		{ href: "/manager/activity", label: "Activity", icon: History },
		{ href: "/manager/notifications", label: "Notifications", icon: Bell },
		{ href: "/manager/reports", label: "Reports", icon: FileBarChart },
		{ href: "/manager/settings", label: "Settings", icon: Settings },
	];

	return (
		<div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
			{/* Sidebar */}
			<aside className="flex h-full w-64 flex-shrink-0 flex-col border-slate-200 border-r bg-white dark:border-slate-800 dark:bg-slate-950">
				{/* Brand */}
				<div className="flex-shrink-0 border-slate-100 border-b px-6 py-5 dark:border-slate-900">
					<Link href="/" className="flex items-center space-x-3">
						<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
							<Hexagon className="h-5 w-5 text-blue-600" />
						</span>
						<span className="font-bold text-base text-slate-900 dark:text-slate-100">
							Evaluna Manager
						</span>
					</Link>
				</div>

				{/* Scrollable Navigation */}
				<nav className="flex-1 overflow-y-auto py-4">
					<ul className="space-y-1 px-3">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
							return (
								<li key={item.href}>
									<Link
										href={item.href}
										className={`flex items-center rounded-lg px-3 py-2.5 font-semibold text-sm transition-all ${
											isActive
												? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
												: "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/40"
										}`}
									>
										<Icon
											className={`mr-3 h-4 w-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}
										/>
										<span>{item.label}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			</aside>

			{/* Main Content Area */}
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				{/* Header */}
				<DashboardHeader />

				{/* Scrollable Workspace Viewport */}
				<main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 dark:bg-slate-900">
					{children}
				</main>
			</div>
		</div>
	);
}
