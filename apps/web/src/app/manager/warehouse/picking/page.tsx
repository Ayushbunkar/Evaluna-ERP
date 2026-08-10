"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import {
	ArrowLeftIcon,
	CheckCircle2Icon,
	ChevronRightIcon,
	ClipboardListIcon,
	Loader2Icon,
	MapPinIcon,
	PackageIcon,
	ScanBarcodeIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function WarehousePickingPage() {
	const [activeListId, setActiveListId] = useState<string | null>(null);

	const utils = trpc.useUtils();

	// Queries
	const { data: pickLists, isLoading: isLoadingLists } =
		trpc.picking.getPickLists.useQuery({});

	const { data: pickItems, isLoading: isLoadingItems } =
		trpc.picking.getPickListItems.useQuery(
			{ pickListId: activeListId || "" },
			{ enabled: !!activeListId },
		);

	// Mutations
	const startMutation = trpc.picking.startPickList.useMutation({
		onSuccess: () => {
			utils.picking.getPickLists.invalidate();
			toast.success("Started picking task");
		},
	});

	const pickItemMutation = trpc.picking.pickItem.useMutation({
		onSuccess: () => {
			utils.picking.getPickListItems.invalidate({ pickListId: activeListId! });
			toast.success("Item picked");
		},
		onError: (error) => toast.error(error.message),
	});

	const completeMutation = trpc.picking.completePickList.useMutation({
		onSuccess: () => {
			utils.picking.getPickLists.invalidate();
			setActiveListId(null);
			toast.success("Pick list completed successfully");
		},
		onError: (error) => toast.error(error.message),
	});

	const pendingLists = pickLists?.filter((l) => l.status === "pending") || [];
	const inProgressLists =
		pickLists?.filter((l) => l.status === "picking") || [];
	const completedLists =
		pickLists?.filter((l) => l.status === "completed") || [];

	if (activeListId) {
		const activeListDetails = pickLists?.find((l) => l.id === activeListId);
		const allPicked = pickItems?.every(
			(i) => i.pickedQty >= i.orderedQty || i.status === "picked",
		);

		return (
			<div className="flex h-full flex-col gap-6 p-6">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setActiveListId(null)}
					>
						<ArrowLeftIcon className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Active Pick List
						</h1>
						<p className="text-muted-foreground text-sm">
							{activeListDetails?.orderId} • {activeListDetails?.customerName}
						</p>
					</div>
					<div className="ml-auto">
						{activeListDetails?.status === "pending" ? (
							<Button
								onClick={() =>
									startMutation.mutate({ pickListId: activeListId })
								}
								disabled={startMutation.isPending}
							>
								{startMutation.isPending ? (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<ScanBarcodeIcon className="mr-2 h-4 w-4" />
								)}
								Start Picking
							</Button>
						) : activeListDetails?.status === "picking" ? (
							<Button
								onClick={() =>
									completeMutation.mutate({ pickListId: activeListId })
								}
								disabled={!allPicked || completeMutation.isPending}
								variant={allPicked ? "default" : "secondary"}
							>
								{completeMutation.isPending ? (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<CheckCircle2Icon className="mr-2 h-4 w-4" />
								)}
								Complete Pick List
							</Button>
						) : null}
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{isLoadingItems ? (
						<Skeleton className="h-48 w-full" />
					) : pickItems?.length === 0 ? (
						<div className="col-span-full py-12 text-center text-muted-foreground">
							No items found in this list.
						</div>
					) : (
						pickItems?.map((item) => (
							<Card
								key={item.id}
								className={`transition-colors ${item.status === "picked" ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : ""}`}
							>
								<CardHeader className="pb-3">
									<CardTitle className="flex items-start justify-between text-lg">
										<span className="line-clamp-2">{item.productName}</span>
										{item.status === "picked" && (
											<Badge
												variant="outline"
												className="border-green-500 text-green-600"
											>
												Picked
											</Badge>
										)}
									</CardTitle>
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<PackageIcon className="h-4 w-4" />
										{item.productCode}
									</div>
									<div className="flex items-center gap-2 font-medium text-blue-600 text-sm dark:text-blue-400">
										<MapPinIcon className="h-4 w-4" />
										{item.location}
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-end justify-between">
										<div>
											<p className="text-muted-foreground text-xs">Required</p>
											<p className="font-bold text-2xl">{item.orderedQty}</p>
										</div>
										{activeListDetails?.status === "picking" &&
										item.status !== "picked" ? (
											<form
												onSubmit={(e) => {
													e.preventDefault();
													const fd = new FormData(e.currentTarget);
													const qty = Number(fd.get("quantity"));
													if (qty > 0) {
														pickItemMutation.mutate({
															itemId: item.id,
															quantity: qty,
														});
													}
												}}
												className="flex items-center gap-2"
											>
												<Input
													name="quantity"
													type="number"
													defaultValue={item.orderedQty}
													min={1}
													max={item.orderedQty}
													className="w-20"
												/>
												<Button
													size="sm"
													type="submit"
													disabled={pickItemMutation.isPending}
												>
													Pick
												</Button>
											</form>
										) : (
											<div className="text-right">
												<p className="text-muted-foreground text-xs">Picked</p>
												<p className="font-bold text-2xl text-green-600">
													{item.pickedQty}
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
					<ClipboardListIcon className="h-6 w-6 text-foreground" />
				</div>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Warehouse Picking
					</h1>
					<p className="text-muted-foreground text-sm">
						Manage picking lists and fulfill orders.
					</p>
				</div>
			</div>

			<Tabs defaultValue="pending" className="flex-1">
				<TabsList>
					<TabsTrigger value="pending">
						Pending ({pendingLists.length})
					</TabsTrigger>
					<TabsTrigger value="progress">
						In Progress ({inProgressLists.length})
					</TabsTrigger>
					<TabsTrigger value="completed">Completed</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="pending" className="m-0 space-y-4">
						{isLoadingLists ? (
							<Skeleton className="h-24 w-full" />
						) : pendingLists.length === 0 ? (
							<div className="py-12 text-center text-muted-foreground">
								No pending pick lists.
							</div>
						) : (
							pendingLists.map((list) => (
								<PickListCard
									key={list.id}
									list={list}
									onClick={() => setActiveListId(list.id)}
								/>
							))
						)}
					</TabsContent>

					<TabsContent value="progress" className="m-0 space-y-4">
						{inProgressLists.length === 0 ? (
							<div className="py-12 text-center text-muted-foreground">
								No picking in progress.
							</div>
						) : (
							inProgressLists.map((list) => (
								<PickListCard
									key={list.id}
									list={list}
									onClick={() => setActiveListId(list.id)}
								/>
							))
						)}
					</TabsContent>

					<TabsContent value="completed" className="m-0 space-y-4">
						{completedLists.length === 0 ? (
							<div className="py-12 text-center text-muted-foreground">
								No completed pick lists.
							</div>
						) : (
							completedLists.map((list) => (
								<PickListCard
									key={list.id}
									list={list}
									onClick={() => setActiveListId(list.id)}
								/>
							))
						)}
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}

function PickListCard({ list, onClick }: { list: any; onClick: () => void }) {
	return (
		<Card
			className="cursor-pointer transition-colors hover:bg-muted/50"
			onClick={onClick}
		>
			<CardContent className="flex items-center p-4 sm:p-6">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold text-lg">{list.id}</h3>
						<Badge
							variant="secondary"
							className={
								list.priority === "urgent" || list.priority === "high"
									? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
									: ""
							}
						>
							{list.priority}
						</Badge>
					</div>
					<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
						<span>Order: {list.orderId}</span>
						<span>•</span>
						<span>{list.customerName}</span>
						<span>•</span>
						<span>{list.totalItems} Items</span>
					</div>
				</div>
				<div className="hidden text-right sm:block">
					<p className="text-muted-foreground text-sm">
						{new Date(list.createdAt).toLocaleDateString()}
					</p>
					<p className="font-medium text-sm">{list.assignedTo}</p>
				</div>
				<ChevronRightIcon className="ml-4 h-5 w-5 text-muted-foreground" />
			</CardContent>
		</Card>
	);
}
