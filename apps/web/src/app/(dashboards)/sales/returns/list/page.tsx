"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { EyeIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";

import { trpc } from "@/lib/trpc/client";

type SalesReturn = {
	id: number;
	order_id: number;
	customer: { name: string | null } | null;
	order: { id: number, total_amount: string } | null;
	total_amount: string;
	created_at: Date | null;
	status: string | null;
};

export default function SalesReturnsList() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const locale = useLocale();

	const { data: salesReturns, isLoading } = trpc.salesReturns.list.useQuery();

	const filteredReturns = (salesReturns ?? []).filter((r) => {
		if (statusFilter !== "all" && r.status !== statusFilter) return false;
		const q = searchTerm.toLowerCase();
		return (
			r.id.toString().includes(q) ||
			r.order_id.toString().includes(q) ||
			(r.customer?.name?.toLowerCase() || "").includes(q)
		);
	});

	const columns: Column<SalesReturn>[] = [
		{
			key: "id",
			header: "Return ID",
			sortable: true,
			className: "font-medium",
		},
		{ key: "order_id", header: "Original Order", sortable: true, render: (row) => `#${row.order_id}` },
		{ key: "customer", header: "Customer", sortable: true, render: (row) => row.customer?.name || "N/A" },
		{
			key: "amount",
			header: "Refund Amount",
			sortable: true,
			render: (row) => formatCurrency(Number(row.total_amount), locale),
		},
		{ key: "items", header: "Items", hideOnMobile: true, render: () => "-" },
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row) => (
				<span
					className={`rounded-full px-2.5 py-1 font-medium text-xs capitalize ${row.status === "refunded" || row.status === "processed" ? "bg-emerald-100 text-emerald-700" : ""}
          ${row.status === "pending" ? "bg-amber-100 text-amber-700" : ""}
          ${row.status === "cancelled" ? "bg-red-100 text-red-700" : ""}
        `}
				>
					{row.status}
				</span>
			),
		},
		{
			key: "created_at",
			header: "Date",
			sortable: true,
			hideOnMobile: true,
			render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
		},
		{
			key: "actions",
			header: "Actions",
			render: (_row) => (
				<TableActions>
					<TableActionButton
						icon={<EyeIcon className="h-4 w-4" />}
						label="View Details"
						onClick={() => {}}
					/>
				</TableActions>
			),
		},
	];

	return (
		<PageTransition className="flex flex-col gap-6 p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sales Returns</h1>
					<p className="text-muted-foreground text-sm">
						Manage customer returns and process refunds.
					</p>
				</div>
				<Button
					asChild
					className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
				>
					<Link href="/sales/returns/create">
						<PlusIcon className="mr-2 h-4 w-4" /> New Return
					</Link>
				</Button>
			</div>

			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
									<RefreshCcwIcon className="h-6 w-6 text-blue-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Total Returns
									</p>
									<h3 className="font-bold text-2xl">{salesReturns?.length || 0}</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
									<RefreshCcwIcon className="h-6 w-6 text-amber-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Pending Review
									</p>
									<h3 className="font-bold text-2xl">{salesReturns?.filter(r => r.status?.toLowerCase() === 'pending').length || 0}</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<Card className="flex flex-col gap-4 border-border/50 bg-card/50 p-3 shadow-sm sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search by ID, Order, or Customer..."
						filters={[
							{
								value: statusFilter,
								onChange: setStatusFilter,
								options: [
									{ label: "All Status", value: "all" },
									{ label: "Pending", value: "pending", variant: "warning" },
									{ label: "Approved", value: "approved", variant: "default" },
									{ label: "Refunded", value: "refunded", variant: "success" },
									{ label: "Rejected", value: "rejected", variant: "danger" },
								],
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filteredReturns as any}
						columns={columns as any}
						isLoading={isLoading}
						emptyMessage="No sales returns found matching your filters."
						emptyIcon={<RefreshCcwIcon className="h-8 w-8" />}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
