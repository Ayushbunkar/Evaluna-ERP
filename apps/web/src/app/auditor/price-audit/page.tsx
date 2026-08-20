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
import { ArrowRightIcon, FlagIcon, TagIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const fieldLabels: Record<string, string> = {
	base_selling_price: "Selling Price",
	base_procurement_price: "Procurement Price",
	price: "Price",
};

export default function PriceAuditPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [searchTerm, setSearchTerm] = useState("");
	const [fieldFilter, setFieldFilter] = useState("all");

	const {
		data: changes = [],
		isLoading,
		error,
	} = trpc.priceAudit.listPriceChanges.useQuery(undefined);

	const [reviewId, setReviewId] = useState<number | null>(null);
	const [severity, setSeverity] = useState<Severity>("MEDIUM");
	const [description, setDescription] = useState("");

	const reviewMutation = trpc.priceAudit.reviewChange.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [["priceAudit", "listPriceChanges"]],
			});
			queryClient.invalidateQueries({ queryKey: [["auditFindings", "list"]] });
			toast.success("Price change flagged for review");
			setReviewId(null);
			setDescription("");
		},
		onError: (err) => toast.error(err.message),
	});

	const fieldOptions: FilterOption[] = [
		{ label: "All fields", value: "all" },
		{ label: "Selling Price", value: "base_selling_price" },
		{ label: "Procurement Price", value: "base_procurement_price" },
		{ label: "Price", value: "price" },
	];

	const filtered = useMemo(() => {
		return (changes as any[]).filter((c) => {
			if (fieldFilter !== "all" && c.price_field !== fieldFilter) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				String(c.product_name ?? "").toLowerCase().includes(q) ||
				String(c.reason ?? "").toLowerCase().includes(q) ||
				String(c.source ?? "").toLowerCase().includes(q)
			);
		});
	}, [changes, fieldFilter, searchTerm]);

	const openReview = (id: number) => {
		setReviewId(id);
		setSeverity("MEDIUM");
		setDescription("");
	};

	const handleReview = () => {
		if (reviewId === null) return;
		if (!description.trim()) {
			toast.error("Description is required");
			return;
		}
		reviewMutation.mutate({
			priceChangeId: reviewId,
			severity,
			description: description.trim(),
		});
	};

	const columns: Column<any>[] = [
		{
			key: "created_at",
			header: "When",
			sortable: true,
			render: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleString() : "—",
		},
		{
			key: "product_name",
			header: "Product",
			sortable: true,
			className: "font-medium",
			render: (row) => row.product_name ?? `#${row.product_id}`,
		},
		{
			key: "price_field",
			header: "Field",
			render: (row) => (
				<Badge variant="outline">
					{fieldLabels[row.price_field] ?? row.price_field}
				</Badge>
			),
		},
		{
			key: "change",
			header: "Old → New",
			render: (row) => (
				<span className="flex items-center gap-1 whitespace-nowrap">
					<span className="text-muted-foreground">
						₹{Number(row.old_price ?? 0).toFixed(2)}
					</span>
					<ArrowRightIcon className="h-3 w-3" />
					<span className="font-medium">
						₹{Number(row.new_price ?? 0).toFixed(2)}
					</span>
				</span>
			),
		},
		{
			key: "changed_by",
			header: "Changed By",
			hideOnMobile: true,
			render: (row) => row.changed_by ?? row.changed_by_uid ?? "—",
		},
		{
			key: "reason",
			header: "Reason",
			hideOnMobile: true,
			render: (row) => row.reason ?? "—",
		},
		{
			key: "source",
			header: "Source",
			hideOnMobile: true,
			render: (row) => (
				<span className="text-muted-foreground text-xs">
					{row.source ?? "—"}
				</span>
			),
		},
		{
			key: "actions",
			header: "Review",
			render: (row) => (
				<Button
					size="sm"
					variant="outline"
					onClick={() => openReview(row.id)}
				>
					<FlagIcon className="mr-1 h-4 w-4" />
					Flag
				</Button>
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
					<div className="mb-2">
						<h1 className="font-bold text-2xl tracking-tight">Price Audit</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Immutable log of price changes. Flagging creates a finding — the
							price record itself is never edited here.
						</p>
					</div>
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search by product, reason or source"
						filters={[
							{
								options: fieldOptions,
								value: fieldFilter,
								onChange: setFieldFilter,
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filtered}
						columns={columns}
						emptyMessage="No price changes recorded"
						emptyIcon={<TagIcon className="h-8 w-8" />}
						defaultSort={[{ id: "created_at", desc: true }]}
					/>
				</CardContent>

				<Dialog
					open={reviewId !== null}
					onOpenChange={(open) => {
						if (!open) setReviewId(null);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Review Price Change #{reviewId}</DialogTitle>
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
									placeholder="Why is this change being flagged?"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setReviewId(null)}>
								Cancel
							</Button>
							<Button
								onClick={handleReview}
								disabled={reviewMutation.isPending || !description.trim()}
							>
								Create Finding
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
