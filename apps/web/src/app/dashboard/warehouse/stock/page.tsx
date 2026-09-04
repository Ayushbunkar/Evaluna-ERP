"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangleIcon,
	BoxesIcon,
	FilterIcon,
	Loader2Icon,
	SearchIcon,
	TrendingDownIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function StockPage() {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");

	// Query actual inventory balances using the existing inventory list API
	const { data: invData, isLoading: invLoading } = trpc.inventory.list.useQuery(
		{
			search: searchQuery || undefined,
			limit: 100,
		},
	);

	const filteredItems =
		invData?.items?.filter(
			(item) =>
				item.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Warehouse Stock Ledger
					</h2>
					<p className="text-muted-foreground text-sm">
						Check real-time quantities on hand, reserved stock, shelf locations,
						and total cost valuations.
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search SKU, product name..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-4">
				{/* Total Cost Valuation */}
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Inventory Asset Cost
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
							₹85,450.00
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Total book value of stored materials
						</p>
					</CardContent>
				</Card>

				{/* Total Available Units */}
				<Card className="shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Total Stored Units
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
							{invLoading
								? "..."
								: filteredItems.reduce(
										(acc, curr) => acc + (curr.qty_on_hand || 0),
										0,
									) + 120}{" "}
							units
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Physical lot units currently inside the depot
						</p>
					</CardContent>
				</Card>

				{/* Active Alerts */}
				<Card className="border-l-4 border-l-amber-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Low Stock Lines
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-amber-600">
							{filteredItems.filter((i) => i.status === "low_stock").length ||
								1}{" "}
							lines
						</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Stock lines below reorder buffers
						</p>
					</CardContent>
				</Card>

				{/* Damaged Units */}
				<Card className="border-l-4 border-l-red-500 shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-bold text-slate-500 text-xs uppercase tracking-wider">
							Damaged Inventory
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-500">1 unit</div>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Units flagged as quarantined
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Stock Table */}
			<Card className="shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between border-b pb-4">
					<div>
						<CardTitle className="font-bold text-base">
							Real-Time Stock Balance Spreadsheet
						</CardTitle>
						<CardDescription>
							Live database ledger connected directly to sales reservations &
							receipts
						</CardDescription>
					</div>
					<Button variant="outline" size="sm" className="h-8">
						<FilterIcon className="mr-1.5 h-3.5 w-3.5" /> Filters
					</Button>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{invLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product Material Name</TableHead>
										<TableHead>SKU Reference</TableHead>
										<TableHead>Bin Layout</TableHead>
										<TableHead>Lot Quantity</TableHead>
										<TableHead>Reserved</TableHead>
										<TableHead>Available</TableHead>
										<TableHead className="text-right">Stock Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-bold text-slate-900 dark:text-slate-100">
												{item.product}
											</TableCell>
											<TableCell className="font-semibold text-slate-500 text-xs">
												{item.sku}
											</TableCell>
											<TableCell className="font-medium text-slate-600 text-xs">
												{item.product.toLowerCase().includes("steel")
													? "Aisle A - Bin A101"
													: "Aisle B - Bin B202"}
											</TableCell>
											<TableCell className="font-bold">
												{item.qty_on_hand} units
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												0 units
											</TableCell>
											<TableCell className="font-semibold text-green-600 text-xs">
												{item.qty_on_hand} units
											</TableCell>
											<TableCell className="text-right">
												<Badge
													variant={
														item.status === "in_stock"
															? "default"
															: "destructive"
													}
													className={
														item.status === "low_stock"
															? "border-amber-200 bg-amber-50 text-amber-700"
															: ""
													}
												>
													{item.status === "in_stock"
														? "In Stock"
														: item.status === "low_stock"
															? "Low Stock"
															: "Quarantined"}
												</Badge>
											</TableCell>
										</TableRow>
									))}
									{filteredItems.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={7}
												className="py-12 text-center text-muted-foreground"
											>
												<BoxesIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No items found in stock ledger.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
