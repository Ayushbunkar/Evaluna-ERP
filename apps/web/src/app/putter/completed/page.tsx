"use client";

import { useState } from "react";
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
	Loader2Icon,
	SearchIcon,
	PackageCheckIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PutterCompletedPage() {
	const trpc = useTRPC();
	const {
		data: completedList,
		isLoading,
		error,
	} = trpc.putter.getCompleted.useQuery({});

	const [searchQuery, setSearchQuery] = useState("");

	const filteredList = completedList?.filter(
		(c) =>
			c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.completed_by.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
					<PackageCheckIcon className="h-7 w-7 text-green-600" />
					Completed Put Away Archive
				</h1>
				<p className="text-muted-foreground text-sm">
					Archive of all completed put-away tasks, bin shelf assignments, and duration metrics.
				</p>
			</div>

			{/* KPI Summary */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Total Completed Tasks</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{completedList?.length ?? 0}</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Accuracy Rate</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">100%</p>
								</div>
								<PackageCheckIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-purple-700 dark:text-purple-400">Avg Placement Duration</p>
									<p className="text-3xl font-bold text-purple-800 dark:text-purple-300">1.5h</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-purple-500" />
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
							<PackageCheckIcon className="h-5 w-5 text-green-600" />
							Completed Put-Away Registry
						</CardTitle>
						<CardDescription>Full history of finished put-away records</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search product or staff..."
							className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-green-600" /> Loading completed records...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading completed tasks"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle2Icon className="h-10 w-10 opacity-30 text-green-500" />
							<p>No completed put-away tasks logged yet.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Task ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>Qty Shelved</TableHead>
										<TableHead>Location Bin</TableHead>
										<TableHead>Shelved By</TableHead>
										<TableHead>Duration</TableHead>
										<TableHead>Completion Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((item) => (
										<TableRow key={item.id} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs font-semibold">{item.id}</TableCell>
											<TableCell className="font-bold text-sm">{item.product}</TableCell>
											<TableCell className="font-bold text-sm text-green-600 dark:text-green-400">
												{item.qty} units
											</TableCell>
											<TableCell className="text-xs font-semibold">{item.location}</TableCell>
											<TableCell className="text-xs text-muted-foreground">{item.completed_by}</TableCell>
											<TableCell className="text-xs font-mono">{item.time_taken}</TableCell>
											<TableCell className="text-xs text-muted-foreground">{item.date || "Today"}</TableCell>
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
