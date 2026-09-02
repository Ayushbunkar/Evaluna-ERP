"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CheckSquareIcon,
	CheckCircle2Icon,
	Loader2Icon,
	SearchIcon,
	PackageIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerCompletedPage() {
	const trpc = useTRPC();
	const {
		data: completedPicks,
		isLoading,
		error,
	} = trpc.picker.getCompleted.useQuery({});

	const [searchQuery, setSearchQuery] = useState("");

	const filteredPicks = completedPicks?.filter(
		(p) =>
			p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.completed_by.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
					<CheckSquareIcon className="h-7 w-7 text-green-600" />
					Completed Picking Archive
				</h1>
				<p className="text-muted-foreground text-sm">
					History of fulfilled picking tasks, item count verifications, and completed order handoffs.
				</p>
			</div>

			{/* Stats Grid */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Total Completed Picks</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{completedPicks?.length ?? 0}</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Fulfillment Accuracy</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">100%</p>
								</div>
								<PackageIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-purple-700 dark:text-purple-400">Handoff Status</p>
									<p className="text-xl font-bold text-purple-800 dark:text-purple-300">Ready for Packing</p>
								</div>
								<CheckSquareIcon className="h-8 w-8 text-purple-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<CheckSquareIcon className="h-5 w-5 text-green-600" />
							Completed Pick Task History
						</CardTitle>
						<CardDescription>Full archive of completed picklists</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search picklist or order ID..."
							className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-green-600" /> Loading completed picks...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading completed picks"}
						</div>
					) : !filteredPicks || filteredPicks.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckSquareIcon className="h-10 w-10 opacity-30 text-green-500" />
							<p>No completed pick tasks logged yet.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Picklist ID</TableHead>
										<TableHead>Order ID</TableHead>
										<TableHead>Total Items</TableHead>
										<TableHead>Completed By</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPicks.map((pick) => (
										<TableRow key={pick.id} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs font-semibold">{pick.id}</TableCell>
											<TableCell className="font-semibold text-sm">{pick.order_id}</TableCell>
											<TableCell className="text-sm font-medium">{pick.items} items</TableCell>
											<TableCell className="text-xs text-muted-foreground">{pick.completed_by}</TableCell>
											<TableCell>
												<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400 capitalize">
													Completed
												</span>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">{pick.date || "Today"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
