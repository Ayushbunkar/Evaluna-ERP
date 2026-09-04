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
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	EyeIcon,
	FilterIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const FINDING_TYPES = [
	{ value: "inventory", label: "Inventory Discrepancy" },
	{ value: "receiving", label: "Receiving Defect" },
	{ value: "upc", label: "UPC / Barcode Mismatch" },
	{ value: "placement", label: "Placement Violation" },
	{ value: "price", label: "Pricing Mismatch" },
	{ value: "route", label: "Route / Dispatch Issue" },
	{ value: "discrepancy", label: "General Discrepancy" },
];

const SEVERITIES = [
	{
		value: "LOW",
		label: "Low",
		color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
	},
	{
		value: "MEDIUM",
		label: "Medium",
		color:
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	},
	{
		value: "HIGH",
		label: "High",
		color:
			"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
	},
	{
		value: "CRITICAL",
		label: "Critical",
		color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
	},
];

const STATUSES: Record<string, { label: string; color: string }> = {
	OPEN: {
		label: "Open",
		color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
	},
	UNDER_REVIEW: {
		label: "Under Review",
		color:
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	},
	CORRECTIVE_ACTION_REQUIRED: {
		label: "Action Required",
		color:
			"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
	},
	RESOLVED: {
		label: "Resolved",
		color:
			"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
	},
	CLOSED: {
		label: "Closed",
		color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
	},
};

export default function AuditorFindingsPage() {
	const trpc = useTRPC();
	const {
		data: findings,
		isLoading,
		error,
		refetch,
	} = trpc.auditFindings.list.useQuery({});

	// Create Finding Mutation
	const createFindingMutation = trpc.auditFindings.create.useMutation({
		onSuccess: () => {
			refetch();
			setIsCreateOpen(false);
			setNewFinding({
				title: "",
				findingType: "inventory",
				severity: "MEDIUM",
				description: "",
			});
		},
	});

	// Resolve Finding Mutation
	const resolveFindingMutation = trpc.auditFindings.resolve.useMutation({
		onSuccess: () => {
			refetch();
			setSelectedFinding(null);
			setResolutionNote("");
		},
	});

	// State
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [selectedFinding, setSelectedFinding] = useState<any | null>(null);
	const [resolutionNote, setResolutionNote] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [severityFilter, setSeverityFilter] = useState("ALL");
	const [statusFilter, setStatusFilter] = useState("ALL");

	// New Finding Form
	const [newFinding, setNewFinding] = useState<{
		title: string;
		findingType:
			| "receiving"
			| "upc"
			| "placement"
			| "inventory"
			| "price"
			| "route"
			| "discrepancy";
		severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
		description: string;
	}>({
		title: "",
		findingType: "inventory",
		severity: "MEDIUM",
		description: "",
	});

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newFinding.title.trim()) return;
		createFindingMutation.mutate({
			title: newFinding.title,
			findingType: newFinding.findingType,
			severity: newFinding.severity,
			description: newFinding.description || undefined,
		});
	};

	const handleResolveSubmit = () => {
		if (!selectedFinding) return;
		resolveFindingMutation.mutate({
			findingId: selectedFinding.id,
			note: resolutionNote || undefined,
		});
	};

	// Filter Logic
	const filteredFindings = findings?.filter((f) => {
		const matchesSearch =
			f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			f.id.toString().includes(searchQuery) ||
			f.finding_type.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesSeverity =
			severityFilter === "ALL" || f.severity === severityFilter;
		const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
		return matchesSearch && matchesSeverity && matchesStatus;
	});

	// KPI Stats
	const totalCount = findings?.length ?? 0;
	const openCount = findings?.filter((f) => f.status === "OPEN").length ?? 0;
	const underReviewCount =
		findings?.filter((f) =>
			["UNDER_REVIEW", "CORRECTIVE_ACTION_REQUIRED"].includes(f.status),
		).length ?? 0;
	const resolvedCount =
		findings?.filter((f) => ["RESOLVED", "CLOSED"].includes(f.status)).length ??
		0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<ShieldAlertIcon className="h-7 w-7 text-blue-600" />
						Audit Findings & Non-Compliance Management
					</h1>
					<p className="text-muted-foreground text-sm">
						Raise, track, and resolve quality, inventory, and operational audit
						findings.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
						<DialogTrigger asChild>
							<Button className="bg-blue-600 shadow-md hover:bg-blue-700">
								<PlusIcon className="mr-2 h-4 w-4" /> Raise New Audit Finding
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px]">
							<DialogHeader>
								<DialogTitle className="flex items-center gap-2">
									<ShieldAlertIcon className="h-5 w-5 text-red-500" />
									Raise New Audit Finding
								</DialogTitle>
								<DialogDescription>
									Log a compliance exception, stock discrepancy, or operational
									defect discovered during audit.
								</DialogDescription>
							</DialogHeader>

							<form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										Finding Title / Summary *
									</label>
									<input
										type="text"
										required
										placeholder="e.g. Stock count mismatch in Rack A-12"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={newFinding.title}
										onChange={(e) =>
											setNewFinding({ ...newFinding, title: e.target.value })
										}
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
											Finding Category
										</label>
										<select
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={newFinding.findingType}
											onChange={(e) =>
												setNewFinding({
													...newFinding,
													findingType: e.target.value as any,
												})
											}
										>
											{FINDING_TYPES.map((t) => (
												<option key={t.value} value={t.value}>
													{t.label}
												</option>
											))}
										</select>
									</div>

									<div className="space-y-1">
										<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
											Severity Level
										</label>
										<select
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={newFinding.severity}
											onChange={(e) =>
												setNewFinding({
													...newFinding,
													severity: e.target.value as any,
												})
											}
										>
											{SEVERITIES.map((s) => (
												<option key={s.value} value={s.value}>
													{s.label}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										Detailed Description / Root Cause Notes
									</label>
									<textarea
										rows={3}
										placeholder="Describe the discrepancy, affected batch/SKU, and physical location..."
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={newFinding.description}
										onChange={(e) =>
											setNewFinding({
												...newFinding,
												description: e.target.value,
											})
										}
									/>
								</div>

								<DialogFooter className="pt-2">
									<Button
										type="button"
										variant="ghost"
										onClick={() => setIsCreateOpen(false)}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={
											createFindingMutation.isPending ||
											!newFinding.title.trim()
										}
										className="bg-blue-600 text-white hover:bg-blue-700"
									>
										{createFindingMutation.isPending && (
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										)}
										Submit Finding
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* KPI Summary Grid */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Total Findings
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{totalCount}
									</p>
								</div>
								<ShieldIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-red-700 text-sm dark:text-red-400">
										Open Issues
									</p>
									<p className="font-bold text-3xl text-red-800 dark:text-red-300">
										{openCount}
									</p>
								</div>
								<AlertTriangleIcon className="h-8 w-8 text-red-500" />
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
										Review / Action
									</p>
									<p className="font-bold text-3xl text-orange-800 dark:text-orange-300">
										{underReviewCount}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-orange-500" />
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
										Resolved
									</p>
									<p className="font-bold text-3xl text-green-800 dark:text-green-300">
										{resolvedCount}
									</p>
								</div>
								<ShieldCheckIcon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Filter Toolbar */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-lg">Audit Findings Log</CardTitle>
						<CardDescription>
							Filter, inspect, and update non-compliance findings
						</CardDescription>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Search Input */}
						<div className="relative w-full sm:w-56">
							<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search title, ID..."
								className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Severity Filter */}
						<select
							className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
							value={severityFilter}
							onChange={(e) => setSeverityFilter(e.target.value)}
						>
							<option value="ALL">All Severities</option>
							<option value="CRITICAL">Critical</option>
							<option value="HIGH">High</option>
							<option value="MEDIUM">Medium</option>
							<option value="LOW">Low</option>
						</select>

						{/* Status Filter */}
						<select
							className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="ALL">All Statuses</option>
							<option value="OPEN">Open</option>
							<option value="UNDER_REVIEW">Under Review</option>
							<option value="CORRECTIVE_ACTION_REQUIRED">
								Action Required
							</option>
							<option value="RESOLVED">Resolved</option>
						</select>
					</div>
				</CardHeader>

				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin" /> Loading
							findings...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading findings"}
						</div>
					) : !filteredFindings || filteredFindings.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<ShieldCheckIcon className="h-10 w-10 text-green-500 opacity-30" />
							<p className="font-medium text-sm">
								No findings match your filter rules
							</p>
							<p className="text-gray-400 text-xs">
								Click "Raise New Audit Finding" above to add one.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Finding ID</TableHead>
										<TableHead>Title</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Severity</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date Raised</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredFindings.map((f) => {
										const sevObj =
											SEVERITIES.find((s) => s.value === f.severity) ??
											SEVERITIES[1];
										const statObj = STATUSES[f.status] ?? STATUSES.OPEN;

										return (
											<TableRow key={f.id} className="hover:bg-muted/50">
												<TableCell className="font-mono font-semibold text-xs">
													#{f.id}
												</TableCell>
												<TableCell className="max-w-[250px] truncate font-medium text-sm">
													{f.title}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs capitalize">
													{f.finding_type?.replace(/_/g, " ")}
												</TableCell>
												<TableCell>
													<span
														className={`rounded-full px-2 py-0.5 font-medium text-xs ${sevObj.color}`}
													>
														{sevObj.label}
													</span>
												</TableCell>
												<TableCell>
													<span
														className={`rounded-full px-2 py-0.5 font-medium text-xs ${statObj.color}`}
													>
														{statObj.label}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{f.created_at
														? new Date(f.created_at).toISOString().split("T")[0]
														: "N/A"}
												</TableCell>
												<TableCell className="flex items-center justify-end gap-2 text-right">
													<Button
														variant="outline"
														size="sm"
														className="h-8 gap-1"
														onClick={() => setSelectedFinding(f)}
													>
														<EyeIcon className="h-3.5 w-3.5" /> Inspect
													</Button>
													{f.status !== "RESOLVED" && f.status !== "CLOSED" && (
														<Button
															variant="outline"
															size="sm"
															className="h-8 gap-1 border-green-600 text-green-700 hover:bg-green-50"
															onClick={() => {
																setSelectedFinding(f);
																setResolutionNote("");
															}}
														>
															<CheckCircle2Icon className="h-3.5 w-3.5 text-green-600" />{" "}
															Resolve
														</Button>
													)}
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

			{/* Detail & Resolve Modal */}
			{selectedFinding && (
				<Dialog
					open={!!selectedFinding}
					onOpenChange={(open) => !open && setSelectedFinding(null)}
				>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ShieldAlertIcon className="h-5 w-5 text-blue-600" />
								Finding #{selectedFinding.id}: {selectedFinding.title}
							</DialogTitle>
							<DialogDescription>
								Full finding record and resolution options
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-xs">
								<div>
									<span className="text-muted-foreground">Category:</span>{" "}
									<strong className="capitalize">
										{selectedFinding.finding_type}
									</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Severity:</span>{" "}
									<strong>{selectedFinding.severity}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Current Status:</span>{" "}
									<strong>{selectedFinding.status}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Date:</span>{" "}
									<strong>
										{selectedFinding.created_at
											? new Date(selectedFinding.created_at)
													.toISOString()
													.split("T")[0]
											: "N/A"}
									</strong>
								</div>
							</div>

							{selectedFinding.description && (
								<div className="space-y-1">
									<p className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										Description:
									</p>
									<p className="rounded-md border bg-background p-2.5 text-gray-800 text-sm dark:text-gray-200">
										{selectedFinding.description}
									</p>
								</div>
							)}

							{selectedFinding.status !== "RESOLVED" &&
								selectedFinding.status !== "CLOSED" && (
									<div className="space-y-1 border-t pt-2">
										<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
											Resolution Notes / Action Taken:
										</label>
										<textarea
											rows={3}
											placeholder="Describe corrective measures taken to fix this finding..."
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={resolutionNote}
											onChange={(e) => setResolutionNote(e.target.value)}
										/>
									</div>
								)}
						</div>

						<DialogFooter className="flex gap-2 sm:justify-between">
							<Button variant="ghost" onClick={() => setSelectedFinding(null)}>
								Close
							</Button>
							{selectedFinding.status !== "RESOLVED" &&
								selectedFinding.status !== "CLOSED" && (
									<Button
										disabled={resolveFindingMutation.isPending}
										onClick={handleResolveSubmit}
										className="bg-green-600 text-white hover:bg-green-700"
									>
										{resolveFindingMutation.isPending && (
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										)}
										Mark as Resolved
									</Button>
								)}
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
