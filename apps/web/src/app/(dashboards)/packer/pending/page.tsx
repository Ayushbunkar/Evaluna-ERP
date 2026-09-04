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
	BoxIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PackageIcon,
	PrinterIcon,
	SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PackerPendingPage() {
	const trpc = useTRPC();
	const {
		data: pendingList,
		isLoading,
		error,
		refetch,
	} = trpc.packer.getPendingToPack.useQuery();

	const packMutation = trpc.packer.packOrder.useMutation({
		onSuccess: () => {
			refetch();
			setSelectedPickList(null);
			setWeight("1.5");
			setDimensions("30x20x10 cm");
		},
	});

	const [selectedPickList, setSelectedPickList] = useState<any | null>(null);
	const [weight, setWeight] = useState("1.5");
	const [dimensions, setDimensions] = useState("30x20x10 cm");
	const [searchQuery, setSearchQuery] = useState("");

	const handlePackSubmit = () => {
		if (!selectedPickList) return;
		packMutation.mutate({
			pick_list_id: selectedPickList.pick_list_id,
			order_id: selectedPickList.id
				? Number.parseInt(selectedPickList.id.replace(/\D/g, "") || "1", 10)
				: 1,
			weight: Number.parseFloat(weight) || 1.0,
			dimensions: dimensions || "Standard Box",
		});
	};

	const filteredList = pendingList?.filter(
		(pl) =>
			pl.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			pl.order_ref.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
					<PackageIcon className="h-7 w-7 text-blue-600" />
					Pending Packing Queue
				</h1>
				<p className="text-muted-foreground text-sm">
					Picklists that have completed picking and are ready for box packaging,
					weight recording, and parcel labeling.
				</p>
			</div>

			{/* Stats */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Total Pending to Pack
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{pendingList?.length ?? 0}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Picking Verified
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{pendingList?.length ?? 0}
									</p>
								</div>
								<PackageIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										Station Status
									</p>
									<p className="font-bold text-green-800 text-xl dark:text-green-300">
										Ready
									</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Table Card */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<BoxIcon className="h-5 w-5 text-blue-600" />
							Pending Pack Queue
						</CardTitle>
						<CardDescription>
							Orders waiting to be packed into shipping boxes
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search picklist or order ref..."
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
							Loading queue...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading pending queue"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>No orders currently waiting for packing.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Picklist ID</TableHead>
										<TableHead>Order Ref</TableHead>
										<TableHead>Picking Completion Time</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((pl) => (
										<TableRow key={pl.id} className="hover:bg-muted/50">
											<TableCell className="font-mono font-semibold text-xs">
												{pl.id}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												{pl.order_ref}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pl.completed_at}
											</TableCell>
											<TableCell>
												<span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
													Ready to Pack
												</span>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													className="h-8 bg-blue-600 text-white hover:bg-blue-700"
													onClick={() => setSelectedPickList(pl)}
												>
													<BoxIcon className="mr-1 h-3.5 w-3.5" /> Pack Parcel
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

			{/* Pack Order Modal */}
			{selectedPickList && (
				<Dialog
					open={!!selectedPickList}
					onOpenChange={(open) => !open && setSelectedPickList(null)}
				>
					<DialogContent className="sm:max-w-[480px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<BoxIcon className="h-5 w-5 text-blue-600" />
								Pack Order {selectedPickList.order_ref}
							</DialogTitle>
							<DialogDescription>
								Record parcel weight and dimensions to create package & generate
								shipping barcode sticker.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-sm">
							<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900 text-xs dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
								<p>
									<strong>Picklist:</strong> {selectedPickList.id}
								</p>
								<p>
									<strong>Order Reference:</strong> {selectedPickList.order_ref}
								</p>
								<p>
									<strong>Status:</strong> Ready for Packaging
								</p>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										Parcel Weight (kg)
									</label>
									<input
										type="number"
										step="0.1"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={weight}
										onChange={(e) => setWeight(e.target.value)}
									/>
								</div>

								<div className="space-y-1">
									<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
										Box Dimensions
									</label>
									<input
										type="text"
										placeholder="e.g. 30x20x10 cm"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={dimensions}
										onChange={(e) => setDimensions(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<DialogFooter className="flex justify-end gap-2">
							<Button variant="ghost" onClick={() => setSelectedPickList(null)}>
								Cancel
							</Button>
							<Button
								disabled={packMutation.isPending}
								onClick={handlePackSubmit}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{packMutation.isPending && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								Complete Packing & Save Package
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</PageTransition>
	);
}
