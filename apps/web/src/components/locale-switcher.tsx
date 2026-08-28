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
	const locale = useLocale();

	const switchLocale = (newLocale: string) => {
		document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
		window.location.reload();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-9 gap-2 rounded-full border-border/50 font-medium text-xs shadow-sm hover:bg-accent/50"
				>
					<GlobeIcon className="h-4 w-4 text-muted-foreground" />
					<span>{locale === "en" ? "English" : "à¤¹à¤¿à¤‚à¤¦à¥€"}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="rounded-xl shadow-xl">
				<DropdownMenuItem
					onClick={() => switchLocale("en")}
					className="text-xs focus:bg-primary/10"
				>
					English
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => switchLocale("hi")}
					className="text-xs focus:bg-primary/10"
				>
					à¤¹à¤¿à¤‚à¤¦à¥€ (Hindi)
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
