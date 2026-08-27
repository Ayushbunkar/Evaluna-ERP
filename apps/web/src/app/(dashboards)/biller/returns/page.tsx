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
import { format } from "date-fns";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function ReturnsReviewPage() {
	const utils = trpc.useUtils();
	const [processingId, setProcessingId] = useState<number | null>(null);

	const { data: returns, isLoading } = trpc.salesReturns.list.useQuery(
		undefined,
		{
			staleTime: 10_000,
		},
	);

	const processMutation = trpc.salesReturns.process.useMutation({
		onSuccess: () => {
			toast.success("Return processed and order adjusted successfully");
			utils.salesReturns.list.invalidate();
			setProcessingId(null);
		},
		onError: (error) => {
			toast.error(`Failed to process return: ${error.message}`);
			setProcessingId(null);
		},
	});

	if (isLoading) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const pendingReturns =
		returns?.filter((r: any) => r.status === "pending") || [];

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Returns & Adjustments
				</h1>
				<p className="text-muted-foreground">
					Review and approve partial returns from drivers to adjust the final
					bill.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Pending Returns ({pendingReturns.length})</CardTitle>
					<CardDescription>
						Returns waiting for biller approval to generate refunds and restock
						inventory.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{pendingReturns.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
							<CheckCircle2 className="mb-4 h-12 w-12 text-green-500 opacity-20" />
							<p>No pending returns to review.</p>
							<p className="text-sm">All caught up!</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Return ID</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Original Order</TableHead>
									<TableHead>Refund Amount</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingReturns.map((ret: any) => (
									<TableRow key={ret.id}>
										<TableCell className="font-medium">RET-{ret.id}</TableCell>
										<TableCell>
											{format(new Date(ret.created_at), "MMM d, yyyy HH:mm")}
										</TableCell>
										<TableCell>
											{ret.customer?.name || "Unknown Customer"}
										</TableCell>
										<TableCell>INV-{ret.order_id}</TableCell>
										<TableCell className="font-semibold text-red-500">
											-â‚¹{Number(ret.total_amount).toFixed(2)}
										</TableCell>
										<TableCell className="text-right">
											<Button
												size="sm"
												disabled={processingId === ret.id}
												onClick={() => {
													setProcessingId(ret.id);
													processMutation.mutate({ id: ret.id });
												}}
											>
												{processingId === ret.id ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<CheckCircle2 className="mr-2 h-4 w-4" />
												)}
												Approve & Adjust Bill
											</Button>
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





