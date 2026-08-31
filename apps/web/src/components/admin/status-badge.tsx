"use client";

import { cn } from "@/lib/utils";

/**
 * One status vocabulary for the whole admin area.
 *
 * Colour is never the only signal — every badge also carries its label as text,
 * and the palettes are chosen to keep contrast in both light and dark themes.
 */

type Tone = "positive" | "negative" | "warning" | "info" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
	positive:
		"bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
	negative:
		"bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
	warning:
		"bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
	info: "bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30",
	neutral:
		"bg-muted text-muted-foreground ring-border dark:bg-muted/40 dark:text-muted-foreground",
};

const STATUS_TONE: Record<string, Tone> = {
	active: "positive",
	approved: "positive",
	paid: "positive",
	completed: "positive",
	verified: "positive",
	present: "positive",
	inactive: "negative",
	suspended: "negative",
	rejected: "negative",
	overdue: "negative",
	failed: "negative",
	cancelled: "negative",
	pending: "warning",
	partial: "warning",
	unpaid: "warning",
	on_hold: "warning",
	leave: "warning",
	draft: "neutral",
	archived: "neutral",
	closed: "neutral",
	in: "positive",
	out: "negative",
};

export function toneForStatus(status: string | null | undefined): Tone {
	if (!status) return "neutral";
	return STATUS_TONE[status.toLowerCase().replace(/\s+/g, "_")] ?? "info";
}

export function StatusBadge({
	status,
	label,
	tone,
	className,
}: {
	status?: string | null;
	label?: string;
	tone?: Tone;
	className?: string;
}) {
	const resolvedTone = tone ?? toneForStatus(status);
	const resolvedLabel = (label ?? status ?? "Unknown").replace(/_/g, " ");
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs capitalize ring-1 ring-inset",
				TONE_CLASS[resolvedTone],
				className,
			)}
		>
			{resolvedLabel}
		</span>
	);
}

/** A yes/no flag shown as readable words rather than a bare tick. */
export function BooleanBadge({
	value,
	trueLabel = "Yes",
	falseLabel = "No",
	trueTone = "positive",
	falseTone = "neutral",
}: {
	value: boolean | null | undefined;
	trueLabel?: string;
	falseLabel?: string;
	trueTone?: Tone;
	falseTone?: Tone;
}) {
	return (
		<StatusBadge
			label={value ? trueLabel : falseLabel}
			tone={value ? trueTone : falseTone}
		/>
	);
}
