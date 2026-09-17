"use client";

import { useState } from "react";
import Link from "next/link";
import {
	ActivityIcon,
	AlertTriangleIcon,
	ArrowUpDownIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	EyeIcon,
	FilterIcon,
	MapPinIcon,
	PlayIcon,
	PlusIcon,
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Label } from "@evaluna/ui/components/label";
import { Textarea } from "@evaluna/ui/components/textarea";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditTasksPage() {
	const trpc = useTRPC();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	// Form state for creating a new audit task
	const [newBranchId, setNewBranchId] = useState<number>(1);
	const [newAuditType, setNewAuditType] = useState<"cycle_count" | "spot_check" | "full_count" | "location_audit">("cycle_count");
	const [newLocationName, setNewLocationName] = useState<string>("");
	const [newDueDate, setNewDueDate] = useState<string>("");
	const [newNotes, setNewNotes] = useState<string>("");

	const {
		data: audits,
		isLoading,
		refetch,
	} = trpc.audit.listAudits.useQuery({
		status: statusFilter === "all" ? undefined : statusFilter,
		branchId: selectedBranchId,
	});

	const { data: branches } = trpc.branch.list.useQuery();

	const createMutation = trpc.audit.createAuditTask.useMutation({
		onSuccess: () => {
			setIsCreateOpen(false);
			setNewLocationName("");
			setNewNotes("");
			setNewDueDate("");
			refetch();
		},
	});

	const handleCreateTask = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate({
			branch_id: Number(newBranchId),
			audit_type: newAuditType,
			location_name: newLocationName.trim() || undefined,
			due_date: newDueDate ? new Date(newDueDate) : undefined,
			notes: newNotes.trim() || undefined,
		});
	};

	// Filter by search query (location, notes, id)
	const filteredAudits = audits?.filter((a) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			a.id.toString().includes(query) ||
			(a.location_name && a.location_name.toLowerCase().includes(query)) ||
			(a.notes && a.notes.toLowerCase().includes(query)) ||
			(a.branch?.name && a.branch.name.toLowerCase().includes(query))
		);
	});

	return (
		<PageTransition className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
							<ClipboardListIcon className="h-5 w-5" />
						</span>
						<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
							Inventory Audit Tasks
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
						Manage, perform, and record physical inventory count assignments
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

					{/* Create Audit Task Dialog */}
					<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
						<DialogTrigger asChild>
							<Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
								<PlusIcon className="mr-1.5 h-3.5 w-3.5" /> Create Audit Task
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[480px]">
							<form onSubmit={handleCreateTask}>
								<DialogHeader>
									<DialogTitle>Create New Inventory Audit Task</DialogTitle>
									<DialogDescription>
										Creates a verified audit assignment snapshot from current system inventory.
									</DialogDescription>
								</DialogHeader>

								<div className="grid gap-4 py-4">
									{/* Warehouse Branch */}
									<div className="grid gap-1.5">
										<Label htmlFor="branch" className="text-xs">
											Warehouse Branch
										</Label>
										<Select
											value={String(newBranchId)}
											onValueChange={(val) => setNewBranchId(Number(val))}
										>
											<SelectTrigger id="branch" className="text-xs">
												<SelectValue placeholder="Select Warehouse Branch" />
											</SelectTrigger>
											<SelectContent>
												{branches?.map((b) => (
													<SelectItem key={b.id} value={String(b.id)} className="text-xs">
														{b.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Audit Type */}
									<div className="grid gap-1.5">
										<Label htmlFor="auditType" className="text-xs">
											Audit Type
										</Label>
										<Select
											value={newAuditType}
											onValueChange={(val: any) => setNewAuditType(val)}
										>
											<SelectTrigger id="auditType" className="text-xs">
												<SelectValue placeholder="Select Audit Type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="cycle_count" className="text-xs">
													Cycle Count (Routine Periodic Check)
												</SelectItem>
												<SelectItem value="spot_check" className="text-xs">
													Spot Check (High-Velocity / Critical SKUs)
												</SelectItem>
												<SelectItem value="location_audit" className="text-xs">
													Location Audit (Specific Aisle / Zone / Bin)
												</SelectItem>
												<SelectItem value="full_count" className="text-xs">
													Full Count (Complete Warehouse Stock)
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Location / Zone name */}
									<div className="grid gap-1.5">
										<Label htmlFor="location" className="text-xs">
											Location / Zone / Aisle (Optional)
										</Label>
										<Input
											id="location"
											placeholder="e.g. Aisle 3 - Bins A01 to A15, or Cold Storage"
											value={newLocationName}
											onChange={(e) => setNewLocationName(e.target.value)}
											className="text-xs"
										/>
									</div>

									{/* Due Date */}
									<div className="grid gap-1.5">
										<Label htmlFor="dueDate" className="text-xs">
											Target Due Date (Optional)
										</Label>
										<Input
											id="dueDate"
											type="date"
											value={newDueDate}
											onChange={(e) => setNewDueDate(e.target.value)}
											className="text-xs"
										/>
									</div>

									{/* Notes / Special Instructions */}
									<div className="grid gap-1.5">
										<Label htmlFor="notes" className="text-xs">
											Instructions / Auditor Notes
										</Label>
										<Textarea
											id="notes"
											placeholder="Specific guidelines for the counting team (e.g. verify batch codes and damaged boxes)..."
											value={newNotes}
											onChange={(e) => setNewNotes(e.target.value)}
											rows={3}
											className="text-xs resize-none"
										/>
									</div>
								</div>

								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setIsCreateOpen(false)}
										className="text-xs"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										size="sm"
										disabled={createMutation.isPending}
										className="text-xs bg-blue-600 hover:bg-blue-700"
									>
										{createMutation.isPending ? "Creating Snapshot..." : "Generate Audit Task"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Filter Toolbar */}
			<Card className="border-border/60 bg-card p-4 shadow-sm">
				<div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
					<div className="relative w-full sm:w-80">
						<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by Audit #, location, notes..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 text-xs"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full sm:w-40 text-xs">
								<FilterIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
								<SelectValue placeholder="Status Filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all" className="text-xs">All Statuses</SelectItem>
								<SelectItem value="planned" className="text-xs">Planned / Pending</SelectItem>
								<SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
								<SelectItem value="discrepancy_review" className="text-xs">Under Review</SelectItem>
								<SelectItem value="completed" className="text-xs">Completed</SelectItem>
							</SelectContent>
						</Select>

						{branches && (
							<Select
								value={selectedBranchId ? String(selectedBranchId) : "all"}
								onValueChange={(v) => setSelectedBranchId(v === "all" ? undefined : Number(v))}
							>
								<SelectTrigger className="w-full sm:w-44 text-xs">
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

			{/* Tasks Directory Table */}
			<Card className="border-border/60 bg-card shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<div>
						<CardTitle className="text-base sm:text-lg">Audit Task Directory</CardTitle>
						<CardDescription className="text-xs">
							Showing {filteredAudits?.length ?? 0} physical count tasks
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							Loading audit tasks...
						</div>
					) : !filteredAudits || filteredAudits.length === 0 ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							<ClipboardCheckIcon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
							No audit tasks match the selected criteria.
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
										<TableHead>Assigned Auditor</TableHead>
										<TableHead>Progress</TableHead>
										<TableHead>Variance</TableHead>
										<TableHead>Due Date</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredAudits.map((audit) => {
										const totalItems = audit.totalItemsCount ?? 0;
										const countedItems = audit.countedItemsCount ?? 0;
										const progressPct = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;
										const hasVariance = (audit.varianceItemsCount ?? 0) > 0;

										return (
											<TableRow key={audit.id} className="hover:bg-muted/50">
												<TableCell className="font-mono font-semibold text-xs text-blue-600">
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
														variant={
															audit.status === "completed" || audit.status === "approved"
																? "default"
																: audit.status === "in_progress"
																	? "secondary"
																	: audit.status === "discrepancy_review" || audit.status === "submitted"
																		? "outline"
																		: "outline"
														}
														className={
															audit.status === "completed" || audit.status === "approved"
																? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200"
																: audit.status === "in_progress"
																	? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200"
																	: audit.status === "discrepancy_review" || audit.status === "submitted"
																		? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200"
																		: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
														}
													>
														{audit.status?.replace("_", " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{audit.auditor?.name ? (
														<span className="flex items-center gap-1">
															<UserIcon className="h-3 w-3 text-muted-foreground" />
															{audit.auditor.name}
														</span>
													) : (
														<span className="italic text-muted-foreground/60">Unassigned</span>
													)}
												</TableCell>
												<TableCell>
													<div className="w-28">
														<div className="flex justify-between text-[11px] text-muted-foreground mb-1">
															<span>{countedItems} / {totalItems}</span>
															<span>{progressPct}%</span>
														</div>
														<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
															<div
																className={`h-full transition-all ${
																	progressPct === 100 ? "bg-emerald-500" : "bg-blue-500"
																}`}
																style={{ width: `${progressPct}%` }}
															/>
														</div>
													</div>
												</TableCell>
												<TableCell>
													{hasVariance ? (
														<span className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
															<AlertTriangleIcon className="mr-1 h-3.5 w-3.5" />
															{audit.varianceItemsCount} items
														</span>
													) : (
														<span className="inline-flex items-center text-xs text-muted-foreground">
															<ShieldCheckIcon className="mr-1 h-3.5 w-3.5 text-emerald-500" />
															0
														</span>
													)}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{audit.due_date ? new Date(audit.due_date).toLocaleDateString() : "—"}
												</TableCell>
												<TableCell className="text-right">
													{audit.status === "completed" || audit.status === "approved" ? (
														<Button size="sm" variant="outline" asChild className="h-7 text-xs">
															<Link href={`/auditor/tasks/${audit.id}`}>
																<EyeIcon className="mr-1 h-3 w-3" /> View Summary
															</Link>
														</Button>
													) : (
														<Button size="sm" asChild className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
															<Link href={`/auditor/tasks/${audit.id}`}>
																<PlayIcon className="mr-1 h-3 w-3" />
																{audit.status === "in_progress" ? "Resume Count" : "Start Count"}
															</Link>
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
		</PageTransition>
	);
}
