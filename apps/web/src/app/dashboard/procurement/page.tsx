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
	BoxesIcon,
	ClipboardListIcon,
	InfoIcon,
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

	// Calculate dynamic KPIs from DB
	const activeSuppliersCount = suppliersList?.length || 0;
	const openPOsCount = pos?.filter((p) => p.status === "pending").length || 0;
	const receivedPOsCount =
		pos?.filter((p) => p.status === "received" || p.status === "completed")
			.length || 0;

	const totalSpend =
		pos?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
	const totalOutstandingBalance =
		suppliersList?.reduce(
			(acc, curr) => acc + Number(curr.outstanding_balance || 0),
			0,
		) || 0;

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
			iconColor: "text-blue-500",
		},
		{
			title: "Open Purchase Orders",
			value: openPOsCount,
			desc: "Expected inbound PO shipments",
			icon: TruckIcon,
			color: "border-l-yellow-500",
			iconColor: "text-yellow-500",
		},
		{
			title: "Outstanding Balance",
			value: `₹${totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			desc: "Due to suppliers ledger",
			icon: ClipboardListIcon,
			color: "border-l-red-500",
			iconColor: "text-red-500",
		},
		{
			title: "Active Suppliers",
			value: activeSuppliersCount,
			desc: "Partners in directory",
			icon: UsersIcon,
			color: "border-l-green-500",
			iconColor: "text-green-500",
		},
	];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			{/* Supervisor banner */}
			<div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center dark:bg-slate-800">
				<div className="space-y-1">
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Procurement & Suppliers Dashboard
					</h2>
					<p className="text-muted-foreground text-sm">
						Manage bulk purchases, supplier outstanding balances, low stock
						reorders, and procurement trends.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="border-blue-200 bg-blue-50 text-blue-700"
					>
						Role: Procurement Manager
					</Badge>
				</div>
			</div>

			{/* KPIs Row */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				{kpis.map((kpi, idx) => {
					const Icon = kpi.icon;
					return (
						<StaggerItem key={idx}>
							<AnimatedCard>
								<Card
									className={`border-l-4 ${kpi.color} bg-white shadow-sm dark:bg-slate-800`}
								>
									<CardHeader className="flex flex-row items-center justify-between pb-2">
										<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											{kpi.title}
										</CardTitle>
										<Icon className={`h-4 w-4 ${kpi.iconColor}`} />
									</CardHeader>
									<CardContent>
										<div className="font-bold text-slate-900 text-xl sm:text-2xl dark:text-slate-100">
											{posLoading || suppliersLoading ? "..." : kpi.value}
										</div>
										<p className="mt-1 text-[10px] text-muted-foreground">
											{kpi.desc}
										</p>
									</CardContent>
								</Card>
							</AnimatedCard>
						</StaggerItem>
					);
				})}
			</StaggerList>

			{/* Two-Column Workspace */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column: Low Stock Procurement Advisor */}
				<div className="space-y-6 lg:col-span-2">
					<Card className="shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between border-b pb-4">
							<div>
								<CardTitle className="font-bold text-base">
									Low-Stock Procurement Advisor
								</CardTitle>
								<CardDescription>
									Live catalog lines falling below reorder thresholds. Order
									replenishment immediately.
								</CardDescription>
							</div>
							<Badge variant="destructive" className="animate-pulse">
								{lowStockItems.length} Warnings
							</Badge>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product Material</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Current Stock</TableHead>
										<TableHead>Reorder Level</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{lowStockItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-bold text-xs">
												{item.product}
											</TableCell>
											<TableCell className="font-semibold text-slate-500 text-xs">
												{item.sku}
											</TableCell>
											<TableCell className="font-bold text-red-600 text-xs">
												{item.qty_on_hand} units
											</TableCell>
											<TableCell className="font-semibold text-xs">
												{item.reorder_level} units
											</TableCell>
											<TableCell className="text-right">
												<Button size="sm" asChild>
													<Link href="/dashboard/procurement/purchase-orders">
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
												<BoxesIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
												<p className="font-bold text-sm">
													No products currently require replenishment.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Inbound Purchases Overview */}
				<div className="space-y-6">
					<Card className="shadow-sm">
						<CardHeader className="border-b pb-3">
							<CardTitle className="font-bold text-sm">
								Inbound Purchase Track
							</CardTitle>
							<CardDescription>
								Status and progression of expected procurement lots
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							<div className="flex items-center justify-between border-b pb-2 text-xs">
								<span>Completed / Received Purchases</span>
								<span className="font-bold text-green-600">
									{receivedPOsCount} POs
								</span>
							</div>
							<div className="flex items-center justify-between border-b pb-2 text-xs">
								<span>Pending expected receipts</span>
								<span className="font-bold text-yellow-600">
									{openPOsCount} POs
								</span>
							</div>

							{openPOsCount > 0 && (
								<div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
									<AlertTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
									<div>
										<h5 className="font-bold text-amber-800 text-xs">
											Pending Goods Received Note (GRN)
										</h5>
										<p className="mt-1 text-[11px] text-amber-700">
											{openPOsCount} purchase orders are currently awaiting
											check-in at the dock gates. Ensure coordination with WMS
											team.
										</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
