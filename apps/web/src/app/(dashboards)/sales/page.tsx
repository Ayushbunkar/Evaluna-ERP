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
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "next-intl";

export default function SalesDashboard() {
	const trpc = useTRPC();
	const locale = useLocale();
	const { data: orders } = trpc.orders.list.useQuery();
	
	const recentOrders = orders?.slice(0, 5) || [];
	const dailyGoal = 50000;
	const todaySales = orders?.reduce((acc, order) => {
		if (new Date(order.created_at || new Date()).toDateString() === new Date().toDateString()) {
			return acc + Number(order.total_amount || 0);
		}
		return acc;
	}, 0) || 0;
	
	const progress = Math.min(Math.round((todaySales / dailyGoal) * 100), 100);

	return (
		<PageTransition className="grid min-w-0 flex-1 items-start gap-6">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-2xl text-foreground tracking-tight">
						Sales Dashboard
					</h1>
					<p className="text-muted-foreground text-sm">
						Welcome back. Start a new sale or manage recent orders.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" className="shadow-sm">
						<SearchIcon className="mr-2 h-4 w-4" /> Lookup Order
					</Button>
					<Button className="shadow-sm" asChild>
						<Link href="/sales/pos">
							<ShoppingCart className="mr-2 h-4 w-4" /> Open POS
						</Link>
					</Button>
				</div>
			</div>

			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card
							className="group cursor-pointer border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
							onClick={() => (window.location.href = "/sales/pos")}
						>
							<CardContent className="p-6">
								<div className="flex flex-col items-center gap-2 text-center">
									<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
										<ShoppingCart className="h-6 w-6 text-primary" />
									</div>
									<h3 className="font-semibold text-lg">Point of Sale</h3>
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

			<div className="mt-4 grid gap-6 md:grid-cols-2">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<div className="space-y-1">
								<CardTitle>Recent Sales</CardTitle>
								<CardDescription>Latest transactions processed</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/sales/orders">
									View All <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-4">
								{recentOrders.length > 0 ? (
									recentOrders.map((order) => (
										<div key={order.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
											<div>
												<p className="font-medium text-sm">Order #{order.id}</p>
												<p className="text-muted-foreground text-xs">{order.customer?.name || "Walk-in Customer"}</p>
											</div>
											<div className="text-right">
												<p className="font-bold text-sm">{formatCurrency(Number(order.total_amount), locale)}</p>
												<p className="text-emerald-600 text-xs capitalize">{order.status}</p>
											</div>
										</div>
									))
								) : (
									<div className="flex h-[150px] items-center justify-center text-muted-foreground text-sm">
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
							<CardTitle>Daily Goal</CardTitle>
							<CardDescription>
								Track your sales target for today
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex h-[200px] flex-col items-center justify-center gap-4 text-center">
								<div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-primary/20">
									<span className="font-bold text-2xl text-foreground">{progress}%</span>
									<div 
										className="absolute inset-0 rounded-full border-8 border-primary transition-all duration-1000" 
										style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)` }}
									/>
								</div>
								<p className="text-muted-foreground text-sm">
									Today's Sales: {formatCurrency(todaySales, locale)} / {formatCurrency(dailyGoal, locale)}
								</p>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>
		</PageTransition>
	);
}
