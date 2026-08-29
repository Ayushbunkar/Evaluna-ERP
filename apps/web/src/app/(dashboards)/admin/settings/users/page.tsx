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
import {
	ActivityIcon,
	Building2Icon,
	CalendarIcon,
	ShieldIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminSettingsUsersPage() {
	const trpc = useTRPC();
	const [users, setUsers] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setIsLoading(true);
			const { data } = await trpc.staff.list.query();
			// Transform staff data to user format
			const userData = data.map((user: any) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				branch: user.branch_id ? `Branch ${user.branch_id}` : "N/A",
				status: user.status,
				lastLogin: user.updated_at || user.created_at,
			}));
			setUsers(userData);
		} catch (err) {
			setError("Failed to load users");
			console.error("Users error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeactivate = async (id: number) => {
		if (window.confirm("Are you sure you want to deactivate this user?")) {
			try {
				await trpc.staff.deactivate.mutate({ id });
				fetchUsers(); // Refresh list
			} catch (err) {
				setError("Failed to deactivate user");
				console.error("Deactivate error:", err);
			}
		}
	};

	if (isLoading) {
		return (
			<PageTransition className="container mx-auto py-8">
				<div className="flex h-[200px] items-center justify-center">
					Loading...
				</div>
			</PageTransition>
		);
	}

	if (error) {
		return (
			<PageTransition className="container mx-auto py-8">
				<div className="flex h-[200px] items-center justify-center">
					{error}
				</div>
			</PageTransition>
		);
	}

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Users Management
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Manage system users and their access permissions
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> User Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings/users/create">
							<UsersIcon className="mr-2 h-4 w-4" /> Add User
						</Link>
					</Button>
				</div>
			</div>

			{!users || users.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No users found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">Name</TableHead>
								<TableHead className="text-left">Email</TableHead>
								<TableHead className="text-left">Role</TableHead>
								<TableHead className="text-left">Branch</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Last Login</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>{user.role}</TableCell>
									<TableCell>{user.branch}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
										>
											{user.status}
										</span>
									</TableCell>
									<TableCell>
										{new Date(user.lastLogin).toLocaleString(undefined, {
											year: "numeric",
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => alert(`View user ${user.id}`)}
										>
											<UsersIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => alert(`Edit user ${user.id}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> Edit
										</Button>
										{user.status === "active" && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeactivate(user.id)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Deactivate
											</Button>
										)}
										{user.status === "inactive" && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`Activate user ${user.id}`)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Activate
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</PageTransition>
	);
}
