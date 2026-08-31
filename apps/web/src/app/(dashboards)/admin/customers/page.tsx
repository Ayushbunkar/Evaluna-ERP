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
	ArchiveIcon,
	EyeIcon,
	HistoryIcon,
	PencilIcon,
	UserPlusIcon,
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
import { BooleanBadge, StatusBadge } from "@/components/admin/status-badge";
import { useAdminTable } from "@/hooks/use-admin-table";
import {
	collectAllPages,
	downloadCsv,
	timestampedFilename,
	toCsv,
} from "@/lib/admin/csv";
import { normaliseError } from "@/lib/admin/errors";
import { date, inr, num, phone, text } from "@/lib/admin/format";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

type SortColumn =
	| "name"
	| "code"
	| "status"
	| "type"
	| "credit_used"
	| "credit_limit"
	| "created_at";

const GSTIN = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9A-Za-z]{2}$/;
const BASE_TYPES = ["retail", "wholesale", "distributor", "corporate"];

function customerFields(
	types: string[],
	branches: Array<{ value: string; label: string }>,
	mode: "create" | "edit",
): FormField[] {
	const typeOptions = Array.from(new Set([...BASE_TYPES, ...types])).map((t) => ({
		value: t,
		label: t.charAt(0).toUpperCase() + t.slice(1),
	}));
	const fields: FormField[] = [
		{ name: "name", label: "Customer name", kind: "text", required: true, maxLength: 255 },
		{
			name: "email",
			label: "Email",
			kind: "email",
			required: true,
			help: "Must be unique across all customers.",
		},
		{ name: "phone", label: "Phone", kind: "tel", placeholder: "98765 43210" },
		{
			name: "customer_type",
			label: "Customer type",
			kind: "select",
			required: true,
			options: typeOptions,
		},
		{
			name: "credit_limit",
			label: "Credit limit (₹)",
			kind: "number",
			min: 0,
			step: 0.01,
		},
		{
			name: "payment_terms",
			label: "Payment terms (days)",
			kind: "number",
			min: 0,
			max: 365,
		},
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
			name: "status",
			label: "Status",
			kind: "select",
			required: true,
			options: [
				{ value: "active", label: "Active" },
				{ value: "inactive", label: "Inactive" },
			],
		},
		{ name: "address", label: "Address", kind: "textarea", wide: true, maxLength: 500 },
		{
			name: "marketing_opt_in",
			label: "Opted in to marketing",
			kind: "checkbox",
			help: "Controls whether campaigns may contact this customer.",
		},
	];
	if (mode === "edit") {
		fields.push({
			name: "credit_hold",
			label: "Credit hold",
			kind: "checkbox",
			help: "Blocks further credit sales to this customer.",
		});
	}
	if (mode === "create" && branches.length > 0) {
		fields.splice(4, 0, {
			name: "branch_id",
			label: "Branch",
			kind: "select",
			options: branches,
		});
	}
	return fields;
}

export default function AdminCustomersPage() {
	const utils = trpc.useUtils();
	const table = useAdminTable<SortColumn>({
		defaultSortBy: "created_at",
		filterKeys: ["status", "customer_type", "credit"],
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);
	const [viewId, setViewId] = useState<number | null>(null);
	const [archiveTarget, setArchiveTarget] = useState<{ id: number; name: string } | null>(null);
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
		status: (table.filters.status as "active" | "inactive") || undefined,
		customer_type: table.filters.customer_type || undefined,
		creditHoldOnly: table.filters.credit === "hold" ? true : undefined,
	};

	const list = trpc.admin.getCustomers.useQuery(query, {
		placeholderData: (previous) => previous,
	});
	const types = trpc.admin.getCustomerTypes.useQuery();
	const branches = trpc.admin.getBranches.useQuery({
		pageSize: 100,
		sortBy: "name",
		sortDir: "asc",
	});
	const detail = trpc.admin.getCustomer.useQuery(
		{ id: (viewId ?? editId) as number },
		{ enabled: viewId !== null || editId !== null },
	);

	const branchOptions = useMemo(
		() =>
			(branches.data?.items ?? []).map((b) => ({ value: String(b.id), label: b.name })),
		[branches.data],
	);
	const createFields = useMemo(
		() => customerFields(types.data ?? [], branchOptions, "create"),
		[types.data, branchOptions],
	);
	const editFields = useMemo(
		() => customerFields(types.data ?? [], branchOptions, "edit"),
		[types.data, branchOptions],
	);

	const refresh = () => {
		void utils.admin.getCustomers.invalidate();
		void utils.admin.getCustomerTypes.invalidate();
		void utils.admin.getDashboardStats.invalidate();
		void utils.admin.getFinancialSummary.invalidate();
	};

	const onMutationError = (error: unknown) => {
		const normalised = normaliseError(error);
		setFormError(normalised.message);
		setFieldErrors(normalised.fieldErrors);
		toast.error(normalised.title, { description: normalised.message });
	};

	const create = trpc.admin.createCustomer.useMutation({
		onSuccess: (result) => {
			toast.success("Customer added", {
				description: `${result.name} was created as ${result.customer_code}.`,
			});
			setCreateOpen(false);
			setFormError(null);
			setFieldErrors({});
			refresh();
		},
		onError: onMutationError,
	});

	const update = trpc.admin.updateCustomer.useMutation({
		onSuccess: (result) => {
			toast.success("Customer updated", { description: `${result.name} was saved.` });
			setEditId(null);
			setFormError(null);
			setFieldErrors({});
			refresh();
			void utils.admin.getCustomer.invalidate();
		},
		onError: onMutationError,
	});

	const archive = trpc.admin.archiveCustomer.useMutation({
		onSuccess: (result) => {
			toast.success("Customer archived", {
				description: `${result.name} no longer appears in the active list.`,
			});
			setArchiveTarget(null);
			refresh();
		},
		onError: (error) => {
			onMutationError(error);
			setArchiveTarget(null);
		},
	});

	const handleExport = async () => {
		setExporting(true);
		try {
			const { rows, total, truncated } = await collectAllPages(async (page, pageSize) => {
				const result = await utils.admin.getCustomers.fetch({ ...query, page, pageSize });
				return { items: result.items, total: result.total };
			});
			downloadCsv(
				timestampedFilename("customers"),
				toCsv(rows, [
					{ header: "Code", value: (r) => r.customer_code },
					{ header: "Name", value: (r) => r.name },
					{ header: "Email", value: (r) => r.email },
					{ header: "Phone", value: (r) => r.phone },
					{ header: "Type", value: (r) => r.customer_type },
					{ header: "Branch", value: (r) => r.branch_name },
					{ header: "Status", value: (r) => r.status },
					{ header: "Credit limit (INR)", value: (r) => r.credit_limit },
					{ header: "Credit used (INR)", value: (r) => r.credit_used },
					{ header: "Credit hold", value: (r) => (r.credit_hold ? "Yes" : "No") },
				]),
			);
			toast.success(
				truncated
					? `Exported the first ${rows.length} of ${total} customers`
					: `Exported ${rows.length} customers`,
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
					email: detail.data.email ?? "",
					phone: detail.data.phone ?? "",
					customer_type: detail.data.customer_type ?? "retail",
					credit_limit: String(detail.data.credit_limit ?? 0),
					payment_terms: String(detail.data.payment_terms ?? 30),
					gst_number: detail.data.gst_number ?? "",
					pan_number: detail.data.pan_number ?? "",
					status: detail.data.status ?? "active",
					address: detail.data.address ?? "",
					marketing_opt_in: detail.data.marketing_opt_in,
					credit_hold: detail.data.credit_hold,
				}
			: undefined;

	const items = list.data?.items ?? [];
	const busy = list.isFetching;

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Customers"
				description="Customer accounts, credit exposure and GST details."
				actions={
					<>
						<Button variant="outline" size="sm" asChild>
							<Link href="/admin/activity-log?entity_type=customers">
								<HistoryIcon className="mr-2 h-4 w-4" /> Customer activity
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
							<UserPlusIcon className="mr-2 h-4 w-4" /> Add customer
						</Button>
					</>
				}
			/>

			<AdminToolbar
				searchValue={table.searchInput}
				onSearchChange={table.setSearchInput}
				searchPlaceholder="Search by name, code, email, phone or GSTIN…"
				entityLabel="customers"
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
							label="Status"
							value={table.filters.status ?? "all"}
							onChange={(v) => table.setFilter("status", v)}
							allLabel="All statuses"
							options={[
								{ value: "active", label: "Active" },
								{ value: "inactive", label: "Inactive" },
							]}
						/>
						<FilterSelect
							label="Type"
							value={table.filters.customer_type ?? "all"}
							onChange={(v) => table.setFilter("customer_type", v)}
							allLabel="All types"
							options={(types.data ?? []).map((t) => ({
								value: t,
								label: t.charAt(0).toUpperCase() + t.slice(1),
							}))}
						/>
						<FilterSelect
							label="Credit"
							value={table.filters.credit ?? "all"}
							onChange={(v) => table.setFilter("credit", v)}
							allLabel="Any credit state"
							options={[{ value: "hold", label: "On credit hold" }]}
						/>
					</>
				}
			/>

			{list.isLoading ? (
				<TableLoading columns={8} />
			) : list.error ? (
				<DataError error={list.error} entity="customers" onRetry={() => list.refetch()} />
			) : items.length === 0 ? (
				table.isFiltered ? (
					<DataNoMatches onClear={table.reset} />
				) : (
					<DataEmpty
						title="No customers yet"
						message="Add your first customer to start billing and tracking receivables."
						action={
							<Button size="sm" onClick={() => setCreateOpen(true)}>
								<UserPlusIcon className="mr-2 h-4 w-4" /> Add customer
							</Button>
						}
					/>
				)
			) : (
				<div className="flex flex-col gap-3">
					<div className="overflow-x-auto rounded-lg border border-border/50">
						<Table className="w-full min-w-[940px]">
							<TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
								<TableRow>
									<SortableHead label="Code" column="code" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<SortableHead label="Name" column="name" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<TableHead>Contact</TableHead>
									<SortableHead label="Type" column="type" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<SortableHead label="Credit used" column="credit_used" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} numeric />
									<SortableHead label="Credit limit" column="credit_limit" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} numeric />
									<SortableHead label="Status" column="status" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((cust) => {
									const overLimit =
										cust.credit_limit > 0 && cust.credit_used > cust.credit_limit;
									return (
										<TableRow key={cust.id} className="hover:bg-muted/30">
											<TableCell className="font-mono text-xs">
												{cust.customer_code}
											</TableCell>
											<TableCell>
												<span className="font-medium">{cust.name}</span>
												{cust.branch_name && (
													<span className="block text-muted-foreground text-xs">
														{cust.branch_name}
													</span>
												)}
											</TableCell>
											<TableCell className="text-xs">
												<span className="block">{text(cust.email)}</span>
												<span className="block text-muted-foreground">
													{phone(cust.phone)}
												</span>
											</TableCell>
											<TableCell className="capitalize">{text(cust.customer_type)}</TableCell>
											<TableCell
												className={`text-right tabular-nums ${overLimit ? "font-medium text-destructive" : ""}`}
											>
												{inr(cust.credit_used)}
											</TableCell>
											<TableCell className="text-right tabular-nums text-muted-foreground">
												{inr(cust.credit_limit)}
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap items-center gap-1">
													<StatusBadge status={cust.status} />
													{cust.credit_hold && (
														<StatusBadge label="Credit hold" tone="warning" />
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														aria-label={`View ${cust.name}`}
														title="View details"
														onClick={() => setViewId(cust.id)}
													>
														<EyeIcon className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														aria-label={`Edit ${cust.name}`}
														title="Edit"
														onClick={() => {
															setFormError(null);
															setFieldErrors({});
															setEditId(cust.id);
														}}
													>
														<PencilIcon className="h-4 w-4" />
													</Button>
													<RowActions
														label={`More actions for ${cust.name}`}
														actions={[
															{
																label: "Archive customer",
																icon: <ArchiveIcon className="h-4 w-4" />,
																destructive: true,
																disabledReason:
																	cust.credit_used > 0
																		? "Settle the outstanding receivable first."
																		: undefined,
																onSelect: () =>
																	setArchiveTarget({ id: cust.id, name: cust.name }),
															},
														]}
													/>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
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
				title="Add customer"
				description="The customer code is generated automatically once the record is saved."
				fields={createFields}
				initialValues={{
					customer_type: "retail",
					status: "active",
					credit_limit: "0",
					payment_terms: "30",
					marketing_opt_in: true,
				}}
				submitLabel="Create customer"
				pending={create.isPending}
				serverError={formError}
				serverFieldErrors={fieldErrors}
				onSubmit={(values) =>
					create.mutate({
						name: String(values.name),
						email: String(values.email),
						phone: String(values.phone ?? ""),
						address: String(values.address ?? ""),
						gst_number: String(values.gst_number ?? ""),
						pan_number: String(values.pan_number ?? ""),
						customer_type: String(values.customer_type || "retail"),
						credit_limit: Number(values.credit_limit || 0),
						payment_terms: Number(values.payment_terms || 30),
						status: (String(values.status) as "active" | "inactive") || "active",
						marketing_opt_in: Boolean(values.marketing_opt_in),
						branch_id: values.branch_id ? Number(values.branch_id) : undefined,
					})
				}
			/>

			<EntityFormDialog
				open={editId !== null && Boolean(editInitial)}
				onOpenChange={(open) => {
					if (!open) setEditId(null);
				}}
				title="Edit customer"
				fields={editFields}
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
						email: String(values.email),
						phone: String(values.phone ?? ""),
						address: String(values.address ?? ""),
						gst_number: String(values.gst_number ?? ""),
						pan_number: String(values.pan_number ?? ""),
						customer_type: String(values.customer_type || "retail"),
						credit_limit: Number(values.credit_limit || 0),
						payment_terms: Number(values.payment_terms || 30),
						status: (String(values.status) as "active" | "inactive") || "active",
						marketing_opt_in: Boolean(values.marketing_opt_in),
						credit_hold: Boolean(values.credit_hold),
					});
				}}
			/>

			<DetailDialog
				open={viewId !== null}
				onOpenChange={(open) => {
					if (!open) setViewId(null);
				}}
				title={detail.data?.name ?? "Customer"}
				subtitle={detail.data?.customer_code}
				loading={detail.isLoading}
				error={viewId !== null ? detail.error : undefined}
				onRetry={() => detail.refetch()}
				sections={
					detail.data
						? [
								{
									title: "Profile",
									rows: [
										{ label: "Customer code", value: detail.data.customer_code },
										{ label: "Status", value: <StatusBadge status={detail.data.status} /> },
										{ label: "Type", value: text(detail.data.customer_type) },
										{ label: "Branch", value: text(detail.data.branch_name) },
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
									title: "Credit",
									rows: [
										{ label: "Credit limit", value: inr(detail.data.credit_limit) },
										{ label: "Credit used", value: inr(detail.data.credit_used) },
										{ label: "Available", value: inr(detail.data.credit_available) },
										{ label: "Payment terms", value: `${detail.data.payment_terms ?? 0} days` },
										{
											label: "Credit hold",
											value: <BooleanBadge value={detail.data.credit_hold} trueTone="warning" />,
										},
										{ label: "Store credit", value: inr(detail.data.store_credit) },
									],
								},
								{
									title: "Relationship",
									rows: [
										{ label: "Loyalty tier", value: text(detail.data.loyalty_tier) },
										{ label: "Loyalty points", value: num(detail.data.loyalty_points) },
										{ label: "Total spent", value: inr(detail.data.total_spent) },
										{ label: "Lifetime value", value: inr(detail.data.lifetime_value) },
										{
											label: "Marketing opt-in",
											value: <BooleanBadge value={detail.data.marketing_opt_in} />,
										},
										{ label: "Customer since", value: date(detail.data.created_at) },
									],
								},
							]
						: []
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
							<PencilIcon className="mr-2 h-4 w-4" /> Edit customer
						</Button>
					) : null
				}
			/>

			<ConfirmDialog
				open={archiveTarget !== null}
				onOpenChange={(open) => {
					if (!open) setArchiveTarget(null);
				}}
				pending={archive.isPending}
				title={`Archive ${archiveTarget?.name}?`}
				description={`${archiveTarget?.name} will be removed from the active customer list and set to inactive.`}
				consequence="The record is archived, not deleted — orders, ledger entries and invoices stay intact. Archiving is refused while the customer still owes money."
				confirmLabel="Archive customer"
				onConfirm={() => {
					if (archiveTarget) archive.mutate({ id: archiveTarget.id });
				}}
			/>
		</PageTransition>
	);
}
