"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ArrowRightIcon,
	BanknoteIcon,
	ReceiptTextIcon,
	SearchIcon,
	ShoppingCart,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function SalesDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: orders } = trpc.orders.list.useQuery();

	const recentOrders = orders?.slice(0, 5) || [];
	const dailyGoal = 50000;
	const todaySales =
		orders?.reduce((acc, order) => {
			if (
				new Date(order.created_at || new Date()).toDateString() ===
				new Date().toDateString()
			) {
				return acc + Number(order.total_amount || 0);
			}
			return acc;
		}, 0) || 0;

	const progress = Math.min(Math.round((todaySales / dailyGoal) * 100), 100);

	return (
		<PageTransition className="container grid min-w-0 flex-1 items-start gap-4 sm:gap-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Sales Dashboard
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Welcome back. Start a new sale or manage recent orders.
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<SearchIcon className="mr-2 h-4 w-4" /> Lookup Order
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/sales/pos">
							<ShoppingCart className="mr-2 h-4 w-4" /> Open POS
						</Link>
					</Button>
				</div>
			</div>

			<StaggerList
				className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
				slow
			>
				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/sales/pos")}
						>
							<CardContent className="p-4 sm:p-6">
								<div className="flex flex-col items-center gap-1 text-center sm:gap-2">
									<div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110 sm:mb-2 sm:h-12 sm:w-12">
										<ShoppingCart className="h-6 w-6 text-primary" />
									</div>
									<h3 className="font-semibold text-base sm:text-lg">
										Point of Sale
									</h3>
									<p className="text-muted-foreground text-xs">
										Process new transactions
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/sales/orders")}
						>
							<CardContent className="p-6">
								<div className="flex flex-col items-center gap-2 text-center">
									<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 transition-transform group-hover:scale-110">
										<ReceiptTextIcon className="h-6 w-6 text-blue-500" />
									</div>
									<h3 className="font-semibold text-lg">Orders</h3>
									<p className="text-muted-foreground text-xs">
										View past receipts
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/sales/customers")}
						>
							<CardContent className="p-6">
								<div className="flex flex-col items-center gap-2 text-center">
									<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 transition-transform group-hover:scale-110">
										<UsersIcon className="h-6 w-6 text-orange-500" />
									</div>
									<h3 className="font-semibold text-lg">Customers</h3>
									<p className="text-muted-foreground text-xs">
										Manage loyalty and profiles
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/sales/cashbook")}
						>
							<CardContent className="p-6">
								<div className="flex flex-col items-center gap-2 text-center">
									<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 transition-transform group-hover:scale-110">
										<BanknoteIcon className="h-6 w-6 text-emerald-500" />
									</div>
									<h3 className="font-semibold text-lg">Daily Till</h3>
									<p className="text-muted-foreground text-xs">
										Cash drawer operations
									</p>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<div className="mt-3 grid gap-4 sm:mt-4 sm:gap-6 md:grid-cols-2">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Recent Sales
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Latest transactions processed
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/sales/orders">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<div className="flex flex-col gap-3 sm:gap-4">
								{recentOrders.length > 0 ? (
									recentOrders.map((order) => (
										<div
											key={order.id}
											className="flex items-center justify-between border-border/50 border-b pb-1.5 last:border-0 last:pb-0 sm:pb-2"
										>
											<div>
												<p className="font-medium text-xs sm:text-sm">
													Order #{order.id}
												</p>
												<p className="text-muted-foreground text-xs">
													{order.customer?.name || "Walk-in Customer"}
												</p>
											</div>
											<div className="text-right">
												<p className="font-bold text-xs sm:text-sm">
													{formatCurrency(Number(order.total_amount), locale)}
												</p>
												<p className="text-emerald-600 text-xs capitalize">
													{order.status}
												</p>
											</div>
										</div>
									))
								) : (
									<div className="flex h-[120px] items-center justify-center text-muted-foreground text-xs sm:h-[150px] sm:text-sm">
										No recent sales found.
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader>
							<CardTitle className="text-base sm:text-lg">Daily Goal</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Track your sales target for today
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex h-[180px] flex-col items-center justify-center gap-3 text-center sm:h-[200px] sm:gap-4">
								<div className="relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
									<svg
										className="absolute inset-0 h-full w-full -rotate-90 transform"
										viewBox="0 0 100 100"
									>
										<circle
											className="stroke-current text-primary/20"
											strokeWidth="8"
											cx="50"
											cy="50"
											r="40"
											fill="transparent"
										/>
										<circle
											className="stroke-current text-primary transition-all duration-1000 ease-out"
											strokeWidth="8"
											strokeLinecap="round"
											cx="50"
											cy="50"
											r="40"
											fill="transparent"
											strokeDasharray="251.2"
											strokeDashoffset={
												251.2 * (1 - Math.min(progress, 100) / 100)
											}
										/>
									</svg>
									<span className="relative font-bold text-foreground text-xl sm:text-2xl">
										{progress}%
									</span>
								</div>
								<p className="text-muted-foreground text-xs sm:text-sm">
									Today's Sales: {formatCurrency(todaySales, locale)} /{" "}
									{formatCurrency(dailyGoal, locale)}
								</p>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>
		</PageTransition>
	);
}
