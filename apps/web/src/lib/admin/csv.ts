/**
 * CSV export for admin tables.
 *
 * Exports always run through the same paginated query the table itself uses, so
 * the file contains exactly the rows the current search + filters select — not
 * just the page on screen, and never invented data.
 */

export type CsvColumn<T> = {
	header: string;
	value: (row: T) => string | number | null | undefined;
};

const MAX_EXPORT_ROWS = 5000;
const EXPORT_PAGE_SIZE = 200;

function escapeCell(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return "";
	const s = String(value);
	// A leading =, +, - or @ makes spreadsheets treat the cell as a formula.
	const guarded = /^[=+\-@]/.test(s) ? `'${s}` : s;
	return /[",\n\r]/.test(guarded)
		? `"${guarded.replace(/"/g, '""')}"`
		: guarded;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
	const head = columns.map((c) => escapeCell(c.header)).join(",");
	const body = rows.map((row) =>
		columns.map((c) => escapeCell(c.value(row))).join(","),
	);
	// BOM so Excel opens UTF-8 (₹, Devanagari) correctly.
	return `﻿${[head, ...body].join("\r\n")}`;
}

export function downloadCsv(filename: string, contents: string) {
	const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

type PagedResult<T> = { items: T[]; total: number };

/**
 * Pulls every page matching the caller's filters and returns the full row set.
 * `truncated` is true when the result was capped, so the UI can say so instead
 * of silently exporting a partial file.
 */
export async function collectAllPages<T>(
	fetchPage: (page: number, pageSize: number) => Promise<PagedResult<T>>,
): Promise<{ rows: T[]; total: number; truncated: boolean }> {
	const first = await fetchPage(1, EXPORT_PAGE_SIZE);
	const rows = [...first.items];
	const total = first.total;
	const pages = Math.ceil(Math.min(total, MAX_EXPORT_ROWS) / EXPORT_PAGE_SIZE);

	for (let page = 2; page <= pages; page++) {
		const next = await fetchPage(page, EXPORT_PAGE_SIZE);
		rows.push(...next.items);
		if (rows.length >= MAX_EXPORT_ROWS) break;
	}

	return {
		rows: rows.slice(0, MAX_EXPORT_ROWS),
		total,
		truncated: total > MAX_EXPORT_ROWS,
	};
}

/** "employees-2026-08-31.csv" */
export function timestampedFilename(prefix: string): string {
	const now = new Date();
	const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	return `${prefix}-${stamp}.csv`;
}
