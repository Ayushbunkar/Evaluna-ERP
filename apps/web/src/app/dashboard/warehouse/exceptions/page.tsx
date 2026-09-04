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
	AlertTriangleIcon,
	CheckCircle2Icon,
	Loader2Icon,
	SearchIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ExceptionsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries (load overview to get stats and triggers)
	const { data: stats, isLoading: statsLoading } =
		trpc.warehouse.getOverviewStats.useQuery({});

	// Mutations
	const logExceptionMutation = trpc.warehouse.logException.useMutation({
		onSuccess: () => {
			toast.success("Operational exception successfully logged!");
			utils.warehouse.getOverviewStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Reporting failed: ${err.message}`);
		},
	});

	// Modal State
	const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
	const [exceptionProdId, setExceptionProdId] = useState("1");
	const [exceptionQty, setExceptionQty] = useState("");
	const [exceptionType, setExceptionType] = useState<
		"damage" | "missing" | "mismatch"
	>("damage");
	const [exceptionReason, setExceptionReason] = useState("");

	const handleRaiseException = async () => {
		await logExceptionMutation.mutateAsync({
			productId: Number.parseInt(exceptionProdId),
			qty: Number.parseInt(exceptionQty) || 1,
			reason: exceptionReason,
			type: exceptionType,
		});
		setIsExceptionModalOpen(false);
		setExceptionQty("");
		setExceptionReason("");
	};

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Operational Exceptions Console
					</h2>
					<p className="text-muted-foreground text-sm">
						Investigate receiving mismatches, missing units on racks, and log
						damaged/quarantined goods.
					</p>
				</div>
				<div className="flex w-full gap-2 sm:w-auto">
					<Button
						variant="destructive"
						onClick={() => setIsExceptionModalOpen(true)}
						className="h-9 font-bold text-xs shadow-sm"
					>
						Report New Exception
					</Button>
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search exceptions..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Exception alert log list */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="font-bold text-base text-slate-950">
							Active Incident Tickets
						</CardTitle>
						<CardDescription>
							Live quality deviations currently pending investigation
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{stats?.delayedTasks !== undefined && stats.delayedTasks > 0 ? (
							<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
								<AlertTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
								<div>
									<h5 className="font-bold text-amber-800 text-xs">
										SLA Violation Warning: Overdue Picking Checklist
									</h5>
									<p className="mt-1 text-[11px] text-amber-700">
										Fulfillment picks have exceeded the 2-hour window on
										shelves. Operator reallocations recommended.
									</p>
								</div>
							</div>
						) : null}

						<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
							<XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
							<div>
								<h5 className="font-bold text-red-800 text-xs">
									Damaged Stock Quarantined: High-Grade Steel Widget
								</h5>
								<p className="mt-1 text-[11px] text-red-700">
									1 lot unit received with dented physical outer housing. Moved
									to isolation shelf in Zone A.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Resolved exceptions summary */}
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="font-bold text-base">
							Resolution Log Archive
						</CardTitle>
						<CardDescription>
							Supervisor actions completed in the past 24 hours
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
							<CheckCircle2Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
							<div>
								<h5 className="font-bold text-green-800 text-xs">
									RESOLVED: PO-1024 Receiving Qty Mismatch
								</h5>
								<p className="mt-1 text-[11px] text-green-700">
									Verified with supplier. Adjusted GRN expected counts in
									database. Stock ledger updated cleanly.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* REPORT EXCEPTION DIALOG MODAL */}
			<Dialog
				open={isExceptionModalOpen}
				onOpenChange={setIsExceptionModalOpen}
			>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg text-slate-900">
							Report Operational Exception / Deviation
						</DialogTitle>
						<DialogDescription>
							Submit physical lot discrepancies directly to the system logs,
							triggering quality quarantine.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Affected Product Item
							</Label>
							<select
								className="mt-1 w-full rounded border bg-white p-2 font-bold text-xs"
								value={exceptionProdId}
								onChange={(e) => setExceptionProdId(e.target.value)}
							>
								<option value="1">High-Grade Steel Widget</option>
								<option value="2">Copper Wire Coil</option>
							</select>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Discrepant Quantity
							</Label>
							<Input
								type="number"
								value={exceptionQty}
								onChange={(e) => setExceptionQty(e.target.value)}
								placeholder="E.g. 1"
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Discrepancy Category Type
							</Label>
							<select
								className="mt-1 w-full rounded border bg-white p-2 font-bold text-xs"
								value={exceptionType}
								onChange={(e) => setExceptionType(e.target.value as any)}
							>
								<option value="damage">Physical Damaged Stock</option>
								<option value="missing">Missing units from Shelf</option>
								<option value="mismatch">Lot Receipt Count Mismatch</option>
							</select>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Discrepancy Investigation Notes
							</Label>
							<Textarea
								placeholder="Specify precise damage indicators, box condition, or shelf scan mismatch..."
								value={exceptionReason}
								onChange={(e) => setExceptionReason(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsExceptionModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleRaiseException}
							variant="destructive"
							disabled={logExceptionMutation.isPending}
						>
							{logExceptionMutation.isPending
								? "Logging..."
								: "Submit Exception Ticket"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
