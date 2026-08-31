"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	EyeIcon,
	HistoryIcon,
	PencilIcon,
	Trash2Icon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
	DataEmpty,
	DataError,
	DataNoMatches,
	TableLoading,
} from "@/components/admin/data-states";
import { DetailDialog } from "@/components/admin/detail-dialog";
import {
	EntityFormDialog,
	type FormField,
	type FormValues,
} from "@/components/admin/entity-form-dialog";
import {
	AdminPageHeader,
	AdminToolbar,
	FilterSelect,
	SortableHead,
	TablePagination,
} from "@/components/admin/list-shell";
import { RowActions } from "@/components/admin/row-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminTable } from "@/hooks/use-admin-table";
import {
	collectAllPages,
	downloadCsv,
	timestampedFilename,
	toCsv,
} from "@/lib/admin/csv";
import { normaliseError } from "@/lib/admin/errors";
import { date, inr, phone, text } from "@/lib/admin/format";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

type SortColumn = "name" | "code" | "outstanding" | "category" | "created_at";

const GSTIN = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9A-Za-z]{2}$/;

const BASE_CATEGORIES = ["local", "regional", "national", "international"];

function supplierFields(categories: string[]): FormField[] {
	const options = Array.from(new Set([...BASE_CATEGORIES, ...categories])).map(
		(c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }),
	);
	return [
		{ name: "name", label: "Supplier name", kind: "text", required: true, maxLength: 255 },
		{
			name: "supplier_category",
			label: "Category",
			kind: "select",
			required: true,
			options,
		},
		{ name: "email", label: "Email", kind: "email" },
		{ name: "phone", label: "Phone", kind: "tel", placeholder: "98765 43210" },
		{
			name: "gst_number",
			label: "GSTIN",
			kind: "text",
			maxLength: 15,
			pattern: GSTIN,
			patternMessage: "A GSTIN is 15 characters, e.g. 27ABCDE1234F1Z5.",
		},
		{
			name: "pan_number",
			label: "PAN",
			kind: "text",
			maxLength: 10,
			pattern: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/,
			patternMessage: "PAN must look like ABCDE1234F.",
		},
		{
			name: "outstanding_balance",
			label: "Opening payable (₹)",
			kind: "number",
			min: 0,
			step: 0.01,
			help: "Amount already owed to this supplier.",
		},
		{ name: "address", label: "Address", kind: "textarea", wide: true, maxLength: 500 },
	];
}

export default function AdminSuppliersPage() {
	const utils = trpc.useUtils();
	const table = useAdminTable<SortColumn>({
		defaultSortBy: "created_at",
		filterKeys: ["category", "outstanding"],
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);
	const [viewId, setViewId] = useState<number | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [exporting, setExporting] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const id = new URLSearchParams(window.location.search).get("view");
		if (id && Number.isFinite(Number(id))) setViewId(Number(id));
	}, []);

	const query = {
		page: table.page,
		pageSize: table.pageSize,
		sortBy: table.sortBy,
		sortDir: table.sortDir,
		search: table.search || undefined,
		category: table.filters.category || undefined,
		outstandingOnly: table.filters.outstanding === "due" ? true : undefined,
	};

	const list = trpc.admin.getSuppliers.useQuery(query, {
		placeholderData: (previous) => previous,
	});
	const categories = trpc.admin.getSupplierCategories.useQuery();
	const detail = trpc.admin.getSupplier.useQuery(
		{ id: (viewId ?? editId) as number },
		{ enabled: viewId !== null || editId !== null },
	);

	const fields = useMemo(
		() => supplierFields(categories.data ?? []),
		[categories.data],
	);

	const refresh = () => {
		void utils.admin.getSuppliers.invalidate();
		void utils.admin.getSupplierCategories.invalidate();
		void utils.admin.getDashboardStats.invalidate();
		void utils.admin.getFinancialSummary.invalidate();
	};

	const onMutationError = (error: unknown) => {
		const normalised = normaliseError(error);
		setFormError(normalised.message);
		setFieldErrors(normalised.fieldErrors);
		toast.error(normalised.title, { description: normalised.message });
	};

	const create = trpc.admin.createSupplier.useMutation({
		onSuccess: (result) => {
			toast.success("Supplier added", {
				description: `${result.name} was created as ${result.supplier_code}.`,
			});
			setCreateOpen(false);
			setFormError(null);
			setFieldErrors({});
			refresh();
		},
		onError: onMutationError,
	});

	const update = trpc.admin.updateSupplier.useMutation({
		onSuccess: (result) => {
			toast.success("Supplier updated", { description: `${result.name} was saved.` });
			setEditId(null);
			setFormError(null);
			setFieldErrors({});
			refresh();
			void utils.admin.getSupplier.invalidate();
		},
		onError: onMutationError,
	});

	const remove = trpc.admin.deleteSupplier.useMutation({
		onSuccess: (result) => {
			toast.success("Supplier deleted", { description: `${result.name} was removed.` });
			setDeleteTarget(null);
			refresh();
		},
		onError: (error) => {
			onMutationError(error);
			setDeleteTarget(null);
		},
	});

	const handleExport = async () => {
		setExporting(true);
		try {
			const { rows, total, truncated } = await collectAllPages(async (page, pageSize) => {
				const result = await utils.admin.getSuppliers.fetch({ ...query, page, pageSize });
				return { items: result.items, total: result.total };
			});
			downloadCsv(
				timestampedFilename("suppliers"),
				toCsv(rows, [
					{ header: "Code", value: (r) => r.supplier_code },
					{ header: "Name", value: (r) => r.name },
					{ header: "Category", value: (r) => r.category },
					{ header: "Email", value: (r) => r.email },
					{ header: "Phone", value: (r) => r.phone },
					{ header: "GSTIN", value: (r) => r.gst_number },
					{ header: "PAN", value: (r) => r.pan_number },
					{ header: "Outstanding (INR)", value: (r) => r.outstanding_balance },
				]),
			);
			toast.success(
				truncated
					? `Exported the first ${rows.length} of ${total} suppliers`
					: `Exported ${rows.length} suppliers`,
			);
		} catch (error) {
			onMutationError(error);
		} finally {
			setExporting(false);
		}
	};

	const editInitial: FormValues | undefined =
		editId !== null && detail.data && detail.data.id === editId
			? {
					name: detail.data.name ?? "",
					supplier_category: detail.data.category ?? "local",
					email: detail.data.email ?? "",
					phone: detail.data.phone ?? "",
					gst_number: detail.data.gst_number ?? "",
					pan_number: detail.data.pan_number ?? "",
					outstanding_balance: String(detail.data.outstanding_balance ?? 0),
					address: detail.data.address ?? "",
				}
			: undefined;

	const items = list.data?.items ?? [];
	const busy = list.isFetching;

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Suppliers"
				description="Vendor master data, GST details and outstanding payables."
				actions={
					<>
						<Button variant="outline" size="sm" asChild>
							<Link href="/admin/activity-log?entity_type=suppliers">
								<HistoryIcon className="mr-2 h-4 w-4" /> Supplier activity
							</Link>
						</Button>
						<Button
							size="sm"
							onClick={() => {
								setFormError(null);
								setFieldErrors({});
								setCreateOpen(true);
							}}
						>
							<TruckIcon className="mr-2 h-4 w-4" /> Add supplier
						</Button>
					</>
				}
			/>

			<AdminToolbar
				searchValue={table.searchInput}
				onSearchChange={table.setSearchInput}
				searchPlaceholder="Search by name, code, GSTIN, email or phone…"
				entityLabel="suppliers"
				total={list.data?.total}
				isFiltered={table.isFiltered}
				onClearFilters={table.reset}
				onRefresh={refresh}
				refreshing={busy}
				onExport={handleExport}
				exporting={exporting}
				filters={
					<>
						<FilterSelect
							label="Category"
							value={table.filters.category ?? "all"}
							onChange={(v) => table.setFilter("category", v)}
							allLabel="All categories"
							options={(categories.data ?? []).map((c) => ({
								value: c,
								label: c.charAt(0).toUpperCase() + c.slice(1),
							}))}
						/>
						<FilterSelect
							label="Balance"
							value={table.filters.outstanding ?? "all"}
							onChange={(v) => table.setFilter("outstanding", v)}
							allLabel="Any balance"
							options={[{ value: "due", label: "Payable outstanding" }]}
						/>
					</>
				}
			/>

			{list.isLoading ? (
				<TableLoading columns={7} />
			) : list.error ? (
				<DataError error={list.error} entity="suppliers" onRetry={() => list.refetch()} />
			) : items.length === 0 ? (
				table.isFiltered ? (
					<DataNoMatches onClear={table.reset} />
				) : (
					<DataEmpty
						title="No suppliers yet"
						message="Add your first supplier to start recording purchases."
						action={
							<Button size="sm" onClick={() => setCreateOpen(true)}>
								<TruckIcon className="mr-2 h-4 w-4" /> Add supplier
							</Button>
						}
					/>
				)
			) : (
				<div className="flex flex-col gap-3">
					<div className="overflow-x-auto rounded-lg border border-border/50">
						<Table className="w-full min-w-[880px]">
							<TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
								<TableRow>
									<SortableHead label="Code" column="code" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<SortableHead label="Name" column="name" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<SortableHead label="Category" column="category" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<TableHead>Contact</TableHead>
									<TableHead>GSTIN</TableHead>
									<SortableHead label="Outstanding" column="outstanding" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} numeric />
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((sup) => (
									<TableRow key={sup.id} className="hover:bg-muted/30">
										<TableCell className="font-mono text-xs">{sup.supplier_code}</TableCell>
										<TableCell className="font-medium">{sup.name}</TableCell>
										<TableCell>
											<StatusBadge status={sup.category} tone="info" />
										</TableCell>
										<TableCell className="text-xs">
											<span className="block">{text(sup.email)}</span>
											<span className="block text-muted-foreground">{phone(sup.phone)}</span>
										</TableCell>
										<TableCell className="font-mono text-xs">{text(sup.gst_number)}</TableCell>
										<TableCell
											className={`text-right tabular-nums ${sup.outstanding_balance > 0 ? "font-medium text-amber-600 dark:text-amber-400" : ""}`}
										>
											{inr(sup.outstanding_balance)}
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													aria-label={`View ${sup.name}`}
													title="View details"
													onClick={() => setViewId(sup.id)}
												>
													<EyeIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													aria-label={`Edit ${sup.name}`}
													title="Edit"
													onClick={() => {
														setFormError(null);
														setFieldErrors({});
														setEditId(sup.id);
													}}
												>
													<PencilIcon className="h-4 w-4" />
												</Button>
												<RowActions
													label={`More actions for ${sup.name}`}
													actions={[
														{
															label: "Delete supplier",
															icon: <Trash2Icon className="h-4 w-4" />,
															destructive: true,
															disabledReason:
																sup.outstanding_balance > 0
																	? "Settle the outstanding payable first."
																	: undefined,
															onSelect: () =>
																setDeleteTarget({ id: sup.id, name: sup.name }),
														},
													]}
												/>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<TablePagination
						page={list.data?.page ?? 1}
						pageSize={list.data?.pageSize ?? table.pageSize}
						total={list.data?.total ?? 0}
						totalPages={list.data?.totalPages ?? 1}
						onPageChange={table.setPage}
						onPageSizeChange={table.setPageSize}
						busy={busy}
					/>
				</div>
			)}

			<EntityFormDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				title="Add supplier"
				description="The supplier code is generated automatically once the record is saved."
				fields={fields}
				initialValues={{ supplier_category: "local", outstanding_balance: "0" }}
				submitLabel="Create supplier"
				pending={create.isPending}
				serverError={formError}
				serverFieldErrors={fieldErrors}
				onSubmit={(values) =>
					create.mutate({
						name: String(values.name),
						supplier_category: String(values.supplier_category || "local"),
						email: String(values.email ?? ""),
						phone: String(values.phone ?? ""),
						gst_number: String(values.gst_number ?? ""),
						pan_number: String(values.pan_number ?? ""),
						address: String(values.address ?? ""),
						outstanding_balance: Number(values.outstanding_balance || 0),
					})
				}
			/>

			<EntityFormDialog
				open={editId !== null && Boolean(editInitial)}
				onOpenChange={(open) => {
					if (!open) setEditId(null);
				}}
				title="Edit supplier"
				fields={fields}
				initialValues={editInitial}
				submitLabel="Save changes"
				pending={update.isPending}
				serverError={formError}
				serverFieldErrors={fieldErrors}
				onSubmit={(values) => {
					if (editId === null) return;
					update.mutate({
						id: editId,
						name: String(values.name),
						supplier_category: String(values.supplier_category || "local"),
						email: String(values.email ?? ""),
						phone: String(values.phone ?? ""),
						gst_number: String(values.gst_number ?? ""),
						pan_number: String(values.pan_number ?? ""),
						address: String(values.address ?? ""),
						outstanding_balance: Number(values.outstanding_balance || 0),
					});
				}}
			/>

			<DetailDialog
				open={viewId !== null}
				onOpenChange={(open) => {
					if (!open) setViewId(null);
				}}
				title={detail.data?.name ?? "Supplier"}
				subtitle={detail.data?.supplier_code}
				loading={detail.isLoading}
				error={viewId !== null ? detail.error : undefined}
				onRetry={() => detail.refetch()}
				sections={
					detail.data
						? [
								{
									title: "Company",
									rows: [
										{ label: "Supplier code", value: detail.data.supplier_code },
										{
											label: "Category",
											value: <StatusBadge status={detail.data.category} tone="info" />,
										},
										{ label: "Email", value: text(detail.data.email) },
										{ label: "Phone", value: phone(detail.data.phone) },
										{ label: "Address", value: text(detail.data.address), wide: true },
									],
								},
								{
									title: "Tax",
									rows: [
										{ label: "GSTIN", value: text(detail.data.gst_number) },
										{ label: "PAN", value: text(detail.data.pan_number) },
									],
								},
								{
									title: "Balances",
									rows: [
										{
											label: "Outstanding payable",
											value: inr(detail.data.outstanding_balance),
										},
										{ label: "On record since", value: date(detail.data.created_at) },
									],
								},
							]
						: []
				}
				extra={
					detail.data ? (
						<section className="space-y-2">
							<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
								Recent purchases
							</h3>
							{detail.data.recentPurchases.length === 0 ? (
								<p className="text-muted-foreground text-xs">
									No purchases recorded against this supplier yet.
								</p>
							) : (
								<ul className="divide-y divide-border/50 rounded-md border border-border/50">
									{detail.data.recentPurchases.map((p) => (
										<li
											key={p.id}
											className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
										>
											<span className="font-mono">{p.grn_number ?? `#${p.id}`}</span>
											<span className="text-muted-foreground">{date(p.created_at)}</span>
											<StatusBadge status={p.payment_status ?? p.status} />
											<span className="tabular-nums">{inr(p.total)}</span>
										</li>
									))}
								</ul>
							)}
						</section>
					) : null
				}
				footer={
					detail.data ? (
						<Button
							size="sm"
							onClick={() => {
								const id = detail.data?.id ?? null;
								setViewId(null);
								setFormError(null);
								setFieldErrors({});
								setEditId(id);
							}}
						>
							<PencilIcon className="mr-2 h-4 w-4" /> Edit supplier
						</Button>
					) : null
				}
			/>

			<ConfirmDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				pending={remove.isPending}
				title={`Delete ${deleteTarget?.name}?`}
				description="This permanently removes the supplier record."
				consequence="Suppliers have no archive state, so this is a hard delete. It will be refused if any purchase still references this supplier."
				confirmLabel="Delete supplier"
				onConfirm={() => {
					if (deleteTarget) remove.mutate({ id: deleteTarget.id });
				}}
			/>
		</PageTransition>
	);
}
