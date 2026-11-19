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
 * - Strips unnecessary trailing zeroes (e.g. 1.000 -> "1", 45.000 -> "45")
 * - Preserves decimal fractions cleanly (e.g. 0.25 -> "0.25", 0.5 -> "0.5", 0.75 -> "0.75", 1.25 -> "1.25")
 * - Does NOT force rounding to 1 decimal place.
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
				const rounded = Math.round(sum * 1000) / 1000;
				return Number.isInteger(rounded) ? String(rounded) : String(rounded);
			}
		}
	}
	const num = Number(val);
	if (isNaN(num)) return String(val);
	const rounded = Math.round(num * 1000) / 1000;
	return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * Safely parse a date range from UI filters (e.g. "YYYY-MM-DD" or Date objects)
 * into broad, timezone-safe UTC Date boundaries that cover the full 24-hour day
 * in both Indian Standard Time (IST, UTC+5:30) and local/UTC environments.
 */
export function parseDateFilterRange(
	startDate?: string | Date | null,
	endDate?: string | Date | null,
): { fromDate: Date | null; toDate: Date | null } {
	let fromDate: Date | null = null;
	let toDate: Date | null = null;

	const parseStart = (val: string | Date): Date => {
		if (typeof val === "string") {
			const dateStr = val.split("T")[0];
			const parts = dateStr.split("-").map(Number);
			if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
				const [y, m, d] = parts;
				// In IST (UTC+5:30), start of day 00:00:00 IST is previous day 18:30:00 UTC
				const istStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - 5.5 * 3600 * 1000);
				const localStart = new Date(y, m - 1, d, 0, 0, 0, 0);
				return new Date(Math.min(istStart.getTime(), localStart.getTime()));
			}
		}
		const d = new Date(val);
		d.setHours(0, 0, 0, 0);
		return d;
	};

	const parseEnd = (val: string | Date): Date => {
		if (typeof val === "string") {
			const dateStr = val.split("T")[0];
			const parts = dateStr.split("-").map(Number);
			if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
				const [y, m, d] = parts;
				// In IST (UTC+5:30), end of day 23:59:59.999 IST is 18:29:59.999 UTC
				const istEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - 5.5 * 3600 * 1000);
				const localEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
				return new Date(Math.max(istEnd.getTime(), localEnd.getTime()));
			}
		}
		const d = new Date(val);
		d.setHours(23, 59, 59, 999);
		return d;
	};

	if (startDate) fromDate = parseStart(startDate);
	if (endDate) toDate = parseEnd(endDate);

	return { fromDate, toDate };
}

