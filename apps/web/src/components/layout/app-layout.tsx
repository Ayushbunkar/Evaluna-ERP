"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@evaluna/ui/components/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import {
	BellIcon,
	Building2Icon,
	ChevronLeft,
	ChevronRight,
	GlobeIcon,
	type LucideIcon,
	MenuIcon,
	Package2Icon,
	RefreshCwIcon,
	WifiOffIcon,
	XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut, Loader2, Package, Map, FileText, CheckSquare, Search, Box, User, Briefcase, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logout } from "@/app/(auth)/login/actions";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { useSession } from "@/hooks/use-session";
import { BranchProvider, useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

export interface NavItem {
	href: string;
	labelKey: string;
	icon: LucideIcon;
}

const ROLE_CONFIG: Record<
	string,
	{ label: string; color: string; bg: string }
> = {
	admin: {
		label: "Admin",
		color: "text-purple-700 dark:text-purple-300",
		bg: "bg-purple-100 dark:bg-purple-900/40",
	},
	manager: {
		label: "Manager",
		color: "text-blue-700 dark:text-blue-300",
		bg: "bg-blue-100 dark:bg-blue-900/40",
	},
	sales: {
		label: "Salesperson",
		color: "text-green-700 dark:text-green-300",
		bg: "bg-green-100 dark:bg-green-900/40",
	},
	biller: {
		label: "Biller",
		color: "text-orange-700 dark:text-orange-300",
		bg: "bg-orange-100 dark:bg-orange-900/40",
	},
	auditor: {
		label: "Auditor",
		color: "text-rose-700 dark:text-rose-300",
		bg: "bg-rose-100 dark:bg-rose-900/40",
	},
	picker: {
		label: "Picker",
		color: "text-cyan-700 dark:text-cyan-300",
		bg: "bg-cyan-100 dark:bg-cyan-900/40",
	},
	putter: {
		label: "Putter",
		color: "text-teal-700 dark:text-teal-300",
		bg: "bg-teal-100 dark:bg-teal-900/40",
	},
};

function BranchSwitcher({ isSuperadmin }: { isSuperadmin: boolean }) {
	const { activeBranchId, setActiveBranchId } = useBranch();
	const { data: branchesList } = trpc.branches.list.useQuery();

	const branchName = activeBranchId
		? branchesList?.find((b: any) => b.id === activeBranchId)?.name || "Branch"
		: "All Branches";

	if (!isSuperadmin) {
		return (
			<Button
				variant="outline"
				size="sm"
				className="h-9 gap-2 rounded-full border-border/50 bg-background/50 px-3 font-medium text-xs shadow-sm backdrop-blur-sm pointer-events-none"
			>
				<Building2Icon className="h-4 w-4 text-muted-foreground" />
				<span className="hidden max-w-[120px] truncate sm:inline-block">
					{branchName}
				</span>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-9 gap-2 rounded-full border-border/50 bg-background/50 px-3 font-medium text-xs shadow-sm backdrop-blur-sm transition-all hover:bg-accent/50"
				>
					<Building2Icon className="h-4 w-4 text-muted-foreground" />
					<span className="hidden max-w-[120px] truncate sm:inline-block">
						{branchName}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[200px] rounded-xl border-border/50 shadow-xl"
			>
				<DropdownMenuLabel className="font-normal text-muted-foreground text-xs uppercase tracking-wider">
					Switch Branch
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => setActiveBranchId(null)}
					className="cursor-pointer rounded-md transition-colors focus:bg-primary/10 focus:text-primary"
				>
					<GlobeIcon className="mr-2 h-4 w-4 opacity-70" /> All Branches
				</DropdownMenuItem>
				{branchesList?.map((branch: any) => (
					<DropdownMenuItem
						key={branch.id}
						onClick={() => setActiveBranchId(branch.id)}
						className="cursor-pointer rounded-md transition-colors focus:bg-primary/10 focus:text-primary"
					>
						<Building2Icon className="mr-2 h-4 w-4 opacity-70" />
						<span className="truncate">
							{branch.name} {branch.is_headquarters ? "(HQ)" : ""}
						</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function NotificationBell() {
	const { data: notifications } = trpc.notifications.list.useQuery(
		{ is_read: false },
		{ refetchInterval: 30000, refetchOnWindowFocus: true },
	);

	const unreadCount = notifications?.length || 0;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Link href="/admin/notifications">
						<Button
							variant="ghost"
							size="icon"
							className="relative h-9 w-9 rounded-full transition-colors hover:bg-accent/50"
						>
							<motion.div
								animate={
									unreadCount > 0 ? { rotate: [0, -15, 15, -15, 15, 0] } : {}
								}
								transition={{
									repeat: Number.POSITIVE_INFINITY,
									repeatDelay: 3,
									duration: 0.5,
								}}
							>
								<BellIcon className="h-5 w-5 text-muted-foreground" />
							</motion.div>
							{unreadCount > 0 && (
								<span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-background" />
							)}
						</Button>
					</Link>
				</TooltipTrigger>
				<TooltipContent className="rounded-lg font-medium text-xs">
					Notifications
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function AppLayout({
	children,
	navItems,
	namespace = "nav",
	role,
}: {
	children: React.ReactNode;
	navItems: NavItem[];
	namespace?: string;
	role?: string;
}) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isOffline, setIsOffline] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const { session } = useSession();
	const t = useTranslations(namespace);

	const handleSync = async () => {
		if (isOffline) {
			toast.error("Cannot sync while offline");
			return;
		}
		setIsSyncing(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/sync`,
				{ method: "POST" },
			);
			const data = await res.json();
			if (res.ok) {
				toast.success(`Sync complete. ${data.syncedCount} records synced.`);
			} else {
				toast.error(`Sync failed: ${data.error}`);
			}
		} catch (_err) {
			toast.error("Failed to connect to sync server");
		} finally {
			setIsSyncing(false);
		}
	};

	useEffect(() => {
		setIsOffline(!navigator.onLine);
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const pageNames: Record<string, string> = Object.fromEntries(
		navItems.map((item) => [item.href, t(item.labelKey as any)]),
	);

	return (
		<div className="flex h-screen w-full flex-col overflow-hidden bg-background selection:bg-primary/20">
			<NetworkStatusBanner />

			{/* Top Navbar */}
			<header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-border/40 border-b bg-background/80 px-4 backdrop-blur-xl transition-all">
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0 rounded-full transition-colors hover:bg-accent/50 md:hidden"
					onClick={() => setMobileMenuOpen(true)}
				>
					<MenuIcon className="h-5 w-5" />
					<span className="sr-only">Open Menu</span>
				</Button>

				<div className="flex shrink-0 items-center gap-2 md:w-[240px]">
					<Package2Icon className="h-6 w-6 text-primary" />
					<span className="hidden bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-lg text-transparent tracking-tight md:inline-block">
						Evaluna ERP
					</span>
					{role && ROLE_CONFIG[role] && (
						<span
							className={`hidden items-center rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wide md:inline-flex ${ROLE_CONFIG[role].bg} ${ROLE_CONFIG[role].color} ml-1`}
						>
							{ROLE_CONFIG[role].label}
						</span>
					)}
				</div>

				<div className="hidden items-center gap-2 font-medium text-muted-foreground text-sm md:flex">
					<span>/</span>
					<span className="text-foreground">
						{pageNames[pathname] || "Dashboard"}
					</span>
				</div>

				{isOffline && (
					<div className="hidden items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 font-semibold text-destructive text-xs shadow-sm ring-1 ring-destructive/20 md:flex">
						<WifiOffIcon className="h-3.5 w-3.5" />
						Offline Mode
					</div>
				)}

				<div className="ml-auto flex items-center gap-2 sm:gap-3">
					{isOffline && (
						<div className="flex items-center rounded-full bg-destructive/10 p-1.5 text-destructive ring-1 ring-destructive/20 md:hidden">
							<WifiOffIcon className="h-4 w-4" />
						</div>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={handleSync}
						disabled={isOffline || isSyncing}
						className="hidden h-9 gap-2 rounded-full border-border/50 bg-background/50 font-medium text-xs shadow-sm transition-all hover:bg-accent/50 md:flex"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 text-muted-foreground ${isSyncing ? "animate-spin text-primary" : ""}`}
						/>
						Sync
					</Button>

					<NotificationBell />
					<BranchSwitcher isSuperadmin={!!session?.user?.isSuperadmin} />

					<div className="hidden sm:block">
						<LocaleSwitcher />
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-9 w-9 overflow-hidden rounded-full shadow-sm ring-1 ring-border/50 transition-all hover:ring-2 hover:ring-primary/20"
							>
								<Image
									src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/placeholder-user.jpg`}
									width={36}
									height={36}
									alt="Avatar"
									className="object-cover"
								/>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-56 rounded-xl border-border/50 shadow-xl"
						>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="font-medium text-sm leading-none">
										{session?.user?.name || "My Account"}
									</p>
									<p className="text-muted-foreground text-xs leading-none">
										{session?.user?.email || ""}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{session?.user?.isSuperadmin || role === "admin" ? (
								<>
									<DropdownMenuItem
										asChild
										className="cursor-pointer rounded-md focus:bg-accent/50"
									>
										<Link
											href={role === "admin" ? "/admin/settings" : "/settings"}
										>
											Settings
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem
										asChild
										className="cursor-pointer rounded-md focus:bg-accent/50"
									>
										<a
											href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/backup`}
											download
										>
											Download Local Backup
										</a>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							) : null}
							<DropdownMenuItem className="cursor-pointer rounded-md focus:bg-accent/50">
								Support
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => logout()}
								className="cursor-pointer rounded-md text-destructive focus:bg-destructive/10 focus:text-destructive"
							>
								Logout
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{/* Mobile drawer overlay */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 md:hidden"
					>
						<div
							className="fixed inset-0 bg-background/80 backdrop-blur-sm"
							onClick={() => setMobileMenuOpen(false)}
						/>
						<motion.nav
							initial={{ x: -300 }}
							animate={{ x: 0 }}
							exit={{ x: -300 }}
							transition={{ type: "spring", stiffness: 400, damping: 40 }}
							className="fixed inset-y-0 left-0 flex w-[280px] flex-col gap-2 overflow-y-auto border-border/40 border-r bg-background p-4 shadow-2xl"
						>
							<div className="mb-6 flex items-center justify-between px-2">
								<div className="flex items-center gap-4">
									<Badge
										variant="secondary"
										className="bg-emerald-100 font-bold text-emerald-800 text-xs uppercase tracking-wider hover:bg-emerald-100/80"
									>
										{role
											? role.replace("_", " ")
											: session?.user?.role?.replace("_", " ") || "Salesperson"}
									</Badge>
									<span className="font-bold text-lg tracking-tight">
										Evaluna ERP
									</span>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setMobileMenuOpen(false)}
									className="h-8 w-8 rounded-full hover:bg-accent/50"
								>
									<XIcon className="h-4 w-4 text-muted-foreground" />
								</Button>
							</div>
							<div className="flex-1 space-y-1">
								{navItems.map(({ href, labelKey, icon: Icon }, i) => {
									const isActive =
										pathname === href || pathname.startsWith(`${href}/`);
									return (
										<motion.div
											key={href}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: i * 0.03, duration: 0.3 }}
										>
											<Link
												href={href}
												onClick={() => setMobileMenuOpen(false)}
												className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
													isActive
														? "bg-primary/10 font-medium text-primary"
														: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
												}`}
											>
												<Icon
													className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
												/>
												{t(labelKey as any)}
											</Link>
										</motion.div>
									);
								})}
							</div>
						</motion.nav>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="flex flex-1 overflow-hidden">
				{/* Desktop Sidebar */}
				<motion.aside
					initial={false}
					animate={{ width: isSidebarCollapsed ? 64 : 240 }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					className="group relative z-10 hidden shrink-0 flex-col border-border/40 border-r bg-background/50 backdrop-blur-xl md:flex"
				>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
						className="absolute top-6 -right-3 z-20 h-6 w-6 rounded-full border border-border/50 bg-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
					>
						{isSidebarCollapsed ? (
							<ChevronRight className="h-3 w-3 text-muted-foreground" />
						) : (
							<ChevronLeft className="h-3 w-3 text-muted-foreground" />
						)}
					</Button>

					<TooltipProvider delayDuration={0}>
						<div className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4">
							{navItems.map(({ href, labelKey, icon: Icon }) => {
								const isActive =
									pathname === href || pathname.startsWith(`${href}/`);

								const NavLink = (
									<Link
										href={href}
										className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all ${
											isActive
												? "bg-primary/10 font-medium text-primary"
												: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
										}`}
									>
										{isActive && (
											<motion.div
												layoutId="active-nav-indicator"
												className="absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full bg-primary"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ duration: 0.2 }}
											/>
										)}
										<Icon
											className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
										/>
										<AnimatePresence>
											{!isSidebarCollapsed && (
												<motion.span
													initial={{ opacity: 0, width: 0 }}
													animate={{ opacity: 1, width: "auto" }}
													exit={{ opacity: 0, width: 0 }}
													className="truncate whitespace-nowrap"
												>
													{t(labelKey as any)}
												</motion.span>
											)}
										</AnimatePresence>
									</Link>
								);

								if (isSidebarCollapsed) {
									return (
										<Tooltip key={href}>
											<TooltipTrigger asChild>{NavLink}</TooltipTrigger>
											<TooltipContent
												side="right"
												className="ml-2 rounded-lg border-border/50 font-medium text-xs"
											>
												{t(labelKey as any)}
											</TooltipContent>
										</Tooltip>
									);
								}

								return <div key={href}>{NavLink}</div>;
							})}
						</div>
					</TooltipProvider>
				</motion.aside>

				{/* Main Content Area */}
				<main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-muted/20">
					<motion.div
						key={pathname}
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -15 }}
						transition={{
							type: "spring",
							stiffness: 400,
							damping: 40,
							mass: 0.8,
						}}
						className="mx-auto h-full w-full max-w-7xl p-4 md:p-6"
					>
						{children}
					</motion.div>
				</main>
			</div>

			<ChatWidget />
		</div>
	);
}

export function AppLayoutWithBranch({
	children,
	navItems,
	namespace,
	role,
}: {
	children: React.ReactNode;
	navItems: NavItem[];
	namespace?: string;
	role?: string;
}) {
	return (
		<BranchProvider>
			<AppLayout navItems={navItems} namespace={namespace} role={role}>
				{children}
			</AppLayout>
		</BranchProvider>
	);
}
