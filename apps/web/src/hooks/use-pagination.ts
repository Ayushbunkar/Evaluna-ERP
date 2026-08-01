import { useMemo, useState } from "react";

/**
 * Client-side pagination hook for arrays.
 * Renders only the current page slice — keeps large tables fast.
 */
export function usePagination<T>(items: T[] | undefined, pageSize = 20) {
	const [page, setPage] = useState(1);
	const safeItems = items ?? [];
	const totalPages = Math.max(1, Math.ceil(safeItems.length / pageSize));

	// Clamp page when data changes
	const safePage = Math.min(page, totalPages);

	const pageItems = useMemo(
		() => safeItems.slice((safePage - 1) * pageSize, safePage * pageSize),
		[safeItems, safePage, pageSize],
	);

	return {
		page: safePage,
		totalPages,
		pageItems,
		setPage,
		hasPrev: safePage > 1,
		hasNext: safePage < totalPages,
		prev: () => setPage((p) => Math.max(1, p - 1)),
		next: () => setPage((p) => Math.min(totalPages, p + 1)),
		totalItems: safeItems.length,
	};
}
