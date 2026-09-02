"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	FileBarChart,
	ActivityIcon,
	ClipboardListIcon,
	Loader2Icon,
	ShieldCheckIcon,
	TrendingUpIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditorReportsPage() {
	const trpc = useTRPC();
	const { data: auditLogs, isLoading, error } = trpc.auditor.listAuditLogs.useQuery({ limit: 100 });
	const { data: stats } = trpc.auditor.getDashboardStats.useQuery({});

	// Group actions for a summary
	const actionSummary = auditLogs?.reduce<Record<string, number>>((acc, log) => {
		const key = log.action ?? "UNKNOWN";
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {}) ?? {};

	const topActions = Object.entries(actionSummary)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
					<FileBarChart className="h-6 w-6 text-blue-600" />
					Audit Reports
				</h1>
				<p className="text-muted-foreground text-sm">
					Comprehensive audit trail and compliance reports
				</p>
			</div>

			{/* Summary Stat Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Open Findings</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{stats?.openFindings ?? 0}</p>
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
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Completed Audits</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{stats?.completedAudits ?? 0}</p>
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
									<p className="text-sm font-medium text-purple-700 dark:text-purple-400">Audit Logs</p>
									<p className="text-3xl font-bold text-purple-800 dark:text-purple-300">{auditLogs?.length ?? 0}</p>
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
									<p className="text-sm font-medium text-orange-700 dark:text-orange-400">Stock Accuracy</p>
									<p className="text-3xl font-bold text-orange-800 dark:text-orange-300">
										{stats?.stockAccuracy != null ? `${stats.stockAccuracy.toFixed(1)}%` : "N/A"}
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
							Top Audit Actions
						</CardTitle>
						<CardDescription>Most frequent actions in audit log</CardDescription>
					</CardHeader>
					<CardContent>
						{topActions.length === 0 ? (
							<p className="text-center text-muted-foreground text-sm py-8">No data available</p>
						) : (
							<div className="space-y-3">
								{topActions.map(([action, count]) => (
									<div key={action} className="flex items-center justify-between">
										<span className="text-xs font-medium truncate max-w-[160px]">
											{action.replace(/_/g, " ")}
										</span>
										<div className="flex items-center gap-2">
											<div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
												<div
													className="h-full rounded-full bg-blue-500"
													style={{ width: `${Math.min(100, (count / (auditLogs?.length || 1)) * 100)}%` }}
												/>
											</div>
											<span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Audit Log Table */}
				<Card className="border-border/50 shadow-sm lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<ClipboardListIcon className="h-4 w-4 text-blue-600" />
							Recent Audit Log
						</CardTitle>
						<CardDescription>Immutable audit trail of all system events</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
								<Loader2Icon className="h-5 w-5 animate-spin" /> Loading audit log...
							</div>
						) : error ? (
							<div className="flex h-40 items-center justify-center text-destructive">
								{error.message || "Error loading audit log"}
							</div>
						) : !auditLogs || auditLogs.length === 0 ? (
							<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
								<ClipboardListIcon className="h-10 w-10 opacity-30" />
								<p>No audit logs found</p>
							</div>
						) : (
							<div className="overflow-x-auto max-h-[400px] overflow-y-auto">
								<Table>
									<TableHeader className="sticky top-0 bg-background">
										<TableRow>
											<TableHead>Action</TableHead>
											<TableHead>Entity</TableHead>
											<TableHead>User</TableHead>
											<TableHead>Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{auditLogs.map((log) => (
											<TableRow key={log.id} className="hover:bg-muted/50">
												<TableCell>
													<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
														{log.action?.replace(/_/g, " ") ?? "—"}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{log.entity_type ?? "—"}
													{log.entity_id ? ` #${log.entity_id}` : ""}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">{log.user_name ?? "System"}</TableCell>
												<TableCell className="text-muted-foreground text-xs whitespace-nowrap">
													{log.created_at
														? new Date(log.created_at).toLocaleString("en-IN", {
																day: "2-digit",
																month: "short",
																hour: "2-digit",
																minute: "2-digit",
														  })
														: "—"}
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
		</PageTransition>
	);
}