"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Headphones,
	History,
	IndianRupee,
	LayoutDashboard,
	Menu,
	Navigation,
	QrCode,
	Truck,
	User,
	X,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DriverProfileModal } from "./driver-profile-modal";

export default function DriverLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const [profileOpen, setProfileOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navItems = [
		{ href: "/driver", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/driver/van-stock", label: "My Van Stock", icon: Truck },
		{ href: "/driver/route", label: "Route Navigation", icon: Navigation },
		{
			href: "/driver/delivery",
			label: "Live Delivery & Bill",
			icon: IndianRupee,
		},
		{
			href: "/driver/scanner",
			label: "Scan Package / Bill",
			icon: QrCode,
		},
		{ href: "/driver/history", label: "Delivery History", icon: History },
		{ href: "/driver/vehicle", label: "Vehicle Status", icon: Truck },
		{ href: "/driver/support", label: "Support & Dispatch", icon: Headphones },
	];

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
						Evaluna Delivery
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
						const isActive = pathname === item.href;
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									onClick={(_e) => {
										setMobileMenuOpen(false);
										router.push(item.href);
									}}
									className={`flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2.5 font-medium text-sm transition-colors active:scale-[0.98] ${
										isActive
											? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
											: "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
									}`}
								>
									<Icon
										className={`h-5 w-5 shrink-0 ${
											isActive
												? "text-blue-600 dark:text-blue-400"
												: "text-gray-400"
										}`}
									/>
									<span className="ml-3 truncate">{item.label}</span>
								</Link>
							</li>
						);
					})}

					{/* Custom Profile Trigger in Sidebar */}
					<li>
						<button
							type="button"
							onClick={() => {
								setMobileMenuOpen(false);
								setProfileOpen(true);
							}}
							className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							<User className="h-5 w-5 shrink-0 text-gray-400" />
							<span className="ml-3 truncate">Update Profile Info</span>
						</button>
					</li>
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
					<button
						type="button"
						className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm cursor-default w-full h-full border-none p-0"
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
				{/* Unified Dashboard Header */}
				<DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

				{/* Content Workspace */}
				<main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 pb-20 md:pb-6">
					<div className="mx-auto w-full min-w-0 max-w-7xl">{children}</div>
				</main>
			</div>

			{/* Driver Mobile Bottom Navigation Bar (Phone-First Quick Actions) */}
			<nav
				aria-label="Driver Mobile Navigation"
				className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-md shadow-lg md:hidden dark:border-gray-800 dark:bg-gray-900/95"
				style={{
					paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
				}}
			>
				<div className="flex items-center justify-around px-2 py-1.5">
					{[
						{ href: "/driver/delivery", label: "Billing", icon: IndianRupee },
						{ href: "/driver/van-stock", label: "Van Stock", icon: Truck },
						{ href: "/driver/route", label: "Route", icon: Navigation },
						{ href: "/driver/scanner", label: "Scan", icon: QrCode },
					].map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`relative flex min-h-[44px] min-w-[56px] flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-medium transition-all active:scale-95 ${
									isActive
										? "text-blue-600 font-bold dark:text-blue-400"
										: "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
								}`}
							>
								{isActive && (
									<motion.div
										layoutId="driver-bottom-nav-pill"
										className="absolute inset-x-2 inset-y-1 -z-10 rounded-xl bg-blue-50 dark:bg-blue-950/60"
										transition={{ type: "spring", stiffness: 500, damping: 35 }}
									/>
								)}
								<Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
								<span className="mt-0.5 truncate text-center leading-tight">
									{item.label}
								</span>
							</Link>
						);
					})}

					<button
						type="button"
						onClick={() => setMobileMenuOpen(true)}
						className="relative flex min-h-[44px] min-w-[56px] flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-medium text-gray-500 transition-all hover:text-gray-900 active:scale-95 dark:text-gray-400 dark:hover:text-gray-100"
					>
						<Menu className="h-5 w-5" />
						<span className="mt-0.5 truncate text-center leading-tight">Menu</span>
					</button>
				</div>
			</nav>

			{/* Profile Info Update Modal */}
			{profileOpen && (
				<DriverProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
			)}
		</div>
	);
}
