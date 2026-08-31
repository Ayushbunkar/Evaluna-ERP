"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import type { ReactNode } from "react";
import { DataError } from "./data-states";

/**
 * Read-only record view used by every "View" action in the admin tables.
 *
 * It fetches nothing itself — the caller passes the query state — so the same
 * shell handles loading, failure and content without duplicating that logic in
 * five pages.
 */

export type DetailRow = {
	label: string;
	value: ReactNode;
	wide?: boolean;
};

export type DetailSection = {
	title: string;
	rows: DetailRow[];
};

export function DetailDialog({
	open,
	onOpenChange,
	title,
	subtitle,
	sections,
	loading = false,
	error,
	onRetry,
	footer,
	extra,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle?: string;
	sections: DetailSection[];
	loading?: boolean;
	error?: unknown;
	onRetry?: () => void;
	footer?: ReactNode;
	extra?: ReactNode;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{subtitle && <DialogDescription>{subtitle}</DialogDescription>}
				</DialogHeader>

				{loading ? (
					<div className="space-y-4" aria-busy="true">
						{Array.from({ length: 3 }).map((_, section) => (
							<div key={section} className="space-y-2">
								<Skeleton className="h-3 w-28" />
								<div className="grid gap-3 sm:grid-cols-2">
									{Array.from({ length: 4 }).map((_, row) => (
										<div key={row} className="space-y-1">
											<Skeleton className="h-3 w-20" />
											<Skeleton className="h-4 w-32" />
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				) : error ? (
					<DataError error={error} onRetry={onRetry} entity="record" />
				) : (
					<div className="space-y-5">
						{sections.map((section) => (
							<section key={section.title} className="space-y-2">
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
									{section.title}
								</h3>
								<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
									{section.rows.map((row) => (
										<div
											key={row.label}
											className={row.wide ? "sm:col-span-2" : undefined}
										>
											<dt className="text-muted-foreground text-xs">{row.label}</dt>
											<dd className="mt-0.5 break-words font-medium text-sm">
												{row.value}
											</dd>
										</div>
									))}
								</dl>
							</section>
						))}
						{extra}
					</div>
				)}

				{footer && !loading && !error && (
					<div className="mt-2 flex flex-wrap justify-end gap-2 border-border/50 border-t pt-4">
						{footer}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
