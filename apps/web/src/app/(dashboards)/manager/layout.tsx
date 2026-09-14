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
	Truck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function ManagerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const t = useTranslations("nav");

	const navItems = [
		{ href: "/manager", label: t("dashboard"), icon: LayoutDashboard },
		{ href: "/manager/dispatch", label: t("assignRoute"), icon: Truck },
		{ href: "/manager/team", label: t("myTeam"), icon: Users },
		{ href: "/manager/tasks", label: t("tasks"), icon: CheckSquare },
		{ href: "/manager/approvals", label: t("approvals"), icon: FileCheck },
		{ href: "/manager/attendance", label: t("attendance"), icon: Clock },
		{ href: "/manager/leave", label: t("leave"), icon: Calendar },
		{ href: "/manager/expenses", label: t("expenses"), icon: CreditCard },
		{ href: "/manager/performance", label: t("performance"), icon: TrendingUp },
		{ href: "/manager/workload", label: t("workload"), icon: BarChart3 },
		{ href: "/manager/exceptions", label: t("exceptions"), icon: AlertTriangle },
		{ href: "/manager/activity", label: t("activity"), icon: History },
		{ href: "/manager/notifications", label: t("notifications"), icon: Bell },
		{ href: "/manager/reports", label: t("reports"), icon: FileBarChart },
		{ href: "/manager/settings", label: t("settings"), icon: Settings },
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
