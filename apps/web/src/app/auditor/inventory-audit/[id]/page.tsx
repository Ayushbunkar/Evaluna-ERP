"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, PackageSearchIcon, PlusCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

function ItemStatusBadge({ status }: { status: string }) {
	const map: Record<string, string> = {
		match: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
		mismatch: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
	};
	return (
		<Badge variant="outline" className={map[status] ?? ""}>
			{status}
		</Badge>
	);
}

export default function InventoryAuditDetailPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const auditId = Number(params.id);

	const {
		data,
		isLoading,
		error,
	} = trpc.audit.getAudit.useQuery({ auditId });

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: [["audit", "getAudit"]] });

	const [isAddOpen, setIsAddOpen] = useState(false);
	const [productId, setProductId] = useState("");
	const [locationId, setLocationId] = useState("");
	const [expectedQty, setExpectedQty] = useState("");
	const [countedQty, setCountedQty] = useState("");

	const addCountMutation = trpc.audit.addCount.useMutation({
		onSuccess: () => {
			invalidate();
			toast.success("Count recorded");
			setIsAddOpen(false);
			setProductId("");
			setLocationId("");
			setExpectedQty("");
			setCountedQty("");
		},
		onError: (err) => toast.error(err.message),
	});

	const handleAdd = () => {
		if (!productId.trim() || !expectedQty.trim() || !countedQty.trim()) {
			toast.error("Product, expected and counted quantities are required");
			return;
		}
		addCountMutation.mutate({
			audit_id: auditId,
			product_id: Number(productId),
			location_id: locationId ? Number(locationId) : undefined,
			expected_qty: Number(expectedQty),
			counted_qty: Number(countedQty),
		});
	};

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{ key: "product_id", header: "Product", sortable: true },
		{
			key: "location_id",
			header: "Location",
			render: (row) => row.location_id ?? "—",
		},
		{ key: "expected_qty", header: "Expected", sortable: true },
		{ key: "counted_qty", header: "Counted", sortable: true },
		{
			key: "variance",
			header: "Variance",
			render: (row) => {
				const v = Number(row.counted_qty ?? 0) - Number(row.expected_qty ?? 0);
				return (
					<span
						className={
							v === 0
								? "text-muted-foreground"
								: v < 0
									? "font-medium text-red-600 dark:text-red-400"
									: "font-medium text-amber-600 dark:text-amber-400"
						}
					>
						{v > 0 ? `+${v}` : v}
					</span>
				);
			},
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (row) => <ItemStatusBadge status={row.status} />,
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

	const audit = data?.audit as any;
	const items = (data?.items ?? []) as any[];

	return (
		<PageTransition>
			<Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => router.push("/auditor/inventory-audit")}
							>
								<ArrowLeftIcon className="mr-1 h-4 w-4" />
								Back
							</Button>
							<div>
								<h1 className="font-bold text-2xl tracking-tight">
									Audit #{auditId}
								</h1>
								{audit ? (
									<p className="mt-1 text-muted-foreground text-sm">
										Branch #{audit.branch_id} · Auditor #{audit.auditor_id} ·{" "}
										<span className="capitalize">
											{String(audit.status).replace(/_/g, " ")}
										</span>
									</p>
								) : (
									<p className="mt-1 text-muted-foreground text-sm">
										Audit not found.
									</p>
								)}
							</div>
						</div>
						<Button size="sm" onClick={() => setIsAddOpen(true)}>
							<PlusCircle className="mr-2 h-4 w-4" />
							Add Count
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={items}
						columns={columns}
						emptyMessage="No counts recorded yet"
						emptyIcon={<PackageSearchIcon className="h-8 w-8" />}
						defaultSort={[{ id: "id", desc: true }]}
					/>
				</CardContent>

				{/* Add count */}
				<Dialog
					open={isAddOpen}
					onOpenChange={(open) => {
						if (!open) setIsAddOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Record Count</DialogTitle>
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
								<Label htmlFor="locationId">Location ID (optional)</Label>
								<Input
									id="locationId"
									value={locationId}
									onChange={(e) => setLocationId(e.target.value)}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="expectedQty">Expected Qty</Label>
									<Input
										id="expectedQty"
										value={expectedQty}
										onChange={(e) => setExpectedQty(e.target.value)}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="countedQty">Counted Qty</Label>
									<Input
										id="countedQty"
										value={countedQty}
										onChange={(e) => setCountedQty(e.target.value)}
									/>
								</div>
							</div>
							<p className="text-muted-foreground text-xs">
								A count below expected auto-creates a discrepancy and adds the
								shortfall to the missing-stock queue.
							</p>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setIsAddOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleAdd} disabled={addCountMutation.isPending}>
								Record
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
