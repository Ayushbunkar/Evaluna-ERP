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
	IndianRupeeIcon,
	PackageIcon,
	PlusIcon,
	ShoppingCartIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const statusBadge = (status: string | null | undefined) => {
	if (status === "completed" || status === "delivered")
		return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
	if (status === "cancelled")
		return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
	if (status === "processing")
		return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
	return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
};

export default function SalesPage() {
	const { data: orders, isLoading } = trpc.orders.list.useQuery();

	const items = Array.isArray(orders) ? orders : [];
	const total = items.reduce(
		(acc, o) => acc + Number.parseFloat(o.total_amount ?? "0"),
		0,
	);
	const avg = items.length > 0 ? total / items.length : 0;
	const completed = items.filter(
		(o) => o.status === "completed" || o.status === "delivered",
	);

	const kpis = [
		{
			label: "Total Orders",
			value: items.length.toString(),
			icon: ShoppingCartIcon,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			label: "Total Revenue",
			value: `₹${total.toLocaleString("en-IN")}`,
			icon: IndianRupeeIcon,
			color: "text-green-600",
			bg: "bg-green-50",
		},
		{
			label: "Avg. Order Value",
			value: `₹${avg.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
			icon: TrendingUpIcon,
			color: "text-purple-600",
			bg: "bg-purple-50",
		},
		{
			label: "Completed",
			value: completed.length.toString(),
			icon: PackageIcon,
			color: "text-teal-600",
			bg: "bg-teal-50",
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
					<h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-bold text-3xl text-transparent">
						Sales
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Track all sales orders and revenue
					</p>
				</div>
				<Link href="/admin/pos">
					<Button className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
						<PlusIcon className="h-4 w-4" />
						New Sale (POS)
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
						<ShoppingCartIcon className="h-5 w-5 text-teal-600" />
						Sales Orders
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
									<TableHead>Order ID</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Total Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="py-10 text-center text-muted-foreground"
										>
											No orders found. Create your first sale from POS.
										</TableCell>
									</TableRow>
								) : (
									items.map((order) => (
										<TableRow key={order.id} className="hover:bg-muted/30">
											<TableCell className="font-medium font-mono">
												ORD-{order.id}
											</TableCell>
											<TableCell>
												{order.customer?.name ?? "Walk-in Customer"}
											</TableCell>
											<TableCell>
												{order.created_at
													? new Date(order.created_at).toLocaleDateString(
															"en-IN",
														)
													: "—"}
											</TableCell>
											<TableCell className="font-semibold">
												₹
												{Number.parseFloat(
													order.total_amount ?? "0",
												).toLocaleString("en-IN")}
											</TableCell>
											<TableCell>{statusBadge(order.status)}</TableCell>
											<TableCell>
												<Link href={`/admin/orders/${order.id}`}>
													<Button size="sm" variant="outline">
														View
													</Button>
												</Link>
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
