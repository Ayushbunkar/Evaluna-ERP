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
 * Formats a given Date, ISO string, or timestamp into YYYY-MM-DD in Asia/Kolkata (IST) timezone.
 */
export function getISTDateString(d: Date | string | number): string {
	try {
		const date = new Date(d);
		if (Number.isNaN(date.getTime())) return "";
		return new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Kolkata",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	} catch {
		return "";
	}
}

/**
 * Normalizes input date strings (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY) into YYYY-MM-DD.
 */
export function normalizeDateInput(val?: string | Date | null): string {
	if (!val) return "";
	if (val instanceof Date) return getISTDateString(val);
	const clean = val.split("T")[0].replace(/\//g, "-").trim();
	const parts = clean.split("-").map(Number);
	if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
		let [y, m, d] = parts;
		if (parts[2] > 1900) {
			// DD-MM-YYYY
			d = parts[0];
			m = parts[1];
			y = parts[2];
		}
		return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
	}
	return clean;
}

/**
 * Checks whether a given timestamp falls within a date range (YYYY-MM-DD),
 * evaluating against IST (Asia/Kolkata), UTC, and local representation.
 */
export function isDateInISTRange(
	date?: Date | string | number | null,
	startStr?: string | null,
	endStr?: string | null,
): boolean {
	if (!date) return false;
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return false;

	const normStart = normalizeDateInput(startStr);
	const normEnd = normalizeDateInput(endStr);
	if (!normStart && !normEnd) return true;

	const istDate = getISTDateString(d);
	const utcDate = d.toISOString().split("T")[0];
	const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

	const inRange = (dt: string) => {
		if (normStart && dt < normStart) return false;
		if (normEnd && dt > normEnd) return false;
		return true;
	};

	return inRange(istDate) || inRange(utcDate) || inRange(localDate);
}

/**
 * Safely parse a date range from UI filters (e.g. "YYYY-MM-DD" or Date objects)
 * into broad UTC Date boundaries that match the full 24-hour day across IST, UTC, and local.
 */
export function parseDateFilterRange(
	startDate?: string | Date | null,
	endDate?: string | Date | null,
): { fromDate: Date | null; toDate: Date | null; startIST: string; endIST: string } {
	let fromDate: Date | null = null;
	let toDate: Date | null = null;
	const startIST = normalizeDateInput(startDate);
	const endIST = normalizeDateInput(endDate);

	const parseStart = (val: string | Date): Date => {
		const norm = normalizeDateInput(val);
		if (norm) {
			const [y, m, d] = norm.split("-").map(Number);
			// Start of day in IST is previous day 18:30:00.000 UTC
			const istStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - 5.5 * 3600 * 1000);
			const utcStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
			const localStart = new Date(y, m - 1, d, 0, 0, 0, 0);
			return new Date(Math.min(istStart.getTime(), utcStart.getTime(), localStart.getTime()));
		}
		const d = new Date(val);
		d.setHours(0, 0, 0, 0);
		return d;
	};

	const parseEnd = (val: string | Date): Date => {
		const norm = normalizeDateInput(val);
		if (norm) {
			const [y, m, d] = norm.split("-").map(Number);
			// End of day in IST is same day 18:29:59.999 UTC; in UTC is 23:59:59.999 UTC
			const istEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - 5.5 * 3600 * 1000);
			const utcEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
			const localEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
			return new Date(Math.max(istEnd.getTime(), utcEnd.getTime(), localEnd.getTime()));
		}
		const d = new Date(val);
		d.setHours(23, 59, 59, 999);
		return d;
	};

	if (startDate) fromDate = parseStart(startDate);
	if (endDate) toDate = parseEnd(endDate);

	return { fromDate, toDate, startIST, endIST };
}

