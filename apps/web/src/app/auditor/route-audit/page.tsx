"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Label } from "@evaluna/ui/components/label";
import {
	type FilterOption,
	SearchFilter,
} from "@evaluna/ui/components/search-filter";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Textarea } from "@evaluna/ui/components/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { FlagIcon, TruckIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const severityVariant = (s: string): "default" | "secondary" | "destructive" => {
	if (s === "CRITICAL" || s === "HIGH") return "destructive";
	if (s === "MEDIUM") return "default";
	return "secondary";
};

const statusVariant = (
	s: string,
): "default" | "secondary" | "destructive" | "outline" => {
	if (s === "completed") return "default";
	if (s === "cancelled") return "destructive";
	if (s === "in_progress") return "secondary";
	return "outline";
};

export default function RouteAuditPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [statusFilter, setStatusFilter] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: trips = [],
		isLoading,
		error,
	} = trpc.routeAudit.listTrips.useQuery(undefined);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [flagTripId, setFlagTripId] = useState<number | null>(null);
	const [severity, setSeverity] = useState<Severity>("MEDIUM");
	const [description, setDescription] = useState("");

	const flagMutation = trpc.routeAudit.flagDeviation.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [["routeAudit", "listTrips"]],
			});
			toast.success("Deviation flagged");
			setIsDialogOpen(false);
			setDescription("");
			setFlagTripId(null);
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const statusFilterOptions: FilterOption[] = [
		{ label: "All", value: "all" },
		{ label: "Planned", value: "planned" },
		{ label: "In Progress", value: "in_progress", variant: "warning" },
		{ label: "Completed", value: "completed", variant: "success" },
		{ label: "Cancelled", value: "cancelled", variant: "danger" },
	];

	const filteredTrips = useMemo(() => {
		return (trips as any[]).filter((t) => {
			if (statusFilter !== "all" && t.status !== statusFilter) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(t.id).includes(q) ||
				String(t.status ?? "").toLowerCase().includes(q)
			);
		});
	}, [trips, statusFilter, searchTerm]);

	const openFlag = (tripId: number) => {
		setFlagTripId(tripId);
		setSeverity("MEDIUM");
		setDescription("");
		setIsDialogOpen(true);
	};

	const handleFlag = () => {
		if (flagTripId === null) return;
		if (!description.trim()) {
			toast.error("Description is required");
			return;
		}
		flagMutation.mutate({
			tripId: flagTripId,
			severity,
			description: description.trim(),
		});
	};

	const columns: Column<any>[] = [
		{ key: "id", header: "Trip #", sortable: true, className: "font-medium" },
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row: any) => (
				<Badge variant={statusVariant(row.status)} className="capitalize">
					{row.status ?? "—"}
				</Badge>
			),
		},
		{
			key: "stops",
			header: "Stops (Plan / Actual)",
			render: (row: any) => (
				<span>
					{row.expected_stops ?? 0} / {row.completed_stops ?? 0}
					{row.stops_deviation !== 0 && (
						<span
							className={
								row.stops_deviation < 0
									? "ml-2 text-red-600"
									: "ml-2 text-amber-600"
							}
						>
							({row.stops_deviation > 0 ? "+" : ""}
							{row.stops_deviation})
						</span>
					)}
				</span>
			),
		},
		{
			key: "cash",
			header: "Cash (Plan / Actual)",
			render: (row: any) => (
				<span>
					₹{row.expected_cash_collection ?? "0"} / ₹
					{row.actual_cash_collection ?? "0"}
				</span>
			),
		},
		{
			key: "cash_deviation",
			header: "Cash Deviation",
			sortable: true,
			render: (row: any) => (
				<span
					className={
						Math.abs(row.cash_deviation) > 0.001
							? row.cash_deviation < 0
								? "font-medium text-red-600"
								: "font-medium text-amber-600"
							: "text-muted-foreground"
					}
				>
					{row.cash_deviation > 0 ? "+" : ""}₹{row.cash_deviation.toFixed(2)}
				</span>
			),
		},
		{
			key: "has_deviation",
			header: "Deviation",
			sortable: true,
			render: (row: any) =>
				row.has_deviation ? (
					<Badge variant="destructive">Deviation</Badge>
				) : (
					<Badge variant="secondary">OK</Badge>
				),
		},
		{
			key: "actions",
			header: "Actions",
			render: (row: any) => (
				<TableActions>
					<TableActionButton
						onClick={() => openFlag(row.id)}
						icon={<FlagIcon className="h-4 w-4" />}
						label="Flag Deviation"
					/>
				</TableActions>
			),
		},
	];

	if (isLoading) {
		return (
			<Card className="flex flex-col gap-6 p-6">
				<CardHeader className="p-0">
					<Skeleton className="h-10 w-64" />
				</CardHeader>
				<CardContent className="space-y-3 p-0">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-4">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-8 w-24" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-500">{(error as any)?.message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<PageTransition>
			<Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<div className="mb-2">
						<h1 className="font-bold text-2xl tracking-tight">Route Audit</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Verify planned vs actual stops and cash collection, and flag
							deviations.
						</p>
					</div>
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search by trip # or status"
						filters={[
							{
								options: statusFilterOptions,
								value: statusFilter,
								onChange: setStatusFilter,
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filteredTrips}
						columns={columns}
						emptyMessage="No delivery trips found"
						emptyIcon={<TruckIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				<Dialog
					open={isDialogOpen}
					onOpenChange={(open) => {
						if (!open) setIsDialogOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Flag Deviation — Trip #{flagTripId}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="severity">Severity</Label>
								<Select
									value={severity}
									onValueChange={(v) => setSeverity(v as Severity)}
								>
									<SelectTrigger id="severity">
										<SelectValue placeholder="Select severity" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="LOW">Low</SelectItem>
										<SelectItem value="MEDIUM">Medium</SelectItem>
										<SelectItem value="HIGH">High</SelectItem>
										<SelectItem value="CRITICAL">Critical</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Describe the deviation..."
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="secondary"
								onClick={() => setIsDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleFlag}
								disabled={flagMutation.isPending || !description.trim()}
							>
								Flag Deviation
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
