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
import { Input } from "@evaluna/ui/components/input";
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
import {
	CheckCircle2Icon,
	FlagIcon,
	MapPinnedIcon,
	PackagePlusIcon,
	PlusCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		AWAITING_PLACEMENT:
			"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		PLACED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
		VERIFICATION_REQUIRED:
			"bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
		VERIFIED:
			"bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
		PLACEMENT_EXCEPTION:
			"bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
	};
	return (
		<Badge variant="outline" className={map[status] ?? ""}>
			{status?.replace(/_/g, " ")}
		</Badge>
	);
}

export default function PlacementPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { activeBranchId } = useBranch();

	const {
		data: rows = [],
		isLoading,
		error,
	} = trpc.placement.list.useQuery({ branchId: activeBranchId ?? undefined });

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: [["placement", "list"]] });

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Create
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [productId, setProductId] = useState("");
	const [batchId, setBatchId] = useState("");
	const [locationId, setLocationId] = useState("");

	// Mark placed
	const [placeId, setPlaceId] = useState<number | null>(null);
	const [placeLocationId, setPlaceLocationId] = useState("");

	// Flag exception
	const [flagId, setFlagId] = useState<number | null>(null);
	const [severity, setSeverity] = useState<Severity>("MEDIUM");
	const [description, setDescription] = useState("");

	const createMutation = trpc.placement.create.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Placement created");
			setIsCreateOpen(false);
			setProductId("");
			setBatchId("");
			setLocationId("");
		},
		onError: (err) => toast.error(err.message),
	});

	const markPlacedMutation = trpc.placement.markPlaced.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Marked as placed");
			setPlaceId(null);
			setPlaceLocationId("");
		},
		onError: (err) => toast.error(err.message),
	});

	const verifyMutation = trpc.placement.verify.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Placement verified");
		},
		onError: (err) => toast.error(err.message),
	});

	const flagMutation = trpc.placement.flagException.useMutation({
		onSuccess: () => {
			invalidate();
			queryClient.invalidateQueries({ queryKey: [["auditFindings", "list"]] });
			toast.success("Exception flagged");
			setFlagId(null);
			setDescription("");
		},
		onError: (err) => toast.error(err.message),
	});

	const statusFilterOptions: FilterOption[] = [
		{ label: "All", value: "all" },
		{ label: "Awaiting", value: "AWAITING_PLACEMENT", variant: "warning" },
		{ label: "Placed", value: "PLACED" },
		{
			label: "Verification Req.",
			value: "VERIFICATION_REQUIRED",
			variant: "warning",
		},
		{ label: "Verified", value: "VERIFIED", variant: "success" },
		{ label: "Exception", value: "PLACEMENT_EXCEPTION", variant: "danger" },
	];

	const filtered = useMemo(() => {
		return (rows as any[]).filter((r) => {
			if (statusFilter !== "all" && r.status !== statusFilter) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(r.id).includes(q) ||
				String(r.product_id).includes(q) ||
				String(r.location_id ?? "").includes(q)
			);
		});
	}, [rows, statusFilter, searchTerm]);

	const handleCreate = () => {
		if (!productId.trim()) {
			toast.error("Product ID is required");
			return;
		}
		createMutation.mutate({
			productId: Number(productId),
			batchId: batchId ? Number(batchId) : undefined,
			locationId: locationId ? Number(locationId) : undefined,
			branchId: activeBranchId ?? undefined,
		});
	};

	const handleMarkPlaced = () => {
		if (placeId === null) return;
		markPlacedMutation.mutate({
			placementId: placeId,
			locationId: placeLocationId ? Number(placeLocationId) : undefined,
		});
	};

	const handleFlag = () => {
		if (flagId === null) return;
		if (!description.trim()) {
			toast.error("Description is required");
			return;
		}
		flagMutation.mutate({
			placementId: flagId,
			severity,
			description: description.trim(),
		});
	};

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{ key: "product_id", header: "Product", sortable: true },
		{
			key: "batch_id",
			header: "Batch",
			render: (row) => row.batch_id ?? "—",
		},
		{
			key: "location_id",
			header: "Location",
			render: (row) => row.location_id ?? "—",
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row) => <StatusBadge status={row.status} />,
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => {
				const isTerminal =
					row.status === "VERIFIED" || row.status === "PLACEMENT_EXCEPTION";
				return (
					<TableActions>
						{row.status === "AWAITING_PLACEMENT" && (
							<TableActionButton
								onClick={() => {
									setPlaceId(row.id);
									setPlaceLocationId(String(row.location_id ?? ""));
								}}
								icon={<PackagePlusIcon className="h-4 w-4" />}
								label="Mark placed"
							/>
						)}
						{(row.status === "PLACED" ||
							row.status === "VERIFICATION_REQUIRED") && (
							<TableActionButton
								onClick={() => verifyMutation.mutate({ placementId: row.id })}
								icon={<CheckCircle2Icon className="h-4 w-4" />}
								label="Verify"
							/>
						)}
						{!isTerminal && (
							<TableActionButton
								variant="danger"
								onClick={() => {
									setFlagId(row.id);
									setSeverity("MEDIUM");
									setDescription("");
								}}
								icon={<FlagIcon className="h-4 w-4" />}
								label="Flag exception"
							/>
						)}
						{isTerminal && (
							<span className="text-muted-foreground text-xs">—</span>
						)}
					</TableActions>
				);
			},
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
						<Skeleton key={i} className="h-8 w-full" />
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
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search by product or location"
						filters={[
							{
								options: statusFilterOptions,
								value: statusFilter,
								onChange: setStatusFilter,
							},
						]}
					>
						<Button size="sm" onClick={() => setIsCreateOpen(true)}>
							<PlusCircle className="mr-2 h-4 w-4" />
							New Placement
						</Button>
					</SearchFilter>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filtered}
						columns={columns}
						emptyMessage="No placement records found"
						emptyIcon={<MapPinnedIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				{/* Create placement */}
				<Dialog
					open={isCreateOpen}
					onOpenChange={(open) => {
						if (!open) setIsCreateOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Placement</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="productId">Product ID</Label>
								<Input
									id="productId"
									value={productId}
									onChange={(e) => setProductId(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="batchId">Batch ID (optional)</Label>
								<Input
									id="batchId"
									value={batchId}
									onChange={(e) => setBatchId(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="locationId">Location ID (optional)</Label>
								<Input
									id="locationId"
									value={locationId}
									onChange={(e) => setLocationId(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleCreate}
								disabled={createMutation.isPending || !productId.trim()}
							>
								Create
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Mark placed */}
				<Dialog
					open={placeId !== null}
					onOpenChange={(open) => {
						if (!open) setPlaceId(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Mark Placed #{placeId}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="placeLocationId">Location ID (optional)</Label>
								<Input
									id="placeLocationId"
									value={placeLocationId}
									onChange={(e) => setPlaceLocationId(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setPlaceId(null)}>
								Cancel
							</Button>
							<Button
								onClick={handleMarkPlaced}
								disabled={markPlacedMutation.isPending}
							>
								Mark Placed
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Flag exception */}
				<Dialog
					open={flagId !== null}
					onOpenChange={(open) => {
						if (!open) setFlagId(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Flag Placement Exception #{flagId}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="severity">Severity</Label>
								<Select
									value={severity}
									onValueChange={(v) => setSeverity(v as Severity)}
								>
									<SelectTrigger id="severity">
										<SelectValue />
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
									placeholder="Describe the placement exception..."
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setFlagId(null)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleFlag}
								disabled={flagMutation.isPending || !description.trim()}
							>
								Flag Exception
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
