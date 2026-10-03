"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
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
	MailIcon,
	PhoneIcon,
	ShieldCheckIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

interface HREmployee {
	id: number;
	name: string;
	emp_code?: string;
	role?: string;
	status?: string;
	email?: string;
	phone?: string;
	department?: string;
	userImage?: string | null;
	image?: string | null;
}

export default function HREmployeesPage() {
	const trpc = useTRPC();
	const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(
		null,
	);
	const { data: employees, isLoading, error } = trpc.hr.getEmployees.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
				Loading employees...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
				Failed to load employees.
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
					<Button
						variant="outline"
						className="text-xs shadow-sm sm:text-sm"
						asChild
					>
						<Link href="/hr/leave">
							<ActivityIcon className="mr-2 h-4 w-4" /> Leave Management
						</Link>
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/hr/employees/create">
							<UsersIcon className="mr-2 h-4 w-4" /> Add Employee
						</Link>
					</Button>
				</div>
			</div>

			{!employees || employees.length === 0 ? (
				<div className="mt-6 flex h-[200px] items-center justify-center rounded-lg border text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No employees found
				</div>
			) : (
				<div className="mt-6 overflow-x-auto rounded-lg border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">ID</TableHead>
								<TableHead className="text-left">Name</TableHead>
								<TableHead className="text-left">Role</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{employees.map((emp) => (
								<TableRow key={emp.id} className="hover:bg-muted/30">
									<TableCell className="font-mono text-muted-foreground text-xs">
										{emp.emp_code || emp.id}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-3">
											{(emp as any).userImage || (emp as any).image ? (
												<img
													src={(emp as any).userImage || (emp as any).image}
													alt={emp.name}
													className="h-8 w-8 shrink-0 rounded-full object-cover shadow-xs ring-1 ring-border"
												/>
											) : (
												<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white text-xs shadow-xs">
													{emp.name
														? emp.name
																.split(" ")
																.map((n: string) => n[0])
																.slice(0, 2)
																.join("")
																.toUpperCase()
														: "?"}
												</div>
											)}
											<div className="min-w-0">
												<span className="block truncate font-semibold text-foreground text-sm">
													{emp.name}
												</span>
												{emp.email && emp.email !== "N/A" && (
													<span className="block truncate text-muted-foreground text-xs">
														{emp.email}
													</span>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell className="text-xs capitalize sm:text-sm">
										{emp.role?.replace(/_/g, " ") || "Staff"}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${
												emp.status === "active"
													? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
													: emp.status === "inactive"
														? "bg-red-500/10 text-red-700 dark:text-red-400"
														: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
											}`}
										>
											{emp.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => setSelectedEmployee(emp)}
										>
											<UsersIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button variant="outline" size="xs" asChild>
											<Link href={"/admin/employees"}>
												<ActivityIcon className="mr-1 h-3 w-3" /> Edit
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* View Employee Detail Modal */}
			<Dialog
				open={!!selectedEmployee}
				onOpenChange={(open) => !open && setSelectedEmployee(null)}
			>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle className="font-semibold text-foreground text-lg">
							Employee Profile Details
						</DialogTitle>
						<DialogDescription className="text-muted-foreground text-xs">
							Detailed information for staff record #{selectedEmployee?.id}
						</DialogDescription>
					</DialogHeader>

					{selectedEmployee && (
						<div className="space-y-4 py-2">
							<div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
								{selectedEmployee.userImage || selectedEmployee.image ? (
									<img
										src={selectedEmployee.userImage || selectedEmployee.image}
										alt={selectedEmployee.name}
										className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
									/>
								) : (
									<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white text-xl shadow-sm">
										{selectedEmployee.name
											? selectedEmployee.name
													.split(" ")
													.map((n: string) => n[0])
													.slice(0, 2)
													.join("")
													.toUpperCase()
											: "?"}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<h3 className="truncate font-bold text-foreground text-lg">
										{selectedEmployee.name}
									</h3>
									<p className="font-mono text-muted-foreground text-xs">
										{selectedEmployee.emp_code || `EMP-${selectedEmployee.id}`}
									</p>
									<div className="mt-1 flex items-center gap-2">
										<span
											className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[11px] ${
												selectedEmployee.status === "active"
													? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
													: selectedEmployee.status === "inactive"
														? "bg-red-500/10 text-red-700 dark:text-red-400"
														: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
											}`}
										>
											{selectedEmployee.status}
										</span>
										<span className="text-muted-foreground text-xs capitalize">
											{selectedEmployee.role?.replace(/_/g, " ") || "Staff"}
										</span>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
								<div className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs">
									<MailIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0">
										<span className="block text-[10px] text-muted-foreground">
											Email Address
										</span>
										<span className="block truncate font-medium text-foreground">
											{selectedEmployee.email || "N/A"}
										</span>
									</div>
								</div>

								<div className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs">
									<PhoneIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0">
										<span className="block text-[10px] text-muted-foreground">
											Phone Number
										</span>
										<span className="block truncate font-medium text-foreground">
											{selectedEmployee.phone || "N/A"}
										</span>
									</div>
								</div>

								<div className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs">
									<Building2Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0">
										<span className="block text-[10px] text-muted-foreground">
											Department
										</span>
										<span className="block truncate font-medium text-foreground">
											{selectedEmployee.department || "General"}
										</span>
									</div>
								</div>

								<div className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs">
									<ShieldCheckIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0">
										<span className="block text-[10px] text-muted-foreground">
											Role Designation
										</span>
										<span className="block truncate font-medium text-foreground capitalize">
											{selectedEmployee.role?.replace(/_/g, " ") || "Staff"}
										</span>
									</div>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="flex gap-2 sm:justify-end">
						<Button variant="outline" onClick={() => setSelectedEmployee(null)}>
							Close
						</Button>
						<Button asChild>
							<Link href={"/admin/employees"}>Edit in Admin</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
