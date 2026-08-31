"use client";

import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { AlertTriangleIcon, InboxIcon, RefreshCwIcon } from "lucide-react";

/**
 * Shared loading / error / empty states for admin list pages.
 * These keep the four query states (loading, error, empty, success) visually
 * distinct and consistent across the admin dashboard.
 */

export function TableLoading({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
	return (
		<div className="overflow-hidden rounded-lg border border-border/50">
			<div className="flex items-center gap-4 border-border/50 border-b bg-muted/30 px-4 py-3">
				{Array.from({ length: columns }).map((_, i) => (
					<Skeleton key={i} className="h-4 flex-1" />
				))}
			</div>
			{Array.from({ length: rows }).map((_, r) => (
				<div
					key={r}
					className="flex items-center gap-4 border-border/30 border-b px-4 py-3 last:border-0"
				>
					{Array.from({ length: columns }).map((_, c) => (
						<Skeleton key={c} className="h-4 flex-1" />
					))}
				</div>
			))}
		</div>
	);
}

export function DataError({
	title = "Something went wrong",
	message,
	onRetry,
}: {
	title?: string;
	message?: string;
	onRetry?: () => void;
}) {
	return (
		<div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
				<AlertTriangleIcon className="h-6 w-6 text-destructive" />
			</div>
			<div className="space-y-1">
				<p className="font-semibold text-foreground text-sm">{title}</p>
				{message && (
					<p className="max-w-md text-muted-foreground text-xs">{message}</p>
				)}
			</div>
			{onRetry && (
				<Button variant="outline" size="sm" onClick={onRetry}>
					<RefreshCwIcon className="mr-2 h-4 w-4" /> Retry
				</Button>
			)}
		</div>
	);
}

export function DataEmpty({
	title = "Nothing here yet",
	message,
}: {
	title?: string;
	message?: string;
}) {
	return (
		<div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-border/50 border-dashed p-8 text-center">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<InboxIcon className="h-6 w-6 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<p className="font-semibold text-foreground text-sm">{title}</p>
				{message && (
					<p className="max-w-md text-muted-foreground text-xs">{message}</p>
				)}
			</div>
		</div>
	);
}
