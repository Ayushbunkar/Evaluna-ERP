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
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	BoxesIcon,
	CheckCircle2Icon,
	Loader2Icon,
	SearchIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PutAwayPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: putAwayQueue, isLoading: putAwayLoading } =
		trpc.warehouse.getPutAwayQueue.useQuery();
	const { data: staffList } = trpc.staff.list.useQuery();

	// Mutations
	const assignPutAwayMutation = trpc.warehouse.assignPutAwayTask.useMutation({
		onSuccess: () => {
			toast.success("Put-away task successfully assigned to operator!");
			utils.warehouse.getOverviewStats.invalidate();
			utils.warehouse.getPutAwayQueue.invalidate();
		},
	});

	const startPutAwayMutation = trpc.warehouse.startPutAwayTask.useMutation({
		onSuccess: () => {
			toast.success("Put-away task started!");
			utils.warehouse.getPutAwayQueue.invalidate();
		},
	});

	const completePutAwayMutation =
		trpc.warehouse.completePutAwayTask.useMutation({
			onSuccess: () => {
				toast.success("Put-away verified, stock balances updated!");
				utils.warehouse.getOverviewStats.invalidate();
				utils.warehouse.getPutAwayQueue.invalidate();
			},
			onError: (err) => {
				toast.error(`Verification failed: ${err.message}`);
			},
		});

	// Modal State
	const [selectedPutAway, setSelectedPutAway] = useState<any>(null);
	const [isPutAwayModalOpen, setIsPutAwayModalOpen] = useState(false);
	const [putAwayQty, setPutAwayQty] = useState<number>(10);
	const [putAwayLocation, setPutAwayLocation] = useState<string>("1");
	const [putAwayNotes, setPutAwayNotes] = useState("");

	const openPutAwayModal = (task: any) => {
		setSelectedPutAway(task);
		setPutAwayQty(10); // Standard received qty
		setIsPutAwayModalOpen(true);
	};

	const handleCompletePutAway = async () => {
		if (!selectedPutAway) return;
		await completePutAwayMutation.mutateAsync({
			placementId: selectedPutAway.id,
			locationId: Number.parseInt(putAwayLocation),
			qty: Number(putAwayQty),
			notes: putAwayNotes,
		});
		setIsPutAwayModalOpen(false);
		setPutAwayNotes("");
	};

	const filteredTasks =
		putAwayQueue?.filter(
			(t) =>
				t.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Put-Away & Placement Verification
					</h2>
					<p className="text-muted-foreground text-sm">
						Route received inventory to precise storage bin layouts and update
						real-time stock indexes.
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search tasks, products, batch..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Inbound Put-Away Verification Queue
					</CardTitle>
					<CardDescription>
						Assign warehouse operator resources and physically store the
						inventory
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{putAwayLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Task Ref</TableHead>
										<TableHead>Product details</TableHead>
										<TableHead>Batch number</TableHead>
										<TableHead>Current Status</TableHead>
										<TableHead>Assigned Putter</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredTasks.map((task) => (
										<TableRow key={task.id}>
											<TableCell className="font-semibold text-slate-900 dark:text-slate-100">
												PV-#{task.id}
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-bold text-slate-800 text-sm dark:text-slate-100">
														{task.product_name}
													</span>
													<span className="text-[11px] text-muted-foreground">
														SKU: {task.product_sku}
													</span>
												</div>
											</TableCell>
											<TableCell className="font-semibold text-xs">
												{task.batch_number || "Awaiting Batch"}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														task.status === "VERIFIED"
															? "default"
															: task.status === "VERIFICATION_REQUIRED"
																? "secondary"
																: "outline"
													}
													className={
														task.status === "AWAITING_PLACEMENT"
															? "border-amber-200 bg-amber-50 text-amber-700"
															: ""
													}
												>
													{task.status}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-xs">
													<UsersIcon className="h-4 w-4 text-slate-400" />
													<span className="font-medium">
														{task.worker_name ?? "Unassigned"}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													{!task.placed_by && (
														<select
															className="cursor-pointer rounded border bg-white px-2 py-1 font-bold text-xs"
															onChange={async (e) => {
																const val = e.target.value;
																if (val) {
																	await assignPutAwayMutation.mutateAsync({
																		placementId: task.id,
																		workerId: Number.parseInt(val),
																	});
																}
															}}
														>
															<option value="">Assign Worker</option>
															{staffList?.map((s) => (
																<option key={s.id} value={s.id}>
																	{s.name}
																</option>
															))}
														</select>
													)}

													{task.placed_by &&
														task.status === "AWAITING_PLACEMENT" && (
															<Button
																size="sm"
																onClick={() =>
																	startPutAwayMutation.mutate({
																		placementId: task.id,
																	})
																}
																className="h-8 text-xs shadow-sm"
															>
																Start Placement
															</Button>
														)}

													{task.status === "VERIFICATION_REQUIRED" && (
														<Button
															size="sm"
															variant="secondary"
															onClick={() => openPutAwayModal(task)}
															className="h-8 text-xs shadow-sm"
														>
															Confirm Storage Bin
														</Button>
													)}

													{task.status === "VERIFIED" && (
														<div className="flex items-center gap-1 font-bold text-green-600 text-xs">
															<CheckCircle2Icon className="h-4 w-4" /> Placed &
															Verified
														</div>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
									{filteredTasks.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<BoxesIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No put-away tasks found.
												</p>
												<p className="text-xs">
													There are no expected products awaiting storage bin
													routing.
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

			{/* CONFIRM PUT AWAY DIALOG */}
			<Dialog open={isPutAwayModalOpen} onOpenChange={setIsPutAwayModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Confirm Storage Bin Layout
						</DialogTitle>
						<DialogDescription>
							Validate physical placement and update database inventory ledger.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Storage Location Bin
							</Label>
							<select
								className="mt-1 w-full rounded border bg-white p-2 font-bold text-xs"
								value={putAwayLocation}
								onChange={(e) => setPutAwayLocation(e.target.value)}
							>
								<option value="1">
									Aisle A - Row 1 - Bin A101 (Steel Widgets Shelf)
								</option>
								<option value="2">
									Aisle B - Row 2 - Bin B202 (Copper Coils Shelf)
								</option>
							</select>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Confirmed Placement Qty
							</Label>
							<Input
								type="number"
								value={putAwayQty}
								onChange={(e) =>
									setPutAwayQty(Number.parseInt(e.target.value) || 0)
								}
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Supervisor Verification Notes
							</Label>
							<Textarea
								placeholder="E.g. Placed in Aisle A shelf 1 safely. Checked for water damage."
								value={putAwayNotes}
								onChange={(e) => setPutAwayNotes(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPutAwayModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCompletePutAway}
							disabled={completePutAwayMutation.isPending}
						>
							{completePutAwayMutation.isPending
								? "Updating inventory..."
								: "Verify Stock & Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
