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
import { ActivityIcon, Building2Icon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/lib/animations";
import { DataEmpty, DataError, TableLoading } from "@/components/admin/data-states";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminCompaniesPage() {
	const trpc = useTRPC();
	const {
		data: companies,
		isLoading,
		error,
		refetch,
	} = trpc.admin.getCompanies.useQuery();

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Companies
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View and manage all companies
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Company Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/companies/create">
							<UsersIcon className="mr-2 h-4 w-4" /> Add Company
						</Link>
					</Button>
				</div>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<TableLoading columns={6} />
				) : error ? (
					<DataError
						title="Error loading companies"
						message={error.message}
						onRetry={() => refetch()}
					/>
				) : !companies || companies.length === 0 ? (
					<DataEmpty
						title="No companies found"
						message="Add your first company to get started."
					/>
				) : (
					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="text-left">Name</TableHead>
									<TableHead className="text-left">Contact</TableHead>
									<TableHead className="text-left">GST Number</TableHead>
									<TableHead className="text-left">PAN</TableHead>
									<TableHead className="text-left">Status</TableHead>
									<TableHead className="text-left">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{companies.map((company) => (
									<TableRow key={company.id}>
										<TableCell>{company.name}</TableCell>
										<TableCell>{company.contact}</TableCell>
										<TableCell>{company.gstNumber}</TableCell>
										<TableCell>{company.pan}</TableCell>
										<TableCell>
											<span
												className={`rounded-full px-2 py-0.5 text-xs capitalize ${company.status.toLowerCase() === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
											>
												{company.status}
											</span>
										</TableCell>
										<TableCell className="flex flex-row gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`View company ${company.id}`)}
											>
												<Building2Icon className="mr-1 h-3 w-3" /> View
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`Edit company ${company.id}`)}
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
