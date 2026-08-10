"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import { CheckIcon, Loader2Icon, ShieldCheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function FinanceApprovalsPage() {
	const utils = trpc.useUtils();

	const { data: pendingApprovals, isLoading: loadingPending } =
		trpc.approvals.getApprovals.useQuery({ status: "pending" });

	const { data: approvedApprovals, isLoading: loadingApproved } =
		trpc.approvals.getApprovals.useQuery({ status: "approved" });

	const { data: rejectedApprovals, isLoading: loadingRejected } =
		trpc.approvals.getApprovals.useQuery({ status: "rejected" });

	const updateStatusMutation = trpc.approvals.updateStatus.useMutation({
		onSuccess: (data) => {
			toast.success(`Request ${data.status} successfully.`);
			utils.approvals.getApprovals.invalidate();
		},
		onError: (error) => {
			toast.error(`Error: ${error.message}`);
		},
	});

	const renderTable = (
		data: any[],
		isLoading: boolean,
		showActions = false,
	) => {
		if (isLoading) {
			return (
				<div className="space-y-4 p-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			);
		}

		if (!data || data.length === 0) {
			return (
				<div className="p-8 text-center text-muted-foreground">
					No approvals found.
				</div>
			);
		}

		return (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Reference</TableHead>
						<TableHead>Requested By</TableHead>
						<TableHead>Reason</TableHead>
						<TableHead>Date</TableHead>
						{showActions && (
							<TableHead className="text-right">Actions</TableHead>
						)}
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((item) => (
						<TableRow key={item.id}>
							<TableCell className="font-medium">{item.id}</TableCell>
							<TableCell>
								<div className="flex flex-col">
									<span className="capitalize">
										{item.referenceType.replace("_", " ")}
									</span>
									<span className="text-muted-foreground text-xs">
										{item.referenceId}
									</span>
								</div>
							</TableCell>
							<TableCell>{item.requestedBy}</TableCell>
							<TableCell className="max-w-[200px] truncate" title={item.reason}>
								{item.reason}
							</TableCell>
							<TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
							{showActions && (
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											size="icon"
											className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-900/50 dark:hover:bg-green-900/20"
											disabled={updateStatusMutation.isPending}
											onClick={() =>
												updateStatusMutation.mutate({
													id: item.id,
													status: "approved",
												})
											}
										>
											<CheckIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20"
											disabled={updateStatusMutation.isPending}
											onClick={() =>
												updateStatusMutation.mutate({
													id: item.id,
													status: "rejected",
												})
											}
										>
											<XIcon className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		);
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
					<ShieldCheckIcon className="h-6 w-6 text-foreground" />
				</div>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Finance Approvals
					</h1>
					<p className="text-muted-foreground text-sm">
						Review and approve financial transactions and expenses.
					</p>
				</div>
			</div>

			<Tabs defaultValue="pending" className="flex-1">
				<TabsList>
					<TabsTrigger value="pending">
						Pending ({pendingApprovals?.length || 0})
					</TabsTrigger>
					<TabsTrigger value="approved">Approved</TabsTrigger>
					<TabsTrigger value="rejected">Rejected</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="pending" className="m-0">
						<Card>
							<CardHeader>
								<CardTitle>Pending Approvals</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								{renderTable(pendingApprovals || [], loadingPending, true)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="approved" className="m-0">
						<Card>
							<CardHeader>
								<CardTitle>Approved Requests</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								{renderTable(approvedApprovals || [], loadingApproved, false)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="rejected" className="m-0">
						<Card>
							<CardHeader>
								<CardTitle>Rejected Requests</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								{renderTable(rejectedApprovals || [], loadingRejected, false)}
							</CardContent>
						</Card>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
