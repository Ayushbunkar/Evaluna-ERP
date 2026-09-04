"use client";

import { ROLES } from "@/lib/permissions"; // Central role definition
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Tooltip } from "@evaluna/ui/components/tooltip";
import {
	ActivityIcon,
	Building2Icon,
	EyeIcon,
	KeyIcon,
	LockIcon,
	PlusIcon,
	RefreshCwIcon,
	ShieldAlertIcon,
	UnlockIcon,
	UserMinusIcon,
	UserPlusIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AdminPageHeader,
	AdminToolbar,
	FilterSelect,
	TablePagination,
} from "@/components/admin/list-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

// --- Constants ---
const USER_STATUSES = [
	"ACTIVE",
	"INACTIVE",
	"LOCKED",
	"PENDING",
	"SUSPENDED",
] as const;

export default function SuperAdminUsersPage() {
	const utils = trpc.useUtils();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [roleFilter, setRoleFilter] = useState("");

	// Fetch users list with real TRPC hook (Super Admin global view)
	const { data, isLoading, refetch, isFetching } = trpc.users.list.useQuery({
		page,
		limit: pageSize,
		search: search || undefined,
		status: (statusFilter as any) || undefined,
		roleName: (roleFilter as any) || undefined,
	});

	// Mutations
	const updateStatus = trpc.users.updateStatus.useMutation({
		onSuccess: () => {
			toast.success("User status updated successfully.");
			void utils.users.list.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to update status: ${err.message}`);
		},
	});

	const revokeSessions = trpc.users.revokeSessions.useMutation({
		onSuccess: () => {
			toast.success("All active sessions revoked successfully.");
		},
		onError: (err) => {
			toast.error(`Failed to revoke sessions: ${err.message}`);
		},
	});

	const users = data?.users || [];
	const total = data?.pagination?.total || 0;
	const totalPages = data?.pagination?.totalPages || 1;

	const handleStatusChange = (userId: string, newStatus: string) => {
		updateStatus.mutate({
			userId,
			newStatus: newStatus as any,
			reason: "Updated by super admin.",
		});
	};

	const handleRevoke = (userId: string) => {
		revokeSessions.mutate({
			userId,
			reason: "Sessions forcefully cleared by super admin.",
		});
	};

	const handleClearFilters = () => {
		setSearch("");
		setStatusFilter("");
		setRoleFilter("");
		setPage(1);
	};

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Super Admin: User Management"
				description="Manage system-wide login accounts, assign roles globally, reset credentials, and control access statuses across all companies."
				actions={
					<Button
						size="sm"
						onClick={() => console.log("Create User dialog open")}
					>
						<PlusIcon className="mr-2 h-4 w-4" /> Create User
					</Button>
				}
			/>

			<AdminToolbar
				searchValue={search}
				onSearchChange={(v) => {
					setSearch(v);
					setPage(1);
				}}
				searchPlaceholder="Search by name, email, or employee ID..."
				entityLabel="users"
				total={total}
				isFiltered={Boolean(search || statusFilter || roleFilter)}
				onClearFilters={handleClearFilters}
				onRefresh={() => void refetch()}
				refreshing={isFetching}
				filters={
					<div className="flex flex-wrap items-center gap-2">
						<FilterSelect
							label="Status"
							value={statusFilter}
							onChange={(v) => {
								setStatusFilter(v === "all" ? "" : v);
								setPage(1);
							}}
							allLabel="All statuses"
							options={USER_STATUSES.map((s) => ({ value: s, label: s }))}
						/>
						<FilterSelect
							label="Role"
							value={roleFilter}
							onChange={(v) => {
								setRoleFilter(v === "all" ? "" : v);
								setPage(1);
							}}
							allLabel="All roles"
							options={ROLES.map((r) => ({
								value: r,
								label: r.toUpperCase().replace("_", " "),
							}))}
						/>
					</div>
				}
			/>

			{/* User Table Card */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
							<RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" /> Loading users...
						</div>
					) : users.length === 0 ? (
						<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
							No users found matching the criteria.
						</div>
					) : (
						<div className="overflow-x-auto rounded-lg">
							<Table className="w-full">
								<TableHeader className="bg-muted/40 backdrop-blur">
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Employee ID</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Last Active</TableHead>
										<TableHead>Created Date</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.map((u) => (
										<TableRow key={u.id} className="hover:bg-muted/30">
											<TableCell className="font-medium">{u.name}</TableCell>
											<TableCell className="font-mono text-xs">
												{u.staffCode || "N/A"}
											</TableCell>
											<TableCell>{u.email}</TableCell>
											<TableCell>
												<Badge variant="primary">
													{u.role.toUpperCase().replace("_", " ")}
												</Badge>
											</TableCell>
											<TableCell>
												<StatusBadge status={u.status.toLowerCase()} />
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{u.lastActiveAt
													? new Date(u.lastActiveAt).toLocaleDateString()
													: "Never"}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{new Date(u.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end gap-1">
													<Tooltip content="Edit Details">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-muted-foreground hover:text-foreground"
															onClick={() => console.log("Edit user clicked")}
														>
															<EyeIcon className="h-4 w-4" />
														</Button>
													</Tooltip>

													{u.status === "ACTIVE" ? (
														<Tooltip content="Lock Account">
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
																onClick={() => handleStatusChange(u.id, "LOCKED")}
															>
																<LockIcon className="h-4 w-4" />
															</Button>
														</Tooltip>
													) : (
														<Tooltip content="Unlock Account">
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
																onClick={() => handleStatusChange(u.id, "ACTIVE")}
															>
																<UnlockIcon className="h-4 w-4" />
															</Button>
														</Tooltip>
													)}

													<Tooltip content="Reset Password">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
															onClick={() => console.log("Reset password clicked")}
														>
															<KeyIcon className="h-4 w-4" />
														</Button>
													</Tooltip>

													<Tooltip content="Revoke All Active Sessions">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
															onClick={() => handleRevoke(u.id)}
														>
															<UserMinusIcon className="h-4 w-4" />
														</Button>
													</Tooltip>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pagination */}
			{totalPages > 1 && (
				<TablePagination
					page={page}
					pageSize={pageSize}
					total={total}
					totalPages={totalPages}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					busy={isFetching}
				/>
			)}
		</PageTransition>
	);
}
