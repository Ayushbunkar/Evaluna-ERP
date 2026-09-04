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
	BanIcon,
	CheckCircle2Icon,
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
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminTable } from "@/hooks/use-admin-table";
import {
	collectAllPages,
	downloadCsv,
	timestampedFilename,
	toCsv,
} from "@/lib/admin/csv";
import { normaliseError } from "@/lib/admin/errors";
import { date, dateInputValue, inr, phone, text } from "@/lib/admin/format";
import { PageTransition } from "@/lib/animations";
import { ROLES } from "@/lib/permissions";
import { trpc } from "@/lib/trpc/client";

type SortColumn =
	| "name"
	| "code"
	| "department"
	| "role"
	| "status"
	| "join_date"
	| "salary"
	| "created_at";

const ROLE_OPTIONS = ROLES.filter((r) => r !== "customer").map((r) => ({
	value: r,
	label: r.replace(/_/g, " "),
}));

/** Shared by the create and edit dialogs so both stay in step. */
function employeeFields(
	branchOptions: Array<{ value: string; label: string }>,
) {
	const fields: FormField[] = [
		{
			name: "name",
			label: "Full name",
			kind: "text",
			required: true,
			maxLength: 255,
		},
		{
			name: "email",
			label: "Email",
			kind: "email",
			required: true,
			help: "Must be unique across all employees.",
		},
		{ name: "phone", label: "Phone", kind: "tel", placeholder: "98765 43210" },
		{
			name: "role",
			label: "Role",
			kind: "select",
			required: true,
			options: ROLE_OPTIONS,
			help: "Drives what this employee can access.",
		},
		{ name: "department", label: "Department", kind: "text", maxLength: 50 },
		{ name: "join_date", label: "Joining date", kind: "date", required: true },
		{
			name: "salary",
			label: "Monthly salary (₹)",
			kind: "number",
			required: true,
			min: 0,
			step: 0.01,
		},
		{
			name: "monthly_sales_target",
			label: "Monthly sales target (₹)",
			kind: "number",
			min: 0,
			step: 0.01,
		},
		{
			name: "address",
			label: "Address",
			kind: "textarea",
			wide: true,
			maxLength: 500,
		},
		{ name: "pf_number", label: "PF number", kind: "text", maxLength: 50 },
		{
			name: "pan",
			label: "PAN",
			kind: "text",
			maxLength: 10,
			pattern: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/,
			patternMessage: "PAN must look like ABCDE1234F.",
		},
		{ name: "bank_name", label: "Bank name", kind: "text", maxLength: 100 },
		{
			name: "bank_account",
			label: "Bank account",
			kind: "text",
			maxLength: 50,
		},
		{
			name: "ifsc",
			label: "IFSC",
			kind: "text",
			maxLength: 11,
			pattern: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
			patternMessage: "Enter a valid 11-character IFSC code.",
		},
	];
	if (branchOptions.length > 0) {
		fields.splice(5, 0, {
			name: "branch_id",
			label: "Branch",
			kind: "select",
			options: branchOptions,
		});
	}
	return fields;
}

export default function AdminEmployeesPage() {
	const utils = trpc.useUtils();
	const table = useAdminTable<SortColumn>({
		defaultSortBy: "created_at",
		filterKeys: ["status", "department", "role"],
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);
	const [viewId, setViewId] = useState<number | null>(null);
	const [confirm, setConfirm] = useState<
		| { kind: "status"; id: number; name: string; next: "active" | "inactive" }
		| { kind: "archive"; id: number; name: string }
		| null
	>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [exporting, setExporting] = useState(false);

	// Deep links from global search land as ?view=<id>.
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
		department: table.filters.department || undefined,
		role: table.filters.role || undefined,
	};

	const list = trpc.admin.getEmployees.useQuery(query, {
		placeholderData: (previous) => previous,
	});
	const facets = trpc.admin.getEmployeeFacets.useQuery();
	const branches = trpc.admin.getBranches.useQuery({
		pageSize: 100,
		sortBy: "name",
		sortDir: "asc",
	});
	const detail = trpc.admin.getEmployee.useQuery(
		{ id: (viewId ?? editId) as number },
		{ enabled: viewId !== null || editId !== null },
	);

	const branchOptions = useMemo(
		() =>
			(branches.data?.items ?? []).map((b) => ({
				value: String(b.id),
				label: b.name,
			})),
		[branches.data],
	);
	const fields = useMemo(() => employeeFields(branchOptions), [branchOptions]);

	const refresh = () => {
		void utils.admin.getEmployees.invalidate();
		void utils.admin.getEmployeeFacets.invalidate();
		void utils.admin.getDashboardStats.invalidate();
	};

	const onMutationError = (error: unknown) => {
		const normalised = normaliseError(error);
		setFormError(normalised.message);
		setFieldErrors(normalised.fieldErrors);
		toast.error(normalised.title, { description: normalised.message });
	};

	const create = trpc.admin.createEmployee.useMutation({
		onSuccess: (result) => {
			toast.success("Employee added", {
				description: `${result.name} was created as ${result.emp_code}.`,
			});
			setCreateOpen(false);
			setFormError(null);
			setFieldErrors({});
			refresh();
		},
		onError: onMutationError,
	});

	const update = trpc.admin.updateEmployee.useMutation({
		onSuccess: (result) => {
			toast.success("Employee updated", {
				description: `${result.name}'s details were saved.`,
			});
			setEditId(null);
			setFormError(null);
			setFieldErrors({});
			refresh();
			void utils.admin.getEmployee.invalidate();
		},
		onError: onMutationError,
	});

	const setStatus = trpc.admin.setEmployeeStatus.useMutation({
		onSuccess: (_result, variables) => {
			toast.success(
				variables.status === "active"
					? "Employee reactivated"
					: "Employee deactivated",
			);
			setConfirm(null);
			refresh();
		},
		onError: (error) => {
			onMutationError(error);
			setConfirm(null);
		},
	});

	const archive = trpc.admin.archiveEmployee.useMutation({
		onSuccess: (result) => {
			toast.success("Employee archived", {
				description: `${result.name} no longer appears in the active list.`,
			});
			setConfirm(null);
			refresh();
		},
		onError: (error) => {
			onMutationError(error);
			setConfirm(null);
		},
	});

	const handleExport = async () => {
		setExporting(true);
		try {
			const { rows, total, truncated } = await collectAllPages(
				async (page, pageSize) => {
					const result = await utils.admin.getEmployees.fetch({
						...query,
						page,
						pageSize,
					});
					return { items: result.items, total: result.total };
				},
			);
			downloadCsv(
				timestampedFilename("employees"),
				toCsv(rows, [
					{ header: "Code", value: (r) => r.emp_code },
					{ header: "Name", value: (r) => r.name },
					{ header: "Email", value: (r) => r.email },
					{ header: "Phone", value: (r) => r.phone },
					{ header: "Department", value: (r) => r.department },
					{ header: "Role", value: (r) => r.role },
					{ header: "Branch", value: (r) => r.branch_name },
					{ header: "Status", value: (r) => r.status },
					{
						header: "Joined",
						value: (r) => (r.join_date ? r.join_date.slice(0, 10) : ""),
					},
					{ header: "Salary (INR)", value: (r) => r.salary },
				]),
			);
			toast.success(
				truncated
					? `Exported the first ${rows.length} of ${total} employees`
					: `Exported ${rows.length} employees`,
				truncated
					? { description: "Narrow the filters to export the remaining rows." }
					: undefined,
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
					role: detail.data.role ?? "",
					department: detail.data.department ?? "",
					branch_id: detail.data.branch_id ? String(detail.data.branch_id) : "",
					join_date: dateInputValue(detail.data.join_date),
					salary: String(detail.data.salary ?? 0),
					monthly_sales_target: String(detail.data.monthly_sales_target ?? 0),
					address: detail.data.address ?? "",
					pf_number: detail.data.pf_number ?? "",
					pan: detail.data.pan ?? "",
					bank_name: detail.data.bank_name ?? "",
					bank_account: detail.data.bank_account ?? "",
					ifsc: detail.data.ifsc ?? "",
				}
			: undefined;

	const submitCreate = (values: FormValues) => {
		create.mutate({
			name: String(values.name),
			email: String(values.email),
			phone: String(values.phone ?? ""),
			address: String(values.address ?? ""),
			role: String(values.role),
			department: String(values.department ?? ""),
			join_date: String(values.join_date),
			salary: Number(values.salary),
			monthly_sales_target: values.monthly_sales_target
				? Number(values.monthly_sales_target)
				: undefined,
			branch_id: values.branch_id ? Number(values.branch_id) : undefined,
			pf_number: String(values.pf_number ?? ""),
			pan: String(values.pan ?? ""),
			bank_name: String(values.bank_name ?? ""),
			bank_account: String(values.bank_account ?? ""),
			ifsc: String(values.ifsc ?? ""),
		});
	};

	const submitEdit = (values: FormValues) => {
		if (editId === null) return;
		update.mutate({
			id: editId,
			name: String(values.name),
			email: String(values.email),
			phone: String(values.phone ?? ""),
			address: String(values.address ?? ""),
			role: String(values.role),
			department: String(values.department ?? ""),
			join_date: String(values.join_date),
			salary: Number(values.salary),
			monthly_sales_target: values.monthly_sales_target
				? Number(values.monthly_sales_target)
				: undefined,
			branch_id: values.branch_id ? Number(values.branch_id) : null,
			pf_number: String(values.pf_number ?? ""),
			pan: String(values.pan ?? ""),
			bank_name: String(values.bank_name ?? ""),
			bank_account: String(values.bank_account ?? ""),
			ifsc: String(values.ifsc ?? ""),
		});
	};

	const items = list.data?.items ?? [];
	const busy = list.isFetching;

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Employees"
				description="Add, edit and manage every person on the payroll."
				actions={
					<>
						<Button variant="outline" size="sm" asChild>
							<Link href="/admin/activity-log?entity_type=staff">
								<HistoryIcon className="mr-2 h-4 w-4" /> Employee activity
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
							<UserPlusIcon className="mr-2 h-4 w-4" /> Add employee
						</Button>
					</>
				}
			/>

			<AdminToolbar
				searchValue={table.searchInput}
				onSearchChange={table.setSearchInput}
				searchPlaceholder="Search by name, code, email or phone…"
				entityLabel="employees"
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
							label="Department"
							value={table.filters.department ?? "all"}
							onChange={(v) => table.setFilter("department", v)}
							allLabel="All departments"
							options={(facets.data?.departments ?? []).map((d) => ({
								value: d,
								label: d,
							}))}
						/>
						<FilterSelect
							label="Role"
							value={table.filters.role ?? "all"}
							onChange={(v) => table.setFilter("role", v)}
							allLabel="All roles"
							options={(facets.data?.roles ?? []).map((r) => ({
								value: r,
								label: r.replace(/_/g, " "),
							}))}
						/>
					</>
				}
			/>

			{list.isLoading ? (
				<TableLoading columns={8} />
			) : list.error ? (
				<DataError
					error={list.error}
					entity="employees"
					onRetry={() => list.refetch()}
				/>
			) : items.length === 0 ? (
				table.isFiltered ? (
					<DataNoMatches onClear={table.reset} />
				) : (
					<DataEmpty
						title="No employees yet"
						message="Add your first employee to start tracking payroll and attendance."
						action={
							<Button size="sm" onClick={() => setCreateOpen(true)}>
								<UserPlusIcon className="mr-2 h-4 w-4" /> Add employee
							</Button>
						}
					/>
				)
			) : (
				<div className="flex flex-col gap-3">
					<div className="overflow-x-auto rounded-lg border border-border/50">
						<Table className="w-full min-w-[900px]">
							<TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
								<TableRow>
									<SortableHead
										label="Code"
										column="code"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<SortableHead
										label="Name"
										column="name"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<SortableHead
										label="Department"
										column="department"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<SortableHead
										label="Role"
										column="role"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<TableHead>Contact</TableHead>
									<SortableHead
										label="Joined"
										column="join_date"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<SortableHead
										label="Salary"
										column="salary"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
										numeric
									/>
									<SortableHead
										label="Status"
										column="status"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((emp) => (
									<TableRow key={emp.id} className="hover:bg-muted/30">
										<TableCell className="font-mono text-xs">
											{emp.emp_code}
										</TableCell>
										<TableCell>
											<span className="font-medium">{emp.name}</span>
											{emp.branch_name && (
												<span className="block text-muted-foreground text-xs">
													{emp.branch_name}
												</span>
											)}
										</TableCell>
										<TableCell>{text(emp.department)}</TableCell>
										<TableCell className="capitalize">
											{text(emp.role?.replace(/_/g, " "))}
										</TableCell>
										<TableCell className="text-xs">
											<span className="block">{text(emp.email)}</span>
											<span className="block text-muted-foreground">
												{phone(emp.phone)}
											</span>
										</TableCell>
										<TableCell className="whitespace-nowrap">
											{date(emp.join_date)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{inr(emp.salary)}
										</TableCell>
										<TableCell>
											<StatusBadge status={emp.status} />
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													aria-label={`View ${emp.name}`}
													title="View details"
													onClick={() => setViewId(emp.id)}
												>
													<EyeIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													aria-label={`Edit ${emp.name}`}
													title="Edit"
													onClick={() => {
														setFormError(null);
														setFieldErrors({});
														setEditId(emp.id);
													}}
												>
													<PencilIcon className="h-4 w-4" />
												</Button>
												<RowActions
													label={`More actions for ${emp.name}`}
													actions={[
														emp.status === "active"
															? {
																	label: "Deactivate",
																	icon: <BanIcon className="h-4 w-4" />,
																	onSelect: () =>
																		setConfirm({
																			kind: "status",
																			id: emp.id,
																			name: emp.name,
																			next: "inactive",
																		}),
																}
															: {
																	label: "Reactivate",
																	icon: (
																		<CheckCircle2Icon className="h-4 w-4" />
																	),
																	onSelect: () =>
																		setConfirm({
																			kind: "status",
																			id: emp.id,
																			name: emp.name,
																			next: "active",
																		}),
																},
														{
															label: "Archive",
															icon: <ArchiveIcon className="h-4 w-4" />,
															destructive: true,
															onSelect: () =>
																setConfirm({
																	kind: "archive",
																	id: emp.id,
																	name: emp.name,
																}),
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
				title="Add employee"
				description="Creates a staff record. The employee code is assigned automatically."
				fields={fields}
				submitLabel="Create employee"
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
				title="Edit employee"
				description="Only the fields you change are written; everything else is left as-is."
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
				title={detail.data?.name ?? "Employee"}
				subtitle={
					detail.data
						? `${detail.data.emp_code} · ${detail.data.role ?? "—"}`
						: undefined
				}
				loading={detail.isLoading}
				error={viewId !== null ? detail.error : undefined}
				onRetry={() => detail.refetch()}
				sections={
					detail.data
						? [
								{
									title: "Identity",
									rows: [
										{ label: "Employee code", value: detail.data.emp_code },
										{
											label: "Status",
											value: <StatusBadge status={detail.data.status} />,
										},
										{ label: "Email", value: text(detail.data.email) },
										{ label: "Phone", value: phone(detail.data.phone) },
										{
											label: "Address",
											value: text(detail.data.address),
											wide: true,
										},
									],
								},
								{
									title: "Placement",
									rows: [
										{
											label: "Department",
											value: text(detail.data.department),
										},
										{
											label: "Role",
											value: text(detail.data.role?.replace(/_/g, " ")),
										},
										{ label: "Branch", value: text(detail.data.branch_name) },
										{ label: "Joined", value: date(detail.data.join_date) },
									],
								},
								{
									title: "Compensation",
									rows: [
										{ label: "Monthly salary", value: inr(detail.data.salary) },
										{
											label: "Sales target",
											value: inr(detail.data.monthly_sales_target),
										},
										{ label: "PF number", value: text(detail.data.pf_number) },
										{ label: "PAN", value: text(detail.data.pan) },
										{ label: "Bank", value: text(detail.data.bank_name) },
										{ label: "Account", value: text(detail.data.bank_account) },
										{ label: "IFSC", value: text(detail.data.ifsc) },
									],
								},
								{
									title: "Record",
									rows: [
										{ label: "Created", value: date(detail.data.created_at) },
										{
											label: "Last updated",
											value: date(detail.data.updated_at),
										},
									],
								},
							]
						: []
				}
				footer={
					detail.data ? (
						<>
							<Button variant="outline" size="sm" asChild>
								<Link
									href={`/admin/activity-log?entity_type=staff&q=${encodeURIComponent(detail.data.name)}`}
								>
									<HistoryIcon className="mr-2 h-4 w-4" /> View activity
								</Link>
							</Button>
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
								<PencilIcon className="mr-2 h-4 w-4" /> Edit employee
							</Button>
						</>
					) : null
				}
			/>

			<ConfirmDialog
				open={confirm !== null}
				onOpenChange={(open) => {
					if (!open) setConfirm(null);
				}}
				destructive={
					confirm?.kind === "archive" || confirm?.next === "inactive"
				}
				pending={setStatus.isPending || archive.isPending}
				title={
					confirm?.kind === "archive"
						? `Archive ${confirm.name}?`
						: confirm?.next === "active"
							? `Reactivate ${confirm?.name}?`
							: `Deactivate ${confirm?.name}?`
				}
				description={
					confirm?.kind === "archive"
						? `${confirm.name} will be removed from the active employee list.`
						: confirm?.next === "active"
							? `${confirm?.name} will be able to work and appear in active reports again.`
							: `${confirm?.name} will stop appearing in active rosters and payroll runs.`
				}
				consequence={
					confirm?.kind === "archive"
						? "The record is archived, not deleted — attendance, payroll and audit history are preserved and an administrator can restore it in the database."
						: undefined
				}
				confirmLabel={
					confirm?.kind === "archive"
						? "Archive employee"
						: confirm?.next === "active"
							? "Reactivate"
							: "Deactivate"
				}
				onConfirm={() => {
					if (!confirm) return;
					if (confirm.kind === "archive") archive.mutate({ id: confirm.id });
					else setStatus.mutate({ id: confirm.id, status: confirm.next });
				}}
			/>
		</PageTransition>
	);
}
