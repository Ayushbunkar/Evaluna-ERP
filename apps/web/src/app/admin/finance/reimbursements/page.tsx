"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { trpc } from "@/lib/trpc/client";

const STATUS_VARIANT: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	submitted: "outline",
	under_review: "outline",
	approved: "default",
	rejected: "destructive",
	paid: "secondary",
	draft: "secondary",
	cancelled: "secondary",
};

function inr(n: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
	}).format(n);
}

// PLACEHOLDER_PAGE
export default function ReimbursementsPage() {
	const [status, setStatus] = useState<string>("");
	const utils = trpc.useUtils();

	const { data, isLoading } = trpc.employeeExpenses.list.useQuery({
		status: status || undefined,
		limit: 50,
		offset: 0,
	});

	function refresh() {
		utils.employeeExpenses.list.invalidate();
	}

	const review = trpc.employeeExpenses.review.useMutation({
		onSuccess: () => {
			toast.success("Decision saved");
			refresh();
		},
		onError: (e) => toast.error(e.message),
	});
	const pay = trpc.employeeExpenses.pay.useMutation({
		onSuccess: () => {
			toast.success("Reimbursement paid");
			refresh();
		},
		onError: (e) => toast.error(e.message),
	});

	const items = data?.items ?? [];
	const busy = review.isPending || pay.isPending;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<h1 className="font-semibold text-2xl">Employee Reimbursements</h1>
				<Select
					value={status || "all"}
					onValueChange={(v) => setStatus(v === "all" ? "" : v)}
				>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						<SelectItem value="submitted">Submitted</SelectItem>
						<SelectItem value="approved">Approved</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Card>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="space-y-2 p-4">
							{[...Array(6)].map((_, i) => (
								<Skeleton key={i} className="h-10 w-full" />
							))}
						</div>
					) : items.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground text-sm">
							No reimbursement requests found.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Number</TableHead>
									<TableHead>Employee</TableHead>
									<TableHead>Category</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((e) => (
									<TableRow key={e.id}>
										<TableCell className="font-mono text-xs">
											{e.expense_number}
										</TableCell>
										<TableCell>{e.staffMember?.name ?? "—"}</TableCell>
										<TableCell>
											{e.category?.name ?? e.custom_category_name ?? "—"}
										</TableCell>
										<TableCell className="text-right font-medium">
											{inr(Number(e.amount))}
										</TableCell>
										<TableCell>
											<Badge variant={STATUS_VARIANT[e.status] ?? "outline"}>
												{e.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											{/* PLACEHOLDER_ACTIONS */}
											<PermissionGate
												domain="finance"
												action="approve"
												fallback={null}
											>
												{(e.status === "submitted" ||
													e.status === "under_review") && (
													<span className="flex justify-end gap-1">
														<Button
															size="sm"
															variant="ghost"
															disabled={busy}
															onClick={() =>
																review.mutate({
																	id: e.id,
																	decision: "approve",
																})
															}
														>
															Approve
														</Button>
														<Button
															size="sm"
															variant="ghost"
															disabled={busy}
															onClick={() =>
																review.mutate({
																	id: e.id,
																	decision: "reject",
																})
															}
														>
															Reject
														</Button>
													</span>
												)}
												{e.status === "approved" && (
													<Button
														size="sm"
														disabled={busy}
														onClick={() => pay.mutate({ id: e.id })}
													>
														Pay
													</Button>
												)}
											</PermissionGate>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
