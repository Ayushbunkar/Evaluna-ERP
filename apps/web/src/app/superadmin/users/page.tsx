"use client";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Activity,
	Edit,
	Plus,
	ShieldCheck,
	Trash2,
	UserCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

const INITIAL_MOCK_USERS = [
	{
		id: "USR-001",
		name: "Rahul Sharma",
		email: "rahul.s@evaluna.in",
		role: "Superadmin",
		status: "Active",
		lastLogin: "2023-10-15 09:30 AM",
	},
	{
		id: "USR-002",
		name: "Priya Patel",
		email: "priya.p@evaluna.in",
		role: "Manager",
		status: "Active",
		lastLogin: "2023-10-15 10:15 AM",
	},
	{
		id: "USR-003",
		name: "Amit Kumar",
		email: "amit.k@evaluna.in",
		role: "Staff",
		status: "Inactive",
		lastLogin: "2023-10-10 05:45 PM",
	},
];

export default function UsersPage() {
	const trpc = useTRPC();
	const { data: usersData, isLoading } =
		trpc.clientSettings.getAllStaff.useQuery();

	const [mockUsers, setMockUsers] = useState(INITIAL_MOCK_USERS);
	const users = usersData && usersData.length > 0 ? usersData : mockUsers;
	
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<any>(null);

	const handleEdit = (user: any) => {
		setEditingUser(user);
		setIsModalOpen(true);
	};

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this user?")) {
			setMockUsers(mockUsers.filter(u => u.id !== id));
		}
	};

	const handleSave = () => {
		setIsModalOpen(false);
		setEditingUser(null);
		// Minimal mock implementation
		alert("User saved successfully!");
	};

	return (
		<div className="min-h-screen space-y-8 bg-white p-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight">
						User Management
					</h1>
					<p className="mt-1 text-gray-500">
						Manage system users, staff members, and assign roles.
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingUser(null);
						setIsModalOpen(true);
					}}
					className="gap-2 bg-gray-900 text-white hover:bg-gray-800"
				>
					<Plus className="h-4 w-4" /> Add New User
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-gray-900 text-sm">
							Total Users
						</CardTitle>
						<Users className="h-5 w-5 text-gray-900" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900">
							{users.length}
						</div>
					</CardContent>
				</Card>
				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-gray-900 text-sm">
							Active Users
						</CardTitle>
						<UserCheck className="h-5 w-5 text-gray-900" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900">
							{users.filter((u) => u.status === "Active").length}
						</div>
					</CardContent>
				</Card>
				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-gray-900 text-sm">
							Roles Assigned
						</CardTitle>
						<ShieldCheck className="h-5 w-5 text-gray-900" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900">
							{new Set(users.map((u) => u.role)).size}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="shadow-sm">
				<CardHeader className="border-b border-gray-200 pb-4">
					<CardTitle className="text-xl text-gray-900">Directory</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="p-6 text-gray-500">Loading...</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="border-b border-gray-200 bg-gray-50 font-medium text-gray-900">
									<tr>
										<th className="px-6 py-4">User ID</th>
										<th className="px-6 py-4">Name</th>
										<th className="px-6 py-4">Email</th>
										<th className="px-6 py-4">Role</th>
										<th className="px-6 py-4">Status</th>
										<th className="px-6 py-4">Last Login</th>
										<th className="px-6 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 bg-white">
									{users.map((user: any) => (
										<tr
											key={user.id}
											className="transition-colors hover:bg-gray-50"
										>
											<td className="px-6 py-4 font-mono text-gray-500 text-xs">
												{user.id}
											</td>
											<td className="px-6 py-4 font-medium text-gray-900">
												{user.name}
											</td>
											<td className="px-6 py-4 text-gray-500">{user.email}</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center bg-gray-100 text-gray-900 px-2.5 py-0.5 font-medium text-xs">
													{user.role}
												</span>
											</td>
											<td className="px-6 py-4">
												<Badge
													className={`border-0 ${user.status === "Active" ? "bg-gray-100 text-gray-900" : "bg-gray-100 text-gray-500"}`}
												>
													{user.status}
												</Badge>
											</td>
											<td className="flex items-center gap-1.5 px-6 py-4 text-gray-500 text-xs">
												<Activity className="h-3 w-3" />{" "}
												{user.lastLogin || "N/A"}
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-gray-900 hover:bg-gray-100"
														onClick={() => handleEdit(user)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-gray-900 hover:bg-gray-100"
														onClick={() => handleDelete(user.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md bg-white p-6 shadow-xl">
						<h2 className="mb-4 font-bold text-gray-900 text-xl">
							{editingUser ? "Edit User" : "Create New User"}
						</h2>
						<div className="space-y-4">
							<div>
								<label className="mb-1 block font-medium text-gray-900 text-sm">
									Full Name
								</label>
								<input
									type="text"
									defaultValue={editingUser?.name || ""}
									className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-gray-900"
								/>
							</div>
							<div>
								<label className="mb-1 block font-medium text-gray-900 text-sm">
									Email Address
								</label>
								<input
									type="email"
									defaultValue={editingUser?.email || ""}
									className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-gray-900"
								/>
							</div>
							<div>
								<label className="mb-1 block font-medium text-gray-900 text-sm">
									Role
								</label>
								<select 
									defaultValue={editingUser?.role || "Staff"}
									className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-gray-900"
								>
									<option>Superadmin</option>
									<option>Manager</option>
									<option>Admin</option>
									<option>Staff</option>
									<option>Accountant</option>
								</select>
							</div>
							<div>
								<label className="mb-1 block font-medium text-gray-900 text-sm">
									Assigned Branch
								</label>
								<select 
									defaultValue={editingUser?.branch || "Global"}
									className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-gray-900"
								>
									<option>Global (All Branches)</option>
									<option>Main Branch</option>
									<option>Downtown Store</option>
									<option>Warehouse A</option>
								</select>
								<p className="mt-1 text-xs text-gray-500">Admins will only see data for their assigned branch.</p>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50" onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>
								Cancel
							</Button>
							<Button onClick={handleSave} className="bg-gray-900 text-white hover:bg-gray-800">
								Save User
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
