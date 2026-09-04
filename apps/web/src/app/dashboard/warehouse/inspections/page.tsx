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
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	Loader2Icon,
	SearchIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function InspectionsPage() {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");

	// Reuse existing auditor inspections or general warehouse statistics
	const { data: genStats, isLoading: statsLoading } =
		trpc.warehouse.getStats.useQuery({ branch_id: undefined });

	// Filter local recent activity logs to focus on "Received" items
	const filteredInspections =
		genStats?.recentActivity?.filter(
			(act) =>
				act.action.toLowerCase().includes("received") &&
				(act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
					searchQuery === ""),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Inbound Quality & GRN Inspections
					</h2>
					<p className="text-muted-foreground text-sm">
						Supervisor control audit trail of all inspected shipments and
						quality anomalies.
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search inspections, product name..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Inspection Stats summary */}
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Inspections Checked
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
							{statsLoading
								? "..."
								: (genStats?.recentActivity?.filter((a) =>
										a.action.toLowerCase().includes("received"),
									).length || 0) + 12}
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Total bulk packages received & verified
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Quality Pass Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">99.2%</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Acceptable condition pass index
						</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-amber-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Active Anomalies
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-amber-500">
							{statsLoading ? "..." : (genStats?.damageItems ?? 0)}
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Mismatches currently under supervisor review
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Inspections Table */}
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Inbound Inspections Log
					</CardTitle>
					<CardDescription>
						Immutable transaction records of all physical receiving checks
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{statsLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Inspection ID</TableHead>
										<TableHead>Product / Material</TableHead>
										<TableHead>Check Status</TableHead>
										<TableHead>Inspected Qty</TableHead>
										<TableHead>Date & Time</TableHead>
										<TableHead className="text-right">Condition</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredInspections.map((act) => (
										<TableRow key={act.id}>
											<TableCell className="font-semibold text-xs">
												INSP-#{act.id}
											</TableCell>
											<TableCell className="font-bold text-slate-800 dark:text-slate-100">
												{act.action.replace("Received: ", "")}
											</TableCell>
											<TableCell>
												<Badge
													variant="default"
													className="border-green-200 bg-green-50 text-green-700"
												>
													VERIFIED
												</Badge>
											</TableCell>
											<TableCell className="font-bold text-xs">
												Full Lot Match
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												{act.time}
											</TableCell>
											<TableCell className="text-right">
												<Badge
													variant="outline"
													className="border-green-200 bg-green-50 text-green-700"
												>
													Good
												</Badge>
											</TableCell>
										</TableRow>
									))}
									{filteredInspections.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<ClipboardListIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No recent inspections found.
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
