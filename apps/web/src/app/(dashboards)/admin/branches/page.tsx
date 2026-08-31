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
import { ActivityIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/lib/animations";
import { DataEmpty, DataError, TableLoading } from "@/components/admin/data-states";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminBranchesPage() {
	const trpc = useTRPC();
	const {
		data: branches,
		isLoading,
		error,
		refetch,
	} = trpc.branches.list.useQuery();

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

			<div className="mt-6">
				{isLoading ? (
					<TableLoading columns={6} />
				) : error ? (
					<DataError
						title="Error loading branches"
						message={error.message}
						onRetry={() => refetch()}
					/>
				) : !branches || branches.length === 0 ? (
					<DataEmpty
						title="No branches found"
						message="Add your first branch to get started."
					/>
				) : (
					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="text-left">Code</TableHead>
									<TableHead className="text-left">Name</TableHead>
									<TableHead className="text-left">Address</TableHead>
									<TableHead className="text-left">Phone</TableHead>
									<TableHead className="text-left">Type</TableHead>
									<TableHead className="text-left">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{branches.map((branch) => (
									<TableRow key={branch.id}>
										<TableCell>{branch.code || `BR-${branch.id}`}</TableCell>
										<TableCell>{branch.name}</TableCell>
										<TableCell>{branch.address || "N/A"}</TableCell>
										<TableCell>{branch.phone || "N/A"}</TableCell>
										<TableCell>
											<span
												className={`rounded-full px-2 py-0.5 text-xs ${branch.is_headquarters ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
											>
												{branch.is_headquarters ? "Headquarters" : "Branch"}
											</span>
										</TableCell>
										<TableCell className="flex flex-row gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`View branch ${branch.id}`)}
											>
												<UsersIcon className="mr-1 h-3 w-3" /> View
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`Edit branch ${branch.id}`)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Edit
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</PageTransition>
	);
}
