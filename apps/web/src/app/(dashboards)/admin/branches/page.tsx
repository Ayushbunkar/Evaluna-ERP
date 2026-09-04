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
import { Building2Icon, EyeIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
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
	SortableHead,
	TablePagination,
} from "@/components/admin/list-shell";
import { RowActions } from "@/components/admin/row-actions";
import { useAdminTable } from "@/hooks/use-admin-table";
import { normaliseError } from "@/lib/admin/errors";
import { text } from "@/lib/admin/format";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

type SortColumn = "name" | "code" | "created_at";

const fields: FormField[] = [
	{
		name: "name",
		label: "Branch Name",
		kind: "text",
		required: true,
		maxLength: 100,
	},
	{ name: "code", label: "Branch Code", kind: "text", maxLength: 20 },
	{
		name: "address",
		label: "Address",
		kind: "textarea",
		maxLength: 500,
		wide: true,
	},
	{ name: "phone", label: "Phone", kind: "tel", maxLength: 20 },
	{ name: "email", label: "Email", kind: "email" },
	{
		name: "is_headquarters",
		label: "Is Headquarters",
		kind: "select",
		options: [
			{ value: "true", label: "Yes" },
			{ value: "false", label: "No" },
		],
	},
];

export default function AdminBranchesPage() {
	const utils = trpc.useUtils();
	const table = useAdminTable<SortColumn>({
		defaultSortBy: "name",
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);
	const [viewId, setViewId] = useState<number | null>(null);
	const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(
		null,
	);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const query = {
		page: table.page,
		pageSize: table.pageSize,
		sortBy: table.sortBy,
		sortDir: table.sortDir,
		search: table.search || undefined,
	};

	const list = trpc.admin.getBranches.useQuery(query, {
		placeholderData: (previous) => previous,
	});

	const detail = trpc.admin.getBranch.useQuery(
		{ id: (viewId ?? editId) as number },
		{ enabled: viewId !== null || editId !== null },
	);

	const refresh = () => {
		void utils.admin.getBranches.invalidate();
		void utils.admin.getDashboardStats.invalidate();
	};

	const onMutationError = (error: unknown) => {
		const normalised = normaliseError(error);
		setFormError(normalised.message);
		setFieldErrors(normalised.fieldErrors);
		toast.error(normalised.title, { description: normalised.message });
	};

	const create = trpc.admin.createBranch.useMutation({
		onSuccess: (result) => {
			toast.success("Branch added", {
				description: `${result.name} was created.`,
			});
			setCreateOpen(false);
			setFormError(null);
			setFieldErrors({});
			refresh();
		},
		onError: onMutationError,
	});

	const update = trpc.admin.updateBranch.useMutation({
		onSuccess: (result) => {
			toast.success("Branch updated", {
				description: `${result.name} details were saved.`,
			});
			setEditId(null);
			setFormError(null);
			setFieldErrors({});
			refresh();
			void utils.admin.getBranch.invalidate();
		},
		onError: onMutationError,
	});

	const deleteMut = trpc.admin.deleteBranch.useMutation({
		onSuccess: () => {
			toast.success("Branch deleted");
			setConfirm(null);
			refresh();
		},
		onError: (error) => {
			onMutationError(error);
			setConfirm(null);
		},
	});

	const editInitial: FormValues | undefined =
		editId !== null && detail.data && detail.data.id === editId
			? {
					name: detail.data.name ?? "",
					code: detail.data.code ?? "",
					address: detail.data.address ?? "",
					phone: detail.data.phone ?? "",
					email: detail.data.email ?? "",
					is_headquarters: detail.data.is_headquarters ? "true" : "false",
				}
			: undefined;

	const submitCreate = (values: FormValues) => {
		create.mutate({
			name: String(values.name),
			code: String(values.code ?? ""),
			address: String(values.address ?? ""),
			phone: String(values.phone ?? ""),
			email: String(values.email ?? ""),
			is_headquarters: values.is_headquarters === "true",
		});
	};

	const submitEdit = (values: FormValues) => {
		if (editId === null) return;
		update.mutate({
			id: editId,
			name: String(values.name),
			code: String(values.code ?? ""),
			address: String(values.address ?? ""),
			phone: String(values.phone ?? ""),
			email: String(values.email ?? ""),
			is_headquarters: values.is_headquarters === "true",
		});
	};

	const items = list.data?.items ?? [];
	const busy = list.isFetching;

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Branches"
				description="Manage all company branches and locations."
				actions={
					<Button
						size="sm"
						onClick={() => {
							setFormError(null);
							setFieldErrors({});
							setCreateOpen(true);
						}}
					>
						<Building2Icon className="mr-2 h-4 w-4" /> Add branch
					</Button>
				}
			/>

			<AdminToolbar
				searchValue={table.searchInput}
				onSearchChange={table.setSearchInput}
				searchPlaceholder="Search by name or code..."
				entityLabel="branches"
				total={list.data?.total}
				isFiltered={table.isFiltered}
				onClearFilters={table.reset}
				onRefresh={refresh}
				refreshing={busy}
			/>

			{list.isLoading ? (
				<TableLoading columns={6} />
			) : list.error ? (
				<DataError
					error={list.error}
					entity="branches"
					onRetry={() => list.refetch()}
				/>
			) : items.length === 0 ? (
				table.isFiltered ? (
					<DataNoMatches onClear={table.reset} />
				) : (
					<DataEmpty
						title="No branches yet"
						message="Add your first branch."
						action={
							<Button size="sm" onClick={() => setCreateOpen(true)}>
								<Building2Icon className="mr-2 h-4 w-4" /> Add branch
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
									<TableHead>Address</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>Type</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((b) => (
									<TableRow key={b.id} className="hover:bg-muted/30">
										<TableCell className="font-mono text-xs">
											{text(b.code)}
										</TableCell>
										<TableCell className="font-medium">{b.name}</TableCell>
										<TableCell>{text(b.address)}</TableCell>
										<TableCell>{text(b.phone)}</TableCell>
										<TableCell>
											<span
												className={`rounded-full px-2 py-0.5 text-xs ${b.is_headquarters ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
											>
												{b.is_headquarters ? "Headquarters" : "Branch"}
											</span>
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => setViewId(b.id)}
												>
													<EyeIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => {
														setFormError(null);
														setFieldErrors({});
														setEditId(b.id);
													}}
												>
													<PencilIcon className="h-4 w-4" />
												</Button>
												<RowActions
													label="Actions"
													actions={[
														{
															label: "Delete",
															icon: <TrashIcon className="h-4 w-4" />,
															destructive: true,
															onSelect: () =>
																setConfirm({ id: b.id, name: b.name }),
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
				title="Add branch"
				description="Create a new branch location."
				fields={fields}
				submitLabel="Create branch"
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
				title="Edit branch"
				description="Update branch details."
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
				title={detail.data?.name ?? "Branch"}
				loading={detail.isLoading}
				error={viewId !== null ? detail.error : undefined}
				onRetry={() => detail.refetch()}
				sections={
					detail.data
						? [
								{
									title: "Identity",
									rows: [
										{ label: "Code", value: text(detail.data.code) },
										{
											label: "Type",
											value: detail.data.is_headquarters
												? "Headquarters"
												: "Branch",
										},
										{ label: "Phone", value: text(detail.data.phone) },
										{ label: "Email", value: text(detail.data.email) },
										{
											label: "Address",
											value: text(detail.data.address),
											wide: true,
										},
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
							<PencilIcon className="mr-2 h-4 w-4" /> Edit branch
						</Button>
					) : null
				}
			/>

			<ConfirmDialog
				open={confirm !== null}
				onOpenChange={(open) => {
					if (!open) setConfirm(null);
				}}
				destructive={true}
				pending={deleteMut.isPending}
				title={`Delete ${confirm?.name}?`}
				description="This will permanently delete the branch."
				confirmLabel="Delete"
				onConfirm={() => {
					if (!confirm) return;
					deleteMut.mutate({ id: confirm.id });
				}}
			/>
		</PageTransition>
	);
}
