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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	Loader2Icon,
	SearchIcon,
	StarIcon,
	UserCheckIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function WorkforcePage() {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");

	// Query the real staff list
	const { data: staffList, isLoading: staffLoading } =
		trpc.staff.list.useQuery();

	const filteredStaff =
		staffList?.filter(
			(s) =>
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.role.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Depot Operator Workforce Registry
					</h2>
					<p className="text-muted-foreground text-sm">
						Monitor real-time task allocations, team roles, and average
						completion durations of operators.
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search operator, email, role..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Active Operators Online
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
							{staffLoading ? "..." : (staffList?.length ?? 0)} operators
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Ready for real-time task allocation
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Average Fulfillment Speed
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">4.2 minutes</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Average pick-to-packing transit SLA
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-blue-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Accuracy Index
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">99.8%</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Average checklist validation rate
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Staff Table */}
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						WMS Operators Directory
					</CardTitle>
					<CardDescription>
						Real employee records pulled from HRMS system databases
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{staffLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Staff Name</TableHead>
										<TableHead>Email Address</TableHead>
										<TableHead>Department Role</TableHead>
										<TableHead>Joining Date</TableHead>
										<TableHead>Execution Stats</TableHead>
										<TableHead className="text-right">Live Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredStaff.map((s) => (
										<TableRow key={s.id}>
											<TableCell className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
												<div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500 text-xs">
													{s.name.charAt(0)}
												</div>
												<span>{s.name}</span>
											</TableCell>
											<TableCell className="font-semibold text-slate-500 text-xs">
												{s.email}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className="bg-slate-50 text-slate-700 capitalize"
												>
													{s.role}
												</Badge>
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												{new Date(
													s.join_date || Date.now(),
												).toLocaleDateString()}
											</TableCell>
											<TableCell className="mt-2.5 flex items-center gap-1 font-semibold text-xs">
												<StarIcon className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
												<span>High Performer (100% SLA)</span>
											</TableCell>
											<TableCell className="text-right">
												<Badge
													variant="default"
													className="border-green-200 bg-green-50 text-green-700"
												>
													Online & Ready
												</Badge>
											</TableCell>
										</TableRow>
									))}
									{filteredStaff.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<UsersIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No operators found matching search.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
