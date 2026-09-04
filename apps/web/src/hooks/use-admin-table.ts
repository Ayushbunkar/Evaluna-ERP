"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Table state for the admin list pages: paging, debounced search, sorting and
 * arbitrary filters, mirrored into the URL query string.
 *
 * The URL is the source of truth on first render, which is what makes a browser
 * refresh (or a shared link) land on the same page, search and filters.
 *
 * `window.history.replaceState` is used rather than `useSearchParams` so the
 * hook needs no Suspense boundary and typing in the search box does not push
 * a history entry per keystroke.
 */

export type SortDir = "asc" | "desc";

export type AdminTableState<TSort extends string> = {
	page: number;
	pageSize: number;
	/** Raw text bound to the input — updates on every keystroke. */
	searchInput: string;
	/** Debounced text actually sent to the server. */
	search: string;
	sortBy: TSort;
	sortDir: SortDir;
	filters: Record<string, string>;
	activeFilterCount: number;
	isFiltered: boolean;
	setPage: (page: number) => void;
	setPageSize: (size: number) => void;
	setSearchInput: (value: string) => void;
	setFilter: (key: string, value: string) => void;
	toggleSort: (column: TSort) => void;
	reset: () => void;
};

const RESERVED = new Set(["page", "pageSize", "q", "sortBy", "sortDir"]);

function readInitial(defaults: {
	pageSize: number;
	sortBy: string;
	sortDir: SortDir;
	filterKeys: string[];
}) {
	if (typeof window === "undefined") {
		return {
			page: 1,
			pageSize: defaults.pageSize,
			search: "",
			sortBy: defaults.sortBy,
			sortDir: defaults.sortDir,
			filters: {} as Record<string, string>,
		};
	}
	const params = new URLSearchParams(window.location.search);
	const filters: Record<string, string> = {};
	for (const key of defaults.filterKeys) {
		const value = params.get(key);
		if (value) filters[key] = value;
	}
	const page = Number.parseInt(params.get("page") ?? "1", 10);
	const pageSize = Number.parseInt(
		params.get("pageSize") ?? String(defaults.pageSize),
		10,
	);
	const dir = params.get("sortDir");
	return {
		page: Number.isFinite(page) && page > 0 ? page : 1,
		pageSize:
			Number.isFinite(pageSize) && pageSize > 0 ? pageSize : defaults.pageSize,
		search: params.get("q") ?? "",
		sortBy: params.get("sortBy") ?? defaults.sortBy,
		sortDir: dir === "asc" || dir === "desc" ? dir : defaults.sortDir,
		filters,
	};
}

export function useAdminTable<TSort extends string>(options: {
	defaultSortBy: TSort;
	defaultSortDir?: SortDir;
	defaultPageSize?: number;
	/** Filter names that participate in the URL, e.g. ["status", "department"]. */
	filterKeys?: string[];
	debounceMs?: number;
}): AdminTableState<TSort> {
	const {
		defaultSortBy,
		defaultSortDir = "desc",
		defaultPageSize = 20,
		filterKeys = [],
		debounceMs = 350,
	} = options;

	const filterKeysRef = useRef(filterKeys);
	const initial = useMemo(
		() =>
			readInitial({
				pageSize: defaultPageSize,
				sortBy: defaultSortBy,
				sortDir: defaultSortDir,
				filterKeys: filterKeysRef.current,
			}),
		[defaultPageSize, defaultSortBy, defaultSortDir],
	);

	const [page, setPageState] = useState(initial.page);
	const [pageSize, setPageSizeState] = useState(initial.pageSize);
	const [searchInput, setSearchInputState] = useState(initial.search);
	const [search, setSearch] = useState(initial.search);
	const [sortBy, setSortBy] = useState<TSort>(initial.sortBy as TSort);
	const [sortDir, setSortDir] = useState<SortDir>(initial.sortDir);
	const [filters, setFilters] = useState<Record<string, string>>(
		initial.filters,
	);

	// Debounce the search term so a five-letter word is one query, not five.
	useEffect(() => {
		if (searchInput === search) return;
		const timer = setTimeout(() => {
			setSearch(searchInput);
			setPageState(1);
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [searchInput, search, debounceMs]);

	// Mirror state into the URL without adding history entries.
	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		// Preserve unrelated params (e.g. ?view=12 deep links).
		for (const key of [...params.keys()]) {
			if (RESERVED.has(key) || filterKeysRef.current.includes(key)) {
				params.delete(key);
			}
		}
		if (page > 1) params.set("page", String(page));
		if (pageSize !== defaultPageSize) params.set("pageSize", String(pageSize));
		if (search) params.set("q", search);
		if (sortBy !== defaultSortBy) params.set("sortBy", sortBy);
		if (sortDir !== defaultSortDir) params.set("sortDir", sortDir);
		for (const [key, value] of Object.entries(filters)) {
			if (value) params.set(key, value);
		}
		const query = params.toString();
		const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
		if (next !== `${window.location.pathname}${window.location.search}`) {
			window.history.replaceState(null, "", next);
		}
	}, [
		page,
		pageSize,
		search,
		sortBy,
		sortDir,
		filters,
		defaultPageSize,
		defaultSortBy,
		defaultSortDir,
	]);

	const setFilter = useCallback((key: string, value: string) => {
		setFilters((prev) => {
			const next = { ...prev };
			if (!value || value === "all") delete next[key];
			else next[key] = value;
			return next;
		});
		setPageState(1);
	}, []);

	const toggleSort = useCallback((column: TSort) => {
		setSortBy((prevColumn) => {
			if (prevColumn === column) {
				setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
				return prevColumn;
			}
			setSortDir("asc");
			return column;
		});
		setPageState(1);
	}, []);

	const reset = useCallback(() => {
		setSearchInputState("");
		setSearch("");
		setFilters({});
		setSortBy(defaultSortBy);
		setSortDir(defaultSortDir);
		setPageState(1);
	}, [defaultSortBy, defaultSortDir]);

	const activeFilterCount =
		Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

	return {
		page,
		pageSize,
		searchInput,
		search,
		sortBy,
		sortDir,
		filters,
		activeFilterCount,
		isFiltered: activeFilterCount > 0,
		setPage: setPageState,
		setPageSize: (size: number) => {
			setPageSizeState(size);
			setPageState(1);
		},
		setSearchInput: setSearchInputState,
		setFilter,
		toggleSort,
		reset,
	};
}
