"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CalendarCheckIcon,
	CheckCircle2Icon,
	ClockIcon,
	AlertCircleIcon,
	BarcodeIcon,
	Loader2Icon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const statusConfig: Record<string, { label: string; color: string }> = {
	PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
	ASSIGNED: { label: "Assigned", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
	IN_PROGRESS: { label: "In Progress", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
	VERIFICATION_REQUIRED: { label: "Needs Verification", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
	COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
	CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
	LOW: { label: "Low", color: "bg-gray-100 text-gray-700" },
	MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
	HIGH: { label: "High", color: "bg-orange-100 text-orange-700" },
	CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700" },
};

export default function AuditorUpcPage() {
	const trpc = useTRPC();
	const { data: tasks, isLoading, error } = trpc.auditor.getUpcTasks.useQuery({});

	const pending = tasks?.filter((t) => t.status === "PENDING").length ?? 0;
	const inProgress = tasks?.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status)).length ?? 0;
	const completed = tasks?.filter((t) => t.status === "COMPLETED").length ?? 0;
	const needsVerification = tasks?.filter((t) => t.status === "VERIFICATION_REQUIRED").length ?? 0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
					<CalendarCheckIcon className="h-6 w-6 text-blue-600" />
					UPC Tasks
				</h1>
				<p className="text-muted-foreground text-sm">
					Monitor and manage UPC barcode verification tasks
				</p>
			</div>

			{/* Stats Cards */}
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
					<Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-purple-700 dark:text-purple-400">In Progress</p>
									<p className="text-3xl font-bold text-purple-800 dark:text-purple-300">{inProgress}</p>
								</div>
								<Loader2Icon className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-orange-700 dark:text-orange-400">Needs Verification</p>
									<p className="text-3xl font-bold text-orange-800 dark:text-orange-300">{needsVerification}</p>
								</div>
								<AlertCircleIcon className="h-8 w-8 text-orange-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Completed</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{completed}</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Task Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<BarcodeIcon className="h-5 w-5 text-blue-600" />
						All UPC Tasks
					</CardTitle>
					<CardDescription>Full list of UPC barcode verification tasks</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin" /> Loading tasks...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading tasks"}
						</div>
					) : !tasks || tasks.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CalendarCheckIcon className="h-10 w-10 opacity-30" />
							<p>No UPC tasks found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Barcode</TableHead>
										<TableHead>Task Type</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Completed</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tasks.map((task) => (
										<TableRow key={task.id} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs">#{task.id}</TableCell>
											<TableCell className="font-mono text-sm">{task.barcode ?? "—"}</TableCell>
											<TableCell className="capitalize">{task.task_type?.replace(/_/g, " ") ?? "—"}</TableCell>
											<TableCell>
												{task.priority ? (
													<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(priorityConfig[task.priority] ?? priorityConfig.MEDIUM).color}`}>
														{(priorityConfig[task.priority] ?? priorityConfig.MEDIUM).label}
													</span>
												) : "—"}
											</TableCell>
											<TableCell>
												<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(statusConfig[task.status ?? "PENDING"] ?? statusConfig.PENDING).color}`}>
													{(statusConfig[task.status ?? "PENDING"] ?? statusConfig.PENDING).label}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">{task.created_at ?? "—"}</TableCell>
											<TableCell className="text-muted-foreground text-xs">{task.completed_at ?? "—"}</TableCell>
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