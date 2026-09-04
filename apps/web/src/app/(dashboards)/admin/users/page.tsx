"use client";

import { ROLES } from "@/lib/permissions"; // Central role definition
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Pagination } from "@evaluna/ui/components/pagination";
import { Select } from "@evaluna/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Tooltip } from "@evaluna/ui/components/tooltip";
import { useState } from "react";
// Assumed imports from project structure
import { trpc } from "@/lib/trpc/client"; // tRPC client wrapper

// --- Constants ---
const USER_STATUSES = [
	"ACTIVE",
	"INACTIVE",
	"LOCKED",
	"PENDING",
	"SUSPENDED",
] as const;

// --- Components ---

/**
 * Renders a clickable action menu for a single user record.
 */
const UserActions = ({ userId }: { userId: string }) => {
	// Mutators for security actions
	const updateStatus = trpc.users.updateStatus.useMutation();
	const revokeSessions = trpc.users.revokeSessions.useMutation();
	// Placeholder for dialogs/modals
	const [showRoleModal, setShowRoleModal] = useState(false);
	const [showPasswordModal, setShowPasswordModal] = useState(false);

	const handleLock = () => {
		updateStatus.mutate({
			userId,
			newStatus: "LOCKED",
			reason: "Manually locked by admin.",
		});
	};

	const handleRevoke = () => {
		revokeSessions.mutate({
			userId,
			reason: "Forced session revoke by admin for security.",
		});
	};

	return (
		<div className="flex space-x-2">
			<Button
				size="sm"
				variant="secondary"
				onClick={() => console.log(`View ${userId}`)}
			>
				View
			</Button>
			<Button size="sm" onClick={() => setShowRoleModal(true)}>
				Assign Role
			</Button>
			<Tooltip content="Lock Account">
				<Button size="sm" variant="warning" onClick={handleLock}>
					Lock
				</Button>
			</Tooltip>
			<Tooltip content="Revoke All Sessions">
				<Button size="sm" variant="danger" onClick={handleRevoke}>
					Revoke
				</Button>
			</Tooltip>
			<Button size="sm" onClick={() => setShowPasswordModal(true)}>
				Reset Password
			</Button>
		</div>
	);
};

export default function AdminUsersPage() {
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState({
		search: "",
		status: "" as (typeof USER_STATUSES)[number] | "",
		roleName: "" as (typeof ROLES)[number] | "",
		branchId: undefined as number | undefined,
	});

	// Use the new tRPC query hook for listing users
	const { data, isLoading, refetch } = trpc.users.list.useQuery({
		page,
		limit: 10,
		search: filters.search || undefined,
		status: filters.status || undefined,
		roleName: filters.roleName || undefined,
		branchId: filters.branchId,
	});

	const users = data?.users || [];
	const totalPages = data?.pagination?.totalPages || 0;

	const handleFilterChange = (key: keyof typeof filters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
		setPage(1); // Reset to first page on filter change
	};

	return (
		<div className="p-8">
			<h1 className="mb-6 font-bold text-3xl">User Management</h1>

			{/* Filter and Create User Bar (Requirement 19) */}
			<Card className="mb-6 p-4">
				<div className="flex items-center justify-between space-x-4">
					<Input
						placeholder="Search by Name, Email or Employee ID"
						className="flex-1"
						onChange={(e) => handleFilterChange("search", e.target.value)}
					/>
					<Select
						value={filters.status}
						onValueChange={(v) => handleFilterChange("status", v)}
					>
						<option value="">Filter by Status</option>
						{USER_STATUSES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</Select>
					<Select
						value={filters.roleName}
						onValueChange={(v) => handleFilterChange("roleName", v)}
					>
						<option value="">Filter by Role</option>
						{ROLES.map((r) => (
							<option key={r} value={r}>
								{r.toUpperCase().replace("_", " ")}
							</option>
						))}
					</Select>
					<Button onClick={() => console.log("Open Create User Modal")}>
						+ Create New User
					</Button>
				</div>
			</Card>

			{/* User Table (Requirement 1) */}
			<Card>
				{isLoading ? (
					<p className="p-4">Loading users...</p>
				) : users.length === 0 ? (
					<p className="p-4">No users found matching the criteria.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Employee ID</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Last Login</TableHead>
								<TableHead>Created Date</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.staffCode}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge variant="primary">
											{user.role.toUpperCase().replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant={userStatusVariant(user.status)}>
											{user.status}
										</Badge>
									</TableCell>
									<TableCell>
										{user.lastActiveAt
											? new Date(user.lastActiveAt).toLocaleDateString()
											: "Never"}
									</TableCell>
									<TableCell>
										{new Date(user.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<UserActions userId={user.id} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="mt-4 flex justify-center">
					<Pagination
						currentPage={page}
						totalPages={totalPages}
						onPageChange={setPage}
					/>
				</div>
			)}
		</div>
	);
}

// Utility function to get Badge variant based on status
function userStatusVariant(status: (typeof USER_STATUSES)[number]) {
	switch (status) {
		case "ACTIVE":
			return "success";
		case "PENDING":
			return "info";
		case "LOCKED":
			return "danger";
		case "SUSPENDED":
			return "warning";
		case "INACTIVE":
			return "secondary";
		default:
			return "secondary";
	}
}
