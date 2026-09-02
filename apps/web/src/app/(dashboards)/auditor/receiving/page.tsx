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
	ActivityIcon,
	CheckCircle2Icon,
	ClockIcon,
	XCircleIcon,
	PackageCheckIcon,
	Loader2Icon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const statusConfig: Record<string, { label: string; color: string }> = {
	PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
	IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
	PASSED: { label: "Passed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
	FAILED: { label: "Failed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
	PARTIAL: { label: "Partial", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
};

const resultConfig: Record<string, { label: string; color: string }> = {
	PASS: { label: "Pass", color: "text-green-600" },
	FAIL: { label: "Fail", color: "text-red-600" },
	PARTIAL: { label: "Partial", color: "text-orange-600" },
};

export default function AuditorReceivingPage() {
	const trpc = useTRPC();
	const { data: inspections, isLoading, error } = trpc.auditor.getReceivingInspections.useQuery({});

	const pending = inspections?.filter((i) => i.status === "PENDING").length ?? 0;
	const inProgress = inspections?.filter((i) => i.status === "IN_PROGRESS").length ?? 0;
	const passed = inspections?.filter((i) => i.result === "PASS").length ?? 0;
	const failed = inspections?.filter((i) => i.result === "FAIL").length ?? 0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
					<ActivityIcon className="h-6 w-6 text-blue-600" />
					Receiving Inspections
				</h1>
				<p className="text-muted-foreground text-sm">
					Track quality inspections for incoming goods
				</p>
			</div>

			{/* Stats */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending</p>
									<p className="text-3xl font-bold text-yellow-800 dark:text-yellow-300">{pending}</p>
								</div>
								<ClockIcon className="h-8 w-8 text-yellow-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">In Progress</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{inProgress}</p>
								</div>
								<Loader2Icon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Passed</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{passed}</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-red-700 dark:text-red-400">Failed</p>
									<p className="text-3xl font-bold text-red-800 dark:text-red-300">{failed}</p>
								</div>
								<XCircleIcon className="h-8 w-8 text-red-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Inspections Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<PackageCheckIcon className="h-5 w-5 text-blue-600" />
						Inspection Records
					</CardTitle>
					<CardDescription>All receiving quality inspections</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin" /> Loading inspections...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading inspections"}
						</div>
					) : !inspections || inspections.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<ActivityIcon className="h-10 w-10 opacity-30" />
							<p>No receiving inspections found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Result</TableHead>
										<TableHead>Inspector Notes</TableHead>
										<TableHead>Inspected At</TableHead>
										<TableHead>Created</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{inspections.map((insp) => (
										<TableRow key={insp.id} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs">#{insp.id}</TableCell>
											<TableCell>
												<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(statusConfig[insp.status ?? "PENDING"] ?? statusConfig.PENDING).color}`}>
													{(statusConfig[insp.status ?? "PENDING"] ?? statusConfig.PENDING).label}
												</span>
											</TableCell>
											<TableCell>
												{insp.result ? (
													<span className={`font-semibold text-xs ${(resultConfig[insp.result] ?? resultConfig.PARTIAL).color}`}>
														{(resultConfig[insp.result] ?? resultConfig.PARTIAL).label}
													</span>
												) : <span className="text-muted-foreground text-xs">—</span>}
											</TableCell>
											<TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
												{insp.inspector_notes ?? "—"}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">{insp.inspected_at ?? "—"}</TableCell>
											<TableCell className="text-muted-foreground text-xs">{insp.created_at ?? "—"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}