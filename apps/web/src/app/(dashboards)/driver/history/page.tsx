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
import { ActivityIcon, ClockIcon, TruckIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverHistoryPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: deliveryHistory,
		isLoading,
		error,
	} = trpc.driver.getDeliveryHistory.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading delivery history
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Delivery History
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Past deliveries and performance
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Driver Activities
					</Button>
				</div>
			</div>

			{!deliveryHistory || deliveryHistory.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No delivery history found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHeader className="text-left">Date</TableHeader>
								<TableHeader className="text-left">Customer</TableHeader>
								<TableHeader className="text-left">Order</TableHeader>
								<TableHeader className="text-left">Status</TableHeader>
								<TableHeader className="text-left">
									Amount Collected
								</TableHeader>
								<TableHeader className="text-left">Actions</TableHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{deliveryHistory.map((delivery) => (
								<TableRow key={delivery.id}>
									<TableCell>{delivery.date}</TableCell>
									<TableCell>{delivery.customerName}</TableCell>
									<TableCell>{delivery.orderId}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${delivery.status === "delivered" ? "bg-green-100 text-green-800" : delivery.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
										>
											{delivery.status}
										</span>
									</TableCell>
									<TableCell>
										{formatCurrency(delivery.amountCollected, locale)}
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										{delivery.status === "failed" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() =>
													alert(`View failure reason ${delivery.id}`)
												}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> View Details
											</Button>
										)}
										{delivery.status === "delivered" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() =>
													alert(`View proof of delivery ${delivery.id}`)
												}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> View PoD
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
