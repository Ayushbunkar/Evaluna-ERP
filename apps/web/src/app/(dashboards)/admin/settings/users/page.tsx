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
import { BanIcon, CheckCircle2Icon, EyeIcon } from "lucide-react";
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
	AdminPageHeader,
	AdminToolbar,
	FilterSelect,
	SortableHead,
	TablePagination,
} from "@/components/admin/list-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminTable } from "@/hooks/use-admin-table";
import { normaliseError } from "@/lib/admin/errors";
import { date, phone, text } from "@/lib/admin/format";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

type SortColumn = "name" | "role" | "status" | "created_at";

export default function AdminSettingsUsersPage() {
	const utils = trpc.useUtils();
	const table = useAdminTable<SortColumn>({
		defaultSortBy: "name",
		filterKeys: ["status", "role"],
	});

	const [viewId, setViewId] = useState<number | null>(null);
	const [confirm, setConfirm] = useState<{
		id: number;
		name: string;
		next: "active" | "inactive";
	} | null>(null);

	const query = {
		page: table.page,
		pageSize: table.pageSize,
		sortBy: table.sortBy,
		sortDir: table.sortDir,
		search: table.search || undefined,
		status: (table.filters.status as "active" | "inactive") || undefined,
		role: table.filters.role || undefined,
	};

	const list = trpc.admin.getEmployees.useQuery(query, {
		placeholderData: (previous) => previous,
	});

	const facets = trpc.admin.getEmployeeFacets.useQuery();

	const detail = trpc.admin.getEmployee.useQuery(
		{ id: viewId as number },
		{ enabled: viewId !== null },
	);

	const refresh = () => {
		void utils.admin.getEmployees.invalidate();
	};

	const onMutationError = (error: unknown) => {
		const normalised = normaliseError(error);
		toast.error(normalised.title, { description: normalised.message });
	};

	const setStatus = trpc.admin.setEmployeeStatus.useMutation({
		onSuccess: (_result, variables) => {
			toast.success(
				variables.status === "active" ? "User reactivated" : "User deactivated",
			);
			setConfirm(null);
			refresh();
		},
		onError: (error) => {
			onMutationError(error);
			setConfirm(null);
		},
	});

	const items = list.data?.items ?? [];
	const busy = list.isFetching;

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="System Users"
				description="View and manage the status of all staff accounts."
			/>

			<AdminToolbar
				searchValue={table.searchInput}
				onSearchChange={table.setSearchInput}
				searchPlaceholder="Search by name, email or code..."
				entityLabel="users"
				total={list.data?.total}
				isFiltered={table.isFiltered}
				onClearFilters={table.reset}
				onRefresh={refresh}
				refreshing={busy}
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
				<TableLoading columns={6} />
			) : list.error ? (
				<DataError
					error={list.error}
					entity="users"
					onRetry={() => list.refetch()}
				/>
			) : items.length === 0 ? (
				table.isFiltered ? (
					<DataNoMatches onClear={table.reset} />
				) : (
					<DataEmpty
						title="No users found"
						message="Staff accounts are created on the Employees page."
					/>
				)
			) : (
				<div className="flex flex-col gap-3">
					<div className="overflow-x-auto rounded-lg border border-border/50">
						<Table className="w-full">
							<TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
								<TableRow>
									<TableHead>Code</TableHead>
									<SortableHead
										label="Name"
										column="name"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<TableHead>Email</TableHead>
									<SortableHead
										label="Role"
										column="role"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<SortableHead
										label="Status"
										column="status"
										sortBy={table.sortBy}
										sortDir={table.sortDir}
										onToggle={table.toggleSort}
									/>
									<TableHead>Joined</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((user) => (
									<TableRow key={user.id} className="hover:bg-muted/30">
										<TableCell className="font-mono text-xs">
											{user.emp_code}
										</TableCell>
										<TableCell className="font-medium">{user.name}</TableCell>
										<TableCell className="text-xs">
											{text(user.email)}
										</TableCell>
										<TableCell className="text-sm capitalize">
											{text(user.role?.replace(/_/g, " "))}
										</TableCell>
										<TableCell>
											<StatusBadge status={user.status} />
										</TableCell>
										<TableCell className="whitespace-nowrap text-xs">
											{date(user.join_date)}
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													title="View details"
													onClick={() => setViewId(user.id)}
												>
													<EyeIcon className="h-4 w-4" />
												</Button>
												{user.status === "active" ? (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														title="Deactivate"
														onClick={() =>
															setConfirm({
																id: user.id,
																name: user.name,
																next: "inactive",
															})
														}
													>
														<BanIcon className="h-4 w-4" />
													</Button>
												) : (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-green-600 hover:text-green-700"
														title="Reactivate"
														onClick={() =>
															setConfirm({
																id: user.id,
																name: user.name,
																next: "active",
															})
														}
													>
														<CheckCircle2Icon className="h-4 w-4" />
													</Button>
												)}
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

			<DetailDialog
				open={viewId !== null}
				onOpenChange={(open) => {
					if (!open) setViewId(null);
				}}
				title={detail.data?.name ?? "User"}
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
									title: "Account",
									rows: [
										{ label: "Employee Code", value: detail.data.emp_code },
										{
											label: "Status",
											value: <StatusBadge status={detail.data.status} />,
										},
										{ label: "Email", value: text(detail.data.email) },
										{ label: "Phone", value: phone(detail.data.phone) },
										{
											label: "Role",
											value: text(detail.data.role?.replace(/_/g, " ")),
										},
										{
											label: "Department",
											value: text(detail.data.department),
										},
										{ label: "Branch", value: text(detail.data.branch_name) },
									],
								},
							]
						: []
				}
			/>

			<ConfirmDialog
				open={confirm !== null}
				onOpenChange={(open) => {
					if (!open) setConfirm(null);
				}}
				destructive={confirm?.next === "inactive"}
				pending={setStatus.isPending}
				title={
					confirm?.next === "active"
						? `Reactivate ${confirm?.name}?`
						: `Deactivate ${confirm?.name}?`
				}
				description={
					confirm?.next === "active"
						? `${confirm?.name} will be able to log in and access the system again.`
						: `${confirm?.name} will be prevented from logging in.`
				}
				confirmLabel={confirm?.next === "active" ? "Reactivate" : "Deactivate"}
				onConfirm={() => {
					if (!confirm) return;
					setStatus.mutate({ id: confirm.id, status: confirm.next });
				}}
			/>
		</PageTransition>
	);
}
