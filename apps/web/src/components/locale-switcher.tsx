"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import { GlobeIcon } from "lucide-react";
import { useLocale } from "next-intl";

export function LocaleSwitcher() {
	let locale = "en";
	try {
		locale = useLocale();
	} catch {
		// Fallback when rendered outside NextIntlClientProvider or during SSR
	}

	const switchLocale = (newLocale: string) => {
		document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
		document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
		window.location.reload();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-8 w-8 p-0 sm:w-auto sm:px-3 gap-2 rounded-full border-border/50 bg-background font-medium text-xs shadow-sm hover:bg-accent/50"
					aria-label="Switch language"
				>
					<GlobeIcon className="h-4 w-4 text-muted-foreground" />
					<span className="hidden sm:inline">{locale === "en" ? "English" : "हिंदी"}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="rounded-xl shadow-xl">
				<DropdownMenuItem
					onClick={() => switchLocale("en")}
					className="cursor-pointer text-xs focus:bg-primary/10"
				>
					English
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => switchLocale("hi")}
					className="cursor-pointer text-xs focus:bg-primary/10"
				>
					हिंदी (Hindi)
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
