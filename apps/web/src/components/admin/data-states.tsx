"use client";

import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	InboxIcon,
	LockIcon,
	RefreshCwIcon,
	SearchXIcon,
	ShieldOffIcon,
	WifiOffIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { normaliseError } from "@/lib/admin/errors";

/**
 * The four-and-a-bit states every admin list has to tell apart:
 * loading, empty, "empty because you filtered", error, unauthorised, forbidden.
 *
 * Collapsing these into one grey box is what makes an expired session look like
 * an empty database, so each one gets its own copy and its own recovery action.
 */

export function TableLoading({
	columns = 5,
	rows = 6,
}: {
	columns?: number;
	rows?: number;
}) {
	return (
		<div
			className="overflow-hidden rounded-lg border border-border/50"
			aria-busy="true"
			aria-live="polite"
		>
			<span className="sr-only">Loading data…</span>
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

export function CardsLoading({ count = 6 }: { count?: number }) {
	return (
		<div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" aria-busy="true">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="space-y-3 rounded-lg border border-border/50 bg-card/50 p-5"
				>
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-7 w-32" />
					<Skeleton className="h-3 w-20" />
				</div>
			))}
		</div>
	);
}

function StateShell({
	tone = "muted",
	icon,
	title,
	message,
	action,
}: {
	tone?: "muted" | "danger" | "warning";
	icon: React.ReactNode;
	title: string;
	message?: string;
	action?: React.ReactNode;
}) {
	const border =
		tone === "danger"
			? "border-destructive/30 bg-destructive/5"
			: tone === "warning"
				? "border-amber-500/30 bg-amber-500/5"
				: "border-border/50 border-dashed";
	const iconBg =
		tone === "danger"
			? "bg-destructive/10 text-destructive"
			: tone === "warning"
				? "bg-amber-500/10 text-amber-600"
				: "bg-muted text-muted-foreground";
	return (
		<div
			role={tone === "danger" ? "alert" : undefined}
			className={`flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center ${border}`}
		>
			<div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
				{icon}
			</div>
			<div className="space-y-1">
				<p className="font-semibold text-foreground text-sm">{title}</p>
				{message && (
					<p className="mx-auto max-w-md text-muted-foreground text-xs">{message}</p>
				)}
			</div>
			{action}
		</div>
	);
}

/** Prompts a fresh sign-in and drops every cached protected response first. */
function ReauthButton() {
	const router = useRouter();
	const queryClient = useQueryClient();
	return (
		<Button
			variant="outline"
			size="sm"
			onClick={() => {
				queryClient.clear();
				router.replace("/login?expired=1");
			}}
		>
			<LockIcon className="mr-2 h-4 w-4" /> Sign in again
		</Button>
	);
}

/**
 * Renders the right recovery surface for a query failure.
 * Pass the raw react-query/tRPC error; classification happens here.
 */
export function DataError({
	error,
	title,
	message,
	onRetry,
	entity = "data",
}: {
	error?: unknown;
	title?: string;
	message?: string;
	onRetry?: () => void;
	entity?: string;
}) {
	const normalised = normaliseError(error);

	if (normalised.kind === "unauthorized") {
		return (
			<StateShell
				tone="warning"
				icon={<LockIcon className="h-6 w-6" />}
				title="Your session has expired"
				message="Please sign in again to continue managing this section."
				action={<ReauthButton />}
			/>
		);
	}

	if (normalised.kind === "forbidden") {
		return (
			<StateShell
				tone="warning"
				icon={<ShieldOffIcon className="h-6 w-6" />}
				title="You do not have permission to view this section"
				message="Ask an administrator to grant your role access, then reload the page."
			/>
		);
	}

	if (normalised.kind === "network") {
		return (
			<StateShell
				tone="danger"
				icon={<WifiOffIcon className="h-6 w-6" />}
				title="Cannot reach the server"
				message="The request did not complete. Check your connection and try again."
				action={
					onRetry ? (
						<Button variant="outline" size="sm" onClick={onRetry}>
							<RefreshCwIcon className="mr-2 h-4 w-4" /> Retry
						</Button>
					) : undefined
				}
			/>
		);
	}

	return (
		<StateShell
			tone="danger"
			icon={<AlertTriangleIcon className="h-6 w-6" />}
			title={title ?? `Unable to load ${entity}`}
			message={message ?? normalised.message}
			action={
				onRetry ? (
					<Button variant="outline" size="sm" onClick={onRetry}>
						<RefreshCwIcon className="mr-2 h-4 w-4" /> Retry
					</Button>
				) : undefined
			}
		/>
	);
}

/** Nothing in the table because nothing exists yet. */
export function DataEmpty({
	title = "Nothing here yet",
	message,
	action,
}: {
	title?: string;
	message?: string;
	action?: React.ReactNode;
}) {
	return (
		<StateShell
			icon={<InboxIcon className="h-6 w-6" />}
			title={title}
			message={message}
			action={action}
		/>
	);
}

/** Nothing in the table because the current search/filters exclude everything. */
export function DataNoMatches({
	onClear,
	message = "No records match the current search and filters.",
}: {
	onClear?: () => void;
	message?: string;
}) {
	return (
		<StateShell
			icon={<SearchXIcon className="h-6 w-6" />}
			title="No matching records"
			message={message}
			action={
				onClear ? (
					<Button variant="outline" size="sm" onClick={onClear}>
						Clear filters
					</Button>
				) : undefined
			}
		/>
	);
}
