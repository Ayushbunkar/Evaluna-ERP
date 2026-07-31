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
	Filter,
	Grid3X3,
	Layers,
	Map,
	Maximize,
	Plus,
	Search,
	Settings,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function WarehousePage() {
	const { data: zones, isLoading } = trpc.warehouse.list.useQuery();

	const totalCapacity =
		zones?.reduce((sum, zone) => sum + zone.capacity, 0) || 0;
	const totalUsed = zones?.reduce((sum, zone) => sum + zone.used, 0) || 0;
	const utilization =
		totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

	return (
		<div className="mx-auto max-w-7xl space-y-8 p-8">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight dark:text-white">
						Warehouse Mapping
					</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400">
						Manage zones, racks, and bin locations visually
					</p>
				</div>
				<div className="flex gap-3">
					<Button variant="outline" className="shadow-sm">
						<Maximize className="mr-2 h-4 w-4" /> Layout View
					</Button>
					<Button className="bg-primary text-white shadow-sm hover:bg-primary/90">
						<Plus className="mr-2 h-4 w-4" /> Add Zone
					</Button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
				<Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Total Zones
						</CardTitle>
						<Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								new Set(zones?.map((z) => z.zone)).size || 0
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-purple-50 to-fuchsia-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Total Racks
						</CardTitle>
						<Grid3X3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								zones?.length || 0
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Overall Capacity
						</CardTitle>
						<Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2 font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								<>
									{totalUsed.toLocaleString()}{" "}
									<span className="font-normal text-gray-500 text-sm">
										/ {totalCapacity.toLocaleString()}
									</span>
								</>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Space Utilization
						</CardTitle>
						<span className="font-bold text-green-600 text-sm dark:text-green-400">
							{utilization}%
						</span>
					</CardHeader>
					<CardContent>
						<div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-green-200 dark:bg-green-900/30">
							<motion.div
								className="h-full rounded-full bg-green-500"
								initial={{ width: 0 }}
								animate={{ width: `${utilization}%` }}
								transition={{ duration: 1, ease: "easeOut" }}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Data Table */}
			<Card className="border-gray-200 shadow-sm dark:border-gray-800">
				<CardHeader className="border-gray-100 border-b pb-4 dark:border-gray-800">
					<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
						<CardTitle className="text-lg">Zones & Racks</CardTitle>
						<div className="flex w-full gap-2 sm:w-auto">
							<div className="relative flex-1 sm:w-64">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
								<input
									type="text"
									placeholder="Search zone or rack..."
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
									<th className="px-6 py-4">Zone</th>
									<th className="px-6 py-4">Rack ID</th>
									<th className="px-6 py-4 text-right">Capacity (Bins)</th>
									<th className="px-6 py-4 text-right">Used Space</th>
									<th className="px-6 py-4">Utilization</th>
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
														<Skeleton className="h-6 w-32" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="mt-2 h-2 w-full" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="mx-auto h-6 w-20" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-8" />
													</td>
												</tr>
											))
									: zones?.map((zone, i) => {
											const pct = Math.round((zone.used / zone.capacity) * 100);
											return (
												<motion.tr
													key={zone.id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: i * 0.05 }}
													className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
												>
													<td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
														{zone.zone}
													</td>
													<td className="px-6 py-4 font-medium font-mono text-gray-600 dark:text-gray-300">
														{zone.rack}
													</td>
													<td className="px-6 py-4 text-right text-gray-500">
														{zone.capacity.toLocaleString()}
													</td>
													<td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
														{zone.used.toLocaleString()}
													</td>
													<td className="px-6 py-4">
														<div className="flex items-center gap-2">
															<div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
																<div
																	className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-green-500"}`}
																	style={{ width: `${pct}%` }}
																/>
															</div>
															<span className="w-8 text-gray-500 text-xs">
																{pct}%
															</span>
														</div>
													</td>
													<td className="px-6 py-4 text-center">
														<Badge
															variant="outline"
															className={
																zone.status === "active"
																	? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
																	: zone.status === "near_full"
																		? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
																		: zone.status === "full"
																			? "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
																			: "border-gray-300 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
															}
														>
															{zone.status.replace("_", " ").toUpperCase()}
														</Badge>
													</td>
													<td className="px-6 py-4 text-right">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
														>
															<Settings className="h-4 w-4" />
														</Button>
													</td>
												</motion.tr>
											);
										})}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
