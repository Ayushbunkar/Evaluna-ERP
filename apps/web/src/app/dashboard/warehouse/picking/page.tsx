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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
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
	CheckCircle2Icon,
	CheckSquareIcon,
	Loader2Icon,
	SearchIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickingPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: pickingQueue, isLoading: pickingLoading } =
		trpc.warehouse.getPickingQueue.useQuery();
	const { data: staffList } = trpc.staff.list.useQuery();

	// Mutations
	const assignPickingMutation = trpc.warehouse.assignPickingTask.useMutation({
		onSuccess: () => {
			toast.success("Picker operator successfully assigned!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPickingQueue.invalidate();
		},
	});

	const startPickingMutation = trpc.warehouse.startPickingTask.useMutation({
		onSuccess: () => {
			toast.success("Picking task started on shelves!");
			utils.warehouse.getPickingQueue.invalidate();
		},
	});

	const pickItemMutation = trpc.warehouse.pickItem.useMutation({
		onSuccess: () => {
			toast.success("Line item successfully picked!");
			utils.warehouse.getPickingQueue.invalidate();
		},
	});

	const completePickingMutation =
		trpc.warehouse.completePickingTask.useMutation({
			onSuccess: () => {
				toast.success("Picking completed! Moved to packing/dispatch hand-off.");
				utils.warehouse.getOverviewStats.invalidate();
				utils.warehouse.getPickingQueue.invalidate();
				utils.warehouse.getPackingQueue.invalidate();
			},
			onError: (err) => {
				toast.error(`Completion failed: ${err.message}`);
			},
		});

	// Modal State
	const [selectedPickList, setSelectedPickList] = useState<any>(null);
	const [pickListItems, setPickListItems] = useState<any[]>([]);
	const [loadingItems, setLoadingItems] = useState(false);
	const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);

	const openPickingModal = async (pl: any) => {
		setSelectedPickList(pl);
		setIsPickingModalOpen(true);
		setLoadingItems(true);
		try {
			const items = await utils.client.warehouse.getPickListItems.query({
				pickListId: pl.id,
			});
			setPickListItems(items);
		} catch (e) {
			toast.error("Failed to load pick items");
		} finally {
			setLoadingItems(false);
		}
	};

	const handlePickItem = async (
		itemId: number,
		currentQty: number,
		targetQty: number,
	) => {
		await pickItemMutation.mutateAsync({
			itemId,
			qtyPicked: targetQty,
		});
		// Refresh items inside the modal
		if (selectedPickList) {
			const items = await utils.client.warehouse.getPickListItems.query({
				pickListId: selectedPickList.id,
			});
			setPickListItems(items);
		}
	};

	const handleCompletePicking = async () => {
		if (!selectedPickList) return;
		await completePickingMutation.mutateAsync({
			pickListId: selectedPickList.id,
		});
		setIsPickingModalOpen(false);
	};

	const filteredPicks =
		pickingQueue?.filter(
			(pl) =>
				pl.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				String(pl.id).includes(searchQuery),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Outbound Picking Queue
					</h2>
					<p className="text-muted-foreground text-sm">
						Supervise the picking checklist process, allocate picker operators,
						and monitor shelf fulfillment times.
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search pick lists, customers..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Fulfillment Picking Checklist Queue
					</CardTitle>
					<CardDescription>
						Coordinate picker operators to retrieve stock items from the
						specified aisle bins
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{pickingLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Pick List ID</TableHead>
										<TableHead>Customer Order</TableHead>
										<TableHead>SLA Priority</TableHead>
										<TableHead>Checklist Status</TableHead>
										<TableHead>Assigned Picker</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPicks.map((pl) => (
										<TableRow key={pl.id}>
											<TableCell className="font-semibold text-slate-900 dark:text-slate-100">
												PL-#{pl.id}
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-bold text-slate-800 text-sm dark:text-slate-100">
														{pl.customer_name || "Walk-in Customer"}
													</span>
													<span className="text-[11px] text-muted-foreground">
														Order ID: #{pl.order_id}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														pl.priority === "high" || pl.priority === "urgent"
															? "destructive"
															: "secondary"
													}
													className={
														pl.priority === "urgent" ? "animate-pulse" : ""
													}
												>
													{pl.priority || "normal"}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														pl.status === "completed"
															? "default"
															: pl.status === "picking"
																? "secondary"
																: "outline"
													}
													className={
														pl.status === "pending"
															? "border-amber-200 bg-amber-50 text-amber-700"
															: ""
													}
												>
													{pl.status}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-xs">
													<UsersIcon className="h-4 w-4 text-slate-400" />
													<span className="font-medium">
														{pl.worker_name ?? "Unassigned"}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													{!pl.assigned_to && (
														<select
															className="cursor-pointer rounded border bg-white px-2 py-1 font-bold text-xs"
															onChange={async (e) => {
																const val = e.target.value;
																if (val) {
																	await assignPickingMutation.mutateAsync({
																		pickListId: pl.id,
																		workerId: Number.parseInt(val),
																	});
																}
															}}
														>
															<option value="">Assign Picker</option>
															{staffList?.map((s) => (
																<option key={s.id} value={s.id}>
																	{s.name}
																</option>
															))}
														</select>
													)}

													{pl.assigned_to && pl.status === "assigned" && (
														<Button
															size="sm"
															onClick={() =>
																startPickingMutation.mutate({
																	pickListId: pl.id,
																})
															}
															className="h-8 text-xs shadow-sm"
														>
															Start Picking
														</Button>
													)}

													{pl.status === "picking" && (
														<Button
															size="sm"
															onClick={() => openPickingModal(pl)}
															className="h-8 text-xs shadow-sm"
														>
															Execute Shelf Pick
														</Button>
													)}

													{pl.status === "completed" && (
														<div className="flex items-center gap-1 font-bold text-green-600 text-xs">
															<CheckCircle2Icon className="h-4 w-4" /> Pick
															Completed
														</div>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
									{filteredPicks.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<CheckSquareIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No picking lists found.
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

			{/* EXECUTE ITEMS PICK MODAL */}
			<Dialog open={isPickingModalOpen} onOpenChange={setIsPickingModalOpen}>
				<DialogContent className="max-w-2xl bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Picking Item Lines — PL-#{selectedPickList?.id}
						</DialogTitle>
						<DialogDescription>
							Physically scan and retrieve ordered items from corresponding
							shelf bins.
						</DialogDescription>
					</DialogHeader>

					{loadingItems ? (
						<div className="flex justify-center py-8">
							<Loader2Icon className="h-6 w-6 animate-spin" />
						</div>
					) : (
						<div className="my-2 max-h-[300px] space-y-4 overflow-y-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Target Qty</TableHead>
										<TableHead>Picked Qty</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pickListItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="max-w-[250px] truncate font-bold text-xs">
												{item.product_name}
											</TableCell>
											<TableCell className="font-semibold text-xs">
												{item.quantity_ordered} units
											</TableCell>
											<TableCell className="font-semibold text-xs">
												{item.quantity_picked} units
											</TableCell>
											<TableCell className="text-right">
												{item.status !== "picked" ? (
													<Button
														size="sm"
														onClick={() =>
															handlePickItem(
																item.id,
																item.quantity_picked,
																item.quantity_ordered,
															)
														}
														className="h-8 text-xs"
													>
														Scan & Pick {item.quantity_ordered}
													</Button>
												) : (
													<span className="font-bold text-green-600 text-xs">
														Picked ✓
													</span>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPickingModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCompletePicking}
							disabled={
								pickListItems.some((i) => i.status !== "picked") ||
								completePickingMutation.isPending
							}
						>
							{completePickingMutation.isPending
								? "Completing..."
								: "Close Pick List & Move to Packing"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
