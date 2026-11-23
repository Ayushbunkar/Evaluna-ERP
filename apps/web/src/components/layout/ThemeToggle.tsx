"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
	const { setTheme, theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					title="Switch Theme (Light / Dark)"
					className={
						className ||
						"h-9 w-9 rounded-full ring-1 ring-border/50 transition-all hover:bg-accent hover:ring-2 hover:ring-primary/20"
					}
				>
					<Sun className="h-4 w-4 rotate-0 scale-100 text-amber-500 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-4 w-4 rotate-90 scale-0 text-blue-400 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-36 rounded-xl border-border/50 shadow-xl"
			>
				<DropdownMenuItem
					onClick={() => setTheme("light")}
					className={`cursor-pointer gap-2 ${mounted && theme === "light" ? "font-semibold text-primary" : ""}`}
				>
					<Sun className="h-4 w-4 text-amber-500" />
					<span>Light</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("dark")}
					className={`cursor-pointer gap-2 ${mounted && theme === "dark" ? "font-semibold text-primary" : ""}`}
				>
					<Moon className="h-4 w-4 text-blue-400" />
					<span>Dark</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("system")}
					className={`cursor-pointer gap-2 ${mounted && theme === "system" ? "font-semibold text-primary" : ""}`}
				>
					<Laptop className="h-4 w-4 text-muted-foreground" />
					<span>System</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
