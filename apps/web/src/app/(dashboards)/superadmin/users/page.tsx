"use client";

import { ROLES, type Role } from "@/lib/permissions"; // Central role definition
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Select } from "@evaluna/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	Tooltip as TooltipRoot,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@evaluna/ui/components/tooltip";

function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<TooltipRoot>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent>{content}</TooltipContent>
			</TooltipRoot>
		</TooltipProvider>
	);
}
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@evaluna/ui/components/dialog";
import {
	ActivityIcon,
	Building2Icon,
	CopyIcon,
	CheckIcon,
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

	// User creation modal states
	const [createOpen, setCreateOpen] = useState(false);
	const [form, setForm] = useState({
		fullName: "",
		employeeId: "",
		email: "",
		roleName: "putter" as Role,
		branchId: 1,
		warehouseId: "" as string,
		initialPassword: "",
		forcePasswordChange: true,
	});
	const [copiedField, setCopiedField] = useState<"email" | "password" | "all" | null>(null);
	const [createdCreds, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);

	// State for administrative action modals
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedUserName, setSelectedUserName] = useState<string>("");

	// View Details Modal
	const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

	// Lock/Unlock Modal
	const [lockStatusOpen, setLockStatusOpen] = useState(false);
	const [pendingStatus, setPendingStatus] = useState<"ACTIVE" | "LOCKED" | null>(null);
	const [statusReason, setStatusStatusReason] = useState("");

	// Reset Password Modal
	const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
	const [newPasswordVal, setNewPasswordVal] = useState("");
	const [forcePwdChange, setForcePasswordChange] = useState(true);
	const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

	// Revoke Sessions Modal
	const [revokeSessionsOpen, setRevokeSessionsOpen] = useState(false);
	const [revokeReason, setRevokeReason] = useState("");

	// Fetch users list with real TRPC hook (Super Admin global view)
	const { data, isLoading, refetch, isFetching } = trpc.users.list.useQuery({
		page,
		limit: pageSize,
		search: search || undefined,
		status: (statusFilter as any) || undefined,
		roleName: (roleFilter as any) || undefined,
	});

	// Fetch detailed user profile for the View Details modal
	const { data: userDetails, isLoading: detailsLoading } = trpc.users.get.useQuery(
		{ userId: selectedUserId || "" },
		{ enabled: !!selectedUserId && viewDetailsOpen }
	);

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
			void utils.users.list.invalidate();
		},
		onError: (err) => {
			toast.error(`Failed to revoke sessions: ${err.message}`);
		},
	});

	const resetCredentials = trpc.users.resetCredentials.useMutation({
		onSuccess: () => {
			toast.success("User password has been reset successfully.");
			setPasswordResetSuccess(true);
		},
		onError: (err) => {
			toast.error(`Failed to reset password: ${err.message}`);
		},
	});

	const createUser = trpc.users.create.useMutation({
		onSuccess: (res, variables) => {
			toast.success("User account and credentials created successfully!");
			setCreatedCredentials({
				email: variables.email,
				pass: variables.initialPassword || "Password@123",
			});
			void utils.users.list.invalidate();
		},
		onError: (err) => {
			let msg = "";
			if (err?.message?.startsWith("[")) {
				try {
					const parsed = JSON.parse(err.message);
					if (Array.isArray(parsed)) {
						msg = parsed.map((issue: any) => issue.message).join(", ");
					}
				} catch (_) {}
			}
			if (!msg) {
				msg = err?.message || "Failed to create user.";
			}
			toast.error(`Failed to create user: ${msg}`);
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

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.fullName || !form.employeeId || !form.email) {
			toast.error("Please fill in all required fields.");
			return;
		}

		if (form.employeeId.length < 3) {
			toast.error("Employee ID must be at least 3 characters.");
			return;
		}

		if (form.initialPassword && form.initialPassword.length < 8) {
			toast.error("Initial Password must be at least 8 characters.");
			return;
		}

		const pass = form.initialPassword || `Temp@${Math.random().toString(36).slice(-8)}123`;
		setForm((prev) => ({ ...prev, initialPassword: pass }));

		createUser.mutate({
			fullName: form.fullName,
			employeeId: form.employeeId,
			email: form.email,
			roleName: form.roleName,
			branchId: Number(form.branchId) || 1,
			warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
			initialPassword: pass,
			forcePasswordChange: form.forcePasswordChange,
		});
	};

	const copyToClipboard = (text: string, type: "email" | "password" | "all") => {
		navigator.clipboard.writeText(text);
		setCopiedField(type);
		toast.success("Copied to clipboard!");
		setTimeout(() => setCopiedField(null), 2000);
	};

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Super Admin: User Management"
				description="Manage system-wide login accounts, assign roles globally, reset credentials, and control access statuses across all companies."
				actions={
					<Button
						size="sm"
						onClick={() => {
							setCreatedCredentials(null);
							setForm({
								fullName: "",
								employeeId: "",
								email: "",
								roleName: "putter",
								branchId: 1,
								warehouseId: "",
								initialPassword: "",
								forcePasswordChange: true,
							});
							setCreateOpen(true);
						}}
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
												<Badge variant="default">
													{(u.role || "user").toUpperCase().replace("_", " ")}
												</Badge>
											</TableCell>
											<TableCell>
												<StatusBadge status={u.status} />
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
															onClick={() => {
																setSelectedUserId(u.id);
																setSelectedUserName(u.name);
																setViewDetailsOpen(true);
															}}
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
																onClick={() => {
																	setSelectedUserId(u.id);
																	setSelectedUserName(u.name);
																	setPendingStatus("LOCKED");
																	setLockStatusOpen(true);
																}}
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
																onClick={() => {
																	setSelectedUserId(u.id);
																	setSelectedUserName(u.name);
																	setPendingStatus("ACTIVE");
																	setLockStatusOpen(true);
																}}
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
															onClick={() => {
																setSelectedUserId(u.id);
																setSelectedUserName(u.name);
																setResetPasswordOpen(true);
																setPasswordResetSuccess(false);
																setNewPasswordVal("");
															}}
														>
															<KeyIcon className="h-4 w-4" />
														</Button>
													</Tooltip>

													<Tooltip content="Revoke All Active Sessions">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
															onClick={() => {
																setSelectedUserId(u.id);
																setSelectedUserName(u.name);
																setRevokeSessionsOpen(true);
																setRevokeReason("");
															}}
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

			{/* Create User Dialog Modal */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Create User Account</DialogTitle>
						<DialogDescription>
							Register a real authentication user linked atomically to an employee record in the ERP.
						</DialogDescription>
					</DialogHeader>

					{!createdCreds ? (
						<form onSubmit={handleCreateSubmit} className="space-y-4">
							<div className="space-y-1">
								<Label htmlFor="fullName">Full Name *</Label>
								<Input
									id="fullName"
									value={form.fullName}
									onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="employeeId">Employee ID *</Label>
									<Input
										id="employeeId"
										value={form.employeeId}
										onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
										placeholder="EMP-123"
										required
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="email">Email / ID *</Label>
									<Input
										id="email"
										type="email"
										value={form.email}
										onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
										placeholder="user@evaluna.com"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="roleSelect">Operational Role *</Label>
									<select
										id="roleSelect"
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										value={form.roleName}
										onChange={(e) => setForm((prev) => ({ ...prev, roleName: e.target.value as any }))}
									>
										{ROLES.map((r) => (
											<option key={r} value={r}>
												{r.toUpperCase().replace("_", " ")}
											</option>
										))}
									</select>
								</div>
								<div className="space-y-1">
									<Label htmlFor="branchId">Primary Branch ID *</Label>
									<Input
										id="branchId"
										type="number"
										value={form.branchId}
										onChange={(e) => setForm((prev) => ({ ...prev, branchId: Number(e.target.value) || 1 }))}
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="warehouseId">Warehouse ID (Optional)</Label>
									<Input
										id="warehouseId"
										type="number"
										value={form.warehouseId}
										onChange={(e) => setForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
										placeholder="Optional"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="initialPassword">Initial Password</Label>
									<Input
										id="initialPassword"
										value={form.initialPassword}
										onChange={(e) => setForm((prev) => ({ ...prev, initialPassword: e.target.value }))}
										placeholder="Auto-generated if empty"
									/>
								</div>
							</div>

							<div className="flex items-center space-x-2 pt-2">
								<input
									id="forceChange"
									type="checkbox"
									className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									checked={form.forcePasswordChange}
									onChange={(e) => setForm((prev) => ({ ...prev, forcePasswordChange: e.target.checked }))}
								/>
								<Label htmlFor="forceChange" className="cursor-pointer text-xs sm:text-sm">
									Force password change on first login
								</Label>
							</div>

							<DialogFooter className="pt-4">
								<Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={createUser.isPending}>
									{createUser.isPending ? "Creating..." : "Create Account"}
								</Button>
							</DialogFooter>
						</form>
					) : (
						<div className="space-y-4 py-2">
							<div className="rounded-lg bg-green-500/10 p-3 text-center text-green-500 text-sm font-semibold">
								User Account Provisioned Successfully!
							</div>

							<Card className="border border-green-500/20 bg-background/50">
								<CardContent className="p-4 space-y-3">
									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="font-semibold text-muted-foreground">Login ID (Email):</span>
										<div className="flex items-center space-x-2 font-mono">
											<span>{createdCreds.email}</span>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 text-muted-foreground"
												onClick={() => copyToClipboard(createdCreds.email, "email")}
											>
												{copiedField === "email" ? <CheckIcon className="h-3.5 w-3.5 text-green-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
											</Button>
										</div>
									</div>

									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="font-semibold text-muted-foreground">Temporary Password:</span>
										<div className="flex items-center space-x-2 font-mono">
											<span className="bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-600 font-semibold">{createdCreds.pass}</span>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 text-muted-foreground"
												onClick={() => copyToClipboard(createdCreds.pass, "password")}
											>
												{copiedField === "password" ? <CheckIcon className="h-3.5 w-3.5 text-green-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>

							<p className="text-muted-foreground text-xs leading-normal">
								* Displayed only once for security reasons. Copy these temporary credentials and share them with the user.
							</p>

							<DialogFooter className="pt-4">
								<Button
									type="button"
									className="w-full"
									onClick={() => {
										copyToClipboard(`Email: ${createdCreds.email}\nPassword: ${createdCreds.pass}`, "all");
									}}
								>
									{copiedField === "all" ? "Copied All!" : "Copy All & Close"}
								</Button>
								<Button type="button" variant="outline" className="w-full" onClick={() => setCreateOpen(false)}>
									Close
								</Button>
							</DialogFooter>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* View Details Dialog Modal */}
			<Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
				<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>User Profile & Security Audit</DialogTitle>
						<DialogDescription>
							Detailed configuration, active sessions, and recent security logs for {selectedUserName || "the user"}.
						</DialogDescription>
					</DialogHeader>

					{detailsLoading ? (
						<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
							<RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" /> Loading user details...
						</div>
					) : !userDetails ? (
						<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
							Failed to load user details.
						</div>
					) : (
						<div className="space-y-6 py-2">
							{/* Profile Grid */}
							<div className="grid grid-cols-2 gap-4 border-b pb-4 border-border/40">
								<div>
									<span className="text-xs font-semibold text-muted-foreground block">Full Name</span>
									<span className="text-sm font-medium">{userDetails.profile?.name || "N/A"}</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-muted-foreground block">Email / Login ID</span>
									<span className="text-sm font-medium">{userDetails.profile?.email || "N/A"}</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-muted-foreground block">Employee ID</span>
									<span className="text-sm font-mono text-xs">{userDetails.profile?.staffCode || "N/A"}</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-muted-foreground block">Primary Role</span>
									<span className="text-sm">
										<Badge variant="outline" className="capitalize">
											{(userDetails.profile?.role || "N/A").toUpperCase().replace("_", " ")}
										</Badge>
									</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-muted-foreground block">Status</span>
									<span className="text-sm">
										<StatusBadge status={userDetails.profile?.status || "ACTIVE"} />
									</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-muted-foreground block">Branch ID</span>
									<span className="text-sm">{userDetails.profile?.branchId ?? "N/A"}</span>
								</div>
							</div>

							{/* Active Sessions */}
							<div className="space-y-2">
								<h4 className="text-sm font-semibold flex items-center">
									<ActivityIcon className="mr-1.5 h-4 w-4 text-blue-500" />
									Active Sessions ({userDetails.sessions?.length || 0})
								</h4>
								{userDetails.sessions?.length === 0 ? (
									<p className="text-xs text-muted-foreground">No active sessions found.</p>
								) : (
									<div className="rounded-md border border-border/40 overflow-hidden text-xs">
										<div className="bg-muted/40 p-2 grid grid-cols-3 font-semibold border-b border-border/40">
											<span>Device / User Agent</span>
											<span>IP Address</span>
											<span>Last Used</span>
										</div>
										<div className="divide-y divide-border/30 max-h-32 overflow-y-auto">
											{userDetails.sessions?.map((session: any) => (
												<div key={session.id} className="p-2 grid grid-cols-3 hover:bg-muted/10">
													<span className="truncate" title={session.userAgent}>
														{session.deviceName || session.userAgent || "Unknown Device"}
													</span>
													<span>{session.ipAddress || "Unknown IP"}</span>
													<span>{session.createdAt ? new Date(session.createdAt).toLocaleString() : "N/A"}</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Audit Logs */}
							<div className="space-y-2">
								<h4 className="text-sm font-semibold flex items-center">
									<ShieldAlertIcon className="mr-1.5 h-4 w-4 text-yellow-500" />
									Security Audit Logs ({userDetails.auditLogs?.length || 0})
								</h4>
								{userDetails.auditLogs?.length === 0 ? (
									<p className="text-xs text-muted-foreground">No security logs recorded.</p>
								) : (
									<div className="rounded-md border border-border/40 overflow-hidden text-xs">
										<div className="bg-muted/40 p-2 grid grid-cols-3 font-semibold border-b border-border/40">
											<span>Action</span>
											<span>Reason / Description</span>
											<span>Date / Time</span>
										</div>
										<div className="divide-y divide-border/30 max-h-40 overflow-y-auto">
											{userDetails.auditLogs?.map((log: any) => (
												<div key={log.id} className="p-2 grid grid-cols-3 hover:bg-muted/10">
													<span className="font-semibold text-yellow-600 dark:text-yellow-400">{log.action}</span>
													<span className="truncate" title={log.reason || log.description}>
														{log.reason || log.description || "N/A"}
													</span>
													<span>{new Date(log.createdAt).toLocaleString()}</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					<DialogFooter>
						<Button type="button" onClick={() => setViewDetailsOpen(false)}>
							Close Details
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Lock/Unlock User Dialog Modal */}
			<Dialog open={lockStatusOpen} onOpenChange={setLockStatusOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{pendingStatus === "LOCKED" ? "Lock User Account" : "Unlock User Account"}</DialogTitle>
						<DialogDescription>
							{pendingStatus === "LOCKED" 
								? "Locking this account will prevent the user from logging in and suspend any active sessions immediately."
								: "Unlocking this account will restore standard login and operation privileges."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1">
							<Label htmlFor="statusReason">Reason for status change *</Label>
							<Input
								id="statusReason"
								value={statusReason}
								onChange={(e) => setStatusStatusReason(e.target.value)}
								placeholder="Enter reason (at least 5 characters)"
								required
							/>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setLockStatusOpen(false)}>
							Cancel
						</Button>
						<Button 
							type="button" 
							disabled={updateStatus.isPending || statusReason.trim().length < 5}
							onClick={() => {
								if (pendingStatus) {
									updateStatus.mutate({
										userId: selectedUserId || "",
										newStatus: pendingStatus,
										reason: statusReason,
									}, {
										onSuccess: () => {
											setLockStatusOpen(false);
											setStatusStatusReason("");
										}
									});
								}
							}}
						>
							{updateStatus.isPending ? "Updating..." : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reset Password Dialog Modal */}
			<Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Reset User Password</DialogTitle>
						<DialogDescription>
							Change or re-generate credentials for {selectedUserName}.
						</DialogDescription>
					</DialogHeader>

					{!passwordResetSuccess ? (
						<div className="space-y-4 py-2">
							<div className="space-y-1">
								<Label htmlFor="newPasswordVal">New Password (at least 8 chars)</Label>
								<div className="flex gap-2">
									<Input
										id="newPasswordVal"
										value={newPasswordVal}
										onChange={(e) => setNewPasswordVal(e.target.value)}
										placeholder="Leave empty to auto-generate"
									/>
									<Button 
										type="button" 
										variant="outline"
										onClick={() => setNewPasswordVal(`Temp@${Math.random().toString(36).slice(-8)}123`)}
									>
										Generate
									</Button>
								</div>
							</div>

							<div className="flex items-center space-x-2 pt-1">
								<input
									id="forcePwdChange"
									type="checkbox"
									className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									checked={forcePwdChange}
									onChange={(e) => setForcePasswordChange(e.target.checked)}
								/>
								<Label htmlFor="forcePwdChange" className="cursor-pointer text-xs sm:text-sm">
									Force password change on first login
								</Label>
							</div>

							<DialogFooter className="pt-2">
								<Button type="button" variant="outline" onClick={() => setResetPasswordOpen(false)}>
									Cancel
								</Button>
								<Button 
									type="button" 
									disabled={resetCredentials.isPending}
									onClick={() => {
										const finalPass = newPasswordVal || `Temp@${Math.random().toString(36).slice(-8)}123`;
										setNewPasswordVal(finalPass);
										resetCredentials.mutate({
											userId: selectedUserId || "",
											newPassword: finalPass,
											forcePasswordChange: forcePwdChange,
										});
									}}
								>
									{resetCredentials.isPending ? "Resetting..." : "Reset Password"}
								</Button>
							</DialogFooter>
						</div>
					) : (
						<div className="space-y-4 py-2">
							<div className="rounded-lg bg-green-500/10 p-3 text-center text-green-500 text-sm font-semibold">
								Password Reset Successfully!
							</div>

							<Card className="border border-green-500/20 bg-background/50">
								<CardContent className="p-4 space-y-3">
									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="font-semibold text-muted-foreground">New Temporary Password:</span>
										<div className="flex items-center space-x-2 font-mono">
											<span className="bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-600 font-semibold">{newPasswordVal}</span>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 text-muted-foreground"
												onClick={() => copyToClipboard(newPasswordVal, "password")}
											>
												{copiedField === "password" ? <CheckIcon className="h-3.5 w-3.5 text-green-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>

							<DialogFooter className="pt-2">
								<Button 
									type="button" 
									className="w-full"
									onClick={() => {
										copyToClipboard(newPasswordVal, "password");
										setResetPasswordOpen(false);
										setPasswordResetSuccess(false);
										setNewPasswordVal("");
									}}
								>
									Copy & Close
								</Button>
							</DialogFooter>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Revoke Sessions Dialog Modal */}
			<Dialog open={revokeSessionsOpen} onOpenChange={setRevokeSessionsOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Revoke Active Sessions</DialogTitle>
						<DialogDescription>
							Are you sure you want to terminate all active login sessions for {selectedUserName}? This will force the user to log out immediately on all devices.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1">
							<Label htmlFor="revokeReason">Reason for session revocation *</Label>
							<Input
								id="revokeReason"
								value={revokeReason}
								onChange={(e) => setRevokeReason(e.target.value)}
								placeholder="Enter reason (at least 5 characters)"
								required
							/>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setRevokeSessionsOpen(false)}>
							Cancel
						</Button>
						<Button 
							type="button" 
							disabled={revokeSessions.isPending || revokeReason.trim().length < 5}
							onClick={() => {
								revokeSessions.mutate({
									userId: selectedUserId || "",
									reason: revokeReason,
								}, {
									onSuccess: () => {
										setRevokeSessionsOpen(false);
										setRevokeReason("");
									}
								});
							}}
						>
							{revokeSessions.isPending ? "Revoking..." : "Confirm Revocation"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
