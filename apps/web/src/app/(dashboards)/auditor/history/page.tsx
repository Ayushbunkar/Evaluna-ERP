"use client";

import { useState } from "react";
import Link from "next/link";
import {
	ActivityIcon,
	AlertTriangleIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	DownloadIcon,
	EyeIcon,
	FileBarChartIcon,
	FilterIcon,
	HistoryIcon,
	MapPinIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldCheckIcon,
	UserIcon,
} from "lucide-react";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditHistoryPage() {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);

	const {
		data: audits,
		isLoading,
		refetch,
	} = trpc.audit.listAudits.useQuery({
		branchId: selectedBranchId,
	});

	const { data: branches } = trpc.branch.list.useQuery();

	// History filter: only completed, approved, or submitted audits
	const historyAudits = audits?.filter(
		(a) =>
			a.status === "completed" ||
			a.status === "approved" ||
			a.status === "submitted" ||
			a.status === "discrepancy_review",
	);

	const filteredAudits = historyAudits?.filter((a) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (
			a.id.toString().includes(q) ||
			(a.location_name && a.location_name.toLowerCase().includes(q)) ||
			(a.notes && a.notes.toLowerCase().includes(q)) ||
			(a.branch?.name && a.branch.name.toLowerCase().includes(q))
		);
	});

	return (
		<PageTransition className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
							<HistoryIcon className="h-5 w-5" />
						</span>
						<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
							Stock Audit History & Logs
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
						Immutable historical records of completed inventory counts, discrepancy reconciliations, and manager reviews
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						className="text-xs"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" /> Refresh
					</Button>
				</div>
			</div>

			{/* Filter Bar */}
			<Card className="border-border/60 bg-card p-4 shadow-sm">
				<div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
					<div className="relative w-full sm:w-80">
						<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search historical records..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 text-xs"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						{branches && (
							<Select
								value={selectedBranchId ? String(selectedBranchId) : "all"}
								onValueChange={(v) => setSelectedBranchId(v === "all" ? undefined : Number(v))}
							>
								<SelectTrigger className="w-full sm:w-48 text-xs">
									<MapPinIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
									<SelectValue placeholder="Branch" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all" className="text-xs">All Warehouses</SelectItem>
									{branches.map((b) => (
										<SelectItem key={b.id} value={String(b.id)} className="text-xs">
											{b.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				</div>
			</Card>

			{/* History Table */}
			<Card className="border-border/60 bg-card shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<div>
						<CardTitle className="text-base sm:text-lg">Archived Audit Records</CardTitle>
						<CardDescription className="text-xs">
							Showing {filteredAudits?.length ?? 0} historical audit logs
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							Loading audit history...
						</div>
					) : !filteredAudits || filteredAudits.length === 0 ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							<ClipboardCheckIcon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
							No historical audit records found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[80px]">Audit #</TableHead>
										<TableHead>Location / Type</TableHead>
										<TableHead>Warehouse</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Auditor</TableHead>
										<TableHead className="text-center">Items Audited</TableHead>
										<TableHead>Variance Status</TableHead>
										<TableHead>Created Date</TableHead>
										<TableHead>Completed Date</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredAudits.map((audit) => {
										const hasVariance = (audit.varianceItemsCount ?? 0) > 0;
										return (
											<TableRow key={audit.id} className="hover:bg-muted/50">
												<TableCell className="font-mono font-semibold text-xs text-indigo-600">
													#{audit.id}
												</TableCell>
												<TableCell>
													<div className="font-medium text-xs text-foreground">
														{audit.location_name || "Whole Warehouse"}
													</div>
													<div className="text-[11px] text-muted-foreground capitalize">
														{audit.audit_type?.replace("_", " ") || "Full Count"}
													</div>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{audit.branch?.name ?? `Branch #${audit.branch_id}`}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={
															audit.status === "completed" || audit.status === "approved"
																? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200"
																: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200"
														}
													>
														{audit.status?.replace("_", " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{audit.auditor?.name ?? "Unassigned"}
												</TableCell>
												<TableCell className="text-center font-mono text-xs">
													{audit.countedItemsCount} / {audit.totalItemsCount}
												</TableCell>
												<TableCell>
													{hasVariance ? (
														<span className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
															<AlertTriangleIcon className="mr-1 h-3.5 w-3.5" />
															{audit.varianceItemsCount} discrepancies
														</span>
													) : (
														<span className="inline-flex items-center text-xs text-emerald-600">
															<ShieldCheckIcon className="mr-1 h-3.5 w-3.5" />
															100% Match
														</span>
													)}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : "—"}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{audit.completed_at ? new Date(audit.completed_at).toLocaleDateString() : "—"}
												</TableCell>
												<TableCell className="text-right">
													<Button size="sm" variant="outline" asChild className="h-7 text-xs">
														<Link href={`/auditor/tasks/${audit.id}`}>
															<EyeIcon className="mr-1 h-3 w-3" /> View Log
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
