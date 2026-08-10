"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { motion } from "framer-motion";
import {
	AlertCircleIcon,
	CheckCircleIcon,
	ClockIcon,
	PlusIcon,
	ShoppingBagIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const statusBadge = (status: string | null) => {
	const s = status?.toLowerCase() ?? "unpaid";
	if (s === "paid") return <Badge variant="default">Paid</Badge>;
	if (s === "partial") return <Badge variant="secondary">Partial</Badge>;
	return <Badge variant="outline">Unpaid</Badge>;
};

export default function PurchasesPage() {
	const { data, isLoading } = trpc.purchases.list.useQuery({ limit: 50 });

	const items = data?.items ?? [];
	const total = items.reduce(
		(acc, p) => acc + Number.parseFloat(p.total_amount ?? "0"),
		0,
	);
	const paid = items.filter((p) => p.payment_status === "paid");
	const unpaid = items.filter((p) => p.payment_status === "unpaid");
	const partial = items.filter((p) => p.payment_status === "partial");

	const kpis = [
		{
			label: "Total Purchases",
			value: `₹${total.toLocaleString("en-IN")}`,
			icon: ShoppingBagIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
		{
			label: "Paid",
			value: paid.length.toString(),
			icon: CheckCircleIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
		{
			label: "Unpaid",
			value: unpaid.length.toString(),
			icon: AlertCircleIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
		{
			label: "Partial",
			value: partial.length.toString(),
			icon: ClockIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
	];

	return (
		<motion.div
			className="space-y-6 p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Purchases</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Manage all purchase orders and GRNs
					</p>
				</div>
				<Link href="/admin/purchases/create">
					<Button className="gap-2">
						<PlusIcon className="h-4 w-4" />
						New Purchase
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{kpis.map((kpi, i) => (
					<motion.div
						key={kpi.label}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.07 }}
					>
						<Card className="border-0 shadow-sm">
							<CardContent className="pt-6">
								<div className="flex items-center gap-3">
									<div className={`${kpi.bg} rounded-lg p-2`}>
										<kpi.icon className={`h-5 w-5 ${kpi.color}`} />
									</div>
									<div>
										<p className="text-muted-foreground text-sm">{kpi.label}</p>
										{isLoading ? (
											<Skeleton className="mt-1 h-6 w-20" />
										) : (
											<p className="font-bold text-xl">{kpi.value}</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>

			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TruckIcon className="h-5 w-5 text-muted-foreground" />
						Purchase Orders
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(6)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>GRN No</TableHead>
									<TableHead>Supplier</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Total Amount</TableHead>
									<TableHead>Amount Paid</TableHead>
									<TableHead>Payment Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="py-10 text-center text-muted-foreground"
										>
											No purchases found. Create your first purchase order.
										</TableCell>
									</TableRow>
								) : (
									items.map((purchase) => (
										<TableRow
											key={purchase.id}
											className="transition-colors hover:bg-muted/30"
										>
											<TableCell className="font-medium font-mono">
												{purchase.grn_number ?? `PO-${purchase.id}`}
											</TableCell>
											<TableCell>
												{(purchase as any).supplier?.name ?? "—"}
											</TableCell>
											<TableCell>
												{purchase.created_at
													? new Date(purchase.created_at).toLocaleDateString(
															"en-IN",
														)
													: "—"}
											</TableCell>
											<TableCell className="font-semibold">
												₹
												{Number.parseFloat(
													purchase.total_amount ?? "0",
												).toLocaleString("en-IN")}
											</TableCell>
											<TableCell>
												₹
												{Number.parseFloat(
													purchase.amount_paid ?? "0",
												).toLocaleString("en-IN")}
											</TableCell>
											<TableCell>
												{statusBadge(purchase.payment_status)}
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													<Link href={`/admin/purchases/${purchase.id}/return`}>
														<Button size="sm" variant="outline">
															Return
														</Button>
													</Link>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
