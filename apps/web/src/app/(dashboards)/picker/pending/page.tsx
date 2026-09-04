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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PackageIcon,
	PlaySquareIcon,
	SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PickerPendingPage() {
	const trpc = useTRPC();
	const {
		data: pendingPicks,
		isLoading,
		error,
	} = trpc.picker.getPending.useQuery({});

	const [searchQuery, setSearchQuery] = useState("");

	const filteredPicks = pendingPicks?.filter(
		(p) =>
			p.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<ClockIcon className="h-7 w-7 text-blue-600" />
						Pending Pick Tasks
					</h1>
					<p className="text-muted-foreground text-sm">
						Order picklists queued in warehouse waiting to be picked.
					</p>
				</div>
				<Button className="bg-blue-600 text-white hover:bg-blue-700" asChild>
					<Link href="/picker/active">
						<PlaySquareIcon className="mr-2 h-4 w-4" /> Start Active Pick
					</Link>
				</Button>
			</div>

			{/* Stats Grid */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Total Pending Picks
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{pendingPicks?.length ?? 0}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm text-yellow-700 dark:text-yellow-400">
										High Priority Orders
									</p>
									<p className="font-bold text-3xl text-yellow-800 dark:text-yellow-300">
										{pendingPicks?.filter(
											(p) => p.priority === "High" || p.priority === "Urgent",
										).length ?? 0}
									</p>
								</div>
								<PackageIcon className="h-8 w-8 text-yellow-500" />
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
										Queue Status
									</p>
									<p className="font-bold text-green-800 text-xl dark:text-green-300">
										Active Queue
									</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<ClockIcon className="h-5 w-5 text-blue-600" />
							Pending Pick Task Queue
						</CardTitle>
						<CardDescription>
							All picking assignments queued for fulfillment
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search order or assigned staff..."
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
							Loading pending picks...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading pending picks"}
						</div>
					) : !filteredPicks || filteredPicks.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 text-green-500 opacity-30" />
							<p>No pending picks found in queue right now.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Queue #</TableHead>
										<TableHead>Order ID</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Total Items</TableHead>
										<TableHead>Assigned Picker</TableHead>
										<TableHead>Waiting Since</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPicks.map((pick) => (
										<TableRow key={pick.queue_no} className="hover:bg-muted/50">
											<TableCell className="font-mono font-semibold text-xs">
												#{pick.queue_no}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												{pick.order_id}
											</TableCell>
											<TableCell>
												<span
													className={`rounded-full px-2 py-0.5 font-medium text-xs ${
														pick.priority === "High"
															? "bg-red-100 text-red-800"
															: pick.priority === "Urgent"
																? "bg-orange-100 text-orange-800"
																: "bg-gray-100 text-gray-800"
													}`}
												>
													{pick.priority}
												</span>
											</TableCell>
											<TableCell className="font-medium text-sm">
												{pick.items} items
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pick.assigned_to}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{pick.waiting_since || "Just now"}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													className="h-8 bg-blue-600 text-white hover:bg-blue-700"
													asChild
												>
													<Link href="/picker/active">
														<PlaySquareIcon className="mr-1 h-3.5 w-3.5" />{" "}
														Start Pick
													</Link>
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
		</PageTransition>
	);
}
