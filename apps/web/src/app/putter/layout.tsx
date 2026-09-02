"use client";

import Link from "next/link";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import {
	LayoutDashboardIcon,
	DownloadIcon,
	PackagePlusIcon,
	AlertTriangleIcon,
	RotateCcwIcon,
	XCircleIcon,
	CheckCircleIcon,
	FileTextIcon,
	Hexagon,
} from "lucide-react";

export default function PutterLayout({
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
								Evaluna Putter
							</span>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="mt-4 flex-1 px-3">
						<p className="mb-2 px-3 font-semibold text-gray-400 text-xs uppercase tracking-wider dark:text-gray-500">
							Putter Workspace
						</p>
						<ul className="space-y-1">
							<li>
								<Link
									href="/putter"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<LayoutDashboardIcon className="mr-3 h-4 w-4 text-gray-400" />
									Dashboard
								</Link>
							</li>
							<li>
								<Link
									href="/putter/receiving"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<DownloadIcon className="mr-3 h-4 w-4 text-gray-400" />
									Receiving
								</Link>
							</li>
							<li>
								<Link
									href="/putter/put-away"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<PackagePlusIcon className="mr-3 h-4 w-4 text-gray-400" />
									Put Away
								</Link>
							</li>
							<li>
								<Link
									href="/putter/missing"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<AlertTriangleIcon className="mr-3 h-4 w-4 text-gray-400" />
									Missing Stock
								</Link>
							</li>
							<li>
								<Link
									href="/putter/returns"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<RotateCcwIcon className="mr-3 h-4 w-4 text-gray-400" />
									Sale Return
								</Link>
							</li>
							<li>
								<Link
									href="/putter/damage"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<XCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
									Raise Damage
								</Link>
							</li>
							<li>
								<Link
									href="/putter/completed"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<CheckCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
									Completed
								</Link>
							</li>
							<li>
								<Link
									href="/putter/reports"
									className="flex w-full items-center rounded-lg px-3 py-2 font-medium text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
								>
									<FileTextIcon className="mr-3 h-4 w-4 text-gray-400" />
									Reports
								</Link>
							</li>
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
