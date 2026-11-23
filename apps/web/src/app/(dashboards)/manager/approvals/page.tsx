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
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	EyeIcon,
	FileCheckIcon,
	Loader2Icon,
	PackageIcon,
	RefreshCcwIcon,
	UserIcon,
	XCircleIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function ApprovalsPage() {
	const t = useTranslations("manager");
	const locale = useLocale();
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [activeTab, setActiveTab] = useState<"sales_returns" | "general">(
		"sales_returns",
	);
	const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
	const [rejectReturnItem, setRejectReturnItem] = useState<any | null>(null);
	const [rejectReason, setRejectReason] = useState("");

	// Queries
	const { data: pending = [], isLoading } = trpc.manager.getApprovals.useQuery({
		status: "pending",
	});
	const { data: approved = [] } = trpc.manager.getApprovals.useQuery({
		status: "approved",
	});

	// Pending Sales Returns Query for Manager Verification
	const {
		data: pendingSalesReturns = [],
		isLoading: loadingReturns,
	} = trpc.salesReturns.list.useQuery({
		status: "pending",
	});

	// Mutations
	const reviewApprovalMutation = trpc.manager.reviewApproval.useMutation({
		onSuccess: () => {
			toast.success("Approval action logged successfully!");
			utils.manager.getApprovals.invalidate();
			utils.manager.getDashboardStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Approval action failed: ${err.message}`);
		},
	});

	const processReturnMutation = trpc.salesReturns.process.useMutation({
		onSuccess: (data: any) => {
			toast.success(
				locale === "hi"
					? `बिक्री वापसी #RET-${data.id} स्वीकृत हो गई और सामान स्टॉक में जुड़ गया!`
					: `Sales return #RET-${data.id} approved and stock restored to inventory!`,
			);
			utils.salesReturns.list.invalidate();
			if (selectedReturn?.id === data.id) {
				setSelectedReturn(null);
			}
		},
		onError: (err) => {
			toast.error(`Return approval failed: ${err.message}`);
		},
	});

	const rejectReturnMutation = trpc.salesReturns.reject.useMutation({
		onSuccess: (data: any) => {
			toast.success(
				locale === "hi"
					? `बिक्री वापसी #RET-${data.id} अस्वीकृत (Rejected) कर दी गई।`
					: `Sales return #RET-${data.id} rejected.`,
			);
			utils.salesReturns.list.invalidate();
			setRejectReturnItem(null);
			setRejectReason("");
			if (selectedReturn?.id === data.id) {
				setSelectedReturn(null);
			}
		},
		onError: (err) => {
			toast.error(`Return rejection failed: ${err.message}`);
		},
	});

	const handleAction = async (
		id: number,
		decision: "approved" | "rejected",
	) => {
		await reviewApprovalMutation.mutateAsync({
			approvalId: id,
			decision,
		});
	};

	const handleProcessSalesReturn = (id: number) => {
		if (
			confirm(
				locale === "hi"
					? `क्या आप बिक्री वापसी #RET-${id} को स्वीकृत करके इन्वेंटरी में स्टॉक जोड़ना चाहते हैं?`
					: `Approve return #RET-${id} and restore items to branch inventory?`,
			)
		) {
			processReturnMutation.mutate({ id });
		}
	};

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<FileCheckIcon className="h-6 w-6 text-blue-600" />
						{locale === "hi" ? "मैनेजर अनुमोदन इनबॉक्स" : t("approvalInboxTitle")}
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						{locale === "hi"
							? "बिक्री वापसी (Sales Returns) और आंतरिक अनुरोधों की समीक्षा व स्वीकृति करें।"
							: t("approvalInboxSub")}
					</p>
				</div>

				{/* Tab Selector */}
				<div className="flex rounded-lg border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900">
					<button
						type="button"
						onClick={() => setActiveTab("sales_returns")}
						className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-medium text-xs transition-colors ${
							activeTab === "sales_returns"
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
								: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
						}`}
					>
						<RefreshCcwIcon className="h-3.5 w-3.5" />
						<span>{locale === "hi" ? "बिक्री वापसी (Sales Returns)" : "Sales Returns"}</span>
						{pendingSalesReturns.length > 0 && (
							<Badge className="h-5 px-1.5 text-[10px] bg-amber-500 text-white hover:bg-amber-500">
								{pendingSalesReturns.length}
							</Badge>
						)}
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("general")}
						className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-medium text-xs transition-colors ${
							activeTab === "general"
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
								: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
						}`}
					>
						<FileCheckIcon className="h-3.5 w-3.5" />
						<span>{locale === "hi" ? "सामान्य अनुरोध" : "General Approvals"}</span>
						{pending.length > 0 && (
							<Badge className="h-5 px-1.5 text-[10px] bg-blue-600 text-white hover:bg-blue-600">
								{pending.length}
							</Badge>
						)}
					</button>
				</div>
			</div>

			{/* TAB 1: SALES RETURNS APPROVALS */}
			{activeTab === "sales_returns" && (
				<div className="space-y-4">
					<Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-950">
						<CardHeader className="border-slate-100 border-b bg-slate-50/70 pb-3 dark:border-slate-800 dark:bg-slate-900/50">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<div>
									<CardTitle className="font-bold text-slate-900 text-sm dark:text-slate-100">
										{locale === "hi"
											? `लंबित बिक्री वापसी समीक्षा (${pendingSalesReturns.length})`
											: `Pending Sales Returns for Verification (${pendingSalesReturns.length})`}
									</CardTitle>
									<CardDescription className="text-slate-500 text-xs dark:text-slate-400">
										{locale === "hi"
											? "ग्राहक द्वारा वापस किए गए सामान को सत्यापित करके इन्वेंटरी में स्टॉक बहाल करें।"
											: "Verify returned items from sales orders and authorize stock restoration into branch inventory."}
									</CardDescription>
								</div>
								{pendingSalesReturns.length > 0 && (
									<Badge className="self-start sm:self-auto bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300">
										{locale === "hi" ? "सत्यापन आवश्यक" : "Action Required"}
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{loadingReturns ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : pendingSalesReturns.length > 0 ? (
								<div className="divide-y divide-slate-100 dark:divide-slate-800">
									{pendingSalesReturns.map((ret: any) => {
										const items = ret.returnItems || [];
										const totalRefund = Number(ret.total_amount || 0);

										return (
											<div key={ret.id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
												<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
													{/* Return Details */}
													<div className="space-y-2 flex-1">
														<div className="flex flex-wrap items-center gap-2">
															<span className="font-bold text-primary text-sm">
																#RET-{ret.id}
															</span>
															<Badge
																variant="outline"
																className="border-slate-200 text-[11px] font-mono text-slate-700 dark:border-slate-700 dark:text-slate-300"
															>
																{ret.order?.bill_number || `Order #${ret.order_id}`}
															</Badge>
															<Badge className="border-amber-200 bg-amber-50 text-[10px] text-amber-700 uppercase font-bold dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
																{ret.status || "Pending"}
															</Badge>
															<span className="text-[11px] text-slate-400 dark:text-slate-500">
																{ret.created_at
																	? new Date(ret.created_at).toLocaleString(
																			locale === "hi" ? "hi-IN" : "en-IN",
																		)
																	: ""}
															</span>
														</div>

														{/* Customer Info */}
														<div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
															<UserIcon className="h-3.5 w-3.5 text-slate-400" />
															<span className="font-semibold text-slate-800 dark:text-slate-200">
																{ret.customer?.name || "Customer / ग्राहक"}
															</span>
															{ret.customer?.phone && (
																<span className="font-mono text-slate-500">
																	({ret.customer.phone})
																</span>
															)}
														</div>

														{/* Reason or Note if present */}
														{(ret.reason || ret.notes) && (
															<p className="text-xs text-amber-700 dark:text-amber-400 italic">
																Reason: {ret.reason || ret.notes}
															</p>
														)}

														{/* Returned Items preview */}
														<div className="mt-2 space-y-1">
															<p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
																{locale === "hi" ? "वापस सामान" : "Returned Line Items"}:
															</p>
															<div className="flex flex-wrap gap-1.5">
																{items.map((it: any, idx: number) => (
																	<span
																		key={idx}
																		className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
																	>
																		<PackageIcon className="h-3 w-3 text-slate-400" />
																		<span className="font-medium">{it.product?.name || "Product"}</span>
																		<span className="font-bold text-slate-900 dark:text-slate-100">
																			× {it.quantity} {it.product?.unit || ""}
																		</span>
																		{it.condition && (
																			<span className="text-[10px] text-amber-600">
																				({it.condition})
																			</span>
																		)}
																	</span>
																))}
																{items.length === 0 && (
																	<span className="text-xs text-slate-400 italic">
																		Direct return without line item breakdown
																	</span>
																)}
															</div>
														</div>
													</div>

													{/* Amount and Action Buttons */}
													<div className="flex flex-row lg:flex-col lg:items-end justify-between items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
														<div className="text-left lg:text-right">
															<span className="block font-bold text-rose-600 text-lg dark:text-rose-400">
																{formatCurrency(totalRefund, locale)}
															</span>
															<span className="text-[11px] text-slate-400">
																{locale === "hi" ? "कुल वापसी राशि" : "Refund Amount"}
															</span>
														</div>

														<div className="flex items-center gap-2">
															<Button
																size="sm"
																variant="outline"
																onClick={() => setSelectedReturn(ret)}
																className="h-8 gap-1 text-xs"
															>
																<EyeIcon className="h-3.5 w-3.5" />
																{locale === "hi" ? "विवरण" : "Details"}
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setRejectReturnItem(ret);
																	setRejectReason("");
																}}
																disabled={rejectReturnMutation.isPending || processReturnMutation.isPending}
																className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50 text-xs dark:border-rose-900 dark:text-rose-400"
															>
																<XCircleIcon className="h-3.5 w-3.5 mr-1" />
																{locale === "hi" ? "अस्वीकार" : "Reject"}
															</Button>
															<Button
																size="sm"
																onClick={() => handleProcessSalesReturn(ret.id)}
																disabled={processReturnMutation.isPending || rejectReturnMutation.isPending}
																className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
															>
																{processReturnMutation.isPending ? (
																	<Loader2Icon className="h-3.5 w-3.5 mr-1 animate-spin" />
																) : (
																	<CheckCircle2Icon className="h-3.5 w-3.5 mr-1" />
																)}
																{locale === "hi" ? "स्वीकारें व स्टॉक जोड़ें" : "Approve & Stock"}
															</Button>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="py-14 text-center">
									<CheckCircle2Icon className="mx-auto mb-2 h-9 w-9 text-emerald-500 opacity-80" />
									<p className="font-semibold text-slate-800 text-sm dark:text-slate-200">
										{locale === "hi"
											? "कोई लंबित बिक्री वापसी नहीं है!"
											: "No Pending Sales Returns to Verify!"}
									</p>
									<p className="mt-1 text-slate-400 text-xs dark:text-slate-500">
										{locale === "hi"
											? "सभी ग्राहक बिक्री वापसी सत्यापित और प्रोसेस की जा चुकी हैं।"
											: "All customer sales returns have been reviewed and restored to inventory."}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* TAB 2: GENERAL APPROVALS */}
			{activeTab === "general" && (
				<div className="grid gap-6 md:grid-cols-2">
					{/* Pending Approvals */}
					<Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-950">
						<CardHeader className="border-slate-100 border-b bg-slate-50/70 pb-3 dark:border-slate-800 dark:bg-slate-900/50">
							<CardTitle className="font-bold text-slate-900 text-sm dark:text-slate-100">
								{t("pendingReviewHeader", { count: pending.length })}
							</CardTitle>
							<CardDescription className="text-slate-500 text-xs dark:text-slate-400">
								{t("pendingReviewSub")}
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{isLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : pending.length > 0 ? (
								<div className="divide-y divide-slate-100 dark:divide-slate-800">
									{pending.map((app) => (
										<div key={app.id} className="space-y-3 p-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Badge className="border border-amber-200 bg-amber-50 font-bold text-[10px] text-amber-700 capitalize tracking-wide dark:border-amber-800/50 dark:bg-amber-950/60 dark:text-amber-300">
														{app.reference_type}
													</Badge>
													<span className="font-bold text-slate-900 text-xs dark:text-slate-100">
														ID #{app.reference_id}
													</span>
												</div>
												<span className="text-[10px] text-slate-400 dark:text-slate-500">
													{t("createdLabel", {
														date: app.created_at
															? new Date(app.created_at).toLocaleDateString()
															: "",
													})}
												</span>
											</div>
											<p className="text-slate-600 text-xs dark:text-slate-400">
												{t("requestedByStaffMember", { id: app.requested_by })}
											</p>
											<div className="flex gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleAction(app.id, "rejected")}
													disabled={reviewApprovalMutation.isPending}
													className="h-7 flex-1 border-red-200 text-[11px] text-red-600 hover:bg-red-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/50"
												>
													<XCircleIcon className="mr-1 h-3.5 w-3.5" />{" "}
													{t("reject")}
												</Button>
												<Button
													size="sm"
													onClick={() => handleAction(app.id, "approved")}
													disabled={reviewApprovalMutation.isPending}
													className="h-7 flex-1 bg-blue-600 text-[11px] text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
												>
													<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />{" "}
													{t("approve")}
												</Button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="py-12 text-center text-slate-400 text-xs dark:text-slate-500">
									{t("noPendingRequestsGreatJob")}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Recently Approved / History */}
					<Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-950">
						<CardHeader className="border-slate-100 border-b bg-slate-50/70 pb-3 dark:border-slate-800 dark:bg-slate-900/50">
							<CardTitle className="font-bold text-slate-900 text-sm dark:text-slate-100">
								{t("approvedHistoryHeader", { count: approved.length })}
							</CardTitle>
							<CardDescription className="text-slate-500 text-xs dark:text-slate-400">
								{t("approvedHistorySub")}
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{approved.length > 0 ? (
								<div className="divide-y divide-slate-100 dark:divide-slate-800">
									{approved.slice(0, 5).map((app) => (
										<div
											key={app.id}
											className="flex items-center justify-between p-4"
										>
											<div>
												<div className="flex items-center gap-2">
													<Badge
														variant="outline"
														className="border-slate-200 text-[10px] text-slate-700 capitalize dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
													>
														{app.reference_type}
													</Badge>
													<span className="font-bold text-slate-900 text-xs dark:text-slate-100">
														ID #{app.reference_id}
													</span>
												</div>
												<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
													{t("approvedOnLabel", {
														date: app.resolved_at
															? new Date(app.resolved_at).toLocaleDateString()
															: "",
													})}
												</p>
											</div>
											<Badge className="border-emerald-200 bg-emerald-100 text-[10px] text-emerald-800 capitalize dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300">
												{t("approve")}
											</Badge>
										</div>
									))}
								</div>
							) : (
								<div className="py-12 text-center text-slate-400 text-xs dark:text-slate-500">
									{t("noPastApprovalsFound")}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Full Sales Return Details Modal */}
			<Dialog
				open={!!selectedReturn}
				onOpenChange={(open) => {
					if (!open) setSelectedReturn(null);
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<RefreshCcwIcon className="h-5 w-5 text-primary" />
							<span>
								{locale === "hi" ? "वापसी विवरण" : "Sales Return Verification"} #RET-
								{selectedReturn?.id}
							</span>
						</DialogTitle>
						<DialogDescription>
							{locale === "hi"
								? "ग्राहक द्वारा वापस किए गए सामान और स्टॉक बहाली का विवरण"
								: "Detailed breakdown of customer return items, refund amount, and stock restoration"}
						</DialogDescription>
					</DialogHeader>

					{selectedReturn && (
						<div className="space-y-4 pt-2">
							{/* Summary Details */}
							<div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:grid-cols-4">
								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "ग्राहक" : "Customer"}
									</span>
									<span className="font-semibold text-foreground text-sm">
										{selectedReturn.customer?.name || "N/A"}
									</span>
									{selectedReturn.customer?.phone && (
										<span className="block text-xs text-muted-foreground">
											{selectedReturn.customer.phone}
										</span>
									)}
								</div>

								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "मूल बिल / ऑर्डर" : "Original Order"}
									</span>
									<span className="font-semibold text-foreground text-sm">
										{selectedReturn.order?.bill_number || `#${selectedReturn.order_id}`}
									</span>
								</div>

								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "तारीख" : "Date"}
									</span>
									<span className="font-medium text-foreground text-xs">
										{selectedReturn.created_at
											? new Date(selectedReturn.created_at).toLocaleString(
													locale === "hi" ? "hi-IN" : "en-IN",
												)
											: "-"}
									</span>
								</div>

								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "स्थिति" : "Status"}
									</span>
									<Badge
										variant="outline"
										className="mt-0.5 text-xs font-semibold capitalize border-amber-500 text-amber-600"
									>
										{selectedReturn.status || "pending"}
									</Badge>
								</div>
							</div>

							{/* Returned Items Table */}
							<div>
								<h4 className="mb-2 font-semibold text-sm">
									{locale === "hi" ? "वापस सामान सूची (Returned Items)" : "Returned Items"}
								</h4>
								<div className="overflow-hidden rounded-lg border border-border/60">
									<table className="w-full text-left text-xs">
										<thead className="bg-muted/50 font-medium text-muted-foreground">
											<tr>
												<th className="p-2.5">Product</th>
												<th className="p-2.5 text-center">Qty</th>
												<th className="p-2.5 text-right">Price</th>
												<th className="p-2.5 text-right">Refund Total</th>
												<th className="p-2.5">Reason / Condition</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/40">
											{(selectedReturn.returnItems || []).map((item: any, idx: number) => (
												<tr key={idx} className="hover:bg-muted/10">
													<td className="p-2.5">
														<p className="font-medium text-foreground">
															{item.product?.name || `Product #${item.id}`}
														</p>
														{item.product?.sku && (
															<p className="font-mono text-[10px] text-muted-foreground">
																{item.product.sku}
															</p>
														)}
													</td>
													<td className="p-2.5 text-center font-semibold">
														{item.quantity} {item.product?.unit || ""}
													</td>
													<td className="p-2.5 text-right">
														{formatCurrency(Number(item.price || 0), locale)}
													</td>
													<td className="p-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
														{formatCurrency(Number(item.refund_amount || 0), locale)}
													</td>
													<td className="p-2.5">
														<span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
															{item.reason || item.condition || "Delivery Return"}
														</span>
													</td>
												</tr>
											))}
										</tbody>
										<tfoot className="border-t border-border/60 bg-muted/20 font-semibold">
											<tr>
												<td colSpan={3} className="p-2.5 text-right">
													{locale === "hi" ? "कुल वापसी राशि:" : "Total Refund:"}
												</td>
												<td className="p-2.5 text-right font-bold text-rose-600 text-sm dark:text-rose-400">
													{formatCurrency(Number(selectedReturn.total_amount), locale)}
												</td>
												<td></td>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>

							{/* Actions in Modal */}
							{selectedReturn.status === "pending" && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
									<div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
										<AlertTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
										<div>
											<p className="font-semibold">
												{locale === "hi" ? "समीक्षा और स्टॉक बहाली" : "Authorize Return"}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{locale === "hi"
													? "स्वीकृत करने पर यह सामान तुरंत इन्वेंटरी में जुड़ जाएगा और रिफंड वाउचर रिकॉर्ड होगा।"
													: "Approving will restore all items into branch inventory and record refund entry."}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
										<Button
											variant="outline"
											size="sm"
											disabled={rejectReturnMutation.isPending || processReturnMutation.isPending}
											onClick={() => {
												setRejectReturnItem(selectedReturn);
												setRejectReason("");
											}}
											className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50 text-xs dark:border-rose-800 dark:text-rose-400"
										>
											<XCircleIcon className="mr-1 h-3.5 w-3.5" />
											{locale === "hi" ? "अस्वीकार करें" : "Reject"}
										</Button>
										<Button
											size="sm"
											disabled={processReturnMutation.isPending || rejectReturnMutation.isPending}
											onClick={() => handleProcessSalesReturn(selectedReturn.id)}
											className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
										>
											{processReturnMutation.isPending ? (
												<Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
											) : (
												<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />
											)}
											{locale === "hi" ? "स्वीकारें व स्टॉक जोड़ें" : "Approve & Add to Stock"}
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Rejection Reason Dialog */}
			<Dialog
				open={!!rejectReturnItem}
				onOpenChange={(open) => {
					if (!open) {
						setRejectReturnItem(null);
						setRejectReason("");
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
							<XCircleIcon className="h-5 w-5" />
							<span>
								{locale === "hi" ? "वापसी अस्वीकार करें" : "Reject Sales Return"} #RET-
								{rejectReturnItem?.id}
							</span>
						</DialogTitle>
						<DialogDescription>
							{locale === "hi"
								? "कृपया इस बिक्री वापसी को अस्वीकार करने का कारण दर्ज करें:"
								: "Please enter the reason for rejecting this return request:"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<Textarea
							placeholder={
								locale === "hi"
									? "अस्वीकृति का कारण (उदा. सील टूटी हुई, समयावधि समाप्त)..."
									: "Rejection reason (e.g. Broken packaging, expired return window)..."
							}
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
							className="text-sm"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setRejectReturnItem(null)}
							disabled={rejectReturnMutation.isPending}
						>
							{locale === "hi" ? "रद्द करें" : "Cancel"}
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={rejectReturnMutation.isPending}
							onClick={() => {
								if (rejectReturnItem) {
									rejectReturnMutation.mutate({
										id: rejectReturnItem.id,
										reason: rejectReason || undefined,
									});
								}
							}}
						>
							{rejectReturnMutation.isPending ? (
								<Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
							) : (
								<XCircleIcon className="mr-1 h-3.5 w-3.5" />
							)}
							{locale === "hi" ? "अस्वीकार करें" : "Confirm Reject"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
