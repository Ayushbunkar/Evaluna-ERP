"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Header,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@evaluna/ui/components/table";
import { ActivityIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminBranchesPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: branches, isLoading, error } = trpc.branches.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading branches
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Branches
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View and manage all company branches
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Branch Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/branches/create">
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
								<TableHead className="text-left">ID</TableHead>
								<TableHead className="text-left">Name</TableHead>
								<TableHead className="text-left">Location</TableHead>
								<TableHead className="text-left">Manager</TableHead>
								<TableHead className="text-left">Employees</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{branches.map((branch) => (
								<TableRow key={branch.id}>
									<TableCell>{branch.id}</TableCell>
									<TableCell>{branch.name}</TableCell>
									<TableCell>{branch.location || "N/A"}</TableCell>
									<TableCell>{branch.manager_name || "Not Assigned"}</TableCell>
									<TableCell>{branch.employee_count || 0}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${branch.status === "active" ? "bg-green-100 text-green-800" : branch.status === "inactive" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
										>
											{branch.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View branch ${branch.id}`)}
										>
											<UsersIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`Edit branch ${branch.id}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> Edit
										</Button>
										{branch.status === "active" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => alert(`Deactivate branch ${branch.id}`)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Deactivate
											</Button>
										)}
										{branch.status === "inactive" && (
											<Button
												variant="outline"
												size="xs"
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
