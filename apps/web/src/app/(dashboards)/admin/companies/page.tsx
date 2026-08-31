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
	Building2Icon,
	EyeIcon,
	PencilIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
	SortableHead,
	FilterSelect,
	TablePagination,
} from "@/components/admin/list-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminTable } from "@/hooks/use-admin-table";
import { normaliseError } from "@/lib/admin/errors";
import { text } from "@/lib/admin/format";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

type SortColumn = "name" | "status" | "created_at";

const fields: FormField[] = [
	{ name: "name", label: "Company Name", kind: "text", required: true, maxLength: 255 },
	{ name: "contact", label: "Contact", kind: "tel", maxLength: 20 },
	{ name: "gst_number", label: "GST Number", kind: "text", maxLength: 15 },
	{ name: "pan", label: "PAN", kind: "text", maxLength: 10 },
	{ name: "address", label: "Address", kind: "textarea", maxLength: 500, wide: true },
	{ name: "financial_year_start", label: "Financial Year Start", kind: "date" },
	{ name: "financial_year_end", label: "Financial Year End", kind: "date" },
	{ name: "status", label: "Status", kind: "select", options: [{value: "active", label: "Active"}, {value: "inactive", label: "Inactive"}] },
];

export default function AdminCompaniesPage() {
	const utils = trpc.useUtils();
	const table = useAdminTable<SortColumn>({
		defaultSortBy: "name",
		filterKeys: ["status"],
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);
	const [viewId, setViewId] = useState<number | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const query = {
		page: table.page,
		pageSize: table.pageSize,
		sortBy: table.sortBy,
		sortDir: table.sortDir,
		search: table.search || undefined,
		status: (table.filters.status as "active" | "inactive") || undefined,
	};

	const list = trpc.admin.getCompanies.useQuery(query, {
		placeholderData: (previous) => previous,
	});

	const detail = trpc.admin.getCompany.useQuery(
		{ id: (viewId ?? editId) as number },
		{ enabled: viewId !== null || editId !== null },
	);

	const refresh = () => {
		void utils.admin.getCompanies.invalidate();
		void utils.admin.getDashboardStats.invalidate();
	};

	const onMutationError = (error: unknown) => {
		const normalised = normaliseError(error);
		setFormError(normalised.message);
		setFieldErrors(normalised.fieldErrors);
		toast.error(normalised.title, { description: normalised.message });
	};

	const create = trpc.admin.createCompany.useMutation({
		onSuccess: (result) => {
			toast.success("Company added", { description: `${result.name} was created.` });
			setCreateOpen(false);
			setFormError(null);
			setFieldErrors({});
			refresh();
		},
		onError: onMutationError,
	});

	const update = trpc.admin.updateCompany.useMutation({
		onSuccess: (result) => {
			toast.success("Company updated", { description: `${result.name} details were saved.` });
			setEditId(null);
			setFormError(null);
			setFieldErrors({});
			refresh();
			void utils.admin.getCompany.invalidate();
		},
		onError: onMutationError,
	});

	const editInitial: FormValues | undefined =
		editId !== null && detail.data && detail.data.id === editId
			? {
					name: detail.data.name ?? "",
					contact: detail.data.contact ?? "",
					gst_number: detail.data.gst_number ?? "",
					pan: detail.data.pan ?? "",
					address: detail.data.address ?? "",
					financial_year_start: detail.data.financial_year_start ?? "",
					financial_year_end: detail.data.financial_year_end ?? "",
					status: detail.data.status ?? "active",
				}
			: undefined;

	const submitCreate = (values: FormValues) => {
		create.mutate({
			name: String(values.name),
			contact: String(values.contact ?? ""),
			gst_number: String(values.gst_number ?? ""),
			pan: String(values.pan ?? ""),
			address: String(values.address ?? ""),
			financial_year_start: String(values.financial_year_start ?? ""),
			financial_year_end: String(values.financial_year_end ?? ""),
			status: (values.status as "active" | "inactive") ?? "active",
		});
	};

	const submitEdit = (values: FormValues) => {
		if (editId === null) return;
		update.mutate({
			id: editId,
			name: String(values.name),
			contact: String(values.contact ?? ""),
			gst_number: String(values.gst_number ?? ""),
			pan: String(values.pan ?? ""),
			address: String(values.address ?? ""),
			financial_year_start: String(values.financial_year_start ?? ""),
			financial_year_end: String(values.financial_year_end ?? ""),
			status: (values.status as "active" | "inactive") ?? "active",
		});
	};

	const items = list.data?.items ?? [];
	const busy = list.isFetching;

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Companies"
				description="Manage all registered companies."
				actions={
					<Button
						size="sm"
						onClick={() => {
							setFormError(null);
							setFieldErrors({});
							setCreateOpen(true);
						}}
					>
						<Building2Icon className="mr-2 h-4 w-4" /> Add company
					</Button>
				}
			/>

			<AdminToolbar
				searchValue={table.searchInput}
				onSearchChange={table.setSearchInput}
				searchPlaceholder="Search by name or GST..."
				entityLabel="companies"
				total={list.data?.total}
				isFiltered={table.isFiltered}
				onClearFilters={table.reset}
				onRefresh={refresh}
				refreshing={busy}
				filters={
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
				}
			/>

			{list.isLoading ? (
				<TableLoading columns={6} />
			) : list.error ? (
				<DataError error={list.error} entity="companies" onRetry={() => list.refetch()} />
			) : items.length === 0 ? (
				table.isFiltered ? (
					<DataNoMatches onClear={table.reset} />
				) : (
					<DataEmpty
						title="No companies yet"
						message="Add your first company."
						action={
							<Button size="sm" onClick={() => setCreateOpen(true)}>
								<Building2Icon className="mr-2 h-4 w-4" /> Add company
							</Button>
						}
					/>
				)
			) : (
				<div className="flex flex-col gap-3">
					<div className="overflow-x-auto rounded-lg border border-border/50">
						<Table className="w-full">
							<TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
								<TableRow>
									<SortableHead label="Name" column="name" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<TableHead>Contact</TableHead>
									<TableHead>GST Number</TableHead>
									<TableHead>PAN</TableHead>
									<SortableHead label="Status" column="status" sortBy={table.sortBy} sortDir={table.sortDir} onToggle={table.toggleSort} />
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((company) => (
									<TableRow key={company.id} className="hover:bg-muted/30">
										<TableCell className="font-medium">{company.name}</TableCell>
										<TableCell>{text(company.contact)}</TableCell>
										<TableCell className="font-mono text-xs">{text(company.gst_number)}</TableCell>
										<TableCell className="font-mono text-xs">{text(company.pan)}</TableCell>
										<TableCell>
											<StatusBadge status={company.status} />
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													title="View details"
													onClick={() => setViewId(company.id)}
												>
													<EyeIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													title="Edit"
													onClick={() => {
														setFormError(null);
														setFieldErrors({});
														setEditId(company.id);
													}}
												>
													<PencilIcon className="h-4 w-4" />
												</Button>
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
				title="Add company"
				description="Register a new company."
				fields={fields}
				submitLabel="Create company"
				pending={create.isPending}
				serverError={formError}
				serverFieldErrors={fieldErrors}
				onSubmit={submitCreate}
			/>

			<EntityFormDialog
				open={editId !== null && Boolean(editInitial)}
				onOpenChange={(open) => {
					if (!open) setEditId(null);
				}}
				title="Edit company"
				description="Update company details."
				fields={fields}
				initialValues={editInitial}
				submitLabel="Save changes"
				pending={update.isPending}
				serverError={formError}
				serverFieldErrors={fieldErrors}
				onSubmit={submitEdit}
			/>

			<DetailDialog
				open={viewId !== null}
				onOpenChange={(open) => {
					if (!open) setViewId(null);
				}}
				title={detail.data?.name ?? "Company"}
				loading={detail.isLoading}
				error={viewId !== null ? detail.error : undefined}
				onRetry={() => detail.refetch()}
				sections={
					detail.data
						? [
								{
									title: "Details",
									rows: [
										{ label: "Status", value: <StatusBadge status={detail.data.status} /> },
										{ label: "Contact", value: text(detail.data.contact) },
										{ label: "GST Number", value: text(detail.data.gst_number) },
										{ label: "PAN", value: text(detail.data.pan) },
										{ label: "Financial Year Start", value: text(detail.data.financial_year_start) },
										{ label: "Financial Year End", value: text(detail.data.financial_year_end) },
										{ label: "Address", value: text(detail.data.address), wide: true },
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
							<PencilIcon className="mr-2 h-4 w-4" /> Edit company
						</Button>
					) : null
				}
			/>
		</PageTransition>
	);
}
