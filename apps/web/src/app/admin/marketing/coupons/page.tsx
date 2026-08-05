"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";

export default function CouponsPage() {
	const { data, isLoading } = trpc.marketing.listCoupons.useQuery();

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pb-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Coupons</h1>
					<p className="mt-1 text-muted-foreground">
						Manage discount coupons and promotional codes.
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
						<CardTitle>All Coupons</CardTitle>
						<CardDescription>Active and expired coupons</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-6">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<Skeleton className="h-32 w-full rounded-xl" />
									<Skeleton className="h-32 w-full rounded-xl" />
									<Skeleton className="h-32 w-full rounded-xl" />
									<Skeleton className="h-32 w-full rounded-xl" />
								</div>
								<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
									<Skeleton className="h-64 w-full rounded-xl" />
									<Skeleton className="h-64 w-full rounded-xl" />
								</div>
							</div>
						) : (
							<div className="text-sm">
								{data && data.length > 0 ? (
									<div className="space-y-4">
										{data.map((coupon: any) => (
											<div
												key={coupon.id}
												className="flex items-center justify-between rounded-md border p-4"
											>
												<div>
													<p className="font-semibold text-lg">{coupon.code}</p>
													<p className="text-muted-foreground">
														{coupon.description}
													</p>
												</div>
												<div className="flex items-center gap-4">
													<span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary text-xs">
														{coupon.discount}% OFF
													</span>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="py-8 text-center text-muted-foreground">
										No coupons available.
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
