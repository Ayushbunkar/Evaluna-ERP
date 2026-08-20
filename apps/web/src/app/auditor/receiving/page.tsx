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
	PackageSearchIcon,
	PlusCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		PENDING:
			"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		VERIFIED:
			"bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
		DISCREPANCY:
			"bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
	};
	return (
		<Badge variant="outline" className={map[status] ?? ""}>
			{status}
		</Badge>
	);
}

export default function ReceivingInspectionsPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { activeBranchId } = useBranch();

	const {
		data: inspections = [],
		isLoading,
		error,
	} = trpc.receivingInspections.list.useQuery({
		branchId: activeBranchId ?? undefined,
	});

	const invalidateKeys = [["receivingInspections", "list"]];
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: invalidateKeys[0] });

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Create dialog
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [productId, setProductId] = useState("");
	const [purchaseId, setPurchaseId] = useState("");
	const [expectedQty, setExpectedQty] = useState("");

	// Verify dialog
	const [verifyId, setVerifyId] = useState<number | null>(null);
	const [vReceivedQty, setVReceivedQty] = useState("");
	const [vCondition, setVCondition] = useState<"good" | "damaged" | "mismatch">(
		"good",
	);
	const [vUpcStatus, setVUpcStatus] = useState<
		"present" | "missing" | "invalid"
	>("present");
	const [vNotes, setVNotes] = useState("");

	// Flag dialog
	const [flagId, setFlagId] = useState<number | null>(null);
	const [fReceivedQty, setFReceivedQty] = useState("");
	const [fCondition, setFCondition] = useState<"good" | "damaged" | "mismatch">(
		"damaged",
	);
	const [fSeverity, setFSeverity] = useState<
		"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
	>("MEDIUM");
	const [fDescription, setFDescription] = useState("");

	const createMutation = trpc.receivingInspections.create.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Inspection created");
			setIsCreateOpen(false);
			setProductId("");
			setPurchaseId("");
			setExpectedQty("");
		},
		onError: (err) => toast.error(err.message),
	});

	const verifyMutation = trpc.receivingInspections.verify.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Inspection verified");
			setVerifyId(null);
		},
		onError: (err) => toast.error(err.message),
	});

	const flagMutation = trpc.receivingInspections.flagDiscrepancy.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Discrepancy flagged");
			setFlagId(null);
			setFDescription("");
		},
		onError: (err) => toast.error(err.message),
	});

	const statusFilterOptions: FilterOption[] = [
		{ label: "All", value: "all" },
		{ label: "Pending", value: "PENDING", variant: "warning" },
		{ label: "Verified", value: "VERIFIED", variant: "success" },
		{ label: "Discrepancy", value: "DISCREPANCY", variant: "danger" },
	];

	const filtered = useMemo(() => {
		return inspections.filter((r: any) => {
			if (statusFilter !== "all" && r.status !== statusFilter) return false;
			const q = searchTerm.toLowerCase().trim();
			if (!q) return true;
			return (
				String(r.id).includes(q) ||
				String(r.product_id).includes(q) ||
				String(r.purchase_id ?? "").includes(q)
			);
		});
	}, [inspections, statusFilter, searchTerm]);

	const handleCreate = () => {
		if (!productId.trim()) {
			toast.error("Product ID is required");
			return;
		}
		createMutation.mutate({
			productId: Number(productId),
			purchaseId: purchaseId ? Number(purchaseId) : undefined,
			branchId: activeBranchId ?? undefined,
			expectedQty: expectedQty ? Number(expectedQty) : undefined,
		});
	};

	const handleVerify = () => {
		if (verifyId === null) return;
		verifyMutation.mutate({
			inspectionId: verifyId,
			receivedQty: vReceivedQty ? Number(vReceivedQty) : undefined,
			condition: vCondition,
			upcStatus: vUpcStatus,
			notes: vNotes || undefined,
		});
	};

	const handleFlag = () => {
		if (flagId === null) return;
		if (!fDescription.trim()) {
			toast.error("Description is required");
			return;
		}
		flagMutation.mutate({
			inspectionId: flagId,
			receivedQty: fReceivedQty ? Number(fReceivedQty) : undefined,
			condition: fCondition,
			severity: fSeverity,
			description: fDescription,
		});
	};

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{
			key: "purchase_id",
			header: "Purchase",
			render: (row) => row.purchase_id ?? "—",
		},
		{ key: "product_id", header: "Product", sortable: true },
		{
			key: "expected_qty",
			header: "Expected",
			render: (row) => row.expected_qty ?? "—",
		},
		{
			key: "received_qty",
			header: "Received",
			render: (row) => row.received_qty ?? "—",
		},
		{
			key: "condition",
			header: "Condition",
			render: (row) => (
				<span className="capitalize">{row.condition ?? "—"}</span>
			),
		},
		{
			key: "upc_status",
			header: "UPC",
			hideOnMobile: true,
			render: (row) => (
				<span className="capitalize">{row.upc_status ?? "—"}</span>
			),
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
			render: (row) =>
				row.status === "PENDING" ? (
					<TableActions>
						<TableActionButton
							onClick={() => {
								setVerifyId(row.id);
								setVReceivedQty(String(row.expected_qty ?? ""));
								setVCondition("good");
								setVUpcStatus("present");
								setVNotes("");
							}}
							icon={<CheckCircle2Icon className="h-4 w-4" />}
							label="Verify"
						/>
						<TableActionButton
							variant="danger"
							onClick={() => {
								setFlagId(row.id);
								setFReceivedQty(String(row.received_qty ?? ""));
								setFCondition("damaged");
								setFSeverity("MEDIUM");
								setFDescription("");
							}}
							icon={<FlagIcon className="h-4 w-4" />}
							label="Flag discrepancy"
						/>
					</TableActions>
				) : (
					<span className="text-muted-foreground text-xs">—</span>
				),
		},
	];

	if (isLoading) {
		return (
			<Card className="flex flex-col gap-6 p-6">
				<CardHeader className="p-0">
					<div className="flex items-center justify-between">
						<Skeleton className="h-10 w-48" />
						<Skeleton className="h-9 w-32" />
					</div>
				</CardHeader>
				<CardContent className="space-y-3 p-0">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-4">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-8 w-20" />
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
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search by inspection, product or purchase ID"
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
							New Inspection
						</Button>
					</SearchFilter>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filtered}
						columns={columns}
						emptyMessage="No receiving inspections found."
						emptyIcon={<PackageSearchIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				{/* Create inspection */}
				<Dialog
					open={isCreateOpen}
					onOpenChange={(open) => {
						if (!open) setIsCreateOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Receiving Inspection</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="productId">Product ID</Label>
								<Input
									id="productId"
									value={productId}
									onChange={(e) => setProductId(e.target.value)}
									placeholder="e.g. 42"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="purchaseId">Purchase ID (optional)</Label>
								<Input
									id="purchaseId"
									value={purchaseId}
									onChange={(e) => setPurchaseId(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="expectedQty">Expected Qty (optional)</Label>
								<Input
									id="expectedQty"
									value={expectedQty}
									onChange={(e) => setExpectedQty(e.target.value)}
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

				{/* Verify inspection */}
				<Dialog
					open={verifyId !== null}
					onOpenChange={(open) => {
						if (!open) setVerifyId(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Verify Inspection #{verifyId}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="vReceivedQty">Received Qty</Label>
								<Input
									id="vReceivedQty"
									value={vReceivedQty}
									onChange={(e) => setVReceivedQty(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="vCondition">Condition</Label>
								<Select
									value={vCondition}
									onValueChange={(v) =>
										setVCondition(v as "good" | "damaged" | "mismatch")
									}
								>
									<SelectTrigger id="vCondition">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="good">Good</SelectItem>
										<SelectItem value="damaged">Damaged</SelectItem>
										<SelectItem value="mismatch">Mismatch</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="vUpcStatus">UPC Status</Label>
								<Select
									value={vUpcStatus}
									onValueChange={(v) =>
										setVUpcStatus(v as "present" | "missing" | "invalid")
									}
								>
									<SelectTrigger id="vUpcStatus">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="present">Present</SelectItem>
										<SelectItem value="missing">Missing</SelectItem>
										<SelectItem value="invalid">Invalid</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="vNotes">Notes (optional)</Label>
								<Textarea
									id="vNotes"
									value={vNotes}
									onChange={(e) => setVNotes(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setVerifyId(null)}>
								Cancel
							</Button>
							<Button onClick={handleVerify} disabled={verifyMutation.isPending}>
								Verify
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Flag discrepancy */}
				<Dialog
					open={flagId !== null}
					onOpenChange={(open) => {
						if (!open) setFlagId(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Flag Discrepancy #{flagId}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="fReceivedQty">Received Qty (optional)</Label>
								<Input
									id="fReceivedQty"
									value={fReceivedQty}
									onChange={(e) => setFReceivedQty(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="fCondition">Condition</Label>
								<Select
									value={fCondition}
									onValueChange={(v) =>
										setFCondition(v as "good" | "damaged" | "mismatch")
									}
								>
									<SelectTrigger id="fCondition">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="good">Good</SelectItem>
										<SelectItem value="damaged">Damaged</SelectItem>
										<SelectItem value="mismatch">Mismatch</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="fSeverity">Severity</Label>
								<Select
									value={fSeverity}
									onValueChange={(v) =>
										setFSeverity(v as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
									}
								>
									<SelectTrigger id="fSeverity">
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
								<Label htmlFor="fDescription">Description</Label>
								<Textarea
									id="fDescription"
									value={fDescription}
									onChange={(e) => setFDescription(e.target.value)}
									placeholder="Describe the discrepancy..."
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
								disabled={flagMutation.isPending || !fDescription.trim()}
							>
								Flag Discrepancy
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
