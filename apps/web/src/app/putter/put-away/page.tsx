"use client";

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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CameraIcon,
	CheckCircle2Icon,
	Loader2Icon,
	MapPinIcon,
	PackagePlusIcon,
	SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PutAwayTasksPage() {
	const trpc = useTRPC();
	const {
		data: putAwayTasks,
		isLoading,
		error,
		refetch,
	} = trpc.putter.getPutAwayTasks.useQuery({});

	const confirmMutation = trpc.putter.confirmPutAway.useMutation({
		onSuccess: () => {
			toast.success("Put-away task confirmed and item placed in bin!");
			refetch();
			setSelectedTask(null);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to confirm put-away");
		},
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTask, setSelectedTask] = useState<any | null>(null);
	const [targetLocation, setTargetLocation] = useState("Rack B-04 / Shelf 2");
	const [showCameraScanner, setShowCameraScanner] = useState(false);

	const handleConfirmSubmit = () => {
		if (!selectedTask) return;
		confirmMutation.mutate({
			id: selectedTask.id,
			location: targetLocation,
		});
	};

	const filteredList = putAwayTasks?.filter(
		(t) =>
			t.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.id.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<PackagePlusIcon className="h-7 w-7 text-blue-600" />
						Warehouse Put Away Tasks
					</h1>
					<p className="text-muted-foreground text-sm">
						Transfer received stock items from receiving bay to designated
						warehouse shelf bin locations.
					</p>
				</div>

				<Button
					variant="outline"
					className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-50"
					onClick={() => setShowCameraScanner(true)}
				>
					<CameraIcon className="h-4 w-4" /> Camera Scan Bin Barcode
				</Button>
			</div>

			{/* KPI Summary */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Tasks Pending Put-Away
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{putAwayTasks?.length ?? 0}
									</p>
								</div>
								<PackagePlusIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										Put-Away Efficiency
									</p>
									<p className="font-bold text-3xl text-green-800 dark:text-green-300">
										100%
									</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-purple-700 text-sm dark:text-purple-400">
										Receiving Bay Status
									</p>
									<p className="font-bold text-purple-800 text-xl dark:text-purple-300">
										Clear
									</p>
								</div>
								<MapPinIcon className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table Card */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<PackagePlusIcon className="h-5 w-5 text-blue-600" />
							Put Away Task Queue
						</CardTitle>
						<CardDescription>
							Items received at loading dock awaiting bin placement
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search product, SKU or Task ID..."
							className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" />{" "}
							Loading put away queue...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading put-away tasks"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>No put-away tasks pending in queue.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Task ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Quantity</TableHead>
										<TableHead>From Location</TableHead>
										<TableHead>Target Bin Location</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((task) => (
										<TableRow key={task.id} className="hover:bg-muted/50">
											<TableCell className="font-mono font-semibold text-xs">
												{task.id}
											</TableCell>
											<TableCell className="font-bold text-sm">
												{task.product}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs">
												{task.sku}
											</TableCell>
											<TableCell className="font-bold text-blue-600 text-sm dark:text-blue-400">
												{task.qty} units
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{task.from}
											</TableCell>
											<TableCell className="font-semibold text-green-600 text-xs dark:text-green-400">
												{task.to_location}
											</TableCell>
											<TableCell>
												<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 text-xs capitalize dark:bg-blue-900/30 dark:text-blue-400">
													{task.status}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													className="h-8 bg-blue-600 text-white hover:bg-blue-700"
													onClick={() => setSelectedTask(task)}
												>
													<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />{" "}
													Confirm Put Away
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Confirm Put Away Modal */}
			{selectedTask && (
				<Dialog
					open={!!selectedTask}
					onOpenChange={(open) => !open && setSelectedTask(null)}
				>
					<DialogContent className="sm:max-w-[450px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<PackagePlusIcon className="h-5 w-5 text-blue-600" />
								Confirm Item Put Away
							</DialogTitle>
							<DialogDescription>
								Confirm placement of {selectedTask.product} in shelf bin.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2 text-sm">
							<div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-900 dark:bg-blue-950/30">
								<p>
									<strong>Product:</strong> {selectedTask.product}
								</p>
								<p>
									<strong>SKU:</strong> {selectedTask.sku}
								</p>
								<p>
									<strong>Quantity to Shelve:</strong> {selectedTask.qty} units
								</p>
							</div>

							<div className="space-y-1">
								<label className="font-semibold text-xs">
									Target Bin Location:
								</label>
								<input
									type="text"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={targetLocation}
									onChange={(e) => setTargetLocation(e.target.value)}
								/>
							</div>
						</div>

						<DialogFooter>
							<Button variant="ghost" onClick={() => setSelectedTask(null)}>
								Cancel
							</Button>
							<Button
								disabled={confirmMutation.isPending}
								onClick={handleConfirmSubmit}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{confirmMutation.isPending && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								Confirm Bin Placement
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={(code) => {
					setTargetLocation(code);
					toast.success(`Scanned Bin Location: ${code}`);
				}}
				title="Scan Shelf Bin Location Barcode"
				description="Point phone camera at shelf bin barcode sticker."
			/>
		</PageTransition>
	);
}
