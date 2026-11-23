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
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	Loader2Icon,
	RefreshCwIcon,
	SearchIcon,
	ShieldCheckIcon,
	TruckIcon,
	XCircleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function InspectionsPage() {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"ALL" | "VERIFIED" | "DISCREPANCY" | "DAMAGED"
	>("ALL");

	// Real-time receiving inspections query
	const {
		data: inspections,
		isLoading,
		isRefetching,
		refetch,
	} = trpc.warehouse.getReceivingInspections.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	// Calculated stats
	const stats = useMemo(() => {
		if (!inspections || inspections.length === 0) {
			return {
				total: 0,
				verified: 0,
				discrepancies: 0,
				damaged: 0,
				passRate: 100,
			};
		}

		let verified = 0;
		let discrepancies = 0;
		let damaged = 0;

		for (const item of inspections) {
			if (item.status === "VERIFIED" || item.condition === "good") {
				verified += 1;
			}
			if (item.status === "DISCREPANCY" || item.condition === "mismatch") {
				discrepancies += 1;
			}
			if (item.condition === "damaged") {
				damaged += 1;
			}
		}

		const passRate =
			inspections.length > 0
				? Math.round((verified / inspections.length) * 100)
				: 100;

		return {
			total: inspections.length,
			verified,
			discrepancies,
			damaged,
			passRate,
		};
	}, [inspections]);

	// Filtered inspections list
	const filteredInspections = useMemo(() => {
		if (!inspections) return [];
		return inspections.filter((insp) => {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				!query ||
				insp.id.toString().includes(query) ||
				insp.product_name?.toLowerCase().includes(query) ||
				insp.product_sku?.toLowerCase().includes(query) ||
				insp.supplier_name?.toLowerCase().includes(query) ||
				insp.grn_number?.toLowerCase().includes(query) ||
				insp.inspector_name?.toLowerCase().includes(query);

			if (!matchesSearch) return false;

			if (statusFilter === "VERIFIED") {
				return insp.status === "VERIFIED" && insp.condition === "good";
			}
			if (statusFilter === "DISCREPANCY") {
				return (
					insp.status === "DISCREPANCY" || insp.condition === "mismatch"
				);
			}
			if (statusFilter === "DAMAGED") {
				return insp.condition === "damaged";
			}

			return true;
		});
	}, [inspections, searchQuery, statusFilter]);

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Inbound Quality & GRN Inspections
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE QA
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Supervisor control audit trail of all inspected incoming shipments,
						physical condition logs & quality anomalies.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<div className="relative w-full sm:w-72">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search product, SKU, GRN, supplier..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="gap-1.5"
					>
						<RefreshCwIcon
							className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						<span className="hidden sm:inline">Refresh</span>
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
				<Card className="shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Total Inspections
								</p>
								<p className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
									{isLoading ? "..." : stats.total}
								</p>
							</div>
							<div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
								<ClipboardCheckIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-emerald-500 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Quality Pass Rate
								</p>
								<p className="font-bold text-2xl text-emerald-600 tracking-tight sm:text-3xl dark:text-emerald-400">
									{isLoading ? "..." : `${stats.passRate}%`}
								</p>
							</div>
							<div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
								<ShieldCheckIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-amber-500 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Quantity Mismatches
								</p>
								<p className="font-bold text-2xl text-amber-600 tracking-tight sm:text-3xl dark:text-amber-400">
									{isLoading ? "..." : stats.discrepancies}
								</p>
							</div>
							<div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
								<AlertTriangleIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-red-500 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Damaged Goods
								</p>
								<p className="font-bold text-2xl text-red-600 tracking-tight sm:text-3xl dark:text-red-400">
									{isLoading ? "..." : stats.damaged}
								</p>
							</div>
							<div className="rounded-xl bg-red-50 p-2.5 text-red-600 dark:bg-red-950/40 dark:text-red-400">
								<AlertCircleIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Inspections Table Card */}
			<Card className="shadow-sm">
				<CardHeader className="border-b pb-4">
					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div>
							<CardTitle className="font-bold text-base">
								Inbound Inspections QA Log
							</CardTitle>
							<CardDescription>
								Immutable transaction records of physical receiving inspections
							</CardDescription>
						</div>

						{/* Filter Buttons */}
						<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
							<Button
								variant={statusFilter === "ALL" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("ALL")}
								className="h-7 text-xs"
							>
								All ({stats.total})
							</Button>
							<Button
								variant={statusFilter === "VERIFIED" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("VERIFIED")}
								className="h-7 text-xs"
							>
								Verified Good ({stats.verified})
							</Button>
							<Button
								variant={statusFilter === "DISCREPANCY" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("DISCREPANCY")}
								className="h-7 text-xs"
							>
								Mismatches ({stats.discrepancies})
							</Button>
							<Button
								variant={statusFilter === "DAMAGED" ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter("DAMAGED")}
								className="h-7 text-xs"
							>
								Damaged ({stats.damaged})
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-2 text-muted-foreground text-xs">
								Loading quality inspections log...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="w-[120px]">Inspection ID</TableHead>
										<TableHead>Product / Material</TableHead>
										<TableHead>PO & GRN Ref</TableHead>
										<TableHead>Expected / Received</TableHead>
										<TableHead>Inspected By</TableHead>
										<TableHead>Date & Time</TableHead>
										<TableHead className="text-right">Condition</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredInspections.map((insp) => (
										<TableRow key={insp.id} className="hover:bg-muted/20">
											<TableCell className="font-mono font-bold text-xs">
												INSP-#{insp.id}
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-bold text-slate-800 text-xs dark:text-slate-100">
														{insp.product_name || `Product #${insp.product_id}`}
													</span>
													{insp.product_sku && (
														<span className="font-mono text-[10px] text-muted-foreground">
															SKU: {insp.product_sku}
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-semibold text-xs">
														PO #{insp.purchase_id || "Direct"}
													</span>
													<span className="font-mono text-[10px] text-muted-foreground">
														{insp.grn_number || "GRN Verified"}
													</span>
												</div>
											</TableCell>
											<TableCell className="font-semibold text-xs">
												{insp.received_qty ?? 0} / {insp.expected_qty ?? 0} units
											</TableCell>
											<TableCell className="text-xs">
												{insp.inspector_name || "Warehouse Staff"}
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												{insp.created_at
													? new Date(insp.created_at).toLocaleString()
													: "N/A"}
											</TableCell>
											<TableCell className="text-right">
												{insp.condition === "good" ? (
													<Badge
														variant="outline"
														className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
													>
														<CheckCircle2Icon className="mr-1 h-3 w-3" /> Good
													</Badge>
												) : insp.condition === "damaged" ? (
													<Badge
														variant="outline"
														className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
													>
														<XCircleIcon className="mr-1 h-3 w-3" /> Damaged
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
													>
														<AlertTriangleIcon className="mr-1 h-3 w-3" /> Mismatch
													</Badge>
												)}
											</TableCell>
										</TableRow>
									))}
									{filteredInspections.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={7}
												className="py-16 text-center text-muted-foreground"
											>
												<ClipboardListIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
												<p className="font-bold text-slate-700 text-sm dark:text-slate-300">
													No receiving quality inspections found.
												</p>
												<p className="text-xs">
													Inspections are automatically logged whenever purchase
													orders are received at the inbound dock.
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
