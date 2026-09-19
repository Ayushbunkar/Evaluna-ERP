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
	Award,
	CheckCircle2,
	DollarSign,
	Download,
	IndianRupee,
	Search,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CommissionsPage() {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");

	const { data: commissions = [], isLoading } =
		trpc.manager.getCommissions.useQuery();

	const filteredList = commissions.filter((c) => {
		if (roleFilter !== "all") {
			if (!c.role?.toLowerCase().includes(roleFilter.toLowerCase())) return false;
		}
		if (searchTerm) {
			const q = searchTerm.toLowerCase();
			return (
				c.name?.toLowerCase().includes(q) ||
				c.email?.toLowerCase().includes(q) ||
				c.role?.toLowerCase().includes(q)
			);
		}
		return true;
	});

	const totalCommissionsEarned = filteredList.reduce(
		(sum, c) => sum + c.earnedCommission,
		0,
	);
	const totalVolumeGenerated = filteredList.reduce(
		(sum, c) => sum + c.salesVolume,
		0,
	);
	const topPerformer = [...filteredList].sort(
		(a, b) => b.earnedCommission - a.earnedCommission,
	)[0];

	return (
		<PageTransition className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<TrendingUp className="h-6 w-6 text-blue-600" />
						Sales & Driver Commissions
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Real-time incentive calculations, milestone performance, and staff
						payouts.
					</p>
				</div>
				<Button
					variant="outline"
					onClick={() => toast.info("Exporting commission statements...")}
					className="border-slate-200"
				>
					<Download className="mr-2 h-4 w-4" />
					Export Report
				</Button>
			</div>

			{/* Metric Overview */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<IndianRupee className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Total Commission Pool
							</div>
							<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
								₹{totalCommissionsEarned.toLocaleString()}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
							<TrendingUp className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Attributed Sales / Collections
							</div>
							<div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
								₹{totalVolumeGenerated.toLocaleString()}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<Award className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Top Performer
							</div>
							<div className="font-bold text-lg text-slate-900 truncate max-w-[150px] dark:text-slate-100">
								{topPerformer ? topPerformer.name : "N/A"}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder="Search employee by name, role..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					{["all", "sales", "driver"].map((r) => (
						<Button
							key={r}
							variant={roleFilter === r ? "default" : "outline"}
							size="sm"
							onClick={() => setRoleFilter(r)}
							className="capitalize"
						>
							{r === "all" ? "All Roles" : r}
						</Button>
					))}
				</div>
			</div>

			{/* Table */}
			<Card>
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="text-base">Commission Breakdown</CardTitle>
					<CardDescription>
						Computed automatically from completed delivery trip collections &
						orders.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 text-center text-slate-500">
							Calculating commission payouts...
						</div>
					) : filteredList.length === 0 ? (
						<div className="py-12 text-center text-slate-500">
							No commission records found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900/50 dark:text-slate-400">
									<tr>
										<th className="px-6 py-3">Employee</th>
										<th className="px-6 py-3">Role</th>
										<th className="px-6 py-3 text-right">Base Salary</th>
										<th className="px-6 py-3 text-right">Volume</th>
										<th className="px-6 py-3 text-center">Rate</th>
										<th className="px-6 py-3 text-right">Commission</th>
										<th className="px-6 py-3 text-right">Total Payout</th>
										<th className="px-6 py-3 text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
									{filteredList.map((item) => (
										<tr
											key={item.staffId}
											className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
										>
											<td className="px-6 py-4">
												<div className="font-semibold text-slate-900 dark:text-slate-100">
													{item.name}
												</div>
												<div className="text-xs text-slate-400">
													{item.email}
												</div>
											</td>
											<td className="px-6 py-4">
												<Badge variant="secondary" className="capitalize">
													{item.role || "Staff"}
												</Badge>
											</td>
											<td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-300">
												₹{item.baseSalary.toLocaleString()}
											</td>
											<td className="px-6 py-4 text-right font-medium text-slate-800 dark:text-slate-200">
												₹{item.salesVolume.toLocaleString()}
											</td>
											<td className="px-6 py-4 text-center">
												<span className="rounded bg-blue-50 px-2 py-0.5 font-bold text-xs text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
													{item.commissionRate}%
												</span>
											</td>
											<td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
												+₹{item.earnedCommission.toLocaleString()}
											</td>
											<td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
												₹{item.totalPayout.toLocaleString()}
											</td>
											<td className="px-6 py-4 text-center">
												<Badge
													variant="outline"
													className={
														item.status === "Settled"
															? "bg-slate-50 text-slate-600 border-slate-200"
															: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
													}
												>
													{item.status}
												</Badge>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
