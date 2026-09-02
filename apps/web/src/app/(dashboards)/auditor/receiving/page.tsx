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
	ActivityIcon,
	CheckCircle2Icon,
	ClockIcon,
	XCircleIcon,
	PackageCheckIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	AlertTriangleIcon,
	EyeIcon,
	BarcodeIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const statusConfig: Record<string, { label: string; color: string }> = {
	PENDING: { label: "Pending Audit", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
	VERIFIED: { label: "Passed & Verified", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
	DISCREPANCY: { label: "Defect Discrepancy", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const conditionConfig: Record<string, { label: string; color: string }> = {
	good: { label: "Good Condition", color: "bg-green-100 text-green-700" },
	damaged: { label: "Damaged Goods", color: "bg-red-100 text-red-700" },
	mismatch: { label: "Quantity Mismatch", color: "bg-orange-100 text-orange-700" },
};

export default function AuditorReceivingPage() {
	const trpc = useTRPC();
	const {
		data: inspections,
		isLoading,
		error,
		refetch,
	} = trpc.auditor.getReceivingInspections.useQuery({});
	const { data: productsList } = trpc.auditor.getProductsList.useQuery();

	const createMutation = trpc.auditor.createReceivingInspection.useMutation({
		onSuccess: () => {
			refetch();
			setIsModalOpen(false);
			setSelectedProductId(null);
			setExpectedQty(10);
			setReceivedQty(10);
			setCondition("good");
			setUpcStatus("present");
			setNotes("");
		},
	});

	// State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
	const [expectedQty, setExpectedQty] = useState<number>(10);
	const [receivedQty, setReceivedQty] = useState<number>(10);
	const [condition, setCondition] = useState<"good" | "damaged" | "mismatch">("good");
	const [upcStatus, setUpcStatus] = useState<"present" | "missing" | "invalid">("present");
	const [notes, setNotes] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [inspectItem, setInspectItem] = useState<any | null>(null);

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedProductId) return;
		createMutation.mutate({
			productId: selectedProductId,
			expectedQty: Number(expectedQty) || 0,
			receivedQty: Number(receivedQty) || 0,
			condition: condition,
			upcStatus: upcStatus,
			notes: notes || undefined,
		});
	};

	const filteredInspections = inspections?.filter((i) => {
		const matchesSearch =
			i.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			i.product_sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			i.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			i.id.toString().includes(searchQuery);
		const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const totalCount = inspections?.length ?? 0;
	const passedCount = inspections?.filter((i) => i.status === "VERIFIED").length ?? 0;
	const damagedCount = inspections?.filter((i) => i.condition === "damaged").length ?? 0;
	const discrepancyCount = inspections?.filter((i) => i.status === "DISCREPANCY").length ?? 0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
						<ActivityIcon className="h-7 w-7 text-blue-600" />
						Incoming Goods Receiving Inspection
					</h1>
					<p className="text-muted-foreground text-sm">
						Quality assurance, goods receipt note (GRN) audit, material condition & barcode verification.
					</p>
				</div>

				<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
					<DialogTrigger asChild>
						<Button className="shadow-md bg-blue-600 hover:bg-blue-700">
							<PlusIcon className="mr-2 h-4 w-4" /> Log Goods Receiving Inspection
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<PackageCheckIcon className="h-5 w-5 text-blue-600" />
								Log Incoming Goods GRN Audit
							</DialogTitle>
							<DialogDescription>
								Inspect incoming shipments. Discrepancies and damaged goods auto-escalate to an Audit Finding.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
							{/* Product Selector */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
									Received Inventory Item *
								</label>
								<select
									required
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={selectedProductId ?? ""}
									onChange={(e) => setSelectedProductId(Number(e.target.value) || null)}
								>
									<option value="">-- Select Incoming Product --</option>
									{productsList?.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} (SKU: {p.sku || "N/A"})
										</option>
									))}
								</select>
							</div>

							{/* Quantities */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
										Expected Qty (GRN/PO)
									</label>
									<input
										type="number"
										min="0"
										required
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={expectedQty}
										onChange={(e) => setExpectedQty(Number(e.target.value))}
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
										Actual Physical Received Qty
									</label>
									<input
										type="number"
										min="0"
										required
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={receivedQty}
										onChange={(e) => setReceivedQty(Number(e.target.value))}
									/>
								</div>
							</div>

							{/* Condition & UPC Status */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
										Material Condition
									</label>
									<select
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={condition}
										onChange={(e) => setCondition(e.target.value as any)}
									>
										<option value="good">✅ Good / Intact</option>
										<option value="damaged">🚨 Damaged Goods</option>
										<option value="mismatch">⚠️ Qty Mismatch</option>
									</select>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
										Barcode Tag Status
									</label>
									<select
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={upcStatus}
										onChange={(e) => setUpcStatus(e.target.value as any)}
									>
										<option value="present">🏷️ Present & Valid</option>
										<option value="missing">❓ Missing Tag</option>
										<option value="invalid">❌ Invalid / Unreadable Code</option>
									</select>
								</div>
							</div>

							{/* Notes */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
									Inspector Notes & Batch / Box Tag
								</label>
								<textarea
									rows={3}
									placeholder="Notes on packaging, seal condition, or supplier batch..."
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
									Save Inspection Audit
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
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Inspections</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{totalCount}</p>
								</div>
								<PackageCheckIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Passed & Verified</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{passedCount}</p>
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
									<p className="text-sm font-medium text-red-700 dark:text-red-400">Damaged Defective</p>
									<p className="text-3xl font-bold text-red-800 dark:text-red-300">{damagedCount}</p>
								</div>
								<XCircleIcon className="h-8 w-8 text-red-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-orange-700 dark:text-orange-400">Discrepancies</p>
									<p className="text-3xl font-bold text-orange-800 dark:text-orange-300">{discrepancyCount}</p>
								</div>
								<AlertTriangleIcon className="h-8 w-8 text-orange-500" />
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
							<ActivityIcon className="h-5 w-5 text-blue-600" />
							Receiving Inspection Records
						</CardTitle>
						<CardDescription>Full audit log of incoming shipments and material GRN reviews</CardDescription>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Search Input */}
						<div className="relative w-full sm:w-56">
							<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search product, SKU..."
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
						</select>
					</div>
				</CardHeader>

				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin" /> Loading receiving inspections...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading receiving inspections"}
						</div>
					) : !filteredInspections || filteredInspections.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<PackageCheckIcon className="h-10 w-10 opacity-30 text-blue-500" />
							<p className="text-sm font-medium">No receiving inspections match your filter rules</p>
							<p className="text-xs text-gray-400">Click "Log Goods Receiving Inspection" above to add one.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>GRN ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Expected / Received</TableHead>
										<TableHead>Condition</TableHead>
										<TableHead>UPC Status</TableHead>
										<TableHead>Audit Status</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredInspections.map((i) => {
										const statObj = statusConfig[i.status ?? "PENDING"] ?? statusConfig.VERIFIED;
										const condObj = conditionConfig[i.condition ?? "good"] ?? conditionConfig.good;

										return (
											<TableRow key={i.id} className="hover:bg-muted/50">
												<TableCell className="font-mono text-xs font-semibold">#{i.id}</TableCell>
												<TableCell className="font-semibold text-sm">{i.product_name}</TableCell>
												<TableCell className="font-mono text-xs text-muted-foreground">{i.product_sku}</TableCell>
												<TableCell className="text-sm font-medium">
													<span className={i.expected_qty !== i.received_qty ? "text-red-600 font-bold" : ""}>
														{i.expected_qty ?? "—"} / {i.received_qty ?? "—"}
													</span>
												</TableCell>
												<TableCell>
													<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${condObj.color}`}>
														{condObj.label}
													</span>
												</TableCell>
												<TableCell className="text-xs capitalize text-muted-foreground">
													{i.upc_status ?? "present"}
												</TableCell>
												<TableCell>
													<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statObj.color}`}>
														{statObj.label}
													</span>
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="outline"
														size="sm"
														className="h-8 gap-1"
														onClick={() => setInspectItem(i)}
													>
														<EyeIcon className="h-3.5 w-3.5" /> Inspect
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
								<PackageCheckIcon className="h-5 w-5 text-blue-600" />
								Receiving GRN Audit #{inspectItem.id}
							</DialogTitle>
							<DialogDescription>Incoming goods inspection details</DialogDescription>
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
									<span className="text-muted-foreground">Quantities:</span>{" "}
									<strong>Expected: {inspectItem.expected_qty} | Received: {inspectItem.received_qty}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Material Condition:</span>{" "}
									<strong className="capitalize">{inspectItem.condition}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Barcode Tag Status:</span>{" "}
									<strong className="capitalize">{inspectItem.upc_status}</strong>
								</div>
								<div>
									<span className="text-muted-foreground">Audit Status:</span>{" "}
									<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(statusConfig[inspectItem.status]?.color || "")}`}>
										{statusConfig[inspectItem.status]?.label || inspectItem.status}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">Inspected At:</span>{" "}
									<strong>{inspectItem.verified_at || inspectItem.created_at || "N/A"}</strong>
								</div>
							</div>

							{inspectItem.notes && (
								<div className="space-y-1">
									<p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Inspector Field Notes:</p>
									<p className="bg-background border p-2.5 rounded-md text-xs text-gray-800 dark:text-gray-200">
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