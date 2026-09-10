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
	AlertTriangleIcon,
	CheckCircle2Icon,
	CornerDownRightIcon,
	InboxIcon,
	RefreshCwIcon,
	SendIcon,
	UserCheckIcon,
	UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function WarehouseShortagesPage() {
	const trpc = useTRPC();

	// Fetch shortages/requests raised by salespeople
	const {
		data: requests,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = trpc.putter.getReplenishmentRequests.useQuery();

	const handleAcknowledge = (id: number) => {
		toast.success(`Request #${id} acknowledged. Allocation team notified.`);
	};

	return (
		<PageTransition className="space-y-6 p-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-gray-900 text-xl tracking-tight sm:text-2xl dark:text-gray-100">
						<AlertTriangleIcon className="h-6 w-6 text-amber-500" />
						Sales Replenishment Requests
					</h1>
					<p className="text-gray-500 text-xs sm:text-sm dark:text-gray-400">
						Monitor and allocate stock for replenishment alerts submitted
						directly by the field sales team.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isLoading || isRefetching}
					className="gap-1.5 self-start border-gray-200 hover:bg-gray-50 sm:self-center dark:border-gray-700 dark:hover:bg-gray-800"
				>
					<RefreshCwIcon
						className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
					/>
					{isRefetching ? "Refreshing…" : "Refresh"}
				</Button>
			</div>

			{/* Main Content */}
			{isLoading ? (
				<div className="flex h-[300px] items-center justify-center text-gray-400 text-sm">
					Loading replenishment requests...
				</div>
			) : error ? (
				<div className="flex h-[300px] items-center justify-center text-red-500 text-sm">
					Error loading requests: {error.message}
				</div>
			) : !requests || requests.length === 0 ? (
				<Card className="border-gray-200/60 bg-white/40 dark:border-gray-700/60 dark:bg-gray-800/40">
					<CardContent className="flex flex-col items-center gap-2.5 py-16 text-center text-gray-400 dark:text-gray-500">
						<CheckCircle2Icon className="h-10 w-10 text-emerald-500" />
						<p className="font-semibold text-gray-800 text-sm dark:text-gray-200">
							No Pending Sales Alerts!
						</p>
						<p className="max-w-sm text-xs">
							Salesperson stock replenishment requests are fully fulfilled.
							Field representatives are completely stocked.
						</p>
					</CardContent>
				</Card>
			) : (
				<Card className="border-gray-200/60 bg-white shadow-sm dark:border-gray-700/60 dark:bg-gray-800">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow className="border-gray-200 dark:border-gray-700">
									<TableHead className="font-semibold text-gray-700 dark:text-gray-300">
										Product Details
									</TableHead>
									<TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">
										Requested Qty
									</TableHead>
									<TableHead className="font-semibold text-gray-700 dark:text-gray-300">
										Raised By (Salesperson)
									</TableHead>
									<TableHead className="font-semibold text-gray-700 dark:text-gray-300">
										Details / Notes
									</TableHead>
									<TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{requests.map((item) => (
									<TableRow
										key={item.id}
										className="border-gray-100 hover:bg-gray-50/50 dark:border-gray-700/50 dark:hover:bg-gray-800/50"
									>
										<TableCell className="font-semibold text-gray-900 text-sm dark:text-gray-100">
											<div>
												<p>{item.productName}</p>
												<span className="mt-0.5 inline-flex items-center rounded-md border border-gray-200/50 bg-gray-100 px-1.5 py-0.5 font-bold font-mono text-[10px] text-gray-500 dark:border-gray-600/40 dark:bg-gray-700/80 dark:text-gray-400">
													SKU: {item.sku || "N/A"}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-center font-bold font-mono text-blue-600 text-sm dark:text-blue-400">
											{item.quantity} units
										</TableCell>
										<TableCell className="text-sm">
											<div className="flex items-center gap-2">
												<span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
													<UserIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
												</span>
												<div>
													<p className="font-bold text-gray-800 dark:text-gray-200">
														{item.salespersonName || "Sales Representative"}
													</p>
													<p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">
														{item.salespersonEmail || "sales@evaluna.com"}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell className="max-w-xs truncate text-gray-600 text-xs dark:text-gray-300">
											<p className="font-mono text-[10px] text-gray-400 dark:text-gray-500">
												Reference: Request #{item.id}
											</p>
											<p className="pt-0.5 font-medium">
												{item.reason?.replace("[Sales Request] ", "") ||
													"Replenishment needed."}
											</p>
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="secondary"
												size="sm"
												className="gap-1.5 border border-gray-200/40 text-xs transition-colors hover:bg-emerald-600 hover:text-white dark:border-gray-700/40"
												onClick={() => handleAcknowledge(item.id)}
											>
												<UserCheckIcon className="h-3.5 w-3.5" />
												Acknowledge
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</PageTransition>
	);
}
