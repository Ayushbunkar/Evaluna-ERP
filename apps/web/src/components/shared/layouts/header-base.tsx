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
import { Bell, Menu, Search, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";

interface HeaderBaseProps {
	title: string;
	onMenuClick: () => void;
}

export function HeaderBase({ title, onMenuClick }: HeaderBaseProps) {
	const { session } = useSession();
	const router = useRouter();

	const handleLogout = async () => {
		await authClient.signOut();
		router.push("/login");
	};

	return (
		<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 shadow-sm md:px-6">
			<Button
				variant="ghost"
				size="icon"
				className="lg:hidden"
				onClick={onMenuClick}
			>
				<Menu className="h-5 w-5" />
				<span className="sr-only">Toggle sidebar</span>
			</Button>

			<div className="flex flex-1 items-center gap-4 md:gap-8">
				<h1 className="hidden font-semibold text-lg tracking-tight md:block">
					{title}
				</h1>

				<form className="ml-auto flex-1 sm:flex-initial">
					<div className="relative">
						<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="search"
							placeholder="Search (Ctrl+K)..."
							className="w-full rounded-md border bg-muted/50 py-2 pr-4 pl-9 text-sm outline-none focus:ring-1 focus:ring-primary md:w-[300px] lg:w-[400px]"
						/>
					</div>
				</form>
			</div>

			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					<span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive" />
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
						>
							<UserIcon className="h-5 w-5 text-primary" />
							<span className="sr-only">Toggle user menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							<div className="flex flex-col space-y-1">
								<p className="font-medium text-sm leading-none">
									{session?.user?.name || "User"}
								</p>
								<p className="text-muted-foreground text-xs leading-none">
									{session?.user?.email || "email@example.com"}
								</p>
								<p className="mt-1 w-max rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs capitalize">
									{session?.user?.role?.replace("_", " ") || "Role"}
								</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => router.push("/profile")}>
							Profile
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => router.push("/settings")}>
							Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className="text-destructive focus:text-destructive"
						>
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
