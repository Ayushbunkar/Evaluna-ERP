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
import { ActivityIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function HREmployeesPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: employees, isLoading, error } = trpc.hr.getEmployees.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading employees
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Employees
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View and manage all employees
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> HR Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/hr/employees/create">
							<UsersIcon className="mr-2 h-4 w-4" /> Add Employee
						</Link>
					</Button>
				</div>
			</div>

			{!employees || employees.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No employees found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHeader className="text-left">ID</TableHeader>
								<TableHeader className="text-left">Name</TableHeader>
								<TableHeader className="text-left">Role</TableHeader>
								<TableHeader className="text-left">Status</TableHeader>
								<TableHeader className="text-left">Actions</TableHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{employees.map((emp) => (
								<TableRow key={emp.id}>
									<TableCell>{emp.id}</TableCell>
									<TableCell>{emp.name}</TableCell>
									<TableCell>{emp.role || "Staff"}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${emp.status === "active" ? "bg-green-100 text-green-800" : emp.status === "inactive" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
										>
											{emp.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View employee ${emp.id}`)}
										>
											<UsersIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`Edit employee ${emp.id}`)}
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
		</PageTransition>
	);
}
