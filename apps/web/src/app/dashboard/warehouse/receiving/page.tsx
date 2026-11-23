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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangleIcon,
	BoxesIcon,
	CheckCircle2Icon,
	ChevronRightIcon,
	ClockIcon,
	DownloadIcon,
	EyeIcon,
	FileTextIcon,
	Loader2Icon,
	PackageCheckIcon,
	PackageIcon,
	PrinterIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldCheckIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const INBOUND_ACTIVE_STATUSES = [
	"pending",
	"ordered",
	"in_transit",
	"draft",
	"approved",
	"partially_received",
	"awaiting_receipt",
];

export default function ReceivingPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<
		"all" | "awaiting" | "received" | "completed"
	>("all");

	// Live Queries
	const {
		data: pos,
		isLoading: posLoading,
		isRefetching,
		refetch,
	} = trpc.warehouse.getReceivingPOs.useQuery(undefined, {
		refetchInterval: 15000,
		refetchOnWindowFocus: true,
	});

	// Mutations
	const receivePOMutation = trpc.warehouse.receivePO.useMutation({
		onSuccess: () => {
			toast.success("Purchase Order successfully received & GRN generated!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getReceivingPOs.invalidate();
			utils.warehouse.getReceivingInspections.invalidate();
			utils.warehouse.getPutAwayQueue.invalidate();
		},
		onError: (err) => {
			toast.error(`Receiving failed: ${err.message}`);
		},
	});

	// Dialog States
	const [selectedPO, setSelectedPO] = useState<any>(null);
	const [poItems, setPoItems] = useState<any[]>([]);
	const [loadingItems, setLoadingItems] = useState(false);
	const [receivingQuantities, setReceivingQuantities] = useState<
		Record<number, number>
	>({});
	const [receivingConditions, setReceivingConditions] = useState<
		Record<number, "good" | "damaged" | "mismatch">
	>({});
	const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);

	// Details Modal State
	const [detailsPO, setDetailsPO] = useState<any>(null);
	const [detailsItems, setDetailsItems] = useState<any[]>([]);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

	const openReceivingModal = async (po: any) => {
		setSelectedPO(po);
		setIsReceivingModalOpen(true);
		setLoadingItems(true);
		try {
			const items = await utils.client.warehouse.getPurchaseItems.query({
				purchaseId: po.id,
			});
			setPoItems(items);
			const defaultQtys: Record<number, number> = {};
			const defaultConds: Record<number, "good" | "damaged" | "mismatch"> = {};
			for (const item of items) {
				defaultQtys[item.product_id] = item.quantity;
				defaultConds[item.product_id] = "good";
			}
			setReceivingQuantities(defaultQtys);
			setReceivingConditions(defaultConds);
		} catch (e) {
			toast.error("Failed to load PO items");
		} finally {
			setLoadingItems(false);
		}
	};

	const openDetailsModal = async (po: any) => {
		setDetailsPO(po);
		setIsDetailsModalOpen(true);
		setLoadingDetails(true);
		try {
			const items = await utils.client.warehouse.getPurchaseItems.query({
				purchaseId: po.id,
			});
			setDetailsItems(items);
		} catch (e) {
			toast.error("Failed to load PO items details");
		} finally {
			setLoadingDetails(false);
		}
	};

	const handleReceivePO = async () => {
		if (!selectedPO) return;
		const itemsPayload = poItems.map((item) => ({
			productId: item.product_id,
			expectedQty: item.quantity,
			receivedQty: receivingQuantities[item.product_id] ?? item.quantity,
			condition: receivingConditions[item.product_id] ?? "good",
		}));

		await receivePOMutation.mutateAsync({
			purchaseId: selectedPO.id,
			items: itemsPayload,
		});
		setIsReceivingModalOpen(false);
	};

	// Statistics calculations
	const stats = useMemo(() => {
		if (!pos)
			return {
				totalPOs: 0,
				awaitingReceipt: 0,
				receivedInDock: 0,
				completed: 0,
				totalValue: 0,
			};

		let awaiting = 0;
		let received = 0;
		let completed = 0;
		let totalVal = 0;

		for (const po of pos) {
			totalVal += Number(po.total_amount) || 0;
			const st = po.status?.toLowerCase() || "";
			if (INBOUND_ACTIVE_STATUSES.includes(st)) {
				awaiting += 1;
			} else if (st === "received") {
				received += 1;
			} else if (st === "completed") {
				completed += 1;
			}
		}

		return {
			totalPOs: pos.length,
			awaitingReceipt: awaiting,
			receivedInDock: received,
			completed,
			totalValue: totalVal,
		};
	}, [pos]);

	// Filter and search
	const filteredPOs = useMemo(() => {
		if (!pos) return [];
		return pos.filter((po) => {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				!query ||
				po.id.toString().includes(query) ||
				po.grn_number?.toLowerCase().includes(query) ||
				po.supplier_name?.toLowerCase().includes(query) ||
				po.status?.toLowerCase().includes(query);

			if (!matchesSearch) return false;

			const st = po.status?.toLowerCase() || "";
			if (activeTab === "awaiting") {
				return INBOUND_ACTIVE_STATUSES.includes(st);
			}
			if (activeTab === "received") {
				return st === "received";
			}
			if (activeTab === "completed") {
				return st === "completed";
			}
			return true;
		});
	}, [pos, searchQuery, activeTab]);

	const getStatusBadge = (status: string | null) => {
		const st = status?.toLowerCase() || "pending";
		switch (st) {
			case "pending":
			case "draft":
				return (
					<Badge
						variant="outline"
						className="border-amber-200 bg-amber-50 font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
					>
						<ClockIcon className="mr-1 h-3 w-3" /> Pending Inbound
					</Badge>
				);
			case "ordered":
			case "in_transit":
			case "awaiting_receipt":
				return (
					<Badge
						variant="outline"
						className="border-blue-200 bg-blue-50 font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
					>
						<TruckIcon className="mr-1 h-3 w-3" /> In Transit / Ordered
					</Badge>
				);
			case "approved":
				return (
					<Badge
						variant="outline"
						className="border-indigo-200 bg-indigo-50 font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400"
					>
						<ShieldCheckIcon className="mr-1 h-3 w-3" /> Approved PO
					</Badge>
				);
			case "partially_received":
				return (
					<Badge
						variant="outline"
						className="border-orange-200 bg-orange-50 font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
					>
						<AlertTriangleIcon className="mr-1 h-3 w-3" /> Partial Receipt
					</Badge>
				);
			case "received":
				return (
					<Badge
						variant="secondary"
						className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
					>
						<CheckCircle2Icon className="mr-1 h-3 w-3" /> Received & In Dock
					</Badge>
				);
			case "completed":
				return (
					<Badge
						variant="default"
						className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
					>
						<BoxesIcon className="mr-1 h-3 w-3" /> Put-Away Completed
					</Badge>
				);
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
							Inbound Goods Receiving (GRN)
						</h2>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[11px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
							LIVE
						</span>
					</div>
					<p className="text-muted-foreground text-sm">
						Inspect incoming shipments against procurement purchase orders,
						record QA checks & generate GRNs.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search PO #, GRN, supplier..."
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

			{/* KPI Summary Row */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
				<Card className="border-border/60 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Total Inbound POs
								</p>
								<p className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
									{posLoading ? "..." : stats.totalPOs}
								</p>
							</div>
							<div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
								<TruckIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-amber-200/70 bg-amber-50/30 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-amber-800 text-xs uppercase tracking-wider dark:text-amber-400">
									Awaiting Receiving
								</p>
								<p className="font-bold text-2xl text-amber-900 tracking-tight sm:text-3xl dark:text-amber-300">
									{posLoading ? "..." : stats.awaitingReceipt}
								</p>
							</div>
							<div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
								<ClockIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-emerald-200/70 bg-emerald-50/30 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-emerald-800 text-xs uppercase tracking-wider dark:text-emerald-400">
									Received & In Dock
								</p>
								<p className="font-bold text-2xl text-emerald-900 tracking-tight sm:text-3xl dark:text-emerald-300">
									{posLoading ? "..." : stats.receivedInDock}
								</p>
							</div>
							<div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
								<PackageCheckIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Total PO Value
								</p>
								<p className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
									₹{stats.totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
								</p>
							</div>
							<div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
								<DownloadIcon className="h-5 w-5" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter Tabs and Inbound Queue Table */}
			<Card className="shadow-sm">
				<CardHeader className="border-b pb-4">
					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div>
							<CardTitle className="font-bold text-base">
								Inbound Procurement & GRN Receiving Queue
							</CardTitle>
							<CardDescription>
								Select an incoming PO to inspect line items, verify physical
								quantities & dispatch to put-away
							</CardDescription>
						</div>

						{/* Segmented Filter Buttons */}
						<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
							<Button
								variant={activeTab === "all" ? "default" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("all")}
								className="h-7 text-xs"
							>
								All ({stats.totalPOs})
							</Button>
							<Button
								variant={activeTab === "awaiting" ? "default" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("awaiting")}
								className="h-7 text-xs"
							>
								Awaiting Receipt ({stats.awaitingReceipt})
							</Button>
							<Button
								variant={activeTab === "received" ? "default" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("received")}
								className="h-7 text-xs"
							>
								Received ({stats.receivedInDock})
							</Button>
							<Button
								variant={activeTab === "completed" ? "default" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("completed")}
								className="h-7 text-xs"
							>
								Completed ({stats.completed})
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{posLoading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							<p className="mt-2 text-muted-foreground text-xs">
								Fetching live inbound purchase orders...
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="w-[140px]">PO & GRN Ref</TableHead>
										<TableHead>Supplier Partner</TableHead>
										<TableHead>Items / Units</TableHead>
										<TableHead>Expected Date</TableHead>
										<TableHead>Order Cost</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPOs.map((po) => {
										const isAwaiting = INBOUND_ACTIVE_STATUSES.includes(
											po.status?.toLowerCase() || "",
										);
										return (
											<TableRow key={po.id} className="hover:bg-muted/20">
												<TableCell>
													<div className="flex flex-col">
														<span className="font-bold text-slate-900 text-sm dark:text-slate-100">
															PO #{po.id}
														</span>
														<span className="font-mono text-[11px] text-muted-foreground">
															{po.grn_number || "GRN Pending"}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-semibold text-slate-800 text-xs dark:text-slate-200">
															{po.supplier_name || "Direct Supplier"}
														</span>
														{po.supplier_phone && (
															<span className="text-[10px] text-muted-foreground">
																{po.supplier_phone}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1.5 font-medium text-xs">
														<PackageIcon className="h-3.5 w-3.5 text-muted-foreground" />
														<span>
															{po.item_count || 1} items (
															{po.total_quantity || "—"} units)
														</span>
													</div>
												</TableCell>
												<TableCell className="text-slate-500 text-xs">
													{po.created_at
														? new Date(po.created_at).toLocaleDateString()
														: "N/A"}
												</TableCell>
												<TableCell className="font-bold text-slate-900 text-xs dark:text-slate-100">
													₹{Number(po.total_amount).toFixed(2)}
												</TableCell>
												<TableCell>{getStatusBadge(po.status)}</TableCell>
												<TableCell className="text-right">
													{isAwaiting ? (
														<Button
															size="sm"
															onClick={() => openReceivingModal(po)}
															className="h-8 shadow-sm"
														>
															<PackageCheckIcon className="mr-1 h-3.5 w-3.5" />
															Receive & Inspect
														</Button>
													) : (
														<div className="flex items-center justify-end gap-2">
															<Button
																size="sm"
																variant="outline"
																onClick={() => openDetailsModal(po)}
																className="h-8 text-xs shadow-sm"
															>
																<EyeIcon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
																View GRN
															</Button>
															<Link
																href="/dashboard/warehouse/put-away"
																className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-semibold text-[11px] text-slate-700 hover:bg-muted/80 dark:text-slate-300"
															>
																Put-Away &rarr;
															</Link>
														</div>
													)}
												</TableCell>
											</TableRow>
										);
									})}
									{filteredPOs.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={7}
												className="py-16 text-center text-muted-foreground"
											>
												<TruckIcon className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
												<p className="font-bold text-slate-700 text-sm dark:text-slate-300">
													No inbound purchase orders found.
												</p>
												<p className="text-xs">
													There are no inbound shipments matching the selected
													status tab or search query.
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

			{/* INSPECT & RECEIVE PO DIALOG MODAL */}
			<Dialog
				open={isReceivingModalOpen}
				onOpenChange={setIsReceivingModalOpen}
			>
				<DialogContent className="max-w-2xl bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<PackageCheckIcon className="h-5 w-5 text-primary" />
							Inspect & Receive Purchase Order #{selectedPO?.id}
						</DialogTitle>
						<DialogDescription>
							Validate physical quantities and condition of incoming goods from{" "}
							<span className="font-semibold text-slate-800 dark:text-slate-200">
								{selectedPO?.supplier_name || "Supplier"}
							</span>
							. This will generate GRN and create Put-Away placement tasks.
						</DialogDescription>
					</DialogHeader>

					{loadingItems ? (
						<div className="flex justify-center py-10">
							<Loader2Icon className="h-6 w-6 animate-spin text-primary" />
						</div>
					) : (
						<div className="my-2 max-h-[350px] space-y-4 overflow-y-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40">
										<TableHead>Product Line Name</TableHead>
										<TableHead>Expected Qty</TableHead>
										<TableHead>Received Qty</TableHead>
										<TableHead>Quality Condition</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{poItems.map((item) => (
										<TableRow key={item.product_id}>
											<TableCell className="max-w-[200px]">
												<div className="flex flex-col">
													<span className="truncate font-bold text-xs">
														{item.product_name}
													</span>
													{item.product_sku && (
														<span className="font-mono text-[10px] text-muted-foreground">
															SKU: {item.product_sku}
														</span>
													)}
												</div>
											</TableCell>
											<TableCell className="font-semibold text-xs">
												{item.quantity} units
											</TableCell>
											<TableCell>
												<Input
													type="number"
													className="h-8 w-24 font-bold text-xs"
													min={0}
													value={
														receivingQuantities[item.product_id] ??
														item.quantity
													}
													onChange={(e) =>
														setReceivingQuantities({
															...receivingQuantities,
															[item.product_id]:
																Number.parseInt(e.target.value) || 0,
														})
													}
												/>
											</TableCell>
											<TableCell>
												<select
													className="rounded border border-input bg-background px-2 py-1 font-semibold text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
													value={receivingConditions[item.product_id] ?? "good"}
													onChange={(e) =>
														setReceivingConditions({
															...receivingConditions,
															[item.product_id]: e.target.value as any,
														})
													}
												>
													<option value="good">✓ Good Condition</option>
													<option value="damaged">⚠ Damaged Goods</option>
													<option value="mismatch">✕ Quantity Mismatch</option>
												</select>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}

					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsReceivingModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleReceivePO}
							disabled={receivePOMutation.isPending || loadingItems}
							className="shadow-sm"
						>
							{receivePOMutation.isPending ? (
								<>
									<Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Generating GRN & Ledger Entries...
								</>
							) : (
								"Generate GRN & Move to Put-Away"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* VIEW GRN DETAILS MODAL */}
			<Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
				<DialogContent className="max-w-2xl bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<FileTextIcon className="h-5 w-5 text-primary" />
							Goods Receipt Note (GRN) Summary
						</DialogTitle>
						<DialogDescription>
							Inbound receipt record for PO #{detailsPO?.id} —{" "}
							<span className="font-mono font-bold text-slate-800 dark:text-slate-200">
								{detailsPO?.grn_number || "GRN Assigned"}
							</span>
						</DialogDescription>
					</DialogHeader>

					{loadingDetails ? (
						<div className="flex justify-center py-10">
							<Loader2Icon className="h-6 w-6 animate-spin text-primary" />
						</div>
					) : (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
								<div>
									<p className="text-[11px] text-muted-foreground">
										Supplier Partner
									</p>
									<p className="font-bold text-xs">
										{detailsPO?.supplier_name || "N/A"}
									</p>
								</div>
								<div>
									<p className="text-[11px] text-muted-foreground">
										Receipt Date
									</p>
									<p className="font-bold text-xs">
										{detailsPO?.created_at
											? new Date(detailsPO.created_at).toLocaleDateString()
											: "N/A"}
									</p>
								</div>
								<div>
									<p className="text-[11px] text-muted-foreground">
										Total Invoice Amount
									</p>
									<p className="font-bold text-emerald-700 text-xs dark:text-emerald-400">
										₹{Number(detailsPO?.total_amount).toFixed(2)}
									</p>
								</div>
							</div>

							<div className="max-h-[250px] overflow-y-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/40">
											<TableHead>Product Line</TableHead>
											<TableHead>Unit Price</TableHead>
											<TableHead>Received Qty</TableHead>
											<TableHead className="text-right">Line Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{detailsItems.map((item) => (
											<TableRow key={item.product_id}>
												<TableCell className="font-semibold text-xs">
													{item.product_name}
												</TableCell>
												<TableCell className="text-xs">
													₹{Number(item.price).toFixed(2)}
												</TableCell>
												<TableCell className="font-bold text-xs">
													{item.quantity} units
												</TableCell>
												<TableCell className="text-right font-bold text-xs">
													₹{(item.quantity * Number(item.price)).toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsDetailsModalOpen(false)}
						>
							Close
						</Button>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									window.print();
								}}
								className="gap-1 text-xs"
							>
								<PrinterIcon className="h-3.5 w-3.5" /> Print Receipt
							</Button>
							<Link href="/dashboard/warehouse/put-away">
								<Button size="sm" className="gap-1 text-xs">
									Go to Put-Away Queue <ChevronRightIcon className="h-3.5 w-3.5" />
								</Button>
							</Link>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
