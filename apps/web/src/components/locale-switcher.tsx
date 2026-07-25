"use client";

import { useLocale } from "next-intl";
import { Button } from "@evaluna/ui/components/button";
import { GlobeIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@evaluna/ui/components/dropdown-menu";

export function LocaleSwitcher() {
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 rounded-full border-border/50 shadow-sm hover:bg-accent/50 text-xs font-medium">
          <GlobeIcon className="h-4 w-4 text-muted-foreground" />
          <span>{locale === 'en' ? 'English' : 'हिंदी'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl shadow-xl">
        <DropdownMenuItem onClick={() => switchLocale("en")} className="text-xs focus:bg-primary/10">
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLocale("hi")} className="text-xs focus:bg-primary/10">
          हिंदी (Hindi)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
