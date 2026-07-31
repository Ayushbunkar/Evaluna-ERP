"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
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
	AlertCircle,
	Check,
	CheckCircle,
	FileText,
	IndianRupee,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function FinanceApprovalsPage() {
	const [filter, setFilter] = useState("pending");
	const trpc = useTRPC();

	const {
		data: approvals,
		refetch,
		isLoading,
	} = trpc.approvals.getApprovals.useQuery({
		status: filter === "all" ? undefined : filter,
	});

	const updateStatus = trpc.approvals.updateStatus.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const handleApprove = (id: string) => {
		updateStatus.mutate({ id, status: "approved" });
	};

	const handleReject = (id: string) => {
		updateStatus.mutate({ id, status: "rejected" });
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					Finance Approvals Engine
				</h1>
				<p className="mt-2 text-muted-foreground">
					Manage discounts, returns, credit limit requests, and expense claims.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Requests
						</CardTitle>
						<AlertCircle className="h-4 w-4 text-amber-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">12</div>
						<p className="text-muted-foreground text-xs">Requires attention</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Approved Today
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">4</div>
						<p className="text-muted-foreground text-xs">Processed</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Rejected Today
						</CardTitle>
						<XCircle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">1</div>
						<p className="text-muted-foreground text-xs">Declined</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Total Value</CardTitle>
						<IndianRupee className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">₹ 1,45,200</div>
						<p className="text-muted-foreground text-xs">
							Pending approval value
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-primary" />
						<CardTitle>Approval Queue</CardTitle>
					</div>
					<div className="flex gap-2">
						<Button
							variant={filter === "all" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("all")}
						>
							All
						</Button>
						<Button
							variant={filter === "pending" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("pending")}
						>
							Pending
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-32 items-center justify-center text-muted-foreground">
							Loading approvals...
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Request ID</TableHead>
										<TableHead>Reference Type</TableHead>
										<TableHead>Ref ID</TableHead>
										<TableHead>Requested By</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Reason</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{approvals?.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} className="h-24 text-center">
												No requests found.
											</TableCell>
										</TableRow>
									) : (
										approvals?.map((item) => (
											<TableRow key={item.id}>
												<TableCell className="font-medium">{item.id}</TableCell>
												<TableCell>
													<Badge variant="outline">{item.referenceType}</Badge>
												</TableCell>
												<TableCell>{item.referenceId}</TableCell>
												<TableCell>{item.requestedBy}</TableCell>
												<TableCell>
													₹{" "}
													{item.amount.toLocaleString("en-IN", {
														minimumFractionDigits: 2,
													})}
												</TableCell>
												<TableCell
													className="max-w-[200px] truncate"
													title={item.reason}
												>
													{item.reason}
												</TableCell>
												<TableCell>
													{item.status === "pending" && (
														<Badge className="border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
															Pending
														</Badge>
													)}
													{item.status === "approved" && (
														<Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
															Approved
														</Badge>
													)}
													{item.status === "rejected" && (
														<Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
															Rejected
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-right">
													{item.status === "pending" && (
														<div className="flex justify-end gap-2">
															<Button
																variant="outline"
																size="sm"
																className="h-8 w-8 border-green-200 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
																onClick={() => handleApprove(item.id)}
																disabled={updateStatus.isPending}
															>
																<Check className="h-4 w-4" />
																<span className="sr-only">Approve</span>
															</Button>
															<Button
																variant="outline"
																size="sm"
																className="h-8 w-8 border-red-200 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
																onClick={() => handleReject(item.id)}
																disabled={updateStatus.isPending}
															>
																<X className="h-4 w-4" />
																<span className="sr-only">Reject</span>
															</Button>
														</div>
													)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
