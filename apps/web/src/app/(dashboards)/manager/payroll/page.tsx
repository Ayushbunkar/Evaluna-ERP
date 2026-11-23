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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	Filter,
	History,
	IndianRupee,
	Loader2,
	Lock,
	RotateCcw,
	Search,
	ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

function formatINR(amount: number | string | null | undefined) {
	const val = Number(amount || 0);
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(val);
}

export default function ManagerPayrollPage() {
	const t = useTranslations("payroll");
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [selectedMonth, setSelectedMonth] = useState(
		new Date().toISOString().substring(0, 7),
	);
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");

	// Modals
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<any>(null);

	const [returnModalOpen, setReturnModalOpen] = useState(false);
	const [returnReason, setReturnReason] = useState("");

	const [confirmBatchApproveOpen, setConfirmBatchApproveOpen] = useState(false);
	const [approvingRowId, setApprovingRowId] = useState<number | null>(null);

	// Queries
	const {
		data: payrollList = [],
		isLoading,
		isRefetching,
	} = trpc.payroll.list.useQuery({
		month: selectedMonth,
		team: selectedTeam !== "all" ? selectedTeam : undefined,
		search: searchTerm || undefined,
	});

	const { data: auditHistory = [], isLoading: auditLoading } =
		trpc.payroll.getAuditHistory.useQuery(
			{ payrollId: selectedRecord?.id ?? 0 },
			{ enabled: !!selectedRecord?.id },
		);

	// Mutations
	const approveMutation = trpc.payroll.managerApprove.useMutation({
		onSuccess: (data) => {
			toast.success(
				`${data.approvedCount} payroll record(s) approved and sent to Finance!`,
			);
			setReviewModalOpen(false);
			setConfirmBatchApproveOpen(false);
			setSelectedRecord(null);
			utils.payroll.list.invalidate();
			utils.payroll.getSummaryStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Approval failed: ${err.message}`);
		},
	});

	const returnMutation = trpc.payroll.managerReturn.useMutation({
		onSuccess: (data) => {
			toast.success(
				`${data.returnedCount} payroll record(s) returned to HR with mandatory reason.`,
			);
			setReturnModalOpen(false);
			setReviewModalOpen(false);
			setReturnReason("");
			setSelectedRecord(null);
			utils.payroll.list.invalidate();
			utils.payroll.getSummaryStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Return failed: ${err.message}`);
		},
	});

	// Handlers
	const handleOpenReview = (record: any) => {
		setSelectedRecord(record);
		setReviewModalOpen(true);
	};

	const handleRowApprove = (record: any) => {
		if (!record) return;
		setApprovingRowId(record.id);
		approveMutation.mutate(
			{ id: record.id },
			{
				onSettled: () => {
					setApprovingRowId(null);
				},
			},
		);
	};

	const handleApproveSingle = () => {
		if (!selectedRecord) return;
		approveMutation.mutate({
			id: selectedRecord.id,
		});
	};

	const handleOpenReturnDialog = () => {
		setReturnReason("");
		setReturnModalOpen(true);
	};

	const handleConfirmReturn = () => {
		if (!selectedRecord) return;
		if (!returnReason.trim() || returnReason.trim().length < 3) {
			toast.error(
				"A mandatory explanation of at least 3 characters is required",
			);
			return;
		}
		returnMutation.mutate({
			id: selectedRecord.id,
			reason: returnReason.trim(),
		});
	};

	const handleBatchApprove = () => {
		approveMutation.mutate({
			month: selectedMonth,
			ids: pendingApprovalList.map((r) => r.id),
		});
	};

	const handleExport = () => {
		if (!payrollList.length) {
			toast.info("No records to export");
			return;
		}
		const csvRows = [
			[
				"Staff Code",
				"Employee Name",
				"Team",
				"Month",
				"Working Days",
				"Present",
				"Paid Leave",
				"Overtime Hours",
				"System Calculated",
				"HR Adjustment",
				"Adjustment Reason",
				"Final Pay",
				"Status",
				"Submitted By",
			],
			...payrollList.map((r) => [
				r.staff?.staff_code || "",
				r.staff?.name || "",
				r.staff?.department || "General",
				r.month,
				r.working_days || 30,
				r.present_days || 0,
				r.paid_leave_days || 0,
				r.overtime_hours || 0,
				r.system_calculated_amount || r.base_salary,
				r.adjustment_amount || 0,
				r.adjustment_reason || "",
				r.net_payable,
				r.status,
				r.submitted_by || "",
			]),
		];
		const blob = new Blob([csvRows.map((e) => e.join(",")).join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `manager_payroll_${selectedMonth}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success("Payroll register exported!");
	};

	// Filters
	const teams = Array.from(
		new Set(
			payrollList.map((r) => r.staff?.department || "General").filter(Boolean),
		),
	);

	const pendingApprovalList = payrollList.filter(
		(r) => r.status === "submitted_to_manager",
	);

	const totalNetPayable = payrollList.reduce(
		(sum, p) => sum + Number(p.net_payable || 0),
		0,
	);
	const totalPendingSignoff = pendingApprovalList.length;
	const totalAuthorized = payrollList.filter(
		(p) =>
			p.status === "manager_approved" ||
			p.status === "paid" ||
			p.status === "locked",
	).length;

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "draft":
			case "hr_review":
				return (
					<Badge
						variant="outline"
						className="border-blue-200 bg-blue-50 text-blue-700"
					>
						{t("statusHrReview")}
					</Badge>
				);
			case "submitted_to_manager":
				return (
					<Badge
						variant="outline"
						className="border-amber-300 bg-amber-50 font-bold text-amber-800"
					>
						<Clock className="mr-1 inline h-3 w-3" />{" "}
						{t("statusSubmittedToManager")}
					</Badge>
				);
			case "returned_to_hr":
				return (
					<Badge
						variant="outline"
						className="border-rose-300 bg-rose-50 text-rose-700"
					>
						{t("statusReturnedToHr")}
					</Badge>
				);
			case "manager_approved":
				return (
					<Badge
						variant="outline"
						className="border-emerald-200 bg-emerald-50 font-bold text-emerald-700"
					>
						<CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-600" />{" "}
						{t("statusManagerApproved")}
					</Badge>
				);
			case "paid":
			case "locked":
				return (
					<Badge className="bg-emerald-600 font-semibold text-white">
						<Lock className="mr-1 inline h-3 w-3" /> {t("statusPaid")}
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	return (
		<PageTransition className="container mx-auto space-y-6 py-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl text-slate-900 tracking-tight dark:text-slate-100">
						<IndianRupee className="h-7 w-7 text-blue-600" />
						Manager Payroll Authorization
					</h1>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Review HR-submitted attendance metrics, manual salary adjustments,
						and authorize payments.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
						<Calendar className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
						<input
							type="month"
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(e.target.value)}
							className="h-7 w-36 cursor-pointer border-0 bg-transparent p-0 font-medium text-foreground text-xs focus:outline-none sm:w-40 sm:text-sm dark:text-slate-100"
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						className="gap-1.5 text-xs"
					>
						<Download className="h-4 w-4" />
						{t("exportRegister")}
					</Button>
				</div>
			</div>

			{/* Top Metric Cards */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
				<Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
					<CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
						<div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<IndianRupee className="h-6 w-6" />
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<div className="truncate font-medium text-slate-500 text-xs dark:text-slate-400">
								Total Net Payable ({selectedMonth})
							</div>
							<div
								className="mt-1 truncate font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100"
								title={formatINR(totalNetPayable)}
							>
								{formatINR(totalNetPayable)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="overflow-hidden border-l-4 border-l-amber-500 shadow-sm dark:border-slate-800">
					<CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
						<div className="shrink-0 rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<Clock className="h-6 w-6" />
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<div className="truncate font-medium text-slate-500 text-xs dark:text-slate-400">
								Pending Manager Sign-off
							</div>
							<div
								className="mt-1 truncate font-bold text-amber-600 text-xl tracking-tight sm:text-2xl dark:text-amber-400"
								title={String(totalPendingSignoff)}
							>
								{totalPendingSignoff}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm dark:border-slate-800">
					<CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
						<div className="shrink-0 rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<div className="truncate font-medium text-slate-500 text-xs dark:text-slate-400">
								Authorized / Disbursed
							</div>
							<div
								className="mt-1 truncate font-bold text-emerald-600 text-xl tracking-tight sm:text-2xl dark:text-emerald-400"
								title={String(totalAuthorized)}
							>
								{totalAuthorized}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search, Filter & Batch Approve Header */}
			<div className="flex flex-col gap-3 rounded-lg border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900">
				<div className="flex flex-wrap items-center gap-2.5">
					<div className="relative w-full sm:w-64">
						<Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder={t("searchPlaceholder")}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="h-9 pl-8 text-xs"
						/>
					</div>

					<div className="flex items-center gap-1.5 text-slate-500 text-xs">
						<Filter className="h-3.5 w-3.5" />
						<select
							value={selectedTeam}
							onChange={(e) => setSelectedTeam(e.target.value)}
							className="h-9 rounded-md border border-input bg-background px-2.5 font-medium text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="all">{t("allTeams")}</option>
							{teams.map((tm) => (
								<option key={tm} value={tm}>
									{tm}
								</option>
							))}
						</select>
					</div>
				</div>

				<div>
					<Button
						size="sm"
						onClick={() => setConfirmBatchApproveOpen(true)}
						disabled={totalPendingSignoff === 0 || approveMutation.isPending}
						className="w-full gap-1.5 bg-emerald-600 font-semibold text-white text-xs shadow-sm hover:bg-emerald-700 sm:w-auto"
					>
						{approveMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<CheckCircle2 className="h-3.5 w-3.5" />
						)}
						{t("approve")} All Pending ({totalPendingSignoff})
					</Button>
				</div>
			</div>

			{/* Table Card */}
			<Card className="overflow-hidden shadow-sm">
				<CardHeader className="border-b bg-slate-50/50 px-6 py-4 dark:bg-slate-900/50">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="font-bold text-base">
								Team Payroll Submissions
							</CardTitle>
							<CardDescription className="text-xs">
								Inspect attendance computations, review HR manual adjustments
								with reasons, and authorize disbursements.
							</CardDescription>
						</div>
						{isRefetching && (
							<Loader2 className="h-4 w-4 animate-spin text-blue-500" />
						)}
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center gap-2 py-16 text-slate-400">
							<Loader2 className="h-5 w-5 animate-spin" />
							<span>Loading payroll approvals...</span>
						</div>
					) : payrollList.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
							<AlertCircle className="h-8 w-8 text-slate-300" />
							<p className="font-semibold text-sm">{t("noRecordsFound")}</p>
						</div>
					) : (
						<>
							{/* Desktop View Table */}
							<div className="-webkit-overflow-scrolling-touch hidden w-full overflow-x-auto lg:block">
								<Table className="w-full min-w-[900px] text-xs">
									<TableHeader>
										<TableRow className="bg-slate-50 dark:bg-slate-900/60">
											<TableHead className="px-4 py-3 font-bold">
												{t("employee")}
											</TableHead>
											<TableHead className="px-3 py-3 font-bold">
												{t("team")}
											</TableHead>
											<TableHead className="px-2 py-3 text-center font-bold text-emerald-600">
												{t("present")}
											</TableHead>
											<TableHead className="px-2 py-3 text-center font-bold text-blue-600">
												{t("paidLeave")}
											</TableHead>
											<TableHead className="px-2 py-3 text-center font-bold text-purple-600">
												{t("overtime")}
											</TableHead>
											<TableHead className="px-3 py-3 text-right font-bold">
												{t("systemCalculated")}
											</TableHead>
											<TableHead className="px-3 py-3 text-right font-bold">
												{t("hrAdjustment")}
											</TableHead>
											<TableHead className="px-4 py-3 text-right font-bold">
												{t("finalPay")}
											</TableHead>
											<TableHead className="px-3 py-3 text-center font-bold">
												{t("status")}
											</TableHead>
											<TableHead className="px-3 py-3 font-bold">
												Submitted By
											</TableHead>
											<TableHead className="px-4 py-3 text-right font-bold">
												{t("actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
										{payrollList.map((row) => {
											const isPendingApproval =
												row.status === "submitted_to_manager";
											const adj = Number(row.adjustment_amount || 0);

											return (
												<TableRow
													key={row.id}
													className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
												>
													<TableCell className="px-4 py-3">
														<div className="font-bold text-slate-900 dark:text-slate-100">
															{row.staff?.name || `Staff #${row.staff_id}`}
														</div>
														<div className="font-mono text-[10px] text-slate-400">
															{row.staff?.staff_code || `ID-${row.staff_id}`}
														</div>
													</TableCell>
													<TableCell className="px-3 py-3">
														<Badge
															variant="outline"
															className="text-[10px] capitalize"
														>
															{row.staff?.department || "General"}
														</Badge>
													</TableCell>
													<TableCell className="px-2 py-3 text-center font-semibold text-emerald-600">
														{Number(row.present_days || 0)}
													</TableCell>
													<TableCell className="px-2 py-3 text-center font-semibold text-blue-600">
														{Number(row.paid_leave_days || 0)}
													</TableCell>
													<TableCell className="px-2 py-3 text-center font-semibold text-purple-600">
														{Number(row.overtime_hours || 0)}h
													</TableCell>
													<TableCell className="px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
														{formatINR(
															row.system_calculated_amount || row.base_salary,
														)}
													</TableCell>
													<TableCell className="px-3 py-3 text-right font-medium">
														{adj !== 0 ? (
															<span
																className={`rounded px-1.5 py-0.5 font-bold text-[11px] ${
																	adj > 0
																		? "border border-emerald-200 bg-emerald-50 text-emerald-700"
																		: "border border-rose-200 bg-rose-50 text-rose-700"
																}`}
																title={row.adjustment_reason || "HR Adjustment"}
															>
																{adj > 0
																	? `+${formatINR(adj)}`
																	: formatINR(adj)}
															</span>
														) : (
															<span className="text-slate-400">—</span>
														)}
													</TableCell>
													<TableCell className="px-4 py-3 text-right font-bold text-slate-900 text-sm dark:text-slate-100">
														{formatINR(row.net_payable)}
													</TableCell>
													<TableCell className="px-3 py-3 text-center">
														{getStatusBadge(row.status)}
													</TableCell>
													<TableCell className="px-3 py-3 text-slate-500">
														<div className="font-medium text-slate-700 dark:text-slate-300">
															{row.submitted_by || "HR"}
														</div>
														<div className="text-[10px] text-slate-400">
															{row.submitted_at
																? new Date(
																		row.submitted_at,
																	).toLocaleDateString()
																: ""}
														</div>
													</TableCell>
													<TableCell className="px-4 py-3 text-right">
														<div className="flex items-center justify-end gap-1.5">
															{isPendingApproval ? (
																<>
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => handleOpenReview(row)}
																		className="h-7 gap-1 border-blue-200 text-blue-700 text-xs hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
																	>
																		<Eye className="h-3 w-3" />
																		Review & Sign
																	</Button>
																	<Button
																		size="sm"
																		onClick={() => handleRowApprove(row)}
																		disabled={
																			approvingRowId === row.id ||
																			approveMutation.isPending
																		}
																		className="h-7 gap-1 bg-emerald-600 font-semibold text-white text-xs shadow-xs hover:bg-emerald-700"
																		title={t("approve")}
																	>
																		{approvingRowId === row.id ? (
																			<Loader2 className="h-3 w-3 animate-spin" />
																		) : (
																			<CheckCircle2 className="h-3 w-3" />
																		)}
																		{t("approve")}
																	</Button>
																</>
															) : (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => handleOpenReview(row)}
																	className="h-7 gap-1 text-slate-600 text-xs dark:text-slate-400"
																>
																	<Eye className="h-3 w-3" />
																	{t("details")}
																</Button>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							{/* Mobile View Responsive Cards */}
							<div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
								{payrollList.map((row) => {
									const isPendingApproval =
										row.status === "submitted_to_manager";
									const adj = Number(row.adjustment_amount || 0);

									return (
										<div key={row.id} className="space-y-3 p-4">
											<div className="flex items-start justify-between">
												<div>
													<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
														{row.staff?.name}
													</h4>
													<p className="font-mono text-[11px] text-slate-400">
														{row.staff?.staff_code || `ID-${row.staff_id}`}{" "}
														&bull; {row.staff?.department || "General"}
													</p>
												</div>
												<div>{getStatusBadge(row.status)}</div>
											</div>

											<div className="grid grid-cols-4 gap-1 rounded bg-slate-50 p-2 text-center text-[11px] dark:bg-slate-900">
												<div>
													<span className="block text-[9px] text-slate-400">
														Pres
													</span>
													<span className="font-bold text-emerald-600">
														{Number(row.present_days || 0)}
													</span>
												</div>
												<div>
													<span className="block text-[9px] text-slate-400">
														Leave
													</span>
													<span className="font-bold text-blue-600">
														{Number(row.paid_leave_days || 0)}
													</span>
												</div>
												<div>
													<span className="block text-[9px] text-slate-400">
														OT
													</span>
													<span className="font-bold text-purple-600">
														{Number(row.overtime_hours || 0)}h
													</span>
												</div>
												<div>
													<span className="block text-[9px] text-slate-400">
														Adj
													</span>
													<span
														className={`font-bold ${
															adj !== 0
																? adj > 0
																	? "text-emerald-600"
																	: "text-rose-600"
																: "text-slate-400"
														}`}
													>
														{adj !== 0 ? (adj > 0 ? `+${adj}` : adj) : "—"}
													</span>
												</div>
											</div>

											<div className="flex items-center justify-between pt-1 text-xs">
												<div>
													<span className="text-slate-500">System: </span>
													<span className="font-medium">
														{formatINR(
															row.system_calculated_amount || row.base_salary,
														)}
													</span>
												</div>
												<div className="font-bold text-base text-slate-900 dark:text-slate-100">
													{formatINR(row.net_payable)}
												</div>
											</div>

											<div className="flex items-center justify-end gap-2 pt-2">
												{isPendingApproval ? (
													<>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleOpenReview(row)}
															className="h-8 flex-1 gap-1 border-blue-200 text-blue-700 text-xs hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
														>
															<Eye className="h-3 w-3" />
															Review & Sign
														</Button>
														<Button
															size="sm"
															onClick={() => handleRowApprove(row)}
															disabled={
																approvingRowId === row.id ||
																approveMutation.isPending
															}
															className="h-8 flex-1 gap-1 bg-emerald-600 font-semibold text-white text-xs shadow-xs hover:bg-emerald-700"
														>
															{approvingRowId === row.id ? (
																<Loader2 className="h-3 w-3 animate-spin" />
															) : (
																<CheckCircle2 className="h-3 w-3" />
															)}
															{t("approve")}
														</Button>
													</>
												) : (
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleOpenReview(row)}
														className="h-8 w-full text-xs"
													>
														<Eye className="mr-1 h-3 w-3" />
														{t("details")}
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Review & Authorize Dialog */}
			<Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between">
							<span>Review Payroll: {selectedRecord?.staff?.name}</span>
							<div>
								{selectedRecord && getStatusBadge(selectedRecord.status)}
							</div>
						</DialogTitle>
						<DialogDescription>
							Month: {selectedRecord?.month} &bull; Staff Code:{" "}
							{selectedRecord?.staff?.staff_code} &bull; Team:{" "}
							{selectedRecord?.staff?.department || "General"}
						</DialogDescription>
					</DialogHeader>

					{selectedRecord && (
						<div className="space-y-4 py-2">
							{/* Attendance Breakdown */}
							<div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900/60">
								<h5 className="mb-2 flex items-center gap-1 font-bold text-slate-500 text-xs uppercase">
									<Clock className="h-3.5 w-3.5" />
									{t("attendanceSummary")}
								</h5>
								<div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
									<div className="rounded border bg-white p-2 dark:bg-slate-800">
										<span className="block text-[10px] text-slate-400">
											Working Days
										</span>
										<span className="font-bold text-slate-800 dark:text-slate-200">
											{selectedRecord.working_days || 30}
										</span>
									</div>
									<div className="rounded border bg-white p-2 dark:bg-slate-800">
										<span className="block text-[10px] text-slate-400">
											{t("present")}
										</span>
										<span className="font-bold text-emerald-600">
											{Number(selectedRecord.present_days || 0)}
										</span>
									</div>
									<div className="rounded border bg-white p-2 dark:bg-slate-800">
										<span className="block text-[10px] text-slate-400">
											{t("halfDay")}
										</span>
										<span className="font-bold text-amber-600">
											{selectedRecord.half_days || 0}
										</span>
									</div>
									<div className="rounded border bg-white p-2 dark:bg-slate-800">
										<span className="block text-[10px] text-slate-400">
											{t("paidLeave")}
										</span>
										<span className="font-bold text-blue-600">
											{Number(selectedRecord.paid_leave_days || 0)}
										</span>
									</div>
									<div className="rounded border bg-white p-2 dark:bg-slate-800">
										<span className="block text-[10px] text-slate-400">
											{t("absent")}
										</span>
										<span className="font-bold text-rose-600">
											{Number(selectedRecord.absent_days || 0)}
										</span>
									</div>
									<div className="rounded border bg-white p-2 dark:bg-slate-800">
										<span className="block text-[10px] text-slate-400">
											{t("overtime")}
										</span>
										<span className="font-bold text-purple-600">
											{Number(selectedRecord.overtime_hours || 0)}h
										</span>
									</div>
								</div>
							</div>

							{/* Calculation Comparison (System vs HR Adjustment) */}
							<div className="rounded-lg border bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30 p-4 dark:from-slate-900 dark:to-slate-900/60">
								<h5 className="mb-3 flex items-center gap-1.5 font-bold text-slate-700 text-xs uppercase dark:text-slate-300">
									<IndianRupee className="h-4 w-4 text-blue-600" />
									Compensation Breakdown & Verification
								</h5>

								<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
									<div className="rounded-lg border bg-white p-3 shadow-xs dark:bg-slate-800">
										<span className="block text-slate-500 text-xs">
											{t("systemCalculated")}
										</span>
										<span className="font-bold text-lg text-slate-800 dark:text-slate-200">
											{formatINR(
												selectedRecord.system_calculated_amount ||
													selectedRecord.base_salary,
											)}
										</span>
									</div>

									<div className="rounded-lg border bg-white p-3 shadow-xs dark:bg-slate-800">
										<span className="block text-slate-500 text-xs">
											{t("hrAdjustment")}
										</span>
										<div className="font-bold text-lg">
											{Number(selectedRecord.adjustment_amount || 0) !== 0 ? (
												<span
													className={
														Number(selectedRecord.adjustment_amount) > 0
															? "text-emerald-600"
															: "text-rose-600"
													}
												>
													{Number(selectedRecord.adjustment_amount) > 0
														? `+${formatINR(selectedRecord.adjustment_amount)}`
														: formatINR(selectedRecord.adjustment_amount)}
												</span>
											) : (
												<span className="text-slate-400">None (₹0)</span>
											)}
										</div>
									</div>

									<div className="rounded-lg border border-blue-200 bg-blue-50/30 bg-white p-3 shadow-xs dark:bg-slate-800">
										<span className="block font-bold text-blue-700 text-xs dark:text-blue-400">
											{t("finalPay")}
										</span>
										<span className="font-bold text-blue-900 text-xl dark:text-blue-300">
											{formatINR(selectedRecord.net_payable)}
										</span>
									</div>
								</div>

								{/* HR Adjustment Reason Display */}
								{selectedRecord.adjustment_reason && (
									<div className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs">
										<span className="flex items-center gap-1 font-bold text-amber-900">
											<AlertCircle className="h-3.5 w-3.5" />
											HR Adjustment Reason:
										</span>
										<p className="font-medium text-amber-800 italic">
											&ldquo;{selectedRecord.adjustment_reason}&rdquo;
										</p>
									</div>
								)}
							</div>

							{/* Audit History Timeline */}
							<div className="space-y-2 border-t pt-3">
								<h5 className="flex items-center gap-1 font-bold text-slate-500 text-xs uppercase">
									<History className="h-3.5 w-3.5" />
									{t("approvalHistory")}
								</h5>

								{auditLoading ? (
									<div className="py-2 text-slate-400 text-xs">
										Loading audit history...
									</div>
								) : auditHistory.length === 0 ? (
									<div className="py-1 text-slate-400 text-xs">
										No recorded audit events.
									</div>
								) : (
									<div className="max-h-40 space-y-2 overflow-y-auto pr-1">
										{auditHistory.map((item) => (
											<div
												key={item.id}
												className="space-y-0.5 rounded border bg-slate-50 p-2 text-xs dark:bg-slate-900"
											>
												<div className="flex items-center justify-between">
													<span className="font-bold text-slate-800 capitalize dark:text-slate-200">
														{item.action.replace(/_/g, " ")}
													</span>
													<span className="text-[10px] text-slate-400">
														{item.changedAt
															? new Date(item.changedAt).toLocaleString()
															: ""}
													</span>
												</div>
												<div className="text-[11px] text-slate-600 dark:text-slate-400">
													By: {item.changedByName || "System"} (
													{item.role || "staff"})
												</div>
												{item.reason && (
													<div className="text-[11px] text-blue-700 italic dark:text-blue-300">
														&ldquo;{item.reason}&rdquo;
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setReviewModalOpen(false)}
						>
							{t("close")}
						</Button>

						{selectedRecord?.status === "submitted_to_manager" && (
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50"
									onClick={handleOpenReturnDialog}
									disabled={
										returnMutation.isPending || approveMutation.isPending
									}
								>
									<RotateCcw className="h-3.5 w-3.5" />
									{t("sendBack")}
								</Button>

								<Button
									size="sm"
									className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
									onClick={handleApproveSingle}
									disabled={
										returnMutation.isPending || approveMutation.isPending
									}
								>
									{approveMutation.isPending ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<CheckCircle2 className="h-3.5 w-3.5" />
									)}
									{t("approve")} & Route to Finance
								</Button>
							</div>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Send Back with Mandatory Reason Dialog */}
			<Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-rose-700">
							<RotateCcw className="h-5 w-5" />
							Send Payroll Back to HR
						</DialogTitle>
						<DialogDescription>
							Returning payroll for {selectedRecord?.staff?.name}. A mandatory
							explanation is required so HR can perform corrections.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2 py-2">
						<Label
							htmlFor="retReason"
							className="font-bold text-slate-700 text-xs dark:text-slate-300"
						>
							Mandatory Return Reason *
						</Label>
						<Textarea
							id="retReason"
							placeholder={t("sendBackReasonHint")}
							value={returnReason}
							onChange={(e) => setReturnReason(e.target.value)}
							rows={3}
							className="text-xs"
						/>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setReturnModalOpen(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							size="sm"
							className="bg-rose-600 text-white hover:bg-rose-700"
							disabled={returnMutation.isPending}
							onClick={handleConfirmReturn}
						>
							{returnMutation.isPending ? "Sending..." : "Confirm Return"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Batch Approve Confirmation Dialog */}
			<Dialog
				open={confirmBatchApproveOpen}
				onOpenChange={setConfirmBatchApproveOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("confirmApproveTitle")}</DialogTitle>
						<DialogDescription>{t("confirmApproveDesc")}</DialogDescription>
					</DialogHeader>

					<div className="space-y-2 py-2 text-xs">
						<div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
							Authorizing <strong>{totalPendingSignoff}</strong> submitted
							payroll record(s) for period <strong>{selectedMonth}</strong>.
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setConfirmBatchApproveOpen(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							size="sm"
							className="bg-emerald-600 text-white hover:bg-emerald-700"
							disabled={approveMutation.isPending}
							onClick={handleBatchApprove}
						>
							{approveMutation.isPending ? "Approving..." : t("confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
