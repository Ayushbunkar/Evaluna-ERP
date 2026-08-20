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
	LayoutDashboardIcon,
	LogOutIcon,
	MenuIcon,
	PackageIcon,
	PlusCircleIcon,
	ShoppingBagIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/(auth)/login/actions";

const NAV = [
	{ href: "/customer", label: "Dashboard", icon: LayoutDashboardIcon },
	{ href: "/customer/orders", label: "My Orders", icon: ShoppingBagIcon },
	{ href: "/customer/orders/new", label: "New Order", icon: PlusCircleIcon },
	{ href: "/customer/profile", label: "Profile", icon: UserIcon },
];

function isActivePath(pathname: string, href: string) {
	if (href === "/customer") return pathname === "/customer";
	// "New Order" is more specific than "My Orders" — avoid both lighting up.
	if (href === "/customer/orders")
		return (
			pathname === "/customer/orders" ||
			(pathname.startsWith("/customer/orders/") &&
				!pathname.startsWith("/customer/orders/new"))
		);
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomerShell({
	children,
	name,
	email,
}: {
	children: React.ReactNode;
	name: string;
	email: string;
}) {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);
	const initial = (name?.trim()?.[0] ?? "C").toUpperCase();

	const navLinks = (onNavigate?: () => void) =>
		NAV.map(({ href, label, icon: Icon }) => {
			const active = isActivePath(pathname, href);
			return (
				<Link
					key={href}
					href={href}
					onClick={onNavigate}
					className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
						active
							? "bg-primary/10 font-medium text-primary"
							: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
					}`}
				>
					<Icon className="h-4 w-4 shrink-0" />
					<span className="truncate">{label}</span>
				</Link>
			);
		});

	return (
		<div className="flex h-screen w-full flex-col overflow-hidden bg-background">
			<header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-border/40 border-b bg-background/80 px-3 backdrop-blur-xl sm:px-4">
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0 rounded-full md:hidden"
					onClick={() => setMobileOpen(true)}
				>
					<MenuIcon className="h-5 w-5" />
					<span className="sr-only">Open menu</span>
				</Button>

				<div className="flex shrink-0 items-center gap-2 md:w-[220px]">
					<PackageIcon className="h-6 w-6 text-primary" />
					<span className="font-bold text-base tracking-tight sm:text-lg">
						Evaluna
					</span>
					<span className="ml-1 hidden items-center rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-[10px] text-emerald-800 uppercase tracking-wide sm:inline-flex dark:bg-emerald-900/40 dark:text-emerald-300">
						Customer
					</span>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm ring-1 ring-border/50"
							>
								{initial}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56 rounded-xl">
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="font-medium text-sm leading-none">
										{name || "My Account"}
									</p>
									<p className="text-muted-foreground text-xs leading-none">
										{email}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild className="cursor-pointer rounded-md">
								<Link href="/customer/profile">Profile</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => logout()}
								className="cursor-pointer rounded-md text-destructive focus:bg-destructive/10 focus:text-destructive"
							>
								<LogOutIcon className="mr-2 h-4 w-4" /> Logout
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{/* PLACEHOLDER_BODY */}

			{/* Mobile drawer */}
			{mobileOpen && (
				<div className="fixed inset-0 z-50 md:hidden">
					<div
						className="fixed inset-0 bg-background/80 backdrop-blur-sm"
						onClick={() => setMobileOpen(false)}
					/>
					<nav className="fixed inset-y-0 left-0 flex w-[260px] flex-col gap-1 border-border/40 border-r bg-background p-4 shadow-2xl">
						<div className="mb-4 flex items-center justify-between px-2">
							<span className="font-bold text-lg">Evaluna</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 rounded-full"
								onClick={() => setMobileOpen(false)}
							>
								<XIcon className="h-4 w-4" />
							</Button>
						</div>
						{navLinks(() => setMobileOpen(false))}
					</nav>
				</div>
			)}

			<div className="flex flex-1 overflow-hidden">
				<aside className="hidden w-[220px] shrink-0 flex-col border-border/40 border-r bg-background/50 px-3 py-4 md:flex">
					<div className="flex flex-1 flex-col gap-1">{navLinks()}</div>
				</aside>

				<main className="relative flex-1 overflow-y-auto bg-muted/20">
					<div className="mx-auto h-full w-full max-w-6xl p-3 sm:p-4 md:p-6">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
