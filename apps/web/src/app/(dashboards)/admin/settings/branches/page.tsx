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
import { ActivityIcon, LayoutIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminSettingsBranchesPage() {
	const trpc = useTRPC();
	const [branches, setBranches] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchBranches();
	}, []);

	const fetchBranches = async () => {
		try {
			setIsLoading(true);
			// We don't have a dedicated branches list in admin router, but we can use the branches router
			// However, for settings we might want to see all branches regardless of user's branch
			// Let's use the admin router's getDashboardStats to get total branches, but we need a list
			// Since we don't have a branches list endpoint, we'll simulate for now
			// In a real implementation, we would add an endpoint to list branches in admin router
			const mockBranches = [
				{
					id: 1,
					name: "Main Branch",
					code: "MAIN",
					address: "Downtown",
					phone: "123-456-7890",
					email: "main@example.com",
					status: "active",
					manager_name: "John Doe",
					employee_count: 10,
				},
				{
					id: 2,
					name: "West Branch",
					code: "WEST",
					address: "West Side",
					phone: "098-765-4321",
					email: "west@example.com",
					status: "active",
					manager_name: "Jane Smith",
					employee_count: 8,
				},
			];
			setBranches(mockBranches);
		} catch (err) {
			setError("Failed to load branches");
			console.error("Branches error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeactivate = async (id: number) => {
		if (window.confirm("Are you sure you want to deactivate this branch?")) {
			// In a real app, we would call a mutate function
			fetchBranches(); // Refresh list
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
						Branches Management
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Manage company branches and locations
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Branch Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings/branches/create">
							<UsersIcon className="mr-2 h-4 w-4" /> Add Branch
						</Link>
					</Button>
				</div>
			</div>

			{!branches || branches.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No branches found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">Branch Name</TableHead>
								<TableHead className="text-left">Code</TableHead>
								<TableHead className="text-left">Address</TableHead>
								<TableHead className="text-left">Manager</TableHead>
								<TableHead className="text-left">Employees</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{branches.map((branch) => (
								<TableRow key={branch.id}>
									<TableCell>{branch.name}</TableCell>
									<TableCell>{branch.code}</TableCell>
									<TableCell>{branch.address}</TableCell>
									<TableCell>{branch.manager_name || "Not Assigned"}</TableCell>
									<TableCell>{branch.employee_count}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${branch.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
										>
											{branch.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => alert(`View branch ${branch.id}`)}
										>
											<LayoutIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => alert(`Edit branch ${branch.id}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> Edit
										</Button>
										{branch.status === "active" && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeactivate(branch.id)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Deactivate
											</Button>
										)}
										{branch.status === "inactive" && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`Activate branch ${branch.id}`)}
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
