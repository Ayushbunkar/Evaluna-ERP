"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
	ClipboardListIcon,
	DownloadIcon,
	EyeIcon,
	FileBarChart,
	FilterIcon,
	Loader2Icon,
	SearchIcon,
	ShieldCheckIcon,
	TrendingUpIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditorReportsPage() {
	const trpc = useTRPC();
	const {
		data: auditLogs,
		isLoading,
		error,
	} = trpc.auditor.listAuditLogs.useQuery({ limit: 200 });
	const { data: stats } = trpc.auditor.getDashboardStats.useQuery({});

	// State
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [selectedLogItem, setSelectedLogItem] = useState<any | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState("ALL");
	const [exportType, setExportType] = useState("full");

	// Group actions for top audit actions list
	const actionSummary =
		auditLogs?.reduce<Record<string, number>>((acc, log) => {
			const key = log.action ?? "UNKNOWN";
			acc[key] = (acc[key] ?? 0) + 1;
			return acc;
		}, {}) ?? {};

	const actionList = Object.keys(actionSummary);

	const topActions = Object.entries(actionSummary)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	// Filter Logs
	const filteredLogs = auditLogs?.filter((log) => {
		const matchesSearch =
			log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.id.toString().includes(searchQuery);
		const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
		return matchesSearch && matchesAction;
	});

	// Dynamic CSV Export
	const handleExportCsv = () => {
		if (!auditLogs || auditLogs.length === 0) return;
		const headers = [
			"Log ID",
			"Action",
			"Entity Type",
			"Entity ID",
			"User Name",
			"Date",
		];
		const csvRows = [headers.join(",")];

		auditLogs.forEach((log) => {
			const row = [
				log.id,
				`"${log.action || ""}"`,
				`"${log.entity_type || ""}"`,
				log.entity_id || "",
				`"${log.user_name || "System"}"`,
				`"${log.created_at ? new Date(log.created_at).toISOString() : ""}"`,
			];
			csvRows.push(row.join(","));
		});

		const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute(
			"download",
			`evaluna_audit_report_${new Date().toISOString().split("T")[0]}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setIsExportOpen(false);
	};

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<FileBarChart className="h-7 w-7 text-blue-600" />
						Audit Trail & Compliance Reports
					</h1>
					<p className="text-muted-foreground text-sm">
						Immutable audit log of system events, non-compliance statistics, and
						downloadable reports.
					</p>
				</div>

				<Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
					<DialogTrigger asChild>
						<Button className="bg-blue-600 shadow-md hover:bg-blue-700">
							<DownloadIcon className="mr-2 h-4 w-4" /> Export Compliance Report
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[450px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<FileBarChart className="h-5 w-5 text-blue-600" />
								Export Compliance & Audit Report
							</DialogTitle>
							<DialogDescription>
								Generate a downloadable CSV audit report for regulatory and
								internal compliance review.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="space-y-1">
								<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
									Report Type
								</label>
								<select
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={exportType}
									onChange={(e) => setExportType(e.target.value)}
								>
									<option value="full">
										📊 Full Audit Log Trail (All System Events)
									</option>
									<option value="findings">
										⚠️ Audit Findings & Exceptions Summary
									</option>
									<option value="upc">🏷️ UPC / Barcode Compliance Report</option>
								</select>
							</div>

							<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 text-xs dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
								<p className="font-semibold">
									Ready to export {auditLogs?.length ?? 0} log records.
								</p>
								<p className="mt-0.5 opacity-90">
									Includes timestamps, action codes, entity IDs, and user
									attributes.
								</p>
							</div>
						</div>

						<DialogFooter className="flex justify-end gap-2">
							<Button variant="ghost" onClick={() => setIsExportOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleExportCsv}
								className="bg-green-600 text-white hover:bg-green-700"
							>
								<DownloadIcon className="mr-2 h-4 w-4" /> Download CSV Report
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Summary Stat Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Open Findings
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{stats?.openFindings ?? 0}
									</p>
								</div>
								<ShieldCheckIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										Completed Audits
									</p>
									<p className="font-bold text-3xl text-green-800 dark:text-green-300">
										{stats?.completedAudits ?? 0}
									</p>
								</div>
								<TrendingUpIcon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-purple-700 text-sm dark:text-purple-400">
										Audit Trail Logs
									</p>
									<p className="font-bold text-3xl text-purple-800 dark:text-purple-300">
										{auditLogs?.length ?? 0}
									</p>
								</div>
								<ClipboardListIcon className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-orange-700 text-sm dark:text-orange-400">
										Stock Accuracy
									</p>
									<p className="font-bold text-3xl text-orange-800 dark:text-orange-300">
										{stats?.stockAccuracy != null
											? `${stats.stockAccuracy.toFixed(1)}%`
											: "100.0%"}
									</p>
								</div>
								<ActivityIcon className="h-8 w-8 text-orange-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Top Action Summary */}
				<Card className="border-border/50 shadow-sm lg:col-span-1">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<ActivityIcon className="h-4 w-4 text-blue-600" />
							Top System Audit Actions
						</CardTitle>
						<CardDescription>
							Most frequent audit events recorded
						</CardDescription>
					</CardHeader>
					<CardContent>
						{topActions.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								No log data available
							</p>
						) : (
							<div className="space-y-3">
								{topActions.map(([action, count]) => (
									<div
										key={action}
										className="flex items-center justify-between"
									>
										<span className="max-w-[160px] truncate font-medium text-xs">
											{action.replace(/_/g, " ")}
										</span>
										<div className="flex items-center gap-2">
											<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-blue-500"
													style={{
														width: `${Math.min(100, (count / (auditLogs?.length || 1)) * 100)}%`,
													}}
												/>
											</div>
											<span className="w-6 text-right font-semibold text-muted-foreground text-xs">
												{count}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Audit Log Table */}
				<Card className="border-border/50 shadow-sm lg:col-span-2">
					<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="flex items-center gap-2 text-base">
								<ClipboardListIcon className="h-4 w-4 text-blue-600" />
								System Audit Trail Log
							</CardTitle>
							<CardDescription>
								Immutable record of actions across all modules
							</CardDescription>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{/* Search Bar */}
							<div className="relative w-full sm:w-48">
								<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<input
									type="text"
									placeholder="Search action..."
									className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-xs shadow-sm"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							{/* Action Filter */}
							<select
								className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-sm"
								value={actionFilter}
								onChange={(e) => setActionFilter(e.target.value)}
							>
								<option value="ALL">All Actions</option>
								{actionList.map((act) => (
									<option key={act} value={act}>
										{act.replace(/_/g, " ")}
									</option>
								))}
							</select>
						</div>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
								<Loader2Icon className="h-5 w-5 animate-spin" /> Loading audit
								log...
							</div>
						) : error ? (
							<div className="flex h-40 items-center justify-center text-destructive">
								{error.message || "Error loading audit log"}
							</div>
						) : !filteredLogs || filteredLogs.length === 0 ? (
							<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
								<ClipboardListIcon className="h-10 w-10 text-blue-500 opacity-30" />
								<p>No audit logs match your search filter</p>
							</div>
						) : (
							<div className="max-h-[400px] overflow-x-auto overflow-y-auto">
								<Table>
									<TableHeader className="sticky top-0 bg-background">
										<TableRow>
											<TableHead>Action Code</TableHead>
											<TableHead>Entity</TableHead>
											<TableHead>User / Actor</TableHead>
											<TableHead>Timestamp</TableHead>
											<TableHead className="text-right">Details</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredLogs.map((log) => (
											<TableRow key={log.id} className="hover:bg-muted/50">
												<TableCell>
													<span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-800 text-xs dark:bg-blue-900/30 dark:text-blue-400">
														{log.action?.replace(/_/g, " ") ?? "—"}
													</span>
												</TableCell>
												<TableCell className="font-mono text-muted-foreground text-xs">
													{log.entity_type ?? "—"}
													{log.entity_id ? ` #${log.entity_id}` : ""}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{log.user_name ?? "System"}
												</TableCell>
												<TableCell className="whitespace-nowrap text-muted-foreground text-xs">
													{log.created_at
														? new Date(log.created_at).toLocaleString("en-IN", {
																day: "2-digit",
																month: "short",
																hour: "2-digit",
																minute: "2-digit",
															})
														: "—"}
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="outline"
														size="sm"
														className="h-7 px-2 text-xs"
														onClick={() => setSelectedLogItem(log)}
													>
														<EyeIcon className="mr-1 h-3 w-3" /> View Diff
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Log Detail & JSON Diff Modal */}
			{selectedLogItem && (
				<Dialog
					open={!!selectedLogItem}
					onOpenChange={(open) => !open && setSelectedLogItem(null)}
				>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-base">
								<ClipboardListIcon className="h-5 w-5 text-blue-600" />
								Audit Log #{selectedLogItem.id}: {selectedLogItem.action}
							</DialogTitle>
							<DialogDescription>Audit trail payload diff</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2 text-xs">
							<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
								<div>
									<span className="text-muted-foreground">Action Code:</span>{" "}
									<strong>{selectedLogItem.action}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Entity:</span>{" "}
									<strong>
										{selectedLogItem.entity_type} #{selectedLogItem.entity_id}
									</strong>
								</div>
								<div>
									<span className="text-muted-foreground">User / Actor:</span>{" "}
									<strong>{selectedLogItem.user_name || "System"}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Timestamp:</span>{" "}
									<strong>
										{selectedLogItem.created_at
											? new Date(selectedLogItem.created_at).toLocaleString()
											: "N/A"}
									</strong>
								</div>
							</div>

							{selectedLogItem.old_values && (
								<div className="space-y-1">
									<p className="font-semibold text-gray-700 dark:text-gray-300">
										Previous State (Old Values):
									</p>
									<pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-[11px]">
										{JSON.stringify(selectedLogItem.old_values, null, 2)}
									</pre>
								</div>
							)}

							{selectedLogItem.new_values && (
								<div className="space-y-1">
									<p className="font-semibold text-gray-700 dark:text-gray-300">
										Updated State (New Values):
									</p>
									<pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-[11px]">
										{JSON.stringify(selectedLogItem.new_values, null, 2)}
									</pre>
								</div>
							)}
						</div>

						<DialogFooter>
							<Button variant="ghost" onClick={() => setSelectedLogItem(null)}>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
