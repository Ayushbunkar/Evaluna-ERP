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
import {
	ActivityIcon,
	Building2Icon,
	CalendarIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminCompaniesPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: companies,
		isLoading,
		error,
	} = trpc.admin.getCompanies.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading companies
			</div>
		);

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

			{!companies || companies.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No companies found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">ID</TableHead>
								<TableHead className="text-left">Name</TableHead>
								<TableHead className="text-left">Registration</TableHead>
								<TableHead className="text-left">Address</TableHead>
								<TableHead className="text-left">City</TableHead>
								<TableHead className="text-left">Country</TableHead>
								<TableHead className="text-left">Contact</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{companies.map((company) => (
								<TableRow key={company.id}>
									<TableCell>{company.id}</TableCell>
									<TableCell>{company.name}</TableCell>
									<TableCell>{company.registrationNumber}</TableCell>
									<TableCell>{company.address}</TableCell>
									<TableCell>{company.city}</TableCell>
									<TableCell>{company.country}</TableCell>
									<TableCell>
										{company.email} {/* Show email as primary contact */}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${company.status === "active" ? "bg-green-100 text-green-800" : company.status === "inactive" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
										>
											{company.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View company ${company.id}`)}
										>
											<Building2Icon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`Edit company ${company.id}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> Edit
										</Button>
										{company.status === "active" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() =>
													alert(`Deactivate company ${company.id}`)
												}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Deactivate
											</Button>
										)}
										{company.status === "inactive" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => alert(`Activate company ${company.id}`)}
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
