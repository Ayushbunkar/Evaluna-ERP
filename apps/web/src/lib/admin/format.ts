/**
 * Presentation helpers for the admin dashboard.
 *
 * The admin section is India-first: every amount is INR with lakh/crore
 * grouping, and every date is rendered in the Indian locale. Keeping these in
 * one place is what stops "₹" and "$" from appearing on the same screen.
 */

const LOCALE = "en-IN";
const CURRENCY = "INR";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
	style: "currency",
	currency: CURRENCY,
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const currencyCompactFormatter = new Intl.NumberFormat(LOCALE, {
	style: "currency",
	currency: CURRENCY,
	maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
	day: "2-digit",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

function toDate(value: string | number | Date | null | undefined): Date | null {
	if (value === null || value === undefined || value === "") return null;
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

/** ₹1,23,456.00 — the canonical money format for the whole admin area. */
export function inr(amount: number | string | null | undefined): string {
	const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	if (n === null || n === undefined || !Number.isFinite(n)) return "—";
	return currencyFormatter.format(n);
}

/** ₹1,23,456 — for KPI tiles where decimals are noise. */
export function inrCompact(amount: number | string | null | undefined): string {
	const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	if (n === null || n === undefined || !Number.isFinite(n)) return "—";
	return currencyCompactFormatter.format(n);
}

export function num(value: number | null | undefined): string {
	if (value === null || value === undefined || !Number.isFinite(value)) return "—";
	return numberFormatter.format(value);
}

export function percent(value: number | null | undefined, digits = 1): string {
	if (value === null || value === undefined || !Number.isFinite(value)) return "—";
	return `${value.toFixed(digits)}%`;
}

export function date(value: string | number | Date | null | undefined): string {
	const d = toDate(value);
	return d ? dateFormatter.format(d) : "—";
}

export function dateTime(value: string | number | Date | null | undefined): string {
	const d = toDate(value);
	return d ? dateTimeFormatter.format(d) : "—";
}

/** "3 hours ago" — falls back to an absolute date beyond a month. */
export function relativeTime(
	value: string | number | Date | null | undefined,
): string {
	const d = toDate(value);
	if (!d) return "—";
	const diffMs = Date.now() - d.getTime();
	const minutes = Math.round(diffMs / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
	return dateFormatter.format(d);
}

/** An <input type="date"> value, in the browser's own timezone. */
export function dateInputValue(
	value: string | number | Date | null | undefined,
): string {
	const d = toDate(value);
	if (!d) return "";
	const offset = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

/** +91 98765 43210 — leaves anything unexpected untouched. */
export function phone(value: string | null | undefined): string {
	if (!value) return "—";
	const digits = value.replace(/\D/g, "");
	if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
	if (digits.length === 12 && digits.startsWith("91")) {
		return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
	}
	return value;
}

export function text(value: string | null | undefined): string {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : "—";
}

/** Turns "employee.deactivate" / "staff" into "Employee deactivate" / "Staff". */
export function humanise(value: string | null | undefined): string {
	if (!value) return "—";
	const spaced = value.replace(/[._-]+/g, " ").trim();
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
