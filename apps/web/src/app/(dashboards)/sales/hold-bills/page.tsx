"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import { PlayCircleIcon, RefreshCcwIcon, TrashIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

type Order = {
	id: number;
	customer: { name: string | null } | null;
	total_amount: string;
	created_at: Date | null;
	status: string | null;
};

export default function HoldBillsPage() {
	const locale = useLocale();
	const router = useRouter();
	const utils = trpc.useUtils();

	const { data: orders, isLoading } = trpc.orders.list.useQuery();
	const deleteMutation = trpc.orders.delete.useMutation({
		onSuccess: () => {
			toast.success("Hold bill deleted successfully.");
			utils.orders.list.invalidate();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const suspendedOrders = (orders ?? []).filter((o) => o.status === "suspended");

	const handleResume = (id: number) => {
		toast.info("Resuming hold bill...");
		// Currently POS doesn't support resuming directly via URL yet, 
		// but we can route them or open it. For now we will just show a toast or redirect to POS.
		router.push(`/sales/pos?resume=${id}`);
	};

	const handleDelete = (id: number) => {
		if (window.confirm("Are you sure you want to delete this hold bill?")) {
			deleteMutation.mutate({ id });
		}
	};

	const columns: Column<Order>[] = [
		{
			key: "id",
			header: "Bill ID",
			sortable: true,
			className: "font-medium",
		},
		{ key: "customer", header: "Customer", sortable: true, render: (row) => row.customer?.name || "Walk-in" },
		{
			key: "amount",
			header: "Total Amount",
			sortable: true,
			render: (row) => formatCurrency(Number(row.total_amount), locale),
		},
		{
			key: "created_at",
			header: "Date Held",
			sortable: true,
			render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-",
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => (
				<TableActions>
					<TableActionButton
						icon={<PlayCircleIcon className="h-4 w-4" />}
						label="Resume Bill"
						onClick={() => handleResume(row.id)}
					/>
					<TableActionButton
						icon={<TrashIcon className="h-4 w-4 text-red-500" />}
						label="Delete Bill"
						onClick={() => handleDelete(row.id)}
					/>
				</TableActions>
			),
		},
	];

	return (
		<PageTransition className="flex flex-col gap-6 p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Hold Bills</h1>
					<p className="text-muted-foreground text-sm">
						View and manage bills that were put on hold.
					</p>
				</div>
			</div>

			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
									<RefreshCcwIcon className="h-6 w-6 text-amber-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Suspended Bills
									</p>
									<h3 className="font-bold text-2xl">{suspendedOrders.length}</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<Card className="flex flex-col gap-4 border-border/50 bg-card/50 p-3 shadow-sm sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<h2 className="text-lg font-semibold">Active Hold Bills</h2>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={suspendedOrders as any}
						columns={columns as any}
						isLoading={isLoading}
						emptyMessage="No hold bills found."
						emptyIcon={<RefreshCcwIcon className="h-8 w-8" />}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
