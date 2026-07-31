"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";

export default function OrdersPage() {
	const { data, isLoading } = trpc.orders.getAll.useQuery();

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pb-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sales Orders</h1>
					<p className="mt-1 text-muted-foreground">
						Manage and view all your sales orders.
					</p>
				</div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<Card>
					<CardHeader>
						<CardTitle>Orders List</CardTitle>
						<CardDescription>All recent orders</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex justify-center p-8">
								<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
							</div>
						) : (
							<div className="text-sm">
								{data && data.length > 0 ? (
									<div className="space-y-4">
										{data.slice(0, 10).map((order: any) => (
											<div
												key={order.id}
												className="flex items-center justify-between rounded-md border p-4"
											>
												<div>
													<p className="font-semibold">Order #{order.id}</p>
													<p className="text-muted-foreground">
														{new Date(order.createdAt).toLocaleDateString()}
													</p>
												</div>
												<div className="font-medium">
													${Number(order.total).toFixed(2)}
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="py-8 text-center text-muted-foreground">
										No orders found.
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
