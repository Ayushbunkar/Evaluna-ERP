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

const MOCK_ROLES = [
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
	{
		id: "ROL-04",
		name: "Staff",
		description: "Limited access to daily operational tasks",
		usersCount: 15,
		status: "Active",
	},
	{
		id: "ROL-05",
		name: "Guest",
		description: "View-only access for temporary users",
		usersCount: 0,
		status: "Inactive",
	},
];

export default function RolesPage() {
	const trpc = useTRPC();
	// using any query as placeholder, fallback to mock data
	const { data: rolesData, isLoading } =
		trpc.clientSettings.getAllRoles?.useQuery() ?? {
			data: null,
			isLoading: false,
		};

	const roles = rolesData && rolesData.length > 0 ? rolesData : MOCK_ROLES;
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<div className="min-h-screen space-y-8 bg-gray-50/30 p-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight">
						Role Management
					</h1>
					<p className="mt-1 text-muted-foreground">
						Define and manage organizational roles and their scopes.
					</p>
				</div>
				<Button
					onClick={() => setIsModalOpen(true)}
					className="gap-2 bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
				>
					<Plus className="h-4 w-4" /> Create Role
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-indigo-800 text-sm">
							Total Roles
						</CardTitle>
						<Shield className="h-5 w-5 text-indigo-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-indigo-900">
							{roles.length}
						</div>
					</CardContent>
				</Card>
				<Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-emerald-800 text-sm">
							Active Roles
						</CardTitle>
						<CheckCircle2 className="h-5 w-5 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-emerald-900">
							{roles.filter((r) => r.status === "Active").length}
						</div>
					</CardContent>
				</Card>
				<Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-amber-800 text-sm">
							Total Assigned Users
						</CardTitle>
						<Users className="h-5 w-5 text-amber-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-amber-900">
							{roles.reduce((acc, curr) => acc + curr.usersCount, 0)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border-gray-200 shadow-sm">
				<CardHeader className="border-gray-100 border-b bg-white pb-4">
					<CardTitle className="text-xl">Roles List</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="space-y-4 p-6">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-16 animate-pulse rounded-md bg-gray-100"
								/>
							))}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="border-gray-200 border-b bg-gray-50 font-medium text-gray-600">
									<tr>
										<th className="px-6 py-4">Role ID</th>
										<th className="px-6 py-4">Role Name</th>
										<th className="px-6 py-4">Description</th>
										<th className="px-6 py-4">Assigned Users</th>
										<th className="px-6 py-4">Status</th>
										<th className="px-6 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100 bg-white">
									{roles.map((role: any) => (
										<tr
											key={role.id}
											className="transition-colors hover:bg-gray-50/50"
										>
											<td className="px-6 py-4 font-mono text-gray-500 text-xs">
												{role.id}
											</td>
											<td className="px-6 py-4 font-medium text-gray-900">
												<div className="flex items-center gap-2">
													<Shield className="h-4 w-4 text-indigo-400" />
													{role.name}
												</div>
											</td>
											<td className="max-w-md truncate px-6 py-4 text-gray-600">
												{role.description}
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700 text-xs">
													<Users className="h-3 w-3" /> {role.usersCount} users
												</span>
											</td>
											<td className="px-6 py-4">
												<Badge
													className={`border-0 ${role.status === "Active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}`}
												>
													{role.status}
												</Badge>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
														disabled={role.name === "Superadmin"}
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

			{/* Basic Mock Modal for Adding Role */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="fade-in zoom-in w-full max-w-md animate-in rounded-xl bg-white p-6 shadow-xl duration-200">
						<h2 className="mb-4 font-bold text-gray-900 text-xl">
							Create New Role
						</h2>
						<div className="space-y-4">
							<div>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									Role Name
								</label>
								<input
									type="text"
									className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
									placeholder="e.g. Sales Executive"
								/>
							</div>
							<div>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									Description
								</label>
								<textarea
									className="min-h-[100px] w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
									placeholder="Brief description of the role's responsibilities..."
								/>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="status"
									className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
									defaultChecked
								/>
								<label htmlFor="status" className="text-gray-700 text-sm">
									Set as Active immediately
								</label>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="outline" onClick={() => setIsModalOpen(false)}>
								Cancel
							</Button>
							<Button className="bg-indigo-600 text-white hover:bg-indigo-700">
								Save Role
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
