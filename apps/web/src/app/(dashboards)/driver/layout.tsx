"use client";

import {
	Headphones,
	Hexagon,
	History,
	IndianRupee,
	LayoutDashboard,
	Navigation,
	Truck,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DriverProfileModal } from "./driver-profile-modal";

export default function DriverLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [profileOpen, setProfileOpen] = useState(false);

	const navItems = [
		{ href: "/driver", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/driver/route", label: "Route Navigation", icon: Navigation },
		{ href: "/driver/delivery", label: "Live Delivery & Bill", icon: IndianRupee },
		{ href: "/driver/history", label: "Delivery History", icon: History },
		{ href: "/driver/vehicle", label: "Vehicle Status", icon: Truck },
		{ href: "/driver/support", label: "Support & Dispatch", icon: Headphones },
	];

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-gray-900">
			{/* Sidebar */}
			<aside className="w-64 border-gray-200 border-r bg-white dark:border-gray-700 dark:bg-gray-800">
				<div className="flex h-full flex-col">
					{/* Brand */}
					<div className="flex-shrink-0 px-6 py-4">
						<Link href="/" className="flex items-center space-x-3">
							<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
								<Hexagon className="h-5 w-5 text-blue-600" />
							</span>
							<span className="font-semibold text-gray-900 text-lg dark:text-gray-100">
								Evaluna Delivery
							</span>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="mt-10 flex-1">
						<ul className="space-y-1 px-3">
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.href}
										href={item.href}
										className={`flex w-full items-center rounded-lg px-3 py-3 font-medium text-base transition-colors ${
											isActive
												? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
												: "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
										}`}
									>
										<Icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
										<span className="ml-3">{item.label}</span>
									</Link>
								);
							})}

							{/* Custom Profile Trigger in Sidebar */}
							<button
								onClick={() => setProfileOpen(true)}
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
							>
								<User className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Update Profile Info</span>
							</button>
						</ul>
					</nav>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden">
				<div className="flex h-full flex-col">
					{/* Unified Dashboard Header (With notifications, break toggles, profile actions) */}
					<DashboardHeader />

					{/* Content Workspace */}
					<div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
				</div>
			</main>

			{/* Profile Info Update Modal */}
			{profileOpen && (
				<DriverProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
			)}
		</div>
	);
}
