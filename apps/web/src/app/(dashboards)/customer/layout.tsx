import Link from "next/link";

export default function CustomerLayout({
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
								<svg
									className="h-5 w-5 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWeight="2"
										d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 0c1.1 0 2 .9 2 2-.001.682-.268 1.285-.732 1.64l-7 7c-.254.254-.566.39-.9.39s-.646-.136-.9-.39l-3-3c-.254-.254-.254-.667 0-.92s.667-.254.92 0L9 11l7-7c.464-.454 1.09-.484 1.716-.01l.008.01c.35.285.547.742.547 1.233v.01z"
									/>
								</svg>
							</span>
							<span className="font-semibold text-gray-900 text-lg dark:text-gray-100">
								Evaluna Customer
							</span>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="mt-10 flex-1">
						<ul className="space-y-1 px-3">
							<Link
								href="/customer/dashboard"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWeight="2"
										d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 001 1h3m-3 2H9a2 2 0 00-2 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 00-2-2H9m-3 5v-6"
									/>
								</svg>
								<span className="ml-3">Dashboard</span>
							</Link>

							<Link
								href="/customer/profile"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWeight="2"
										d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
									/>
									<circle cx="12" cy="7" r="4" />
								</svg>
								<span className="ml-3">Customer Profile</span>
							</Link>

							<Link
								href="/customer/orders"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWeight="2"
										d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 0c1.1 0 2 .9 2 2-.001.682-.268 1.285-.732 1.64l-7 7c-.254.254-.566.39-.9.39s-.646-.136-.9-.39l-3-3c-.254-.254-.254-.667 0-.92s.667-.254.92 0L9 11l7-7c.464-.454 1.09-.484 1.716-.01l.008.01c.35.285.547.742.547 1.233v.01z"
									/>
								</svg>
								<span className="ml-3">Orders</span>
							</Link>

							<Link
								href="/customer/payments"
								className="flex w-full items-center rounded-lg px-3 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWeight="2"
										d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
									/>
								</svg>
								<span className="ml-3">Payments</span>
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
								Welcome, Customer Representative
							</div>
							<div className="flex items-center space-x-4">
								<button className="flex items-center rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
									<svg
										className="h-5 w-5 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWeight="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 002-2H5a2 2 0 002-2v10a2 2 0 002 2z"
										/>
									</svg>
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
