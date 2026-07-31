import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
const _localeCurrencyMap: Record<string, string> = {
	en: "INR",
};

function resolveLocale(locale?: string) {
	return locale ?? "en-IN";
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
