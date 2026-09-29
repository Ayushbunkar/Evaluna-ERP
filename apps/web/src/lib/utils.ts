import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
/**
 * Evaluna is an India-first ERP: money is always INR and numbers use the Indian
 * lakh/crore grouping. A bare language tag ("en", "hi") is therefore widened to
 * its Indian variant so `formatCurrency` renders 12,50,000 rather than 1,250,000.
 */
const LOCALE_ALIASES: Record<string, string> = {
	en: "en-IN",
	hi: "hi-IN",
};

function resolveLocale(locale?: string) {
	if (!locale) return "en-IN";
	const base = locale.split("-")[0];
	return LOCALE_ALIASES[base] ?? "en-IN";
}

function resolveCurrency(_locale: string) {
	return "INR";
}

export function formatDate(date: Date | string, locale?: string) {
	if (typeof date === "string") {
		date = new Date(date);
	}
	return new Intl.DateTimeFormat(resolveLocale(locale)).format(date);
}

/** Format an amount as a currency string. */
export function formatCurrency(amount: number | string, locale?: string) {
	const loc = resolveLocale(locale);
	const numericAmount =
		typeof amount === "string" ? Number.parseFloat(amount) : amount;
	return new Intl.NumberFormat(loc, {
		style: "currency",
		currency: resolveCurrency(loc),
		minimumFractionDigits: 2,
	}).format(numericAmount);
}

/** Format an ISO date string to a short label like "Jan 5". */
export function formatShortDate(dateStr: string, locale?: string) {
	const d = new Date(`${dateStr}T00:00:00`);
	return d.toLocaleDateString(resolveLocale(locale), {
		month: "short",
		day: "numeric",
	});
}

/**
 * Cleanly format product or order quantities.
 * - Strips unnecessary trailing zeroes (e.g. 1.000 -> 1, 45.000 -> 45)
 * - Limits fractional amounts to at most a single decimal digit (e.g. 1.5, 0.5)
 * - Resilient against old concatenated strings (e.g. "01.00045.000" -> sums & formats cleanly)
 */
export function formatQty(val: number | string | null | undefined): string {
	if (val === null || val === undefined || val === "") return "0";
	if (typeof val === "string") {
		// Detect old concatenated decimal string like "01.00045.000"
		if ((val.match(/\./g) || []).length > 1) {
			const parts = val.match(/\d+(\.\d+)?/g);
			if (parts && parts.length > 0) {
				const sum = parts.reduce((acc, p) => acc + (parseFloat(p) || 0), 0);
				const rounded = Math.round(sum * 10) / 10;
				return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
			}
		}
	}
	const num = Number(val);
	if (isNaN(num)) return String(val);
	const rounded = Math.round(num * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

