"use client";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { CheckCircle2, Edit, Plus, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

const INITIAL_MOCK_ROLES = [
	{
		id: "ROL-01",
		name: "Superadmin",
		description: "Full system access across all modules",
		usersCount: 2,
		status: "Active",
	},
	{
		id: "ROL-02",
		name: "Manager",
		description: "Can manage staff, view reports, and handle inventory",
		usersCount: 5,
		status: "Active",
	},
	{
		id: "ROL-03",
		name: "Accountant",
		description: "Access to billing, invoices, and financial reports",
		usersCount: 3,
		status: "Active",
	},
];

export default function RolesPage() {
	const trpc = useTRPC();
	const { data: rolesData, isLoading } =
		trpc.clientSettings.getAllRoles?.useQuery() ?? {
			data: null,
			isLoading: false,
		};

	const [mockRoles, setMockRoles] = useState(INITIAL_MOCK_ROLES);
	const roles = rolesData && rolesData.length > 0 ? rolesData : mockRoles;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<any>(null);

	const handleEdit = (role: any) => {
		setEditingRole(role);
		setIsModalOpen(true);
	};

	const handleDelete = (id: string, name: string) => {
		if (name === "Superadmin") {
			alert("Cannot delete Superadmin role.");
			return;
		}
		if (confirm("Are you sure you want to delete this role?")) {
			setMockRoles(mockRoles.filter(r => r.id !== id));
		}
	};

	const handleSave = () => {
		setIsModalOpen(false);
		setEditingRole(null);
		alert("Role saved successfully!");
	};

	return (
		<div className="min-h-screen space-y-8 bg-white p-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight">
						Role Management
					</h1>
					<p className="mt-1 text-gray-500">
						Define and manage organizational roles and their scopes.
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingRole(null);
						setIsModalOpen(true);
					}}
					className="gap-2 bg-gray-900 text-white hover:bg-gray-800"
				>
					<Plus className="h-4 w-4" /> Create Role
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-gray-900 text-sm">
							Total Roles
						</CardTitle>
						<Shield className="h-5 w-5 text-gray-900" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900">
							{roles.length}
						</div>
					</CardContent>
				</Card>
				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-gray-900 text-sm">
							Active Roles
						</CardTitle>
						<CheckCircle2 className="h-5 w-5 text-gray-900" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900">
							{roles.filter((r) => r.status === "Active").length}
						</div>
					</CardContent>
				</Card>
				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-gray-900 text-sm">
							Total Assigned Users
						</CardTitle>
						<Users className="h-5 w-5 text-gray-900" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900">
							{roles.reduce((acc: any, curr: any) => acc + curr.usersCount, 0)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="shadow-sm">
				<CardHeader className="border-b border-gray-200 pb-4">
					<CardTitle className="text-xl text-gray-900">Roles List</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="p-6 text-gray-500">Loading...</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="border-b border-gray-200 bg-gray-50 font-medium text-gray-900">
									<tr>
										<th className="px-6 py-4">Role ID</th>
										<th className="px-6 py-4">Role Name</th>
										<th className="px-6 py-4">Description</th>
										<th className="px-6 py-4">Assigned Users</th>
										<th className="px-6 py-4">Status</th>
										<th className="px-6 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 bg-white">
									{roles.map((role: any) => (
										<tr
											key={role.id}
											className="transition-colors hover:bg-gray-50"
										>
											<td className="px-6 py-4 font-mono text-gray-500 text-xs">
												{role.id}
											</td>
											<td className="px-6 py-4 font-medium text-gray-900">
												<div className="flex items-center gap-2">
													<Shield className="h-4 w-4 text-gray-900" />
													{role.name}
												</div>
											</td>
											<td className="max-w-md truncate px-6 py-4 text-gray-500">
												{role.description}
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-900 px-2.5 py-1 font-medium text-xs">
													<Users className="h-3 w-3" /> {role.usersCount} users
												</span>
											</td>
											<td className="px-6 py-4">
												<Badge
													className={`border-0 ${role.status === "Active" ? "bg-gray-100 text-gray-900" : "bg-gray-100 text-gray-500"}`}
												>
													{role.status}
												</Badge>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-gray-900 hover:bg-gray-100"
														onClick={() => handleEdit(role)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-gray-900 hover:bg-gray-100"
														disabled={role.name === "Superadmin"}
														onClick={() => handleDelete(role.id, role.name)}
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
							{editingRole ? "Edit Role" : "Create New Role"}
						</h2>
						<div className="space-y-4">
							<div>
								<label className="mb-1 block font-medium text-gray-900 text-sm">
									Role Name
								</label>
								<input
									type="text"
									defaultValue={editingRole?.name || ""}
									className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-gray-900"
								/>
							</div>
							<div>
								<label className="mb-1 block font-medium text-gray-900 text-sm">
									Description
								</label>
								<textarea
									defaultValue={editingRole?.description || ""}
									className="min-h-[100px] w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-gray-900"
								/>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="status"
									defaultChecked={editingRole ? editingRole.status === "Active" : true}
									className="border-gray-300 text-gray-900 focus:ring-gray-900"
								/>
								<label htmlFor="status" className="text-gray-900 text-sm">
									Set as Active immediately
								</label>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50" onClick={() => { setIsModalOpen(false); setEditingRole(null); }}>
								Cancel
							</Button>
							<Button onClick={handleSave} className="bg-gray-900 text-white hover:bg-gray-800">
								Save Role
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
