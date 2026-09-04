"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import {
	CalendarIcon,
	CheckSquareIcon,
	CreditCardIcon,
	Loader2Icon,
	SearchIcon,
	UserIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function TeamPage() {
	const trpc = useTRPC();
	const [search, setSearch] = useState("");
	const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

	// Queries
	const { data: employees = [], isLoading } =
		trpc.manager.getEmployees.useQuery({ search });
	const { data: detail, isLoading: detailLoading } =
		trpc.manager.getEmployeeDetail.useQuery(
			{ staffId: selectedStaffId ?? 0 },
			{ enabled: selectedStaffId !== null },
		);

	return (
		<PageTransition className="relative min-h-screen space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<UsersIcon className="h-6 w-6 text-blue-600" />
						My Team Workspace
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Overview, search, and deep-dive audits of your team members'
						metrics.
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search employee by name..."
						className="pl-9"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Main Employee List */}
				<div className="md:col-span-2">
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="font-bold text-base">
								Workforce Register
							</CardTitle>
							<CardDescription>
								Click any team member to load their operational timeline and
								balance history
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{isLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<div className="divide-y divide-slate-100 dark:divide-slate-800">
									{employees.map((emp) => (
										<div
											key={emp.id}
											onClick={() => setSelectedStaffId(emp.id)}
											className={`flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30 ${
												selectedStaffId === emp.id
													? "bg-blue-50/40 dark:bg-blue-950/20"
													: ""
											}`}
										>
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 dark:bg-slate-800">
													{emp.name?.charAt(0)}
												</div>
												<div>
													<p className="font-bold text-slate-900 text-sm dark:text-slate-100">
														{emp.name}
													</p>
													<p className="text-slate-500 text-xs capitalize">
														{emp.role}
													</p>
												</div>
											</div>
											<Badge
												variant="outline"
												className="text-[10px] capitalize"
											>
												Active
											</Badge>
										</div>
									))}
									{employees.length === 0 && (
										<div className="py-12 text-center text-slate-400 text-xs">
											No team members found.
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Slide-Over Side Audits Panel */}
				<div>
					{selectedStaffId ? (
						<Card className="border-l-4 border-l-blue-500 shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between border-b pb-4">
								<div>
									<CardTitle className="flex items-center gap-1.5 font-bold text-base">
										<UserIcon className="h-4.5 w-4.5 text-blue-600" />
										Member Profile Audit
									</CardTitle>
									<CardDescription className="text-xs">
										Sourced directly from active HRMS/Staff tables
									</CardDescription>
								</div>
								<Button
									size="icon"
									variant="ghost"
									onClick={() => setSelectedStaffId(null)}
									className="h-7 w-7 text-slate-400"
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</CardHeader>
							<CardContent className="space-y-5 p-4">
								{detailLoading ? (
									<div className="flex justify-center py-12">
										<Loader2Icon className="h-7 w-7 animate-spin text-primary" />
									</div>
								) : detail ? (
									<>
										{/* Basic Info */}
										<div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/30">
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800 text-lg">
												{detail.employee?.name?.charAt(0)}
											</div>
											<div>
												<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
													{detail.employee?.name}
												</h4>
												<p className="text-slate-500 text-xs capitalize">
													{detail.employee?.role}
												</p>
												<p className="mt-0.5 font-mono text-[10px] text-slate-400">
													{detail.employee?.email}
												</p>
											</div>
										</div>

										{/* Assigned Tasks count */}
										<div className="space-y-2">
											<h5 className="flex items-center gap-1 font-bold text-slate-400 text-xs uppercase tracking-wider">
												<CheckSquareIcon className="h-3.5 w-3.5" /> Tasks Queue
												({detail.tasks?.length ?? 0})
											</h5>
											<div className="space-y-1.5">
												{detail.tasks?.slice(0, 3).map((t: any) => (
													<div
														key={t.id}
														className="rounded border bg-white p-2 text-xs dark:bg-transparent"
													>
														<span className="font-bold text-slate-800 dark:text-slate-200">
															Type: {t.task_type}
														</span>
														<div className="mt-1 flex items-center justify-between">
															<Badge
																variant="outline"
																className="text-[9px] uppercase"
															>
																{t.status}
															</Badge>
															<span className="text-[9px] text-slate-400">
																Due: {new Date(t.due_at).toLocaleDateString()}
															</span>
														</div>
													</div>
												))}
												{detail.tasks?.length === 0 && (
													<p className="py-1 text-slate-400 text-xs">
														No tasks currently assigned.
													</p>
												)}
											</div>
										</div>

										{/* Active Leaves */}
										<div className="space-y-2">
											<h5 className="flex items-center gap-1 font-bold text-slate-400 text-xs uppercase tracking-wider">
												<CalendarIcon className="h-3.5 w-3.5" /> Approved Leaves
												({detail.leaves?.length ?? 0})
											</h5>
											<div className="space-y-1.5">
												{detail.leaves?.slice(0, 3).map((l: any) => (
													<div
														key={l.id}
														className="rounded border border-slate-100 bg-slate-50/50 p-2 text-xs"
													>
														<p className="font-semibold text-slate-800 dark:text-slate-200">
															Status: {l.status}
														</p>
														<span className="mt-1 block text-[9px] text-slate-400">
															Resolved:{" "}
															{l.resolved_at
																? new Date(l.resolved_at).toLocaleDateString()
																: "Pending"}
														</span>
													</div>
												))}
												{detail.leaves?.length === 0 && (
													<p className="py-1 text-slate-400 text-xs">
														No leave requests logged.
													</p>
												)}
											</div>
										</div>

										{/* Claimed Expenses */}
										<div className="space-y-2">
											<h5 className="flex items-center gap-1 font-bold text-slate-400 text-xs uppercase tracking-wider">
												<CreditCardIcon className="h-3.5 w-3.5" /> Reimbursement
												Claims ({detail.expenses?.length ?? 0})
											</h5>
											<div className="space-y-1.5">
												{detail.expenses?.slice(0, 3).map((e: any) => (
													<div
														key={e.id}
														className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/50 p-2 text-xs"
													>
														<div>
															<p className="font-semibold text-slate-800 dark:text-slate-200">
																₹{Number.parseFloat(e.amount).toLocaleString()}
															</p>
															<span className="text-[9px] text-slate-400">
																{e.custom_category_name || "General"}
															</span>
														</div>
														<Badge className="text-[9px] uppercase">
															{e.status}
														</Badge>
													</div>
												))}
												{detail.expenses?.length === 0 && (
													<p className="py-1 text-slate-400 text-xs">
														No expense claims logged.
													</p>
												)}
											</div>
										</div>
									</>
								) : null}
							</CardContent>
						</Card>
					) : (
						<div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center text-slate-400">
							<UsersIcon className="mb-2 h-8 w-8 text-slate-300" />
							<p className="font-bold text-xs">No member selected</p>
							<p className="mt-1 text-[10px]">
								Click any team member on the register to inspect their detailed
								analytics folder.
							</p>
						</div>
					)}
				</div>
			</div>
		</PageTransition>
	);
}
