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

const MOCK_USERS = [
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
	{
		id: "USR-004",
		name: "Sneha Desai",
		email: "sneha.d@evaluna.in",
		role: "Accountant",
		status: "Active",
		lastLogin: "2023-10-14 11:20 AM",
	},
	{
		id: "USR-005",
		name: "Vikram Singh",
		email: "vikram.s@evaluna.in",
		role: "Staff",
		status: "Active",
		lastLogin: "2023-10-15 08:00 AM",
	},
];

export default function UsersPage() {
	const trpc = useTRPC();
	const { data: usersData, isLoading } =
		trpc.clientSettings.getAllStaff.useQuery();

	const users = usersData && usersData.length > 0 ? usersData : MOCK_USERS;
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<div className="min-h-screen space-y-8 bg-gray-50/30 p-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight">
						User Management
					</h1>
					<p className="mt-1 text-muted-foreground">
						Manage system users, staff members, and assign roles.
					</p>
				</div>
				<Button
					onClick={() => setIsModalOpen(true)}
					className="gap-2 bg-blue-600 text-white shadow-md hover:bg-blue-700"
				>
					<Plus className="h-4 w-4" /> Add New User
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-blue-800 text-sm">
							Total Users
						</CardTitle>
						<Users className="h-5 w-5 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-blue-900">
							{users.length}
						</div>
					</CardContent>
				</Card>
				<Card className="border-green-100 bg-gradient-to-br from-green-50 to-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-green-800 text-sm">
							Active Users
						</CardTitle>
						<UserCheck className="h-5 w-5 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-green-900">
							{users.filter((u) => u.status === "Active").length}
						</div>
					</CardContent>
				</Card>
				<Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-semibold text-purple-800 text-sm">
							Roles Assigned
						</CardTitle>
						<ShieldCheck className="h-5 w-5 text-purple-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-purple-900">
							{new Set(users.map((u) => u.role)).size}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border-gray-200 shadow-sm">
				<CardHeader className="border-gray-100 border-b bg-white pb-4">
					<CardTitle className="text-xl">Directory</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="space-y-4 p-6">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="h-12 animate-pulse rounded-md bg-gray-100"
								/>
							))}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="border-gray-200 border-b bg-gray-50 font-medium text-gray-600">
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
								<tbody className="divide-y divide-gray-100 bg-white">
									{users.map((user: any) => (
										<tr
											key={user.id}
											className="transition-colors hover:bg-gray-50/50"
										>
											<td className="px-6 py-4 font-mono text-gray-500 text-xs">
												{user.id}
											</td>
											<td className="px-6 py-4 font-medium text-gray-900">
												{user.name}
											</td>
											<td className="px-6 py-4 text-gray-600">{user.email}</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 font-medium text-indigo-800 text-xs">
													{user.role}
												</span>
											</td>
											<td className="px-6 py-4">
												<Badge
													className={`border-0 ${user.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}`}
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
														className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
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

			{/* Basic Mock Modal for Adding User */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="fade-in zoom-in w-full max-w-md animate-in rounded-xl bg-white p-6 shadow-xl duration-200">
						<h2 className="mb-4 font-bold text-gray-900 text-xl">
							Create New User
						</h2>
						<div className="space-y-4">
							<div>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									Full Name
								</label>
								<input
									type="text"
									className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g. Ramesh Singh"
								/>
							</div>
							<div>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									Email Address
								</label>
								<input
									type="email"
									className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="ramesh@evaluna.in"
								/>
							</div>
							<div>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									Role
								</label>
								<select className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option>Manager</option>
									<option>Staff</option>
									<option>Accountant</option>
								</select>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="outline" onClick={() => setIsModalOpen(false)}>
								Cancel
							</Button>
							<Button className="bg-blue-600 text-white hover:bg-blue-700">
								Save User
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
