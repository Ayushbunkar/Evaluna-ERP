"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	BellIcon,
	CalendarCheckIcon,
	ChartNoAxesCombinedIcon,
	ChevronDownIcon,
	HexagonIcon,
	LandmarkIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	MenuIcon,
	ReceiptIcon,
	RefreshCwIcon,
	UserIcon,
	UsersIcon,
	WalletCardsIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function FinanceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// Collapsible sidebar state (desktop)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	// Mobile drawer state
	const [mobileOpen, setMobileOpen] = useState(false);

	// Sync state
	const [syncTime, setSyncTime] = useState<string>("now");
	const [isSyncing, setIsSyncing] = useState(false);

	// Queries for dynamic counters
	const { data: stats, refetch: refetchStats } =
		trpc.finance.getDashboardStats.useQuery(
			{},
			{
				refetchInterval: 30000, // poll every 30s
			},
		);

	const handleManualSync = async () => {
		setIsSyncing(true);
		try {
			await Promise.all([
				refetchStats(),
				utils.finance.getInvoices.invalidate(),
				utils.finance.getTransactions.invalidate(),
				utils.finance.getExpenses.invalidate(),
				utils.finance.getBankAccounts.invalidate(),
			]);
			setSyncTime(new Date().toLocaleTimeString());
			toast.success("Finance ledger queues refreshed.");
		} catch (e) {
			toast.error("Live sync failed.");
		} finally {
			setIsSyncing(false);
		}
	};

	useEffect(() => {
		setSyncTime(new Date().toLocaleTimeString());
	}, []);

	// Compute breadcrumbs based on pathname
	const getBreadcrumbs = () => {
		const parts = pathname.split("/").filter(Boolean);
		return parts.map((part, index) => {
			const isLast = index === parts.length - 1;
			const formatted =
				part.charAt(0).toUpperCase() + part.slice(1).replace("-", " ");
			return {
				label: formatted,
				href: "/" + parts.slice(0, index + 1).join("/"),
				isLast,
			};
		});
	};

	const navGroups = [
		{
			title: "Overview",
			items: [
				{ label: "Dashboard", href: "/finance", icon: LayoutDashboardIcon },
			],
		},
		{
			title: "Accounting",
			items: [
				{
					label: "Transactions",
					href: "/finance/transactions",
					icon: ReceiptIcon,
				},
				{ label: "Bank Accounts", href: "/finance/bank", icon: LandmarkIcon },
			],
		},
		{
			title: "Expenses & Payroll",
			items: [
				{
					label: "Expenses",
					href: "/finance/expenses",
					icon: WalletCardsIcon,
					badge: stats?.unpaidInvoicesCount,
				},
				{
					label: "Payroll & Payouts",
					href: "/finance/payroll",
					icon: CalendarCheckIcon,
				},
			],
		},
		{
			title: "Reports",
			items: [
				{
					label: "Financial Reports",
					href: "/finance/reports",
					icon: ChartNoAxesCombinedIcon,
				},
			],
		},
	];

	const sidebarContent = (
		<div className="flex h-full flex-col border-gray-200 border-r bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
			{/* Brand Header */}
			<div className="flex h-16 items-center justify-between border-gray-200 border-b px-6 dark:border-gray-700">
				<Link href="/" className="flex items-center gap-3">
					<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
						<HexagonIcon className="h-5 w-5 text-blue-600" />
					</span>
					{!sidebarCollapsed && (
						<span className="font-bold text-gray-900 text-lg dark:text-gray-100">
							Evaluna ERP
						</span>
					)}
				</Link>
				{/* Toggle inside mobile drawer */}
				<Button
					variant="ghost"
					size="icon"
					className="text-gray-400 hover:text-gray-600 md:hidden"
					onClick={() => setMobileOpen(false)}
				>
					<XIcon className="h-5 w-5" />
				</Button>
			</div>

			{/* Navigation List */}
			<div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
				{navGroups.map((group, idx) => (
					<div key={idx} className="space-y-1.5">
						{!sidebarCollapsed && (
							<h4 className="px-3 font-semibold text-gray-400 text-xs uppercase tracking-wider dark:text-gray-500">
								{group.title}
							</h4>
						)}
						<ul className="space-y-1">
							{group.items.map((item, itemIdx) => {
								const isActive = pathname === item.href;
								const Icon = item.icon;
								return (
									<li key={itemIdx}>
										<Link
											href={item.href}
											onClick={() => setMobileOpen(false)}
											className={`flex items-center justify-between rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
												isActive
													? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
													: "text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
											}`}
										>
											<div className="flex items-center gap-3">
												<Icon
													className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
												/>
												{!sidebarCollapsed && <span>{item.label}</span>}
											</div>
											{!sidebarCollapsed &&
												item.badge !== undefined &&
												item.badge > 0 && (
													<span className="animate-pulse rounded-full bg-blue-500 px-1.5 py-0.5 font-bold text-white text-xs">
														{item.badge}
													</span>
												)}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
			{/* Desktop Sidebar (Persistent) */}
			<aside
				className={`hidden h-full flex-shrink-0 transition-all duration-300 md:block ${
					sidebarCollapsed ? "w-20" : "w-64"
				}`}
			>
				{sidebarContent}
			</aside>

			{/* Mobile Sidebar (Drawer) */}
			{mobileOpen && (
				<div className="fixed inset-0 z-50 flex bg-gray-900/60 backdrop-blur-sm md:hidden">
					<div className="h-full w-64 animate-slide-in">{sidebarContent}</div>
					<div className="flex-1" onClick={() => setMobileOpen(false)} />
				</div>
			)}

			{/* Main Right Area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Top ERP Header */}
				<header className="z-30 flex h-16 flex-shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6 dark:bg-gray-800">
					<div className="flex items-center gap-4">
						{/* Burger Trigger */}
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							onClick={() => setMobileOpen(true)}
						>
							<MenuIcon className="h-5 w-5" />
						</Button>
						{/* Collapse Trigger for Desktop */}
						<Button
							variant="ghost"
							size="icon"
							className="hidden md:flex"
							onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
						>
							<MenuIcon className="h-5 w-5" />
						</Button>

						{/* Breadcrumbs */}
						<nav className="hidden items-center space-x-2 font-medium text-gray-500 text-sm sm:flex">
							<span className="text-gray-400">Finance</span>
							{getBreadcrumbs().map((b, i) => (
								<div key={i} className="flex items-center space-x-2">
									<span className="text-gray-300">/</span>
									{b.isLast ? (
										<span className="font-semibold text-gray-800 dark:text-gray-100">
											{b.label}
										</span>
									) : (
										<Link
											href={b.href}
											className="transition-colors hover:text-gray-800 dark:hover:text-gray-100"
										>
											{b.label}
										</Link>
									)}
								</div>
							))}
						</nav>
					</div>

					{/* Right Header Controls */}
					<div className="flex items-center gap-2 sm:gap-4">
						{/* Global live sync status */}
						<div className="hidden items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 font-semibold text-[11px] text-gray-500 shadow-inner lg:flex dark:bg-gray-700 dark:text-gray-300">
							<span className="h-2 w-2 animate-ping rounded-full bg-green-500" />
							<span>LIVE</span>
							<span className="text-gray-300">|</span>
							<span className="font-medium text-gray-400">
								SYNCED {syncTime}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
								onClick={handleManualSync}
								disabled={isSyncing}
							>
								<RefreshCwIcon
									className={`h-3 w-3 ${isSyncing ? "animate-spin text-blue-500" : ""}`}
								/>
							</Button>
						</div>

						{/* Global Selector */}
						<div className="relative">
							<div className="flex cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 font-semibold text-xs shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600">
								<span className="text-blue-600 dark:text-blue-400">
									Bhopal Main Warehouse
								</span>
								<ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
							</div>
						</div>

						{/* Notifications icon */}
						<Button
							variant="ghost"
							size="icon"
							className="relative rounded-full"
						>
							<BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
							{stats?.unpaidInvoicesCount !== undefined &&
								stats.unpaidInvoicesCount > 0 && (
									<span className="absolute top-1 right-1 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
								)}
						</Button>

						{/* Profile & Logout triggers */}
						<div className="flex items-center gap-1 rounded-lg border bg-slate-50 p-1 shadow-inner dark:bg-slate-700">
							<Link href="/profile">
								<Button
									variant="ghost"
									size="sm"
									className="h-7 gap-1.5 px-2 font-semibold text-xs hover:bg-white dark:hover:bg-slate-600"
								>
									<UserIcon className="h-3.5 w-3.5 text-gray-500" />
									<span className="hidden sm:inline">Profile</span>
								</Button>
							</Link>
							<span className="text-gray-300">|</span>
							<a href="/api/logout">
								<Button
									variant="ghost"
									size="sm"
									className="h-7 gap-1.5 px-2 font-semibold text-red-600 text-xs hover:bg-red-50 dark:hover:bg-red-950/25"
								>
									<LogOutIcon className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Logout</span>
								</Button>
							</a>
						</div>
					</div>
				</header>

				{/* Content Container (Scrollable) */}
				<main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none dark:bg-gray-900">
					{children}
				</main>
			</div>
		</div>
	);
}
