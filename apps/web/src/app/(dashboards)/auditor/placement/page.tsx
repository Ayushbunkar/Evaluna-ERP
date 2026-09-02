"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
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
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@evaluna/ui/components/dialog";
import {
	UsersIcon,
	CheckCircle2Icon,
	ClockIcon,
	MapPinIcon,
	PackageIcon,
	Loader2Icon,
	XCircleIcon,
	PlusIcon,
	SearchIcon,
	AlertTriangleIcon,
	EyeIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const statusConfig: Record<string, { label: string; color: string }> = {
	AWAITING_PLACEMENT: { label: "Awaiting Placement", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
	PLACED: { label: "Placed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
	VERIFICATION_REQUIRED: { label: "Needs Audit", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
	VERIFIED: { label: "Verified Correct", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
	DISCREPANCY: { label: "Location Discrepancy", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
	PLACEMENT_EXCEPTION: { label: "Critical Exception", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function AuditorPlacementPage() {
	const trpc = useTRPC();
	const {
		data: verifications,
		isLoading,
		error,
		refetch,
	} = trpc.auditor.getPlacementVerifications.useQuery({});
	const { data: productsList } = trpc.auditor.getProductsList.useQuery();

	const createMutation = trpc.auditor.createPlacementVerification.useMutation({
		onSuccess: () => {
			refetch();
			setIsModalOpen(false);
			setSelectedProductId(null);
			setLocationNotes("");
			setAuditStatus("VERIFIED");
			setNotes("");
		},
	});

	// State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
	const [locationNotes, setLocationNotes] = useState("");
	const [auditStatus, setAuditStatus] = useState<"VERIFIED" | "DISCREPANCY" | "PLACEMENT_EXCEPTION">("VERIFIED");
	const [notes, setNotes] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [inspectItem, setInspectItem] = useState<any | null>(null);

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedProductId) return;
		createMutation.mutate({
			productId: selectedProductId,
			locationNotes: locationNotes || undefined,
			status: auditStatus,
			notes: notes || undefined,
		});
	};

	const filteredVerifications = verifications?.filter((v) => {
		const matchesSearch =
			v.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			v.product_sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			v.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			v.id.toString().includes(searchQuery);
		const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const totalCount = verifications?.length ?? 0;
	const verifiedCount = verifications?.filter((v) => v.status === "VERIFIED").length ?? 0;
	const discrepancyCount = verifications?.filter((v) => v.status === "DISCREPANCY").length ?? 0;
	const exceptionCount = verifications?.filter((v) => ["PLACEMENT_EXCEPTION", "FAILED"].includes(v.status ?? "")).length ?? 0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
						<MapPinIcon className="h-7 w-7 text-blue-600" />
						Bin Placement & Location Verification
					</h1>
					<p className="text-muted-foreground text-sm">
						Audit physical warehouse rack/bin placement, verify stock location accuracy, and report discrepancies.
					</p>
				</div>

				<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
					<DialogTrigger asChild>
						<Button className="shadow-md bg-blue-600 hover:bg-blue-700">
							<PlusIcon className="mr-2 h-4 w-4" /> Perform Physical Location Audit
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<MapPinIcon className="h-5 w-5 text-blue-600" />
								Log Placement Verification Audit
							</DialogTitle>
							<DialogDescription>
								Verify physical item placement in warehouse bins/racks. Discrepancies auto-trigger an Audit Finding.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
							{/* Product Selector */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
									Target Inventory Product *
								</label>
								<select
									required
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={selectedProductId ?? ""}
									onChange={(e) => setSelectedProductId(Number(e.target.value) || null)}
								>
									<option value="">-- Select Product --</option>
									{productsList?.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} (SKU: {p.sku || "N/A"})
										</option>
									))}
								</select>
							</div>

							{/* Warehouse Location Input */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
									Physical Location / Bin Tag
								</label>
								<input
									type="text"
									placeholder="e.g. Aisle 04 - Shelf B - Bin 12"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={locationNotes}
									onChange={(e) => setLocationNotes(e.target.value)}
								/>
							</div>

							{/* Audit Status Outcome */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
									Audit Result
								</label>
								<select
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={auditStatus}
									onChange={(e) => setAuditStatus(e.target.value as any)}
								>
									<option value="VERIFIED">✅ Verified (Correct Location & Quantity)</option>
									<option value="DISCREPANCY">⚠️ Discrepancy (Wrong Rack/Bin - Auto Raises Finding)</option>
									<option value="PLACEMENT_EXCEPTION">🚨 Placement Exception (Item Missing / Damaged)</option>
								</select>
							</div>

							{/* Notes */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
									Auditor Field Notes
								</label>
								<textarea
									rows={3}
									placeholder="Provide evidence notes or explain the location mismatch..."
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>

							<DialogFooter className="pt-2">
								<Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={!selectedProductId || createMutation.isPending}
									className="bg-blue-600 hover:bg-blue-700 text-white"
								>
									{createMutation.isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
									Save Audit Log
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* KPI Stats Grid */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Audits</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{totalCount}</p>
								</div>
								<PackageIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Verified Correct</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{verifiedCount}</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-orange-700 dark:text-orange-400">Location Discrepancies</p>
									<p className="text-3xl font-bold text-orange-800 dark:text-orange-300">{discrepancyCount}</p>
								</div>
								<AlertTriangleIcon className="h-8 w-8 text-orange-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-red-700 dark:text-red-400">Exceptions / Missing</p>
									<p className="text-3xl font-bold text-red-800 dark:text-red-300">{exceptionCount}</p>
								</div>
								<XCircleIcon className="h-8 w-8 text-red-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Data Table Card */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<MapPinIcon className="h-5 w-5 text-blue-600" />
							Location Audit Records
						</CardTitle>
						<CardDescription>Full history of bin placement verification audits</CardDescription>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Search Input */}
						<div className="relative w-full sm:w-56">
							<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search product, location..."
								className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Status Filter */}
						<select
							className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="ALL">All Outcomes</option>
							<option value="VERIFIED">Verified</option>
							<option value="DISCREPANCY">Discrepancy</option>
							<option value="PLACEMENT_EXCEPTION">Exception</option>
						</select>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin" /> Loading audit records...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading placement verifications"}
						</div>
					) : !filteredVerifications || filteredVerifications.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<MapPinIcon className="h-10 w-10 opacity-30 text-blue-500" />
							<p className="text-sm font-medium">No placement audits match your filter rules</p>
							<p className="text-xs text-gray-400">Click "Perform Physical Location Audit" above to add one.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Audit ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Audit Status</TableHead>
										<TableHead>Location Tag / Notes</TableHead>
										<TableHead>Verified Date</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredVerifications.map((v) => {
										const statObj = statusConfig[v.status ?? "AWAITING_PLACEMENT"] ?? statusConfig.VERIFIED;
										return (
											<TableRow key={v.id} className="hover:bg-muted/50">
												<TableCell className="font-mono text-xs font-semibold">#{v.id}</TableCell>
												<TableCell className="font-semibold text-sm">{v.product_name}</TableCell>
												<TableCell className="font-mono text-xs text-muted-foreground">{v.product_sku}</TableCell>
												<TableCell>
													<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statObj.color}`}>
														{statObj.label}
													</span>
												</TableCell>
												<TableCell className="max-w-[220px] truncate text-muted-foreground text-xs">
													{v.notes ?? "—"}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">{v.verified_at || v.created_at || "—"}</TableCell>
												<TableCell className="text-right">
													<Button
														variant="outline"
														size="sm"
														className="h-8 gap-1"
														onClick={() => setInspectItem(v)}
													>
														<EyeIcon className="h-3.5 w-3.5" /> View Log
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

			{/* Inspect Modal */}
			{inspectItem && (
				<Dialog open={!!inspectItem} onOpenChange={(open) => !open && setInspectItem(null)}>
					<DialogContent className="sm:max-w-[450px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<MapPinIcon className="h-5 w-5 text-blue-600" />
								Location Audit #{inspectItem.id}
							</DialogTitle>
							<DialogDescription>Placement audit details</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2 text-sm">
							<div className="bg-muted/40 p-3 rounded-lg space-y-1.5 text-xs">
								<div>
									<span className="text-muted-foreground">Product:</span>{" "}
									<strong className="text-sm text-foreground">{inspectItem.product_name}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">SKU:</span>{" "}
									<strong>{inspectItem.product_sku}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Audit Status:</span>{" "}
									<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(statusConfig[inspectItem.status]?.color || "")}`}>
										{statusConfig[inspectItem.status]?.label || inspectItem.status}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">Date Logged:</span>{" "}
									<strong>{inspectItem.verified_at || inspectItem.created_at || "N/A"}</strong>
								</div>
							</div>

							{inspectItem.notes && (
								<div className="space-y-1">
									<p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Auditor Notes & Location:</p>
									<p className="bg-background border p-2.5 rounded-md text-xs font-mono text-gray-800 dark:text-gray-200">
										{inspectItem.notes}
									</p>
								</div>
							)}
						</div>

						<DialogFooter>
							<Button variant="ghost" onClick={() => setInspectItem(null)}>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}