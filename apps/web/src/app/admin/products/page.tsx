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
	AlertTriangle,
	Box,
	Edit,
	Filter,
	Loader2,
	PackageX,
	Plus,
	Search,
	Settings,
	Trash,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ImportModal } from "./components/ImportModal";

export default function ProductsPage() {
	const utils = trpc.useUtils();
	const { data: products, isLoading } = trpc.products.list.useQuery();

	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [visibilityFilter, setVisibilityFilter] = useState("all");
	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	const bulkDelete = trpc.products.bulkDelete.useMutation({
		onSuccess: () => {
			setSelectedIds([]);
			utils.products.list.invalidate();
		},
	});

	const handleBulkDelete = () => {
		if (
			confirm(`Are you sure you want to delete ${selectedIds.length} products?`)
		) {
			bulkDelete.mutate({ ids: selectedIds });
		}
	};

	const categories = products
		? Array.from(new Set(products.map((p) => p.category)))
		: [];

	const filteredProducts = products?.filter((p) => {
		const matchesSearch =
			p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.sku.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory =
			categoryFilter === "all" || p.category === categoryFilter;
		const matchesVisibility =
			visibilityFilter === "all" || p.visibilityLevel === visibilityFilter;
		return matchesSearch && matchesCategory && matchesVisibility;
	});

	const lowStockCount = products?.filter((p) => p.stock < 50).length || 0;
	const missingMarginCount = products?.filter((p) => p.margin <= 0).length || 0;
	const fastMovingCount = products?.filter((p) => p.stock > 100).length || 0;

	return (
		<div className="mx-auto max-w-7xl space-y-8 p-8">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight dark:text-white">
						Product Master
					</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400">
						Manage catalog, pricing, and visibility
					</p>
				</div>
				<div className="flex gap-3">
					<ImportModal onSuccess={() => utils.products.list.invalidate()} />
					<Button variant="outline" className="shadow-sm">
						<Settings className="mr-2 h-4 w-4" /> Manage Categories
					</Button>
					<Button className="bg-primary text-white shadow-sm hover:bg-primary/90">
						<Plus className="mr-2 h-4 w-4" /> Add Product
					</Button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
				<Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Total Products
						</CardTitle>
						<Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								products?.length || 0
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-red-50 to-rose-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Low Stock Alerts
						</CardTitle>
						<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? <Skeleton className="h-8 w-16" /> : lowStockCount}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Missing Margins
						</CardTitle>
						<PackageX className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								missingMarginCount
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="border-none bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm dark:from-slate-800 dark:to-slate-900">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-gray-600 text-sm dark:text-gray-300">
							Fast-Moving
						</CardTitle>
						<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl text-gray-900 dark:text-white">
							{isLoading ? <Skeleton className="h-8 w-16" /> : fastMovingCount}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Advanced Filters */}
			<Card className="border-gray-200 p-4 shadow-sm dark:border-gray-800">
				<div className="flex flex-col items-end gap-4 md:flex-row">
					<div className="relative w-full flex-1">
						<label className="mb-1 block font-medium text-gray-500 text-xs">
							Search
						</label>
						<div className="relative">
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search by name or SKU..."
								className="w-full rounded-md border border-gray-200 py-2 pr-4 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900"
							/>
						</div>
					</div>
					<div className="w-full md:w-48">
						<label className="mb-1 block font-medium text-gray-500 text-xs">
							Category
						</label>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900"
						>
							<option value="all">All Categories</option>
							{categories.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>
					<div className="w-full md:w-48">
						<label className="mb-1 block font-medium text-gray-500 text-xs">
							Visibility
						</label>
						<select
							value={visibilityFilter}
							onChange={(e) => setVisibilityFilter(e.target.value)}
							className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900"
						>
							<option value="all">All Levels</option>
							<option value="global">Global</option>
							<option value="warehouse_only">Warehouse Only</option>
							<option value="admin_only">Admin Only</option>
						</select>
					</div>
					<div className="w-full md:w-auto">
						<Button variant="outline" className="w-full md:w-auto">
							<Filter className="mr-2 h-4 w-4 text-gray-500" /> More Filters
						</Button>
					</div>
				</div>
			</Card>

			{/* Data Table */}
			<Card className="border-gray-200 shadow-sm dark:border-gray-800">
				<CardHeader className="flex flex-row items-center justify-between border-gray-200 border-b bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-700 text-sm dark:text-gray-300">
							{selectedIds.length} selected
						</span>
						{selectedIds.length > 0 && (
							<Button
								variant="destructive"
								size="sm"
								className="h-8"
								onClick={handleBulkDelete}
								disabled={bulkDelete.isPending}
							>
								{bulkDelete.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Trash className="mr-2 h-4 w-4" />
								)}
								Delete Selected
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full whitespace-nowrap text-left text-sm">
							<thead className="border-gray-200 border-b bg-gray-50 font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
								<tr>
									<th className="w-10 px-6 py-4">
										<input
											type="checkbox"
											className="rounded border-gray-300"
											checked={
												filteredProducts?.length > 0 &&
												selectedIds.length === filteredProducts?.length
											}
											onChange={(e) => {
												if (e.target.checked) {
													setSelectedIds(
														filteredProducts?.map((p) => p.id) || [],
													);
												} else {
													setSelectedIds([]);
												}
											}}
										/>
									</th>
									<th className="px-6 py-4">ID / Product Name</th>
									<th className="px-6 py-4">SKU & Category</th>
									<th className="px-6 py-4 text-right">Procurement (₹)</th>
									<th className="px-6 py-4 text-right">Selling (₹)</th>
									<th className="px-6 py-4 text-center">Margin</th>
									<th className="px-6 py-4 text-center">Visibility</th>
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
														<Skeleton className="h-4 w-4" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="h-10 w-48" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="h-10 w-32" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="mx-auto h-6 w-12" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="mx-auto h-6 w-20" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="mx-auto h-6 w-16" />
													</td>
													<td className="px-6 py-4">
														<Skeleton className="ml-auto h-6 w-16" />
													</td>
												</tr>
											))
									: filteredProducts?.map((product, i) => {
											return (
												<motion.tr
													key={product.id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: i * 0.05 }}
													className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
												>
													<td className="px-6 py-4">
														<input
															type="checkbox"
															className="rounded border-gray-300"
															checked={selectedIds.includes(product.id)}
															onChange={(e) => {
																if (e.target.checked) {
																	setSelectedIds([...selectedIds, product.id]);
																} else {
																	setSelectedIds(
																		selectedIds.filter(
																			(id) => id !== product.id,
																		),
																	);
																}
															}}
														/>
													</td>
													<td className="px-6 py-4">
														<div className="flex items-center gap-3">
															<div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 font-bold text-gray-500 text-xs dark:bg-gray-800">
																#{product.id}
															</div>
															<div>
																<div className="font-medium text-gray-900 dark:text-gray-100">
																	{product.name}
																</div>
															</div>
														</div>
													</td>
													<td className="px-6 py-4">
														<div className="font-mono text-gray-900 text-xs dark:text-gray-100">
															{product.sku}
														</div>
														<div className="mt-1 text-gray-500 text-xs">
															{product.category}
														</div>
													</td>
													<td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-400">
														{product.baseProcurementPrice.toFixed(2)}
													</td>
													<td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
														{product.baseSellingPrice.toFixed(2)}
													</td>
													<td className="px-6 py-4 text-center">
														<span
															className={`\${ product.margin >= 30 ? 'bg-green-50 : product.margin > 15 ? 'bg-blue-50 : 'bg-red-50 } inline-flex items-center rounded px-2 py-1 font-medium text-blue-700 text-green-700 text-red-700 text-xs dark:bg-blue-900/30 dark:bg-green-900/30 dark:bg-red-900/30 dark:text-blue-400' dark:text-green-400' dark:text-red-400'`}
														>
															{product.margin}%
														</span>
													</td>
													<td className="px-6 py-4 text-center">
														<Badge
															variant="outline"
															className="font-normal text-xs capitalize"
														>
															{product.visibilityLevel.replace("_", " ")}
														</Badge>
													</td>
													<td className="px-6 py-4 text-center">
														<span className="flex items-center justify-center gap-1.5">
															<span
																className={`\${product.status === 'active' ? 'bg-green-500' : 'bg-red-500'} h-2 w-2 rounded-full`}
															/>
															<span className="text-gray-600 text-xs capitalize dark:text-gray-400">
																{product.status}
															</span>
														</span>
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
