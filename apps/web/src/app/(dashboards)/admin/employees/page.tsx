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

function statusBadgeClass(status: string) {
	const s = status.toLowerCase();
	if (s === "active") return "bg-green-100 text-green-800";
	if (s === "inactive") return "bg-red-100 text-red-800";
	return "bg-yellow-100 text-yellow-800";
}

export default function AdminEmployeesPage() {
	const trpc = useTRPC();
	const {
		data: employees,
		isLoading,
		error,
		refetch,
	} = trpc.admin.getEmployees.useQuery();

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
						<ActivityIcon className="mr-2 h-4 w-4" /> Employee Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/employees/create">
							<UsersIcon className="mr-2 h-4 w-4" /> Add Employee
						</Link>
					</Button>
				</div>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<TableLoading columns={7} />
				) : error ? (
					<DataError
						title="Error loading employees"
						message={error.message}
						onRetry={() => refetch()}
					/>
				) : !employees || employees.length === 0 ? (
					<DataEmpty
						title="No employees found"
						message="Add your first employee to get started."
					/>
				) : (
					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="text-left">Code</TableHead>
									<TableHead className="text-left">Name</TableHead>
									<TableHead className="text-left">Department</TableHead>
									<TableHead className="text-left">Role</TableHead>
									<TableHead className="text-left">Email</TableHead>
									<TableHead className="text-left">Status</TableHead>
									<TableHead className="text-left">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{employees.map((emp) => (
									<TableRow key={emp.id}>
										<TableCell>{emp.emp_code}</TableCell>
										<TableCell>{emp.name}</TableCell>
										<TableCell>{emp.department}</TableCell>
										<TableCell>{emp.role}</TableCell>
										<TableCell>{emp.email}</TableCell>
										<TableCell>
											<span
												className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass(emp.status)}`}
											>
												{emp.status}
											</span>
										</TableCell>
										<TableCell className="flex flex-row gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`View employee ${emp.id}`)}
											>
												<UsersIcon className="mr-1 h-3 w-3" /> View
											</Button>
											<Button
												variant="outline"
												size="sm"
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
			</div>
		</PageTransition>
	);
}
