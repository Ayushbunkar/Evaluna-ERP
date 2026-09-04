"use client";

import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { TableHead } from "@evaluna/ui/components/table";
import {
	ArrowDownIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	DownloadIcon,
	FilterXIcon,
	Loader2Icon,
	RefreshCwIcon,
	SearchIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { num } from "@/lib/admin/format";

/** Page title block shared by every admin screen. */
export function AdminPageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description?: string;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
			<div className="flex min-w-0 flex-col gap-1">
				<h1 className="truncate font-bold text-foreground text-xl tracking-tight sm:text-2xl">
					{title}
				</h1>
				{description && (
					<p className="text-muted-foreground text-xs sm:text-sm">
						{description}
					</p>
				)}
			</div>
			{actions && <div className="flex flex-wrap gap-2">{actions}</div>}
		</div>
	);
}

/** A labelled dropdown filter with an explicit "all" option. */
export function FilterSelect({
	label,
	value,
	onChange,
	options,
	allLabel = "All",
	className,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: Array<{ value: string; label: string }>;
	allLabel?: string;
	className?: string;
}) {
	const id = useId();
	return (
		<div className={className}>
			<Label htmlFor={id} className="sr-only">
				{label}
			</Label>
			<Select value={value || "all"} onValueChange={onChange}>
				<SelectTrigger
					id={id}
					className="h-9 w-full min-w-[140px] text-xs sm:w-auto"
				>
					<SelectValue placeholder={label} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{allLabel}</SelectItem>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

/**
 * Search + filters + refresh + export bar.
 *
 * Refresh refetches the active query (it never reloads the browser), and both
 * refresh and export keep the current search and filters — exporting the rows
 * the admin is actually looking at.
 */
export function AdminToolbar({
	searchValue,
	onSearchChange,
	searchPlaceholder = "Search…",
	filters,
	onRefresh,
	refreshing = false,
	onExport,
	exporting = false,
	onClearFilters,
	isFiltered = false,
	total,
	entityLabel = "records",
}: {
	searchValue: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;
	filters?: ReactNode;
	onRefresh?: () => void;
	refreshing?: boolean;
	onExport?: () => void;
	exporting?: boolean;
	onClearFilters?: () => void;
	isFiltered?: boolean;
	total?: number;
	entityLabel?: string;
}) {
	const searchId = useId();
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative min-w-0 flex-1">
					<Label htmlFor={searchId} className="sr-only">
						Search {entityLabel}
					</Label>
					<SearchIcon
						className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						id={searchId}
						type="search"
						value={searchValue}
						placeholder={searchPlaceholder}
						className="h-9 pl-9"
						onChange={(e) => onSearchChange(e.target.value)}
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{filters}
					{onClearFilters && isFiltered && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClearFilters}
							title="Clear search and filters"
						>
							<FilterXIcon className="mr-1.5 h-4 w-4" /> Clear
						</Button>
					)}
					{onRefresh && (
						<Button
							variant="outline"
							size="sm"
							onClick={onRefresh}
							disabled={refreshing}
							title="Refresh"
							aria-label="Refresh data"
						>
							<RefreshCwIcon
								className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
							/>
						</Button>
					)}
					{onExport && (
						<Button
							variant="outline"
							size="sm"
							onClick={onExport}
							disabled={exporting}
							title="Export the current results to CSV"
						>
							{exporting ? (
								<Loader2Icon className="mr-1.5 h-4 w-4 animate-spin" />
							) : (
								<DownloadIcon className="mr-1.5 h-4 w-4" />
							)}
							Export
						</Button>
					)}
				</div>
			</div>

			{total !== undefined && (
				<p className="text-muted-foreground text-xs" aria-live="polite">
					{num(total)} {entityLabel}
					{isFiltered ? " match the current filters" : " in total"}
				</p>
			)}
		</div>
	);
}

/** A clickable column header that drives server-side sorting. */
export function SortableHead<T extends string>({
	label,
	column,
	sortBy,
	sortDir,
	onToggle,
	className,
	numeric = false,
}: {
	label: string;
	column: T;
	sortBy: T;
	sortDir: "asc" | "desc";
	onToggle: (column: T) => void;
	className?: string;
	numeric?: boolean;
}) {
	const active = sortBy === column;
	return (
		<TableHead
			className={`${numeric ? "text-right" : "text-left"} ${className ?? ""}`}
			aria-sort={
				active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
			}
		>
			<button
				type="button"
				onClick={() => onToggle(column)}
				className={`inline-flex items-center gap-1 rounded font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
					active ? "text-foreground" : "text-muted-foreground"
				}`}
			>
				{label}
				{active ? (
					sortDir === "asc" ? (
						<ArrowUpIcon className="h-3 w-3" aria-hidden="true" />
					) : (
						<ArrowDownIcon className="h-3 w-3" aria-hidden="true" />
					)
				) : (
					<ArrowUpDownIcon className="h-3 w-3 opacity-40" aria-hidden="true" />
				)}
				<span className="sr-only">
					{active
						? `sorted ${sortDir === "asc" ? "ascending" : "descending"}`
						: "not sorted"}
				</span>
			</button>
		</TableHead>
	);
}

const PAGE_SIZES = [10, 20, 50, 100];

/** Page navigation plus page-size control, driven entirely by server totals. */
export function TablePagination({
	page,
	pageSize,
	total,
	totalPages,
	onPageChange,
	onPageSizeChange,
	busy = false,
}: {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
	busy?: boolean;
}) {
	if (total === 0) return null;
	const first = (page - 1) * pageSize + 1;
	const last = Math.min(page * pageSize, total);

	return (
		<nav
			className="flex flex-col items-center justify-between gap-3 border-border/50 border-t pt-3 sm:flex-row"
			aria-label="Pagination"
		>
			<p className="text-muted-foreground text-xs">
				Showing {num(first)}–{num(last)} of {num(total)}
			</p>

			<div className="flex items-center gap-2">
				{onPageSizeChange && (
					<Select
						value={String(pageSize)}
						onValueChange={(v) => onPageSizeChange(Number(v))}
					>
						<SelectTrigger
							className="h-8 w-[110px] text-xs"
							aria-label="Rows per page"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZES.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size} / page
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1 || busy}
					aria-label="Previous page"
				>
					<ChevronLeftIcon className="h-4 w-4" />
				</Button>
				<span className="px-1 text-xs tabular-nums">
					Page {num(page)} of {num(totalPages)}
				</span>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages || busy}
					aria-label="Next page"
				>
					<ChevronRightIcon className="h-4 w-4" />
				</Button>
			</div>
		</nav>
	);
}
