"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Checkbox } from "@evaluna/ui/components/checkbox";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Separator } from "@evaluna/ui/components/separator";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Switch } from "@evaluna/ui/components/switch";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	FileText,
	LogsIcon,
	Settings,
	Shield,
	UserCog,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";

export default function ClientManagementPage() {
	const _router = useRouter();
	const [activeTab, setActiveTab] = useState("roles");

	return (
		<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">
						Client Management
					</h2>
					<p className="text-muted-foreground">
						Manage roles, users, permissions, and system configuration from this
						centralized control panel.
					</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-6 lg:w-[800px]">
					<TabsTrigger value="roles" className="gap-2">
						<Shield className="h-4 w-4" />
						Roles
					</TabsTrigger>
					<TabsTrigger value="users" className="gap-2">
						<Users className="h-4 w-4" />
						Users
					</TabsTrigger>
					<TabsTrigger value="permissions" className="gap-2">
						<Settings className="h-4 w-4" />
						Permissions
					</TabsTrigger>
					<TabsTrigger value="modules" className="gap-2">
						<FileText className="h-4 w-4" />
						Modules
					</TabsTrigger>
					<TabsTrigger value="audit" className="gap-2">
						<LogsIcon className="h-4 w-4" />
						Audit Logs
					</TabsTrigger>
					<TabsTrigger value="settings" className="gap-2">
						<UserCog className="h-4 w-4" />
						System Settings
					</TabsTrigger>
				</TabsList>

				{/* Roles Management */}
				<TabsContent value="roles" className="mt-6 space-y-4">
					<RolesManagement />
				</TabsContent>

				{/* Users Management */}
				<TabsContent value="users" className="mt-6 space-y-4">
					<UsersManagement />
				</TabsContent>

				{/* Permissions Management */}
				<TabsContent value="permissions" className="mt-6 space-y-4">
					<PermissionsManagement />
				</TabsContent>

				{/* Modules Management */}
				<TabsContent value="modules" className="mt-6 space-y-4">
					<ModulesManagement />
				</TabsContent>

				{/* Audit Logs */}
				<TabsContent value="audit" className="mt-6 space-y-4">
					<AuditLogs />
				</TabsContent>

				{/* System Settings */}
				<TabsContent value="settings" className="mt-6 space-y-4">
					<SystemSettings />
				</TabsContent>
			</Tabs>
		</div>
	);
}

// ========== Roles Management Component ========== //
function RolesManagement() {
	const {
		data: roles,
		isLoading,
		refetch,
	} = trpc.clientSettings.getAllRoles.useQuery();
	const createRole = trpc.clientSettings.createRole.useMutation({
		onSuccess: () => {
			toast.success("Role created successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to create role: ${err.message}`),
	});
	const updateRole = trpc.clientSettings.updateRole.useMutation({
		onSuccess: () => {
			toast.success("Role updated successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to update role: ${err.message}`),
	});
	const deleteRole = trpc.clientSettings.deleteRole.useMutation({
		onSuccess: () => {
			toast.success("Role deleted successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to delete role: ${err.message}`),
	});
	const cloneRole = trpc.clientSettings.cloneRole.useMutation({
		onSuccess: () => {
			toast.success("Role cloned successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to clone role: ${err.message}`),
	});

	const [newRole, setNewRole] = useState({
		name: "",
		description: "",
		can_edit_permissions: false,
	});
	const [editingRole, setEditingRole] = useState<(typeof roles)[0] | null>(
		null,
	);
	const [cloneSource, setCloneSource] = useState<number | null>(null);
	const [cloneName, setCloneName] = useState("");

	const handleCreateRole = () => {
		if (!newRole.name.trim()) {
			toast.error("Role name is required");
			return;
		}
		createRole.mutate(newRole);
		setNewRole({ name: "", description: "", can_edit_permissions: false });
	};

	const handleUpdateRole = (role: (typeof roles)[0]) => {
		updateRole.mutate({
			id: role.id,
			name: role.name,
			description: role.description || undefined,
			can_edit_permissions: role.can_edit_permissions,
		});
		setEditingRole(null);
	};

	const handleDeleteRole = (id: number) => {
		if (
			confirm(
				"Are you sure you want to delete this role? This cannot be undone.",
			)
		) {
			deleteRole.mutate({ id });
		}
	};

	const handleCloneRole = () => {
		if (!cloneSource || !cloneName.trim()) {
			toast.error("Please select a role to clone and provide a new name");
			return;
		}
		cloneRole.mutate({
			id: cloneSource,
			new_name: cloneName.trim(),
			new_description: `Cloned from ${roles?.find((r) => r.id === cloneSource)?.name}`,
		});
		setCloneSource(null);
		setCloneName("");
	};

	if (isLoading) {
		return <Skeleton className="h-96 w-full" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Role Management</CardTitle>
				<CardDescription>
					Create, edit, and manage user roles. Roles control what users can
					access and do in the system.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Create Role Form */}
				<div className="space-y-4 rounded-lg border p-4">
					<h3 className="font-semibold text-lg">Create New Role</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="role-name">Role Name</Label>
							<Input
								id="role-name"
								value={newRole.name}
								onChange={(e) =>
									setNewRole({ ...newRole, name: e.target.value })
								}
								placeholder="e.g., Sales Manager"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="role-description">Description</Label>
							<Textarea
								id="role-description"
								value={newRole.description}
								onChange={(e) =>
									setNewRole({ ...newRole, description: e.target.value })
								}
								placeholder="Brief description of the role"
							/>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="can-edit-permissions"
							checked={newRole.can_edit_permissions}
							onCheckedChange={(checked) =>
								setNewRole({ ...newRole, can_edit_permissions: !!checked })
							}
						/>
						<Label htmlFor="can-edit-permissions" className="text-sm">
							Can edit permissions
						</Label>
					</div>
					<Button onClick={handleCreateRole} disabled={createRole.isPending}>
						{createRole.isPending ? "Creating..." : "Create Role"}
					</Button>
				</div>

				{/* Clone Role Form */}
				<div className="space-y-4 rounded-lg border p-4">
					<h3 className="font-semibold text-lg">Clone Existing Role</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="clone-source">Select Role to Clone</Label>
							<Select
								value={cloneSource?.toString()}
								onValueChange={(v) => setCloneSource(Number(v))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									{roles?.map((role) => (
										<SelectItem key={role.id} value={role.id.toString()}>
											{role.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="clone-name">New Role Name</Label>
							<Input
								id="clone-name"
								value={cloneName}
								onChange={(e) => setCloneName(e.target.value)}
								placeholder="e.g., Sales Manager - Copy"
							/>
						</div>
					</div>
					<Button
						onClick={handleCloneRole}
						disabled={cloneRole.isPending || !cloneSource || !cloneName.trim()}
					>
						{cloneRole.isPending ? "Cloning..." : "Clone Role"}
					</Button>
				</div>

				{/* Roles List */}
				<div className="space-y-4">
					<h3 className="font-semibold text-lg">Existing Roles</h3>
					<div className="space-y-2">
						{roles?.map((role) => (
							<div
								key={role.id}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-medium">{role.name}</h4>
										{role.is_default && (
											<Badge variant="secondary">Default</Badge>
										)}
										{role.can_edit_permissions && (
											<Badge variant="outline">Can Edit Permissions</Badge>
										)}
									</div>
									<p className="text-muted-foreground text-sm">
										{role.description || "No description"}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setEditingRole(role)}
									>
										Edit
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => handleDeleteRole(role.id)}
									>
										Delete
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Edit Role Dialog */}
				{editingRole && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
						<div className="w-full max-w-md rounded-lg bg-white p-6">
							<h3 className="mb-4 font-semibold text-lg">
								Edit Role: {editingRole.name}
							</h3>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="edit-role-name">Role Name</Label>
									<Input
										id="edit-role-name"
										value={editingRole.name}
										onChange={(e) =>
											setEditingRole({ ...editingRole, name: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-role-description">Description</Label>
									<Textarea
										id="edit-role-description"
										value={editingRole.description || ""}
										onChange={(e) =>
											setEditingRole({
												...editingRole,
												description: e.target.value,
											})
										}
									/>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="edit-can-edit-permissions"
										checked={editingRole.can_edit_permissions}
										onCheckedChange={(checked) =>
											setEditingRole({
												...editingRole,
												can_edit_permissions: !!checked,
											})
										}
									/>
									<Label
										htmlFor="edit-can-edit-permissions"
										className="text-sm"
									>
										Can edit permissions
									</Label>
								</div>
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() => setEditingRole(null)}
									>
										Cancel
									</Button>
									<Button onClick={() => handleUpdateRole(editingRole)}>
										Save Changes
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ========== Users Management Component ========== //
function UsersManagement() {
	const {
		data: staff,
		isLoading,
		refetch,
	} = trpc.clientSettings.getAllStaff.useQuery();
	const createStaff = trpc.clientSettings.createStaff.useMutation({
		onSuccess: () => {
			toast.success("User created successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to create user: ${err.message}`),
	});
	const updateStaff = trpc.clientSettings.updateStaff.useMutation({
		onSuccess: () => {
			toast.success("User updated successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to update user: ${err.message}`),
	});
	const deleteStaff = trpc.clientSettings.deleteStaff.useMutation({
		onSuccess: () => {
			toast.success("User deleted successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to delete user: ${err.message}`),
	});

	const [newUser, setNewUser] = useState({
		name: "",
		email: "",
		phone: "",
		role: "staff",
		department: "",
		status: "active" as const,
	});
	const [editingUser, setEditingUser] = useState<(typeof staff)[0] | null>(
		null,
	);

	const handleCreateUser = () => {
		if (!newUser.name.trim() || !newUser.email.trim()) {
			toast.error("Name and email are required");
			return;
		}
		createStaff.mutate(newUser);
		setNewUser({
			name: "",
			email: "",
			phone: "",
			role: "staff",
			department: "",
			status: "active",
		});
	};

	const handleUpdateUser = (user: (typeof staff)[0]) => {
		updateStaff.mutate({
			id: user.id,
			name: user.name,
			email: user.email,
			phone: user.phone || undefined,
			role: user.role,
			department: user.department || undefined,
			status: user.status,
		});
		setEditingUser(null);
	};

	const handleDeleteUser = (id: number) => {
		if (
			confirm(
				"Are you sure you want to delete this user? This cannot be undone.",
			)
		) {
			deleteStaff.mutate({ id });
		}
	};

	if (isLoading) {
		return <Skeleton className="h-96 w-full" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>User Management</CardTitle>
				<CardDescription>
					Create, edit, and manage user accounts. Users can be assigned to roles
					and departments.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Create User Form */}
				<div className="space-y-4 rounded-lg border p-4">
					<h3 className="font-semibold text-lg">Create New User</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="user-name">Full Name</Label>
							<Input
								id="user-name"
								value={newUser.name}
								onChange={(e) =>
									setNewUser({ ...newUser, name: e.target.value })
								}
								placeholder="John Doe"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="user-email">Email</Label>
							<Input
								id="user-email"
								type="email"
								value={newUser.email}
								onChange={(e) =>
									setNewUser({ ...newUser, email: e.target.value })
								}
								placeholder="john@example.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="user-phone">Phone</Label>
							<Input
								id="user-phone"
								value={newUser.phone}
								onChange={(e) =>
									setNewUser({ ...newUser, phone: e.target.value })
								}
								placeholder="+1234567890"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="user-role">Role</Label>
							<Select
								value={newUser.role}
								onValueChange={(v) => setNewUser({ ...newUser, role: v })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="manager">Manager</SelectItem>
									<SelectItem value="staff">Staff</SelectItem>
									<SelectItem value="sales_person">Sales Person</SelectItem>
									<SelectItem value="warehouse_staff">
										Warehouse Staff
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="user-department">Department</Label>
							<Input
								id="user-department"
								value={newUser.department}
								onChange={(e) =>
									setNewUser({ ...newUser, department: e.target.value })
								}
								placeholder="Sales, Warehouse, etc."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="user-status">Status</Label>
							<Select
								value={newUser.status}
								onValueChange={(v) =>
									setNewUser({ ...newUser, status: v as "active" | "inactive" })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<Button onClick={handleCreateUser} disabled={createStaff.isPending}>
						{createStaff.isPending ? "Creating..." : "Create User"}
					</Button>
				</div>

				{/* Users List */}
				<div className="space-y-4">
					<h3 className="font-semibold text-lg">Existing Users</h3>
					<div className="space-y-2">
						{staff?.map((user) => (
							<div
								key={user.id}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-medium">{user.name}</h4>
										<Badge
											variant={
												user.status === "active" ? "default" : "secondary"
											}
										>
											{user.status}
										</Badge>
									</div>
									<p className="text-muted-foreground text-sm">{user.email}</p>
									<p className="text-muted-foreground text-xs">
										Role: {user.role} | Dept: {user.department || "N/A"}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setEditingUser(user)}
									>
										Edit
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => handleDeleteUser(user.id)}
									>
										Delete
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Edit User Dialog */}
				{editingUser && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
						<div className="w-full max-w-md rounded-lg bg-white p-6">
							<h3 className="mb-4 font-semibold text-lg">
								Edit User: {editingUser.name}
							</h3>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="edit-user-name">Full Name</Label>
									<Input
										id="edit-user-name"
										value={editingUser.name}
										onChange={(e) =>
											setEditingUser({ ...editingUser, name: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-user-email">Email</Label>
									<Input
										id="edit-user-email"
										type="email"
										value={editingUser.email}
										onChange={(e) =>
											setEditingUser({ ...editingUser, email: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-user-phone">Phone</Label>
									<Input
										id="edit-user-phone"
										value={editingUser.phone || ""}
										onChange={(e) =>
											setEditingUser({ ...editingUser, phone: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-user-role">Role</Label>
									<Select
										value={editingUser.role}
										onValueChange={(v) =>
											setEditingUser({ ...editingUser, role: v })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="manager">Manager</SelectItem>
											<SelectItem value="staff">Staff</SelectItem>
											<SelectItem value="sales_person">Sales Person</SelectItem>
											<SelectItem value="warehouse_staff">
												Warehouse Staff
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-user-department">Department</Label>
									<Input
										id="edit-user-department"
										value={editingUser.department || ""}
										onChange={(e) =>
											setEditingUser({
												...editingUser,
												department: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-user-status">Status</Label>
									<Select
										value={editingUser.status}
										onValueChange={(v) =>
											setEditingUser({
												...editingUser,
												status: v as "active" | "inactive",
											})
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() => setEditingUser(null)}
									>
										Cancel
									</Button>
									<Button onClick={() => handleUpdateUser(editingUser)}>
										Save Changes
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ========== Permissions Management Component ========== //
function PermissionsManagement() {
	const { data: roles, isLoading: rolesLoading } =
		trpc.clientSettings.getAllRoles.useQuery();
	const { data: modules, isLoading: modulesLoading } =
		trpc.clientSettings.getAllModules.useQuery();
	const getRolePermissions = trpc.clientSettings.getRolePermissions.useQuery(
		{ role_id: 0 },
		{ enabled: false },
	);
	const updateRolePermissions =
		trpc.clientSettings.updateRolePermissions.useMutation({
			onSuccess: () => toast.success("Permissions updated successfully"),
			onError: (err) =>
				toast.error(`Failed to update permissions: ${err.message}`),
		});

	const [selectedRole, setSelectedRole] = useState<number | null>(null);
	const [permissions, setPermissions] = useState<
		Array<{ module: string; action: string; is_allowed: boolean }>
	>([]);

	const handleRoleSelect = async (roleId: number) => {
		setSelectedRole(roleId);
		const result = await getRolePermissions.refetch({ role_id: roleId });
		if (result.data) {
			setPermissions(result.data);
		}
	};

	const handlePermissionToggle = (index: number) => {
		const updated = [...permissions];
		updated[index].is_allowed = !updated[index].is_allowed;
		setPermissions(updated);
	};

	const handleSavePermissions = () => {
		if (!selectedRole) return;
		updateRolePermissions.mutate({
			role_id: selectedRole,
			permissions,
		});
	};

	if (rolesLoading || modulesLoading) {
		return <Skeleton className="h-96 w-full" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Permission Management</CardTitle>
				<CardDescription>
					Configure what each role can do in the system. Permissions control
					access to modules and actions.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-4">
					<Label htmlFor="select-role">Select Role to Configure</Label>
					<Select
						value={selectedRole?.toString()}
						onValueChange={(v) => handleRoleSelect(Number(v))}
					>
						<SelectTrigger id="select-role">
							<SelectValue placeholder="Select a role" />
						</SelectTrigger>
						<SelectContent>
							{roles?.map((role) => (
								<SelectItem key={role.id} value={role.id.toString()}>
									{role.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{selectedRole && (
					<>
						<Separator />

						<div className="space-y-4">
							<h3 className="font-semibold text-lg">
								Configure Permissions for Selected Role
							</h3>
							<p className="text-muted-foreground text-sm">
								Toggle permissions to grant or revoke access to different
								modules and actions.
							</p>

							<div className="max-h-96 space-y-3 overflow-y-auto">
								{permissions.map((perm, index) => (
									<div
										key={`${perm.module}-${perm.action}`}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div className="flex-1">
											<div className="font-medium">{perm.module}</div>
											<div className="text-muted-foreground text-sm">
												{perm.action}
											</div>
										</div>
										<Switch
											checked={perm.is_allowed}
											onCheckedChange={() => handlePermissionToggle(index)}
										/>
									</div>
								))}
							</div>

							<Button
								onClick={handleSavePermissions}
								disabled={updateRolePermissions.isPending}
							>
								{updateRolePermissions.isPending
									? "Saving..."
									: "Save Permissions"}
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}

// ========== Modules Management Component ========== //
function ModulesManagement() {
	const {
		data: modules,
		isLoading,
		refetch,
	} = trpc.clientSettings.getAllModules.useQuery();
	const toggleModule = trpc.clientSettings.toggleModule.useMutation({
		onSuccess: () => {
			toast.success("Module status updated");
			refetch();
		},
		onError: (err) => toast.error(`Failed to update module: ${err.message}`),
	});
	const createModule = trpc.clientSettings.createModule.useMutation({
		onSuccess: () => {
			toast.success("Module created successfully");
			refetch();
		},
		onError: (err) => toast.error(`Failed to create module: ${err.message}`),
	});

	const [newModule, setNewModule] = useState({
		name: "",
		slug: "",
		description: "",
		icon: "Package",
	});
	const [_editingModule, _setEditingModule] = useState<
		(typeof modules)[0] | null
	>(null);

	const handleToggleModule = (moduleId: number, isActive: boolean) => {
		toggleModule.mutate({ module_id: moduleId, is_active: !isActive });
	};

	const handleCreateModule = () => {
		if (!newModule.name.trim() || !newModule.slug.trim()) {
			toast.error("Name and slug are required");
			return;
		}
		createModule.mutate(newModule);
		setNewModule({ name: "", slug: "", description: "", icon: "Package" });
	};

	if (isLoading) {
		return <Skeleton className="h-96 w-full" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Module Management</CardTitle>
				<CardDescription>
					Enable or disable system modules. Disabled modules will not appear in
					the UI and users won't have access.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Create Module Form */}
				<div className="space-y-4 rounded-lg border p-4">
					<h3 className="font-semibold text-lg">Create Custom Module</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="module-name">Module Name</Label>
							<Input
								id="module-name"
								value={newModule.name}
								onChange={(e) =>
									setNewModule({ ...newModule, name: e.target.value })
								}
								placeholder="e.g., Custom Reports"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="module-slug">Module Slug</Label>
							<Input
								id="module-slug"
								value={newModule.slug}
								onChange={(e) =>
									setNewModule({ ...newModule, slug: e.target.value })
								}
								placeholder="e.g., custom-reports"
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="module-description">Description</Label>
							<Textarea
								id="module-description"
								value={newModule.description}
								onChange={(e) =>
									setNewModule({ ...newModule, description: e.target.value })
								}
								placeholder="Brief description of the module"
							/>
						</div>
					</div>
					<Button
						onClick={handleCreateModule}
						disabled={createModule.isPending}
					>
						{createModule.isPending ? "Creating..." : "Create Module"}
					</Button>
				</div>

				{/* Modules List */}
				<div className="space-y-4">
					<h3 className="font-semibold text-lg">System Modules</h3>
					<div className="space-y-2">
						{modules?.map((module) => (
							<div
								key={module.id}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-medium">{module.name}</h4>
										{module.is_core && <Badge variant="secondary">Core</Badge>}
									</div>
									<p className="text-muted-foreground text-sm">
										{module.description || "No description"}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										checked={module.is_active}
										onCheckedChange={() =>
											handleToggleModule(module.id, module.is_active)
										}
										disabled={module.is_core}
									/>
									<span className="text-muted-foreground text-sm">
										{module.is_active ? "Enabled" : "Disabled"}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ========== Audit Logs Component ========== //
function AuditLogs() {
	const [filters, setFilters] = useState({
		action: "",
		entity_type: "",
		user_id: undefined as number | undefined,
		start_date: undefined as Date | undefined,
		end_date: undefined as Date | undefined,
	});
	const { data: auditLogs, isLoading } =
		trpc.clientSettings.getAuditLogs.useQuery({
			...filters,
			limit: 50,
		});
	const { data: staff } = trpc.clientSettings.getAllStaff.useQuery();

	const handleFilterChange = (key: string, value: any) => {
		setFilters({ ...filters, [key]: value });
	};

	if (isLoading) {
		return <Skeleton className="h-96 w-full" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Audit Logs</CardTitle>
				<CardDescription>
					Track all system changes and user actions. Every critical change is
					logged with details.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Filters */}
				<div className="space-y-4 rounded-lg border p-4">
					<h3 className="font-semibold text-lg">Filter Logs</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="filter-action">Action</Label>
							<Input
								id="filter-action"
								value={filters.action}
								onChange={(e) => handleFilterChange("action", e.target.value)}
								placeholder="e.g., ROLE_CREATED"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="filter-entity">Entity Type</Label>
							<Input
								id="filter-entity"
								value={filters.entity_type}
								onChange={(e) =>
									handleFilterChange("entity_type", e.target.value)
								}
								placeholder="e.g., roles"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="filter-user">User</Label>
							<Select
								value={filters.user_id?.toString()}
								onValueChange={(v) =>
									handleFilterChange("user_id", v ? Number(v) : undefined)
								}
							>
								<SelectTrigger id="filter-user">
									<SelectValue placeholder="Select user" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="undefined">All Users</SelectItem>
									{staff?.map((user) => (
										<SelectItem key={user.id} value={user.id.toString()}>
											{user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Logs List */}
				<div className="space-y-4">
					<h3 className="font-semibold text-lg">Recent Activity</h3>
					<div className="max-h-96 space-y-2 overflow-y-auto">
						{auditLogs?.map((log) => (
							<div key={log.id} className="rounded-lg border p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<h4 className="font-medium">{log.action}</h4>
											<Badge variant="outline">{log.entity_type}</Badge>
										</div>
										<p className="text-muted-foreground text-sm">
											{log.user_name || "System"} •{" "}
											{new Date(log.created_at).toLocaleString()}
										</p>
										{log.entity_id && (
											<p className="text-muted-foreground text-xs">
												Entity ID: {log.entity_id}
											</p>
										)}
									</div>
								</div>
								{log.new_values && Object.keys(log.new_values).length > 0 && (
									<div className="mt-2 rounded bg-muted/50 p-3">
										<pre className="overflow-auto text-xs">
											{JSON.stringify(log.new_values, null, 2)}
										</pre>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ========== System Settings Component ========== //
function SystemSettings() {
	const { data: clientSettings, isLoading: clientLoading } =
		trpc.clientSettings.getAllClientSettings.useQuery();
	const { data: systemSettings, isLoading: systemLoading } =
		trpc.clientSettings.getAllSystemSettings.useQuery();
	const updateClientSetting =
		trpc.clientSettings.updateClientSettings.useMutation({
			onSuccess: () => toast.success("Client setting updated"),
			onError: (err) => toast.error(`Failed to update setting: ${err.message}`),
		});
	const updateSystemSetting =
		trpc.clientSettings.updateSystemSettings.useMutation({
			onSuccess: () => toast.success("System setting updated"),
			onError: (err) => toast.error(`Failed to update setting: ${err.message}`),
		});

	const [activeCategory, setActiveCategory] = useState("business");

	if (clientLoading || systemLoading) {
		return <Skeleton className="h-96 w-full" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>System Settings</CardTitle>
				<CardDescription>
					Configure business settings, system preferences, and application
					behavior.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<Tabs
					value={activeCategory}
					onValueChange={setActiveCategory}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="business">Business Settings</TabsTrigger>
						<TabsTrigger value="system">System Settings</TabsTrigger>
					</TabsList>

					<TabsContent value="business" className="mt-4 space-y-4">
						<div className="space-y-4">
							{clientSettings?.map((setting) => (
								<div
									key={setting.key}
									className="space-y-2 rounded-lg border p-4"
								>
									<div className="flex items-center justify-between">
										<div>
											<h4 className="font-medium">{setting.key}</h4>
											<p className="text-muted-foreground text-sm">
												{setting.description}
											</p>
										</div>
										<Badge variant="secondary">{setting.category}</Badge>
									</div>
									<Textarea
										value={JSON.stringify(setting.value, null, 2)}
										onChange={(e) =>
											updateClientSetting.mutate({
												key: setting.key,
												value: e.target.value,
											})
										}
										className="min-h-[100px]"
									/>
								</div>
							))}
						</div>
					</TabsContent>

					<TabsContent value="system" className="mt-4 space-y-4">
						<div className="space-y-4">
							{systemSettings?.map((setting) => (
								<div
									key={setting.key}
									className="space-y-2 rounded-lg border p-4"
								>
									<div className="flex items-center justify-between">
										<div>
											<h4 className="font-medium">{setting.key}</h4>
											<p className="text-muted-foreground text-sm">
												{setting.description}
											</p>
										</div>
										<Badge variant="secondary">{setting.category}</Badge>
									</div>
									<Textarea
										value={JSON.stringify(setting.value, null, 2)}
										onChange={(e) =>
											updateSystemSetting.mutate({
												key: setting.key,
												value: e.target.value,
												category: setting.category,
												description: setting.description || undefined,
											})
										}
										className="min-h-[100px]"
									/>
								</div>
							))}
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
