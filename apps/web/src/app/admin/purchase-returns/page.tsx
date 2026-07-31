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
	CheckCircleIcon,
	ClockIcon,
	IndianRupeeIcon,
	PlusIcon,
	RotateCcwIcon,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const statusBadge = (status: string | null) => {
	if (status === "processed")
		return (
			<Badge className="border-green-200 bg-green-100 text-green-800">
				Processed
			</Badge>
		);
	if (status === "rejected")
		return (
			<Badge className="border-red-200 bg-red-100 text-red-800">Rejected</Badge>
		);
	return (
		<Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
			Pending
		</Badge>
	);
};

export default function PurchaseReturnsPage() {
	const { data: returns, isLoading } = trpc.purchaseReturns.list.useQuery();

	const items = Array.isArray(returns) ? returns : [];
	const total = items.reduce(
		(acc, r) => acc + Number.parseFloat(r.total_amount ?? "0"),
		0,
	);
	const processed = items.filter((r) => r.status === "processed");
	const pending = items.filter(
		(r) => r.status !== "processed" && r.status !== "rejected",
	);

	const kpis = [
		{
			label: "Total Returns",
			value: items.length.toString(),
			icon: RotateCcwIcon,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			label: "Processed",
			value: processed.length.toString(),
			icon: CheckCircleIcon,
			color: "text-green-600",
			bg: "bg-green-50",
		},
		{
			label: "Pending",
			value: pending.length.toString(),
			icon: ClockIcon,
			color: "text-yellow-600",
			bg: "bg-yellow-50",
		},
		{
			label: "Total Refund",
			value: `₹${total.toLocaleString("en-IN")}`,
			icon: IndianRupeeIcon,
			color: "text-purple-600",
			bg: "bg-purple-50",
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
					<h1 className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text font-bold text-3xl text-transparent">
						Purchase Returns
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Track and manage returned goods to suppliers
					</p>
				</div>
				<Link href="/admin/purchase-returns/create">
					<Button className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white">
						<PlusIcon className="h-4 w-4" />
						New Return
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
						<RotateCcwIcon className="h-5 w-5 text-red-500" />
						Return Records
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Return ID</TableHead>
									<TableHead>Purchase ID</TableHead>
									<TableHead>Supplier</TableHead>
									<TableHead>Refund Amount</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="py-10 text-center text-muted-foreground"
										>
											No purchase returns found.
										</TableCell>
									</TableRow>
								) : (
									items.map((r) => (
										<TableRow key={r.id} className="hover:bg-muted/30">
											<TableCell className="font-medium font-mono">
												RET-{r.id}
											</TableCell>
											<TableCell>PO-{r.purchase_id}</TableCell>
											<TableCell>{(r as any).supplier?.name ?? "—"}</TableCell>
											<TableCell className="font-semibold text-red-600">
												₹
												{Number.parseFloat(
													r.total_amount ?? "0",
												).toLocaleString("en-IN")}
											</TableCell>
											<TableCell>
												{r.created_at
													? new Date(r.created_at).toLocaleDateString("en-IN")
													: "—"}
											</TableCell>
											<TableCell>{statusBadge(r.status)}</TableCell>
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
