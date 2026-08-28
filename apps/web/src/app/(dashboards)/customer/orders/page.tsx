"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Header,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ActivityIcon,
	CheckCircle2Icon,
	SearchIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CustomerOrdersPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: orders, isLoading, error } = trpc.customer.getOrders.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading orders
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						My Orders
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View all your orders
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Customer Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/customer">
							<UserIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
				</div>
			</div>

			{!orders || orders.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No orders found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHeader className="text-left">Order #</TableHeader>
								<TableHeader className="text-left">Date</TableHeader>
								<TableHeader className="text-left">Items</TableHeader>
								<TableHeader className="text-left">Total</TableHeader>
								<TableHeader className="text-left">Status</TableHeader>
								<TableHeader className="text-left">Actions</TableHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => (
								<TableRow key={order.id}>
									<TableCell>#{order.id}</TableCell>
									<TableCell>{order.date}</TableCell>
									<TableCell>{order.items}</TableCell>
									<TableCell>
										{formatCurrency(Number(order.total), locale)}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${order.status === "delivered" ? "bg-green-100 text-green-800" : order.status === "shipped" ? "bg-blue-100 text-blue-800" : order.status === "processing" ? "bg-yellow-100 text-yellow-800" : order.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
										>
											{order.status.charAt(0).toUpperCase() +
												order.status.slice(1)}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View order ${order.id}`)}
										>
											<SearchIcon className="mr-1 h-3 w-3" /> View
										</Button>
										{order.status !== "delivered" &&
											order.status !== "cancelled" && (
												<Button
													variant="outline"
													size="xs"
													onClick={() => alert(`Cancel order ${order.id}`)}
												>
													<ActivityIcon className="mr-1 h-3 w-3" /> Cancel
												</Button>
											)}
										{order.status === "delivered" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() =>
													alert(`Return items for order ${order.id}`)
												}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Return
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</PageTransition>
	);
}
