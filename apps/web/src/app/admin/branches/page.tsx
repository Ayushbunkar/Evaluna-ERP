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
	Building,
	Edit,
	MapPin,
	Plus,
	Search,
	Trash,
	Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function BranchesPage() {
	const { data: branches, isLoading } = trpc.branches.list.useQuery();

	return (
		<div className="mx-auto max-w-7xl space-y-8 p-8">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight dark:text-white">
						Branches
					</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400">
						Manage your distribution centers and retail hubs
					</p>
				</div>
				<Button className="bg-primary text-white shadow-sm hover:bg-primary/90">
					<Plus className="mr-2 h-4 w-4" /> Add Branch
				</Button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Total Branches
						</CardTitle>
						<Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								branches?.length || 0
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Active Branches
						</CardTitle>
						<MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								branches?.filter((b) => b.status === "active").length || 0
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-purple-50 to-fuchsia-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Total Managers
						</CardTitle>
						<Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								new Set(branches?.map((b) => b.manager)).size || 0
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Data Table */}
			<Card className="border-gray-200 shadow-sm dark:border-gray-800">
				<CardHeader className="border-gray-100 border-b pb-4 dark:border-gray-800">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">Branch Directory</CardTitle>
						<div className="relative">
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								placeholder="Search branches..."
								className="rounded-md border border-gray-200 py-2 pr-4 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead className="border-gray-200 border-b bg-gray-50 font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
								<tr>
									<th className="px-6 py-4">Branch Code & Name</th>
									<th className="px-6 py-4">Location</th>
									<th className="px-6 py-4">Manager</th>
									<th className="px-6 py-4">Contact Info</th>
									<th className="px-6 py-4">Status</th>
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
														<Skeleton className="h-6 w-24" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="h-6 w-32" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-8" />
													</td>
												</tr>
											))
									: branches?.map((branch, i) => (
											<motion.tr
												key={branch.id}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: i * 0.05 }}
												className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
											>
												<td className="px-6 py-4">
													<div className="font-medium text-gray-900 dark:text-gray-100">
														{branch.name}
													</div>
													<div className="mt-1 text-gray-500 text-xs">
														{branch.code}{" "}
														{branch.is_headquarters && (
															<Badge
																variant="outline"
																className="ml-2 border-blue-200 bg-blue-50 text-[10px] text-blue-700"
															>
																HQ
															</Badge>
														)}
													</div>
												</td>
												<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
													{branch.address}
												</td>
												<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
													<div className="flex items-center gap-2">
														<div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 font-medium text-xs dark:bg-gray-700">
															{branch.manager.charAt(0)}
														</div>
														{branch.manager}
													</div>
												</td>
												<td className="px-6 py-4">
													<div className="text-gray-900 dark:text-gray-300">
														{branch.contact}
													</div>
													<div className="mt-1 text-gray-500 text-xs">
														{branch.email}
													</div>
												</td>
												<td className="px-6 py-4">
													<Badge
														variant="outline"
														className={
															branch.status === "active"
																? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
																: branch.status === "maintenance"
																	? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
																	: "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
														}
													>
														{branch.status.charAt(0).toUpperCase() +
															branch.status.slice(1).replace("_", " ")}
													</Badge>
												</td>
												<td className="px-6 py-4 text-right">
													<div className="flex items-center justify-end gap-2">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
														>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
														>
															<Trash className="h-4 w-4" />
														</Button>
													</div>
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
