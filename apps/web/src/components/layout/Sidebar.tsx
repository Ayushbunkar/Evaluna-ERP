"use client";

import { cn } from "@evaluna/ui/lib/utils";
import {
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Package,
	Settings,
	ShoppingCart,
	Users,
	Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";

export type NavItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	roles: string[];
};

export const defaultNavItems: NavItem[] = [
	{
		title: "Dashboard",
		href: "/manager/dashboard",
		icon: LayoutDashboard,
		roles: ["manager", "admin"],
	},
	{
		title: "Sales",
		href: "/manager/sales",
		icon: ShoppingCart,
		roles: ["manager", "admin"],
	},
	{
		title: "Inventory",
		href: "/manager/inventory",
		icon: Package,
		roles: ["manager", "admin"],
	},
	{
		title: "Staff",
		href: "/manager/staff",
		icon: Users,
		roles: ["manager", "admin"],
	},
	{
		title: "Settings",
		href: "/manager/settings",
		icon: Settings,
		roles: ["manager", "admin"],
	},
];

export const adminNavItems: NavItem[] = [
	...defaultNavItems,
	{
		title: "Public Site",
		href: "/",
		icon: Home,
		roles: ["admin"],
	},
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
	items?: NavItem[];
	userRole?: string;
	onItemClick?: () => void;
	showPublicSiteLink?: boolean;
}

export function Sidebar({
	className,
	items = defaultNavItems,
	userRole = "manager",
	onItemClick,
	showPublicSiteLink = false,
	...props
}: SidebarProps) {
	const pathname = usePathname();

	const filteredItems = items.filter((item) => item.roles.includes(userRole));

// Add public site link for admins if enabled
if (showPublicSiteLink && userRole === "admin") {
	filteredItems.push({
		title: "Public Site",
		href: "/",
		icon: Home,
		roles: ["admin"],
	});
}

	return (
		<div
			className={cn(
				"flex h-screen flex-col border-r bg-card pb-12 text-card-foreground",
				className,
			)}
			{...props}
		>
			<div className="flex-1 space-y-4 overflow-y-auto py-4">
				<div className="px-3 py-2">
					<h2 className="mb-2 flex items-center gap-2 px-4 font-semibold text-lg tracking-tight">
						<span className="rounded-md bg-primary p-1 text-primary-foreground">
							<Package className="h-4 w-4" />
						</span>
						Evaluna ERP
					</h2>
					<div className="mt-6 space-y-1">
						{filteredItems.map((item) => {
							const isActive =
								pathname === item.href || pathname.startsWith(`${item.href}/`);
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={onItemClick}
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
										isActive
											? "bg-accent text-accent-foreground"
											: "transparent",
									)}
								>
									<item.icon
										className={cn(
											"h-4 w-4",
											isActive ? "text-primary" : "text-muted-foreground",
										)}
									/>
									{item.title}
								</Link>
							);
						})}
					</div>
				</div>
			</div>
			<div className="mt-auto border-t px-3 py-4">
				<button className="flex w-full items-center gap-3 rounded-md px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-destructive/10 hover:text-destructive">
					<LogOut className="h-4 w-4" />
					Log Out
				</button>
			</div>
		</div>
	);
}
