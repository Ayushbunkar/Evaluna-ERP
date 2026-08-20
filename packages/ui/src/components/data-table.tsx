"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, DownloadIcon } from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Column<T> {
	key: string;
	header: string;
	accessorFn?: (row: T) => unknown;
	render?: (row: T) => ReactNode;
	className?: string;
	headerClassName?: string;
	sortable?: boolean;
	sortFn?: (a: T, b: T) => number;
	hideOnMobile?: boolean;
}

export interface ExportColumn<T> {
	key: string;
	header: string;
	getValue: (item: T) => string | number;
}

interface DataTableProps<T> {
	data: T[];
	columns: Column<T>[];
	exportColumns?: ExportColumn<T>[];
	exportFilename?: string;
	onRowClick?: (row: T) => void;
	defaultSort?: SortingState;
	isLoading?: boolean;
	emptyMessage?: string;
	emptyIcon?: ReactNode;
	emptyAction?: ReactNode;
	afterRows?: ReactNode;
	children?: ReactNode;
}

// ── Column mapping ─────────────────────────────────────────────────────────

function mapToColumnDef<T>(col: Column<T>): ColumnDef<T> {
	return {
		id: col.key,
		accessorFn:
			col.accessorFn ?? ((row: T) => (row as Record<string, unknown>)[col.key]),
		header: ({ column }) => {
			if (!col.sortable) {
				return <span className={col.headerClassName}>{col.header}</span>;
			}
			const sorted = column.getIsSorted();
			return (
				<Button
					variant="ghost"
					size="sm"
					className={cn("-ml-3 h-8", col.headerClassName)}
					onClick={() => {
						if (sorted === false) column.toggleSorting(false);
						else if (sorted === "asc") column.toggleSorting(true);
						else column.clearSorting();
					}}
				>
					{col.header}
					{sorted === "asc" ? (
						<ArrowUp className="ml-1 h-3 w-3" />
					) : sorted === "desc" ? (
						<ArrowDown className="ml-1 h-3 w-3" />
					) : (
						<ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
					)}
				</Button>
			);
		},
		cell: ({ row }) =>
			col.render
				? col.render(row.original)
				: String(row.getValue(col.key) ?? ""),
		sortingFn: (col.sortFn
			? (a: any, b: any) => col.sortFn?.(a.original, b.original) ?? 0
			: "auto") as any,
		enableSorting: col.sortable ?? false,
		meta: { className: col.className, hideOnMobile: col.hideOnMobile },
	};
}

// ── CSV Export ──────────────────────────────────────────────────────────────

function exportCSV<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
	const BOM = "\uFEFF";
	const header = columns.map((c) => `"${c.header}"`).join(",");
	const rows = data.map((item) =>
		columns
			.map((c) => {
				const val = c.getValue(item);
				return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
			})
			.join(","),
	);
	const csv = BOM + [header, ...rows].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${filename}-${Date.now()}.csv`;
	document.body.appendChild(a);
	a.click();
	setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 150);
}

// ── DataTable ──────────────────────────────────────────────────────────────

export function DataTable<T>({
	data,
	columns,
	exportColumns,
	exportFilename = "export",
	onRowClick,
	defaultSort,
	isLoading = false,
	emptyMessage = "No items found.",
	emptyIcon,
	emptyAction,
	afterRows,
	children,
}: DataTableProps<T>) {
	const [sorting, setSorting] = useState<SortingState>(defaultSort ?? []);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	const columnDefs = useMemo(() => columns.map(mapToColumnDef), [columns]);

	const visibleColumnDefs = useMemo(() => {
		if (!isMobile) return columnDefs;
		return columnDefs.filter((_, i) => !columns[i]?.hideOnMobile);
	}, [columnDefs, columns, isMobile]);

	const table = useReactTable({
		data,
		columns: visibleColumnDefs,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const tableContainerRef = useRef<HTMLDivElement>(null);
	const { rows } = table.getRowModel();

	const handleExport = useCallback(() => {
		if (exportColumns) exportCSV(data, exportColumns, exportFilename);
	}, [data, exportColumns, exportFilename]);

	return (
		<div className="space-y-1 sm:space-y-2">
			{(exportColumns || children) && (
				<div className="flex flex-col items-center justify-between gap-1 sm:flex-row sm:gap-2">
					<div className="flex items-center gap-1 sm:gap-2">{children}</div>
					{exportColumns && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleExport}
							className="mt-2 sm:mt-0"
						>
							<DownloadIcon className="mr-1 h-4 w-4" />
							CSV
						</Button>
					)}
				</div>
			)}

			<div
				ref={tableContainerRef}
				className="responsive-table relative max-h-[800px] overflow-x-auto overflow-y-auto"
			>
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-background">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={
											(header.column.columnDef.meta as any)?.className +
											"text-xs sm:text-sm"
										}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={visibleColumnDefs.length}
									className="h-20 text-center sm:h-24"
								>
									<div className="flex items-center justify-center gap-2 text-muted-foreground">
										<div className="h-5 w-5 animate-spin rounded-full border-primary border-b-2" />
										<span>Loading…</span>
									</div>
								</TableCell>
							</TableRow>
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={visibleColumnDefs.length}
									className="h-20 text-center sm:h-24"
								>
									<div className="flex flex-col items-center gap-1 text-muted-foreground sm:gap-2">
										{emptyIcon}
										<span>{emptyMessage}</span>
										{emptyAction}
									</div>
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => {
								return (
									<TableRow
										key={row.id}
										className={
											onRowClick
												? "cursor-pointer hover:bg-muted/50"
												: "hover:bg-muted/50"
										}
										onClick={() => onRowClick?.(row.original)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={
													(cell.column.columnDef.meta as any)?.className +
													"text-xs sm:text-sm"
												}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								);
							})
						)}
						{afterRows}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

// ── Table action helpers ───────────────────────────────────────────────────

export function TableActions({ children }: { children: ReactNode }) {
	return (
		<div
			className="flex items-center gap-1"
			onClick={(e) => e.stopPropagation()}
		>
			{children}
		</div>
	);
}

interface TableActionButtonProps {
	variant?: "default" | "danger";
	onClick: () => void;
	icon: ReactNode;
	label: string;
}

export function TableActionButton({
	variant = "default",
	onClick,
	icon,
	label,
}: TableActionButtonProps) {
	return (
		<Button
			size="icon"
			variant="ghost"
			className={
				variant === "danger"
					? "text-destructive hover:text-destructive"
					: undefined
			}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			{icon}
			<span className="sr-only">{label}</span>
		</Button>
	);
}
