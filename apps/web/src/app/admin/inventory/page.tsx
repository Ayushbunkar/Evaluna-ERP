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
import { motion } from "framer-motion";
import {
	AlertCircle,
	AlertTriangle,
	ArrowRightLeft,
	Filter,
	Package,
	Plus,
	Search,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function InventoryPage() {
	const { data: inventoryData, isLoading } = trpc.inventory.list.useQuery({});

	const items = inventoryData?.items || [];

	const lowStockCount = items.filter((i) => i.status === "low_stock").length;
	const outOfStockCount = items.filter(
		(i) => i.status === "out_of_stock",
	).length;

	return (
		<div className="mx-auto max-w-7xl space-y-8 p-8">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight dark:text-white">
						Inventory Management
					</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400">
						Track stock levels across all branches
					</p>
				</div>
				<div className="flex gap-3">
					<Button variant="outline" className="shadow-sm">
						<ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Stock
					</Button>
					<Button className="bg-primary text-white shadow-sm hover:bg-primary/90">
						<Plus className="mr-2 h-4 w-4" /> Receive Items
					</Button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
				<Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Total Unique SKUs
						</CardTitle>
						<Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? <Skeleton className="h-8 w-16" /> : items.length}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-yellow-50 to-amber-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Low Stock Alerts
						</CardTitle>
						<AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? <Skeleton className="h-8 w-16" /> : lowStockCount}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-red-50 to-rose-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Out of Stock
						</CardTitle>
						<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? <Skeleton className="h-8 w-16" /> : outOfStockCount}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Total Stock Value
						</CardTitle>
						<span className="flex h-5 w-5 items-center justify-center font-bold text-green-600 text-lg dark:text-green-400">
							₹
						</span>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? <Skeleton className="h-8 w-16" /> : "1.2M"}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Data Table */}
			<Card className="border-gray-200 shadow-sm dark:border-gray-800">
				<CardHeader className="border-gray-100 border-b pb-4 dark:border-gray-800">
					<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
						<CardTitle className="text-lg">Current Stock Levels</CardTitle>
						<div className="flex w-full gap-2 sm:w-auto">
							<div className="relative flex-1 sm:w-64">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
								<input
									type="text"
									placeholder="Search SKU or product..."
									className="w-full rounded-md border border-gray-200 py-2 pr-4 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900"
								/>
							</div>
							<Button variant="outline" size="icon">
								<Filter className="h-4 w-4 text-gray-500" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead className="border-gray-200 border-b bg-gray-50 font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
								<tr>
									<th className="px-6 py-4">Product Info</th>
									<th className="px-6 py-4">Branch Location</th>
									<th className="px-6 py-4 text-right">Qty on Hand</th>
									<th className="px-6 py-4 text-right">Reorder Level</th>
									<th className="px-6 py-4 text-center">Status</th>
									<th className="px-6 py-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 dark:divide-gray-800">
								{isLoading
									? Array(5)
											.fill(0)
											.map((_, i) => (
												<tr key={i}>
													<td className="px-6 py-4">
														<Skeleton className="h-10 w-48" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="h-6 w-32" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="mx-auto h-6 w-20" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
												</tr>
											))
									: items.map((item, i) => (
											<motion.tr
												key={item.id}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: i * 0.05 }}
												className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
											>
												<td className="px-6 py-4">
													<div className="font-medium text-gray-900 dark:text-gray-100">
														{item.product}
													</div>
													<div className="mt-1 font-mono text-gray-500 text-xs">
														{item.sku}
													</div>
												</td>
												<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
													{item.branch}
												</td>
												<td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
													{item.qty_on_hand}
												</td>
												<td className="px-6 py-4 text-right text-gray-500">
													{item.reorder_level}
												</td>
												<td className="px-6 py-4 text-center">
													<Badge
														variant="outline"
														className={
															item.status === "in_stock"
																? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
																: item.status === "low_stock"
																	? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
																	: "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
														}
													>
														{item.status.replace("_", " ").toUpperCase()}
													</Badge>
												</td>
												<td className="px-6 py-4 text-right">
													<Button
														variant="ghost"
														size="sm"
														className="h-8 font-medium text-blue-600 text-xs hover:bg-blue-50 hover:text-blue-700"
													>
														Update Qty
													</Button>
												</td>
											</motion.tr>
										))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
