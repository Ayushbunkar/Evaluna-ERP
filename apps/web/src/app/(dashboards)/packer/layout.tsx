import Link from "next/link";
import { LayoutDashboard, User, FileBarChart, Hexagon, Circle } from "lucide-react";

export default function PackerLayout({
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
								Evaluna Packing
							</span>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="mt-10 flex-1">
						<ul className="space-y-1 px-3">
							<Link
								href="/packer/dashboard"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<LayoutDashboard className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Dashboard</span>
							</Link>

							<Link
								href="/packer/pending"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<Circle className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Pending Packing</span>
							</Link>

							<Link
								href="/packer/history"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<Circle className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Packing History</span>
							</Link>

							<Link
								href="/packer/reports"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<FileBarChart className="h-5 w-5 text-gray-400" />
								<span className="ml-3">Reports</span>
							</Link>
						</ul>
					</nav>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden">
				<div className="flex h-full flex-col">
					{/* Header */}
					<header className="border-gray-200 border-b bg-white dark:border-gray-700 dark:bg-gray-800">
						<div className="flex items-center justify-between px-6 py-4">
							<div className="text-gray-500 text-sm dark:text-gray-400">
								Welcome, Packer
							</div>
							<div className="flex items-center space-x-4">
								<button className="flex items-center rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
									<User className="h-5 w-5 text-gray-400" />
									<span className="ml-2 text-gray-600 text-sm dark:text-gray-300">
										Profile
									</span>
								</button>
							</div>
						</div>
					</header>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6">{children}</div>
				</div>
			</main>
		</div>
	);
}
