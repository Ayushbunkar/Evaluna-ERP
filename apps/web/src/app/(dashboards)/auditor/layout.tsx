"use client";

import {
	ActivityIcon,
	CalendarCheckIcon,
	ClipboardList,
	FileBarChart,
	Hexagon,
	History,
	DollarSign,
	FileText,
	LayoutDashboard,
	Settings,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@evaluna/ui/components/button";

const navItems = [
	{ href: "/auditor", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/auditor/stock", label: "Stock Audits", icon: ClipboardList },
	{ href: "/auditor/price-changes", label: "Price Audits", icon: DollarSign },
	{ href: "/auditor/exceptions", label: "Exceptions", icon: AlertTriangle },
	{ href: "/auditor/cash-book", label: "Cash Book", icon: BookOpen },
	{ href: "/auditor/log", label: "Audit Log", icon: FileText },
	{ href: "/auditor/findings", label: "Findings", icon: CheckSquare },
	{ href: "/auditor/upc-tasks", label: "UPC Tasks", icon: Barcode },
	{ href: "/auditor/reports", label: "Reports", icon: BarChart3 },
	{ href: "/auditor/settings", label: "Settings", icon: Settings },
];

export default function AuditorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const sidebarContent = (
		<div className="flex h-full flex-col bg-white dark:bg-gray-800">
			{/* Brand */}
			<div className="flex h-14 flex-shrink-0 items-center justify-between border-gray-200 border-b px-6 dark:border-gray-700">
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
					<span className="font-semibold text-gray-900 text-lg dark:text-gray-100">
						Evaluna Auditor
					</span>
				</Link>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-gray-400 hover:text-gray-600 md:hidden"
					onClick={() => setMobileMenuOpen(false)}
					aria-label="Close sidebar"
				>
					<X className="h-5 w-5" />
				</Button>
			</div>

			{/* Navigation */}
			<nav className="mt-4 flex-1 overflow-y-auto px-3 py-2">
				<p className="mb-2 px-3 font-semibold text-gray-400 text-xs uppercase tracking-wider dark:text-gray-500">
					Menu
				</p>
				<ul className="space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href ||
							(item.href !== "/auditor" && pathname.startsWith(item.href));
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									onClick={(e) => {
										setMobileMenuOpen(false);
										router.push(item.href);
									}}
									className={`flex w-full items-center rounded-lg px-3 py-2.5 font-medium text-sm transition-colors cursor-pointer select-none active:scale-[0.98] ${
										isActive
											? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
											: "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
									}`}
								>
									<Icon
										className={`mr-3 h-5 w-5 shrink-0 ${
											isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
										}`}
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
		<div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
			{/* Desktop Persistent Sidebar */}
			<aside className="hidden w-64 flex-shrink-0 border-gray-200 border-r bg-white md:block dark:border-gray-700 dark:bg-gray-800">
				{sidebarContent}
			</aside>

			{/* Mobile Drawer Overlay */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-50 flex md:hidden">
					<div
						className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
						onClick={() => setMobileMenuOpen(false)}
						aria-label="Close backdrop"
					/>
					<div className="relative z-10 h-full w-72 max-w-[85vw] border-gray-200 border-r bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
						{sidebarContent}
					</div>
				</div>
			)}

			{/* Main Content Area */}
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

				{/* Scrollable Content */}
				<main className="flex-1 overflow-y-auto p-3 sm:p-6">
					<div className="mx-auto w-full max-w-7xl min-w-0">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
