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
	ArchiveIcon,
	CheckCircle2Icon,
	SearchIcon,
	TrendingUpIcon,
	UsersIcon,
	WarehouseIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function InventoryStockPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: stockItems,
		isLoading,
		error,
	} = trpc.inventory.getStockItems.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading stock items
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Stock Levels
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View current inventory levels across all products
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Inventory Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/inventory">
							<ArchiveIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
				</div>
			</div>

			{!stockItems || stockItems.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No stock items found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHeader className="text-left">Product</TableHeader>
								<TableHeader className="text-left">SKU</TableHeader>
								<TableHeader className="text-left">Category</TableHeader>
								<TableHeader className="text-left">Warehouse</TableHeader>
								<TableHeader className="text-left">Quantity</TableHeader>
								<TableHeader className="text-left">Unit Cost</TableHeader>
								<TableHeader className="text-left">Value</TableHeader>
								<TableHeader className="text-left">Status</TableHeader>
								<TableHeader className="text-left">Actions</TableHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{stockItems.map((item) => (
								<TableRow key={item.id}>
									<TableCell>{item.name}</TableCell>
									<TableCell>{item.sku}</TableCell>
									<TableCell>{item.category}</TableCell>
									<TableCell>{item.warehouse}</TableCell>
									<TableCell>{item.quantity}</TableCell>
									<TableCell>
										{formatCurrency(Number(item.unit_cost), locale)}
									</TableCell>
									<TableCell>
										{formatCurrency(Number(item.value), locale)}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${item.quantity <= item.min_level ? "bg-red-100 text-red-800" : item.quantity <= item.max_level * 0.2 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
										>
											{item.quantity <= item.min_level
												? "Low Stock"
												: item.quantity <= item.max_level * 0.2
													? "Low"
													: "OK"}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View stock details ${item.id}`)}
										>
											<SearchIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`Adjust stock for ${item.name}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> Adjust
										</Button>
										{item.quantity <= item.min_level && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => alert(`Reorder ${item.name}`)}
											>
												<TrendingUpIcon className="mr-1 h-3 w-3" /> Reorder
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
