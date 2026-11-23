"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import { ScrollArea } from "@evaluna/ui/components/scroll-area";
import {
	Activity,
	ArrowUpRight,
	AtSign,
	BarChart3,
	Bell,
	Bookmark,
	Bot,
	Calendar,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	ExternalLink,
	Eye,
	FileText,
	Flame,
	FolderHeart,
	Grid,
	Hash,
	HelpCircle,
	Inbox,
	Instagram,
	Layers,
	LayoutDashboard,
	Megaphone,
	Menu,
	MessageCircle,
	Moon,
	PenSquare,
	Plus,
	PlusCircle,
	RefreshCw,
	Settings,
	Share2,
	ShieldCheck,
	Sparkles,
	Sun,
	Tag,
	Target,
	TrendingUp,
	Users,
	Users2,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

interface NavItem {
	title: string;
	href: string;
	icon: React.ElementType;
	badge?: string;
}

interface NavSection {
	category: string;
	items: NavItem[];
}

const navSections: NavSection[] = [
	{
		category: "Main",
		items: [
			{ title: "Overview", href: "/marketing", icon: LayoutDashboard },
			{ title: "My Accounts", href: "/marketing/accounts", icon: AtSign },
			{ title: "All Posts", href: "/marketing/posts", icon: Layers },
			{ title: "Content Planner", href: "/marketing/planner", icon: Calendar },
			{ title: "Create Post", href: "/marketing/create", icon: PenSquare, badge: "New" },
			{ title: "Media Library", href: "/marketing/media", icon: FolderHeart },
		],
	},
	{
		category: "Engagement",
		items: [
			{ title: "Comments", href: "/marketing/comments", icon: MessageCircle, badge: "3" },
			{ title: "Mentions", href: "/marketing/mentions", icon: Tag },
			{ title: "Messages / Inbox", href: "/marketing/inbox", icon: Inbox, badge: "1" },
		],
	},
	{
		category: "Analytics",
		items: [
			{ title: "Overview Analytics", href: "/marketing/analytics", icon: BarChart3 },
			{ title: "Post Performance", href: "/marketing/analytics/posts", icon: TrendingUp },
			{ title: "Audience Insights", href: "/marketing/analytics/audience", icon: Users2 },
			{ title: "Reach & Engagement", href: "/marketing/analytics/reach", icon: Flame },
			{ title: "Hashtag Performance", href: "/marketing/analytics/hashtags", icon: Hash },
		],
	},
	{
		category: "Marketing Tools",
		items: [
			{ title: "Hashtag Manager", href: "/marketing/hashtags", icon: Bookmark },
			{ title: "Caption Generator", href: "/marketing/captions", icon: FileText },
			{ title: "Campaign Manager", href: "/marketing/campaigns", icon: Megaphone },
			{ title: "AI Content Assistant", href: "/marketing/ai-assistant", icon: Bot, badge: "AI" },
		],
	},
	{
		category: "Management",
		items: [
			{ title: "Notifications", href: "/marketing/notifications", icon: Bell },
			{ title: "Team Members", href: "/marketing/team", icon: ShieldCheck },
			{ title: "Settings", href: "/marketing/settings", icon: Settings },
			{ title: "Help & Support", href: "/marketing/help", icon: HelpCircle },
		],
	},
];

export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const trpc = useTRPC();
	const accountsQuery = trpc.instagram.getAccounts.useQuery();
	const notifsQuery = trpc.instagram.getNotifications.useQuery();

	useEffect(() => {
		setMounted(true);
	}, []);

	// Close mobile drawer on route change
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	const currentAccount = accountsQuery.data?.[0] || {
		username: "evalunagroceries",
		name: "Evaluna Wholesale",
		profilePictureUrl:
			"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
		followersCount: 14820,
	};

	const unreadNotifs = notifsQuery.data?.unreadCount || 2;

	return (
		<div className="flex min-h-screen bg-background text-foreground antialiased">
			{/* Mobile Backdrop */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
					onClick={() => setMobileOpen(false)}
					onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
					role="button"
					tabIndex={0}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar Container */}
			<aside
				className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/60 bg-card/95 backdrop-blur-md transition-all duration-300 md:static ${
					mobileOpen
						? "translate-x-0 w-72"
						: "-translate-x-full md:translate-x-0"
				} ${collapsed ? "md:w-20" : "md:w-72"}`}
			>
				{/* Sidebar Header */}
				<div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
					<div className="flex items-center gap-3 overflow-hidden">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md">
							<Instagram className="h-5 w-5" />
						</div>
						{!collapsed && (
							<div className="flex flex-col truncate">
								<span className="font-bold text-sm tracking-tight text-foreground">
									Evaluna Marketing
								</span>
								<span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
									<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
									Meta Graph API
								</span>
							</div>
						)}
					</div>

					{/* Desktop collapse toggle */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setCollapsed(!collapsed)}
						className="hidden h-8 w-8 text-muted-foreground hover:text-foreground md:flex"
						title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
					>
						{collapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronLeft className="h-4 w-4" />
						)}
					</Button>

					{/* Mobile close button */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMobileOpen(false)}
						className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>

				{/* Account Switcher Header Pill */}
				<div className="border-b border-border/40 p-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className={`flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-2 text-left transition-colors hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-primary ${
									collapsed ? "justify-center px-0" : ""
								}`}
							>
								<img
									src={currentAccount.profilePictureUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"}
									alt={currentAccount.username}
									className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
								/>
								{!collapsed && (
									<div className="flex-1 min-w-0">
										<p className="truncate font-semibold text-xs text-foreground">
											@{currentAccount.username}
										</p>
										<p className="truncate text-[10px] text-muted-foreground">
											{(currentAccount.followersCount || 14820).toLocaleString()}{" "}
											Followers
										</p>
									</div>
								)}
								{!collapsed && (
									<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
								)}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-64 rounded-xl border-border/60">
							<DropdownMenuLabel className="text-xs font-semibold">
								Connected Accounts
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="cursor-pointer gap-2 py-2">
								<img
									src={currentAccount.profilePictureUrl || ""}
									alt=""
									className="h-7 w-7 rounded-full object-cover"
								/>
								<div className="flex-1 truncate">
									<p className="font-medium text-xs">@{currentAccount.username}</p>
									<p className="text-[10px] text-emerald-500 font-medium">Active • Business</p>
								</div>
								<CheckCircle2 className="h-4 w-4 text-emerald-500" />
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link
									href="/marketing/accounts"
									className="cursor-pointer gap-2 text-xs font-medium text-primary hover:text-primary/90"
								>
									<Plus className="h-4 w-4" />
									Connect Another Account
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Navigation Links */}
				<ScrollArea className="flex-1 px-3 py-3">
					<div className="space-y-5">
						{navSections.map((section) => (
							<div key={section.category} className="space-y-1">
								{!collapsed && (
									<p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
										{section.category}
									</p>
								)}
								{section.items.map((item) => {
									const isActive =
										pathname === item.href ||
										(item.href !== "/marketing" && pathname.startsWith(item.href));
									const Icon = item.icon;

									return (
										<Link
											key={item.href}
											href={item.href}
											title={collapsed ? item.title : undefined}
											className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
												isActive
													? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
													: "text-muted-foreground hover:bg-accent hover:text-foreground"
											} ${collapsed ? "justify-center px-0" : ""}`}
										>
											<Icon
												className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
													isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
												}`}
											/>
											{!collapsed && (
												<span className="truncate flex-1">{item.title}</span>
											)}
											{!collapsed && item.badge && (
												<span
													className={`ml-auto inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
														isActive
															? "bg-white/20 text-white"
															: item.badge === "AI"
																? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
																: "bg-primary/10 text-primary"
													}`}
												>
													{item.badge}
												</span>
											)}
										</Link>
									);
								})}
							</div>
						))}
					</div>
				</ScrollArea>

				{/* Sidebar Footer: Theme Switcher & Status */}
				<div className="border-t border-border/50 p-3 space-y-2">
					<div className={`flex items-center gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
						{!collapsed && (
							<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
								<span className="h-2 w-2 rounded-full bg-emerald-500" />
								<span>Token: 58d left</span>
							</div>
						)}
						{mounted && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
								className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
								title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
							>
								{theme === "dark" ? (
									<Sun className="h-4 w-4 text-amber-400" />
								) : (
									<Moon className="h-4 w-4 text-blue-500" />
								)}
							</Button>
						)}
					</div>
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col min-w-0 overflow-hidden">
				{/* Top App Header */}
				<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md sm:px-6">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileOpen(true)}
							className="md:hidden h-9 w-9 text-muted-foreground"
						>
							<Menu className="h-5 w-5" />
						</Button>
						<div>
							<h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base capitalize">
								{pathname === "/marketing"
									? "Instagram Marketing Overview"
									: pathname.split("/").filter(Boolean).slice(-1)[0].replace("-", " ")}
							</h2>
							<p className="hidden text-[11px] text-muted-foreground sm:block">
								Evaluna Smart Wholesale Grocery • MP Regional Network
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 sm:gap-3">
						<Button
							variant="outline"
							size="sm"
							asChild
							className="h-8 gap-1.5 text-xs rounded-lg border-border/70 shadow-xs hidden sm:inline-flex"
						>
							<Link href="/marketing/planner">
								<Calendar className="h-3.5 w-3.5" />
								Planner
							</Link>
						</Button>

						<Button
							size="sm"
							asChild
							className="h-8 gap-1.5 text-xs rounded-lg bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white font-medium shadow-md shadow-pink-600/20 hover:opacity-95"
						>
							<Link href="/marketing/create">
								<Plus className="h-3.5 w-3.5" />
								Create Post
							</Link>
						</Button>

						<Link
							href="/marketing/notifications"
							className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
							title="Notifications"
						>
							<Bell className="h-4 w-4" />
							{unreadNotifs > 0 && (
								<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
									{unreadNotifs}
								</span>
							)}
						</Link>
					</div>
				</header>

				{/* Page Outlet */}
				<main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 lg:p-8">
					{children}
				</main>
			</div>
		</div>
	);
}
