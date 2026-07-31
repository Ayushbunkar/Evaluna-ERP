"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangle,
	Check,
	ChevronLeft,
	MapPin,
	PackageCheck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function PickListDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const trpc = useTRPC();
	const pickListId = params.id as string;

	const { data: items = [], isLoading } =
		trpc.picking.getPickListItems.useQuery({ pickListId });

	// Using a local state to mock checking off items since TRPC is mocked for query
	const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});

	const handlePickItem = (itemId: string) => {
		setPickedItems((prev) => ({ ...prev, [itemId]: true }));
		toast.success("Item marked as picked");
	};

	const isAllPicked =
		items.length > 0 &&
		items.every((item) => pickedItems[item.id] || item.status === "picked");

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" onClick={() => router.back()}>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Pick List {pickListId}
					</h1>
					<p className="mt-1 text-muted-foreground">
						Scan or manually pick items from their respective locations.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Items</CardTitle>
						<PackageCheck className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{items.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Picked</CardTitle>
						<Check className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{
								items.filter(
									(item) => pickedItems[item.id] || item.status === "picked",
								).length
							}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Pending</CardTitle>
						<AlertTriangle className="h-4 w-4 text-yellow-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{
								items.filter(
									(item) => !pickedItems[item.id] && item.status !== "picked",
								).length
							}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Items to Pick</CardTitle>
					{isAllPicked && (
						<Badge className="bg-green-100 text-green-800">
							All Items Picked
						</Badge>
					)}
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-64 items-center justify-center">
							Loading...
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Location</TableHead>
									<TableHead>Product Code</TableHead>
									<TableHead>Product Name</TableHead>
									<TableHead>Ordered</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => {
									const isPicked =
										pickedItems[item.id] || item.status === "picked";
									const isOutOfStock = item.status === "out_of_stock";

									return (
										<TableRow
											key={item.id}
											className={isPicked ? "bg-green-50/50 opacity-75" : ""}
										>
											<TableCell>
												<div className="flex items-center gap-2">
													<MapPin className="h-4 w-4 text-muted-foreground" />
													<span className="font-mono">{item.location}</span>
												</div>
											</TableCell>
											<TableCell className="font-medium">
												{item.productCode}
											</TableCell>
											<TableCell>{item.productName}</TableCell>
											<TableCell>{item.orderedQty}</TableCell>
											<TableCell>
												{isPicked ? (
													<Badge
														className="bg-green-100 text-green-800"
														variant="outline"
													>
														Picked
													</Badge>
												) : isOutOfStock ? (
													<Badge
														className="bg-red-100 text-red-800"
														variant="outline"
													>
														Out of Stock
													</Badge>
												) : (
													<Badge
														className="bg-yellow-100 text-yellow-800"
														variant="outline"
													>
														Pending
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant={isPicked ? "outline" : "default"}
													disabled={isPicked || isOutOfStock}
													onClick={() => handlePickItem(item.id)}
												>
													{isPicked ? (
														<>
															<Check className="mr-2 h-4 w-4" />
															Picked
														</>
													) : (
														"Mark Picked"
													)}
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{isAllPicked && (
				<div className="flex justify-end pt-4">
					<Button
						size="lg"
						className="w-full sm:w-auto"
						onClick={() => {
							toast.success("Pick List marked as completed!");
							router.push("/admin/warehouse/picking");
						}}
					>
						Complete Pick List
					</Button>
				</div>
			)}
		</div>
	);
}
