import {
	Building2,
	Circle,
	Hexagon,
	LayoutDashboard,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
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
								Evaluna Super Admin
							</span>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="mt-10 flex-1">
						<ul className="space-y-1 px-3">
							<Link
								href="/superadmin"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<LayoutDashboard className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Dashboard</span>
							</Link>

							<Link
								href="/superadmin/companies"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<Building2 className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Companies</span>
							</Link>

							<Link
								href="/superadmin/users"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<Users className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Users</span>
							</Link>

							<Link
								href="/superadmin/billing"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<Circle className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Billing</span>
							</Link>

							<Link
								href="/superadmin/settings"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<Settings className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Settings</span>
							</Link>
						</ul>
					</nav>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden">
				<div className="flex h-full flex-col">
					<DashboardHeader />

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6">{children}</div>
				</div>
			</main>
		</div>
	);
}
