"use client";

import {
	Building2,
	Circle,
	Hexagon,
	LayoutDashboard,
	Settings,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@evaluna/ui/components/button";

export default function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const t = useTranslations("nav");
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navItems = [
		{ href: "/superadmin", label: t("dashboard"), icon: LayoutDashboard },
		{ href: "/superadmin/companies", label: t("companies"), icon: Building2 },
		{ href: "/superadmin/users", label: t("users"), icon: Users },
		{ href: "/superadmin/billing", label: t("billing"), icon: Circle },
		{ href: "/superadmin/settings", label: t("settings"), icon: Settings },
	];

	const sidebarContent = (
		<div className="flex h-full flex-col bg-white dark:bg-gray-800">
			{/* Brand */}
			<div className="flex h-14 flex-shrink-0 items-center justify-between border-gray-200 border-b px-6 dark:border-gray-700">
				<Link href="/" className="flex items-center space-x-3">
					<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
						<Hexagon className="h-5 w-5 text-blue-600" />
					</span>
					<span className="font-semibold text-gray-900 text-lg dark:text-gray-100">
						Evaluna Super Admin
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
				<ul className="space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href ||
							(item.href !== "/superadmin" && pathname.startsWith(item.href));
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									onClick={() => setMobileMenuOpen(false)}
									className={`flex w-full items-center rounded-lg px-3 py-2.5 font-medium text-sm transition-colors ${
										isActive
											? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
											: "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
									}`}
								>
									<Icon
										className={`h-5 w-5 shrink-0 ${
											isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
										}`}
									/>
									<span className="ml-3 truncate">{item.label}</span>
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
				<div className="fixed inset-0 z-50 flex bg-gray-900/60 backdrop-blur-sm md:hidden">
					<div className="h-full w-72 max-w-[85vw] border-gray-200 border-r bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
						{sidebarContent}
					</div>
					<div
						className="flex-1"
						onClick={() => setMobileMenuOpen(false)}
						aria-label="Close backdrop"
					/>
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
