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
import { ActivityIcon, ShieldIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminSettingsRolesPage() {
	const trpc = useTRPC();
	const [roles, setRoles] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchRoles();
	}, []);

	const fetchRoles = async () => {
		try {
			setIsLoading(true);
			const { data } = await trpc.permissions.getMatrix.query({
				role: "manager",
			}); // Example, we need a proper endpoint
			// Since we don't have a roles list endpoint, we'll simulate with default roles
			const roleList = [
				{ id: 1, name: "superadmin", description: "Full system access" },
				{
					id: 2,
					name: "manager",
					description: "Branch oversight and staff management",
				},
				{ id: 3, name: "hr", description: "Human resources and payroll" },
				{
					id: 4,
					name: "finance",
					description: "Financial management and reporting",
				},
				{
					id: 5,
					name: "inventory",
					description: "Stock and warehouse management",
				},
				{ id: 6, name: "sales", description: "Sales and customer management" },
				{ id: 7, name: "cashier", description: "Point of sale operations" },
				{
					id: 8,
					name: "auditor",
					description: "Inventory auditing and compliance",
				},
			];
			setRoles(roleList);
		} catch (err) {
			setError("Failed to load roles");
			console.error("Roles error:", err);
		} finally {
			setIsLoading(false);
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
						Roles & Permissions
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Define roles and manage system permissions
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Permission Matrix
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings/roles/create">
							<ShieldIcon className="mr-2 h-4 w-4" /> Create Role
						</Link>
					</Button>
				</div>
			</div>

			{!roles || roles.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No roles found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">Role Name</TableHead>
								<TableHead className="text-left">Description</TableHead>
								<TableHead className="text-left">Assigned Users</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{roles.map((role) => (
								<TableRow key={role.id}>
									<TableCell>{role.name}</TableCell>
									<TableCell>{role.description || "No description"}</TableCell>
									<TableCell>
										{/* In a real app, we would fetch the count of users with this role */}
										<span className="text-xs">0 users</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View role ${role.id}`)}
										>
											<ShieldIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`Edit role ${role.id}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> Edit
										</Button>
										{role.name !== "superadmin" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => alert(`Delete role ${role.id}`)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Delete
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
