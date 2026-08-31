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
import { Bell, Clock, Home, Menu, Store, WifiOff } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useSession } from "@/hooks/use-session";
import { trpc } from "@/lib/trpc/client";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
	onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
	const [isOffline, setIsOffline] = React.useState(false);
	const { session } = useSession();
	const handleLogout = () => {
		import("@/lib/auth-client").then((mod) => mod.authClient.signOut().catch(console.error));
		window.location.href = "/login";
	};

	React.useEffect(() => {
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);

		setIsOffline(!navigator.onLine);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const { data: branches } = trpc.branches.list.useQuery();
	const { data: statusData } = trpc.attendance.myStatus.useQuery();
	const activeShift = statusData?.activeShift;

	const activeBranch = React.useMemo(() => {
		const user = session?.user as any;
		if (!branches || !user?.branchId) return "Main Branch";
		return branches.find((b) => b.id === user.branchId)?.name || "Main Branch";
	}, [branches, session?.user]);

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			{isOffline && (
				<div className="flex items-center justify-center bg-destructive px-4 py-1 font-medium text-destructive-foreground text-xs">
					<WifiOff className="mr-2 h-3 w-3" />
					You are currently offline. Some features may be limited.
				</div>
			)}
			<div className="flex h-16 items-center gap-4 px-4">
				<Button
					variant="ghost"
					size="icon"
					className="md:hidden"
					onClick={onMenuClick}
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle Menu</span>
				</Button>
				<div className="flex flex-1 items-center gap-4">
					<CommandPalette />
				</div>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="hidden md:flex">
								<Store className="mr-2 h-4 w-4" />
								{activeBranch}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{branches?.map((branch) => (
								<DropdownMenuItem key={branch.id}>
									{branch.name}
								</DropdownMenuItem>
							))}
							{!branches?.length && (
								<DropdownMenuItem disabled>
									No branches available
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button variant="ghost" size="icon" className="relative">
						<Bell className="h-5 w-5" />
						<span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
						<span className="sr-only">Notifications</span>
					</Button>

					{/* Admin-only public site button */}
					{session?.user?.isSuperadmin && (
						<Link href="/" target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" className="hidden md:flex">
								<Home className="h-5 w-5" />
								<span className="sr-only">Public Site</span>
							</Button>
						</Link>
					)}

					<Link href="/staff">
						<Button
							variant="ghost"
							size="sm"
							className={`hidden md:flex ${activeShift ? "text-green-500" : "text-orange-500"}`}
						>
							<Clock className="mr-2 h-4 w-4" />
							{activeShift ? "Clocked In" : "Clocked Out"}
						</Button>
					</Link>

					<ThemeToggle />

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="relative h-8 w-8 rounded-full border"
							>
								<Menu className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end" forceMount>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="font-medium text-sm leading-none">
										{session?.user?.name || "User"}
									</p>
									<p className="text-muted-foreground text-xs leading-none">
										{session?.user?.email || ""}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{session?.user?.isSuperadmin && (
								<>
									<DropdownMenuItem>Settings</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<Link href="/staff" className="w-full">
								<DropdownMenuItem className="cursor-pointer">
									Staff Portal
								</DropdownMenuItem>
							</Link>
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">Log out</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
