"use client";

import { useLocale } from "next-intl";

export function LocaleSwitcher() {
  useLocale();

  return <span className="rounded border border-border px-2 py-1 text-xs font-medium text-muted-foreground">English</span>;
}
