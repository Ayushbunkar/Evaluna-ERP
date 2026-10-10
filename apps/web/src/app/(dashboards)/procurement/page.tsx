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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	BarChart3Icon,
	BoxesIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	ClockIcon,
	FileTextIcon,
	IndianRupeeIcon,
	PlusIcon,
	ReceiptIcon,
	TrendingUpIcon,
	TruckIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ProcurementDashboardOverview() {
	const trpc = useTRPC();

	// Queries
	const { data: pos, isLoading: posLoading } =
		trpc.warehouse.getReceivingPOs.useQuery();
	const { data: suppliersList, isLoading: suppliersLoading } =
		trpc.suppliers.list.useQuery();
	const { data: invData, isLoading: invLoading } = trpc.inventory.list.useQuery(
		{ limit: 100 },
	);
	const { data: procKpis } = trpc.procurement.getProcurementKpis.useQuery();

	// Calculate dynamic KPIs from DB
	const activeSuppliersCount = procKpis?.activeSuppliers ?? (suppliersList?.length || 0);
	const openPOsCount = procKpis?.pendingApproval ?? (pos?.filter((p) => p.status === "pending").length || 0);
	const receivedPOsCount = pos?.filter((p) => p.status === "completed" || p.status === "received").length || 0;
	const totalSpend =
		procKpis?.totalSpend ??
		(pos?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0);
	const totalOutstandingBalance =
		procKpis?.totalOutstanding ??
		(suppliersList?.reduce(
			(acc, curr) => acc + Number(curr.outstanding_balance || 0),
			0,
		) || 0);

	// Filter low stock items requiring immediate procurement
	const lowStockItems =
		invData?.items?.filter(
			(item) => item.status === "low_stock" || item.qty_on_hand <= 5,
		) || [];

	const kpis = [
		{
			title: "Total Purchase Spend",
			value: `₹${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			desc: "Accumulated procurement volume",
			icon: TrendingUpIcon,
			color: "border-l-blue-500",
			badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
			iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
		},
		{
			title: "Open Purchase Orders",
			value: openPOsCount,
			desc: "Active inbound shipments",
			icon: TruckIcon,
			color: "border-l-amber-500",
			badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
			iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
		},
		{
			title: "Pending Purchase Requests",
			value: procKpis?.pendingPRs ?? 0,
			desc: "Requisitions awaiting approval",
			icon: ClipboardListIcon,
			color: "border-l-purple-500",
			badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
			iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
		},
		{
			title: "Outstanding Payables",
			value: `₹${totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			desc: "Due on supplier invoices",
			icon: IndianRupeeIcon,
			color: "border-l-rose-500",
			badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
			iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
		},
	];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Top Header Card */}
			<div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xs backdrop-blur-md transition-all">
				<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="border-primary/20 bg-primary/10 font-bold text-[10px] text-primary uppercase tracking-wider"
							>
								Enterprise Procurement Suite
							</Badge>
							<Badge
								variant="outline"
								className="border-emerald-500/20 bg-emerald-500/10 font-semibold text-[10px] text-emerald-600 dark:text-emerald-400"
							>
								Live 3-Way Matched
							</Badge>
						</div>
						<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
							Procurement & Payables Hub
						</h1>
						<p className="max-w-2xl text-muted-foreground text-sm">
							Unified purchase requisitions, orders, dock receiving, 3-way matching, and finance settlements in one end-to-end ERP flow.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							asChild
							className="h-9 border-border/80 bg-background/50 font-semibold text-xs shadow-xs hover:bg-muted"
						>
							<Link href="/procurement/requests">
								<ClipboardListIcon className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
								Requests ({procKpis?.pendingPRs ?? 0})
							</Link>
						</Button>
						<Button
							variant="outline"
							size="sm"
							asChild
							className="h-9 border-border/80 bg-background/50 font-semibold text-xs shadow-xs hover:bg-muted"
						>
							<Link href="/procurement/invoices">
								<ReceiptIcon className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
								Supplier Bills
							</Link>
						</Button>
						<Button
							variant="outline"
							size="sm"
							asChild
							className="h-9 border-border/80 bg-background/50 font-semibold text-xs shadow-xs hover:bg-muted"
						>
							<Link href="/procurement/incoming">
								<TruckIcon className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
								Dock Receiving
							</Link>
						</Button>
						<Button
							size="sm"
							asChild
							className="h-9 bg-primary font-bold text-primary-foreground text-xs shadow-sm hover:bg-primary/90"
						>
							<Link href="/procurement/purchase-orders">
								<PlusIcon className="mr-1.5 h-4 w-4" />
								New Purchase Order
							</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* KPIs Grid */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				{kpis.map((kpi, idx) => {
					const Icon = kpi.icon;
					return (
						<StaggerItem key={idx}>
							<AnimatedCard>
								<Card
									className={`border-l-4 ${kpi.color} border-border/60 bg-card/90 shadow-xs backdrop-blur-md transition-all hover:border-border hover:shadow-md`}
								>
									<CardHeader className="flex flex-row items-center justify-between pb-2">
										<CardTitle className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
											{kpi.title}
										</CardTitle>
										<div className={`rounded-xl p-2 ${kpi.iconBg}`}>
											<Icon className="h-4 w-4" />
										</div>
									</CardHeader>
									<CardContent>
										<div className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
											{posLoading || suppliersLoading ? "..." : kpi.value}
										</div>
										<p className="mt-1 text-[11px] text-muted-foreground">
											{kpi.desc}
										</p>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>
					);
				})}
			</StaggerList>

			{/* Two-Column Main Area */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column: Low Stock Procurement Advisor */}
				<div className="space-y-6 lg:col-span-2">
					<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
						<CardHeader className="flex flex-row items-center justify-between border-border/60 border-b pb-4">
							<div>
								<CardTitle className="font-bold text-base text-foreground">
									Low-Stock Procurement Advisor
								</CardTitle>
								<CardDescription className="text-muted-foreground text-xs">
									Inventory materials falling below reorder safety thresholds. Order replenishment to avoid stockouts.
								</CardDescription>
							</div>
							<Badge
								variant="outline"
								className="border-rose-500/30 bg-rose-500/10 font-bold text-rose-600 text-xs dark:text-rose-400"
							>
								{lowStockItems.length} Warnings
							</Badge>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-border/60 bg-muted/30">
											<TableHead className="font-semibold text-muted-foreground text-xs">Product Material</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">SKU</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">Current Stock</TableHead>
											<TableHead className="font-semibold text-muted-foreground text-xs">Reorder Level</TableHead>
											<TableHead className="text-right font-semibold text-muted-foreground text-xs">Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{lowStockItems.map((item) => (
											<TableRow key={item.id} className="border-border/40 hover:bg-muted/40 transition-colors">
												<TableCell className="font-bold text-foreground text-xs">
													{item.product}
												</TableCell>
												<TableCell className="font-mono text-muted-foreground text-xs">
													{item.sku}
												</TableCell>
												<TableCell className="font-bold text-rose-600 text-xs dark:text-rose-400">
													{item.qty_on_hand} units
												</TableCell>
												<TableCell className="font-semibold text-muted-foreground text-xs">
													{item.reorder_level} units
												</TableCell>
												<TableCell className="text-right">
													<Button size="sm" variant="outline" asChild className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10">
														<Link href="/procurement/purchase-orders">
															Replenish
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										))}
										{lowStockItems.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={5}
													className="py-12 text-center text-muted-foreground"
												>
													<BoxesIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
													<p className="font-semibold text-sm">
														All catalog items have healthy inventory levels.
													</p>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Inbound Purchases Overview */}
				<div className="space-y-6">
					<Card className="border-border/60 bg-card/90 shadow-xs backdrop-blur-md">
						<CardHeader className="border-border/60 border-b pb-3">
							<CardTitle className="font-bold text-foreground text-sm">
								Inbound Purchase Tracking
							</CardTitle>
							<CardDescription className="text-muted-foreground text-xs">
								Dock receiving status and order lifecycle progression
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							<div className="flex items-center justify-between border-border/40 border-b pb-2 text-xs">
								<span className="text-muted-foreground">Completed / Received Purchases</span>
								<span className="font-bold text-emerald-600 dark:text-emerald-400">
									{receivedPOsCount} POs
								</span>
							</div>
							<div className="flex items-center justify-between border-border/40 border-b pb-2 text-xs">
								<span className="text-muted-foreground">Pending Expected Deliveries</span>
								<span className="font-bold text-amber-600 dark:text-amber-400">
									{openPOsCount} POs
								</span>
							</div>

							{openPOsCount > 0 ? (
								<div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-amber-800 dark:text-amber-300">
									<AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
									<div className="space-y-1">
										<h5 className="font-bold text-xs">
											Pending Dock Inspections (GRN)
										</h5>
										<p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/80">
											{openPOsCount} purchase orders are awaiting physical receiving and quality checks at warehouse docks.
										</p>
									</div>
								</div>
							) : (
								<div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-800 dark:text-emerald-300">
									<CheckCircle2Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
									<div className="space-y-1">
										<h5 className="font-bold text-xs">
											Dock Receiving Up to Date
										</h5>
										<p className="text-[11px] leading-relaxed text-emerald-700/90 dark:text-emerald-300/80">
											All purchase order deliveries have been inspected and receipt notes generated.
										</p>
									</div>
								</div>
							)}

							<div className="pt-2">
								<Button variant="outline" size="sm" asChild className="w-full text-xs font-semibold">
									<Link href="/procurement/incoming">
										Open Receiving Console
										<ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
