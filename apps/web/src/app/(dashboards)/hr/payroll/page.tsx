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
	AlertTriangle,
	Calendar,
	Clock,
	Download,
	Edit3,
	Eye,
	Filter,
	History,
	IndianRupee,
	Info,
	Loader2,
	Lock,
	RefreshCw,
	Search,
	Send,
	ShieldCheck,
	Users,
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

export default function HRPayrollPage() {
	const t = useTranslations("payroll");
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [selectedMonth, setSelectedMonth] = useState(
		new Date().toISOString().substring(0, 7),
	);
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");

	// Modals
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<any>(null);
	const [adjustAmountInput, setAdjustAmountInput] = useState("");
	const [adjustReasonInput, setAdjustReasonInput] = useState("");

	const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
	const [submittingRowId, setSubmittingRowId] = useState<number | null>(null);

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

	const { data: summaryStats } = trpc.payroll.getSummaryStats.useQuery({
		month: selectedMonth,
	});

	const { data: auditHistory = [], isLoading: auditLoading } =
		trpc.payroll.getAuditHistory.useQuery(
			{ payrollId: selectedRecord?.id ?? 0 },
			{ enabled: !!selectedRecord?.id },
		);

	// Mutations
	const generateMutation = trpc.payroll.generate.useMutation({
		onSuccess: (data) => {
			toast.success(
				`Generated payroll for ${data.generated} employees (${data.skipped} skipped).`,
			);
			utils.payroll.list.invalidate();
			utils.payroll.getSummaryStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Payroll generation failed: ${err.message}`);
		},
	});

	const adjustMutation = trpc.payroll.adjust.useMutation({
		onSuccess: () => {
			toast.success("Payroll adjustment and reason saved successfully!");
			setEditModalOpen(false);
			setSelectedRecord(null);
			utils.payroll.list.invalidate();
			utils.payroll.getSummaryStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Adjustment failed: ${err.message}`);
		},
	});

	const submitMutation = trpc.payroll.submitToManager.useMutation({
		onSuccess: (data) => {
			toast.success(
				data.submittedCount === 1
					? "Payroll submitted to Manager for approval!"
					: `${data.submittedCount} payroll records submitted to Manager for approval!`,
			);
			setConfirmSubmitOpen(false);
			setEditModalOpen(false);
			utils.payroll.list.invalidate();
			utils.payroll.getSummaryStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Submission failed: ${err.message}`);
		},
	});

	// Handlers
	const handleSingleSubmit = (record: any) => {
		if (!record) return;
		const adj = Number(record.adjustment_amount || 0);
		if (adj !== 0 && !record.adjustment_reason?.trim()) {
			toast.error(
				`Cannot submit payroll for ${record.staff?.name || "employee"}: Manual adjustment requires an explanation reason.`,
			);
			handleOpenReview(record);
			return;
		}

		setSubmittingRowId(record.id);
		submitMutation.mutate(
			{ ids: [record.id] },
			{
				onSettled: () => {
					setSubmittingRowId(null);
				},
			},
		);
	};

	const handleOpenReview = (record: any) => {
		setSelectedRecord(record);
		setAdjustAmountInput(String(record.net_payable));
		setAdjustReasonInput(record.adjustment_reason || "");
		setEditModalOpen(true);
	};

	const handleSaveAdjustment = () => {
		if (!selectedRecord) return;
		const num = Number.parseFloat(adjustAmountInput);
		if (Number.isNaN(num) || num < 0) {
			toast.error("Please enter a valid non-negative amount");
			return;
		}

		const systemVal = Number(
			selectedRecord.system_calculated_amount || selectedRecord.base_salary,
		);
		const isChanged = num !== systemVal;

		if (
			isChanged &&
			(!adjustReasonInput || adjustReasonInput.trim().length < 3)
		) {
			toast.error(
				"A mandatory reason of at least 3 characters is required when adjusting salary",
			);
			return;
		}

		adjustMutation.mutate({
			id: selectedRecord.id,
			adjustedAmount: num,
			reason: adjustReasonInput.trim() || "No modification",
		});
	};

	const handleGeneratePayroll = () => {
		generateMutation.mutate({
			month: selectedMonth,
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
				"Pay Type",
				"Working Days",
				"Present",
				"Half Days",
				"Paid Leave",
				"Absent",
				"Overtime Hours",
				"System Calculated",
				"Adjustment",
				"Final Pay",
				"Status",
			],
			...payrollList.map((r) => [
				r.staff?.staff_code || "",
				r.staff?.name || "",
				r.staff?.department || "General",
				r.month,
				r.pay_type || "monthly",
				r.working_days || 30,
				r.present_days || 0,
				r.half_days || 0,
				r.paid_leave_days || 0,
				r.absent_days || 0,
				r.overtime_hours || 0,
				r.system_calculated_amount || r.base_salary,
				r.adjustment_amount || 0,
				r.net_payable,
				r.status,
			]),
		];
		const blob = new Blob([csvRows.map((e) => e.join(",")).join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `payroll_register_${selectedMonth}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success("Payroll register exported!");
	};

	// Unique departments for filter
	const teams = Array.from(
		new Set(
			payrollList.map((r) => r.staff?.department || "General").filter(Boolean),
		),
	);

	const pendingSubmissionCount = payrollList.filter(
		(r) =>
			r.status === "draft" ||
			r.status === "hr_review" ||
			r.status === "returned_to_hr",
	).length;

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "draft":
				return (
					<Badge
						variant="outline"
						className="border-slate-300 bg-slate-50 text-slate-600"
					>
						{t("statusDraft")}
					</Badge>
				);
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
						className="border-amber-200 bg-amber-50 text-amber-700"
					>
						{t("statusSubmittedToManager")}
					</Badge>
				);
			case "returned_to_hr":
				return (
					<Badge
						variant="outline"
						className="border-rose-300 bg-rose-50 font-bold text-rose-700"
					>
						{t("statusReturnedToHr")}
					</Badge>
				);
			case "manager_approved":
				return (
					<Badge
						variant="outline"
						className="border-emerald-200 bg-emerald-50 text-emerald-700"
					>
						{t("statusManagerApproved")}
					</Badge>
				);
			case "paid":
			case "locked":
				return (
					<Badge className="bg-emerald-600 text-white">
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
						{t("title")}
					</h1>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						{t("subtitle")}
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
					<Button
						size="sm"
						onClick={handleGeneratePayroll}
						disabled={generateMutation.isPending}
						className="gap-1.5 bg-blue-600 text-white text-xs shadow-sm hover:bg-blue-700"
					>
						{generateMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="h-4 w-4" />
						)}
						{generateMutation.isPending
							? t("generatingPayroll")
							: t("generatePayroll")}
					</Button>
				</div>
			</div>

			{/* Top Metric Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				<Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<span className="truncate font-medium text-slate-500 text-xs">
								{t("totalEmployees")}
							</span>
							<Users className="h-4 w-4 shrink-0 text-slate-400" />
						</div>
						<div
							className="mt-2 truncate font-bold text-lg text-slate-900 tracking-tight sm:text-xl dark:text-slate-100"
							title={String(summaryStats?.totalEmployees ?? payrollList.length)}
						>
							{summaryStats?.totalEmployees ?? payrollList.length}
						</div>
					</CardContent>
				</Card>

				<Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<span className="truncate font-medium text-slate-500 text-xs">
								{t("totalGross")}
							</span>
							<IndianRupee className="h-4 w-4 shrink-0 text-slate-400" />
						</div>
						<div
							className="mt-2 truncate font-bold text-lg text-slate-900 tracking-tight sm:text-xl dark:text-slate-100"
							title={formatINR(summaryStats?.totalGross)}
						>
							{formatINR(summaryStats?.totalGross)}
						</div>
					</CardContent>
				</Card>

				<Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<span className="truncate font-medium text-slate-500 text-xs">
								{t("totalDeductions")}
							</span>
							<AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
						</div>
						<div
							className="mt-2 truncate font-bold text-lg text-rose-600 tracking-tight sm:text-xl"
							title={`-${formatINR(summaryStats?.totalDeductions)}`}
						>
							-{formatINR(summaryStats?.totalDeductions)}
						</div>
					</CardContent>
				</Card>

				<Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm dark:border-slate-800">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<span className="truncate font-medium text-slate-500 text-xs">
								{t("totalNetPay")}
							</span>
							<ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
						</div>
						<div
							className="mt-2 truncate font-bold text-emerald-600 text-lg tracking-tight sm:text-xl"
							title={formatINR(
								summaryStats?.totalNet ?? (summaryStats as any)?.totalNetPay,
							)}
						>
							{formatINR(
								summaryStats?.totalNet ?? (summaryStats as any)?.totalNetPay,
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-2 overflow-hidden border-l-4 border-l-amber-500 shadow-sm sm:col-span-1 dark:border-slate-800">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<span className="truncate font-medium text-slate-500 text-xs">
								{t("pendingReview")}
							</span>
							<Clock className="h-4 w-4 shrink-0 text-amber-500" />
						</div>
						<div
							className="mt-2 truncate font-bold text-amber-600 text-lg tracking-tight sm:text-xl"
							title={String(pendingSubmissionCount)}
						>
							{pendingSubmissionCount}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search & Team Filter & Batch Action Bar */}
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
						onClick={() => setConfirmSubmitOpen(true)}
						disabled={pendingSubmissionCount === 0 || submitMutation.isPending}
						className="w-full gap-1.5 bg-amber-600 font-semibold text-white text-xs shadow-sm hover:bg-amber-700 sm:w-auto"
					>
						{submitMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-3.5 w-3.5" />
						)}
						{t("submitForApproval")} ({pendingSubmissionCount})
					</Button>
				</div>
			</div>

			{/* Table & Cards Section */}
			<Card className="overflow-hidden shadow-sm">
				<CardHeader className="border-b bg-slate-50/50 px-6 py-4 dark:bg-slate-900/50">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="font-bold text-base">
								{t("employeePayroll")} ({selectedMonth})
							</CardTitle>
							<CardDescription className="text-xs">
								Attendance-derived computations, adjustments, and sign-off
								status.
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
							<span>Loading payroll records...</span>
						</div>
					) : payrollList.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
							<AlertCircle className="h-8 w-8 text-slate-300" />
							<p className="font-semibold text-sm">{t("noRecordsFound")}</p>
							<Button
								variant="outline"
								size="sm"
								onClick={handleGeneratePayroll}
								className="mt-2 text-xs"
							>
								{t("generatePayroll")}
							</Button>
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
											<TableHead className="px-3 py-3 text-center font-bold">
												{t("workingDays")}
											</TableHead>
											<TableHead className="px-2 py-3 text-center font-bold text-emerald-600">
												{t("present")}
											</TableHead>
											<TableHead className="px-2 py-3 text-center font-bold text-blue-600">
												{t("paidLeave")}
											</TableHead>
											<TableHead className="px-2 py-3 text-center font-bold text-amber-600">
												{t("halfDay")}
											</TableHead>
											<TableHead className="px-2 py-3 text-center font-bold text-rose-600">
												{t("absent")}
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
											<TableHead className="px-4 py-3 text-right font-bold">
												{t("actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
										{payrollList.map((row) => {
											const isEditable =
												row.status === "draft" ||
												row.status === "hr_review" ||
												row.status === "returned_to_hr";
											const adj = Number(row.adjustment_amount || 0);

											return (
												<TableRow
													key={row.id}
													className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
												>
													<TableCell className="px-4 py-3">
														<div className="flex items-center gap-2.5">
															{(row.staff as { userImage?: string | null })
																?.userImage ? (
																<img
																	src={
																		(
																			row.staff as {
																				userImage?: string | null;
																			}
																		).userImage ?? undefined
																	}
																	alt={row.staff?.name || ""}
																	className="h-8 w-8 shrink-0 rounded-full object-cover shadow-xs ring-1 ring-border"
																/>
															) : (
																<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-[11px] text-white shadow-xs">
																	{row.staff?.name
																		? row.staff.name
																				.split(" ")
																				.map((n: string) => n[0])
																				.slice(0, 2)
																				.join("")
																				.toUpperCase()
																		: "?"}
																</div>
															)}
															<div className="min-w-0">
																<div className="truncate font-bold text-slate-900 dark:text-slate-100">
																	{row.staff?.name || `Staff #${row.staff_id}`}
																</div>
																<div className="font-mono text-[10px] text-slate-400">
																	{row.staff?.staff_code ||
																		`ID-${row.staff_id}`}
																</div>
															</div>
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
													<TableCell className="px-3 py-3 text-center text-slate-600">
														{row.working_days || 30}
													</TableCell>
													<TableCell className="px-2 py-3 text-center font-semibold text-emerald-600">
														{Number(row.present_days || 0)}
													</TableCell>
													<TableCell className="px-2 py-3 text-center font-semibold text-blue-600">
														{Number(row.paid_leave_days || 0)}
													</TableCell>
													<TableCell className="px-2 py-3 text-center font-semibold text-amber-600">
														{row.half_days || 0}
													</TableCell>
													<TableCell className="px-2 py-3 text-center font-semibold text-rose-600">
														{Number(row.absent_days || 0)}
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
																className={
																	adj > 0 ? "text-emerald-600" : "text-rose-600"
																}
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
													<TableCell className="px-4 py-3 text-right">
														<div className="flex items-center justify-end gap-1.5">
															{isEditable ? (
																<>
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => handleOpenReview(row)}
																		className="h-7 gap-1 border-blue-200 text-blue-700 text-xs hover:bg-blue-50"
																	>
																		<Edit3 className="h-3 w-3" />
																		{t("reviewAndEdit")}
																	</Button>
																	<Button
																		size="sm"
																		onClick={() => handleSingleSubmit(row)}
																		disabled={
																			submittingRowId === row.id ||
																			submitMutation.isPending
																		}
																		className="h-7 gap-1 bg-amber-600 font-semibold text-white text-xs shadow-xs hover:bg-amber-700"
																		title={t("submitForApproval")}
																	>
																		{submittingRowId === row.id ? (
																			<Loader2 className="h-3 w-3 animate-spin" />
																		) : (
																			<Send className="h-3 w-3" />
																		)}
																		{t("submitSingle")}
																	</Button>
																</>
															) : (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => handleOpenReview(row)}
																	className="h-7 gap-1 text-slate-600 text-xs"
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
									const isEditable =
										row.status === "draft" ||
										row.status === "hr_review" ||
										row.status === "returned_to_hr";
									const adj = Number(row.adjustment_amount || 0);

									return (
										<div key={row.id} className="space-y-3 p-4">
											<div className="flex items-start justify-between gap-3">
												<div className="flex min-w-0 items-center gap-2.5">
													{(row.staff as { userImage?: string | null })
														?.userImage ? (
														<img
															src={
																(
																	row.staff as {
																		userImage?: string | null;
																	}
																).userImage ?? undefined
															}
															alt={row.staff?.name || ""}
															className="h-9 w-9 shrink-0 rounded-full object-cover shadow-xs ring-1 ring-border"
														/>
													) : (
														<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white text-xs shadow-xs">
															{row.staff?.name
																? row.staff.name
																		.split(" ")
																		.map((n: string) => n[0])
																		.slice(0, 2)
																		.join("")
																		.toUpperCase()
																: "?"}
														</div>
													)}
													<div className="min-w-0">
														<h4 className="truncate font-bold text-slate-900 text-sm dark:text-slate-100">
															{row.staff?.name}
														</h4>
														<p className="truncate font-mono text-[11px] text-slate-400">
															{row.staff?.staff_code || `ID-${row.staff_id}`}{" "}
															&bull; {row.staff?.department || "General"}
														</p>
													</div>
												</div>
												<div className="shrink-0">
													{getStatusBadge(row.status)}
												</div>
											</div>

											{/* Attendance chips */}
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
														Half
													</span>
													<span className="font-bold text-amber-600">
														{row.half_days || 0}
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
											</div>

											<div className="flex items-center justify-between pt-1 text-xs">
												<div>
													<span className="text-slate-500">System: </span>
													<span className="font-medium">
														{formatINR(
															row.system_calculated_amount || row.base_salary,
														)}
													</span>
													{adj !== 0 && (
														<span className="ml-1 text-blue-600">
															(Adj: {adj > 0 ? `+${adj}` : adj})
														</span>
													)}
												</div>
												<div className="font-bold text-base text-slate-900 dark:text-slate-100">
													{formatINR(row.net_payable)}
												</div>
											</div>

											<div className="flex items-center justify-end gap-2 pt-2">
												{isEditable ? (
													<>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleOpenReview(row)}
															className="h-8 flex-1 border-blue-200 text-blue-700 text-xs hover:bg-blue-50"
														>
															<Edit3 className="mr-1 h-3 w-3" />
															{t("reviewAndEdit")}
														</Button>
														<Button
															size="sm"
															onClick={() => handleSingleSubmit(row)}
															disabled={
																submittingRowId === row.id ||
																submitMutation.isPending
															}
															className="h-8 flex-1 bg-amber-600 font-semibold text-white text-xs shadow-xs hover:bg-amber-700"
														>
															{submittingRowId === row.id ? (
																<Loader2 className="mr-1 h-3 w-3 animate-spin" />
															) : (
																<Send className="mr-1 h-3 w-3" />
															)}
															{t("submitSingle")}
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

			{/* Review & Edit Modal */}
			<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between">
							<span>
								{selectedRecord?.staff?.name} &bull; {selectedRecord?.month}
							</span>
							<div>
								{selectedRecord && getStatusBadge(selectedRecord.status)}
							</div>
						</DialogTitle>
						<DialogDescription>
							Staff Code: {selectedRecord?.staff?.staff_code} &bull; Team:{" "}
							{selectedRecord?.staff?.department || "General"} &bull; Pay Type:{" "}
							{selectedRecord?.pay_type || "Monthly"}
						</DialogDescription>
					</DialogHeader>

					{selectedRecord && (
						<div className="space-y-4 py-2">
							{/* Return Reason Warning Banner if returned */}
							{selectedRecord.status === "returned_to_hr" &&
								selectedRecord.return_reason && (
									<div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 text-xs">
										<div className="flex items-center gap-1.5 font-bold">
											<AlertCircle className="h-4 w-4 text-rose-600" />
											Manager Return Reason:
										</div>
										<p>{selectedRecord.return_reason}</p>
									</div>
								)}

							{/* Attendance Breakdown */}
							<div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900/60">
								<h5 className="mb-2 flex items-center gap-1 font-bold text-slate-500 text-xs uppercase">
									<Clock className="h-3.5 w-3.5" />
									{t("attendanceSummary")}
								</h5>
								<div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
									<div className="rounded border bg-white p-2 dark:bg-slate-800">
										<span className="block text-[10px] text-slate-400">
											Total Days
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

							{/* Calculation Breakdown */}
							<div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900/60">
								<h5 className="mb-2 flex items-center gap-1 font-bold text-slate-500 text-xs uppercase">
									<IndianRupee className="h-3.5 w-3.5" />
									{t("calculationBreakdown")}
								</h5>
								<div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
									<div>
										<span className="block text-[10px] text-slate-400">
											Base Rate
										</span>
										<span className="font-semibold">
											{formatINR(selectedRecord.base_salary)}
										</span>
									</div>
									<div>
										<span className="block text-[10px] text-slate-400">
											{t("overtimePay")}
										</span>
										<span className="font-semibold text-purple-600">
											+{formatINR(selectedRecord.overtime_pay)}
										</span>
									</div>
									<div>
										<span className="block text-[10px] text-slate-400">
											{t("deductions")}
										</span>
										<span className="font-semibold text-rose-600">
											-{formatINR(selectedRecord.deductions)}
										</span>
									</div>
									<div>
										<span className="block font-bold text-[10px] text-slate-400 text-slate-700 dark:text-slate-300">
											{t("systemCalculated")}
										</span>
										<span className="font-bold text-blue-700 text-sm dark:text-blue-400">
											{formatINR(
												selectedRecord.system_calculated_amount ||
													selectedRecord.base_salary,
											)}
										</span>
									</div>
								</div>
							</div>

							{/* Editable HR Adjustment Section (if editable) */}
							{selectedRecord.is_locked || selectedRecord.status === "paid" ? (
								<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-xs">
									<Lock className="h-4 w-4" />
									<span>{t("lockedNotice")}</span>
								</div>
							) : selectedRecord.status !== "draft" &&
								selectedRecord.status !== "hr_review" &&
								selectedRecord.status !== "returned_to_hr" ? (
								<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-xs">
									<Info className="h-4 w-4" />
									<span>
										Payroll has been submitted to Manager and is locked for HR
										editing.
									</span>
								</div>
							) : (
								<div className="space-y-3 border-t pt-3">
									<h5 className="font-bold text-slate-700 text-xs uppercase dark:text-slate-300">
										{t("hrAdjustment")}
									</h5>

									<div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-3">
										<div>
											<Label className="text-slate-500 text-xs">
												{t("originalAmount")}
											</Label>
											<div className="font-bold text-slate-700 text-sm dark:text-slate-300">
												{formatINR(
													selectedRecord.system_calculated_amount ||
														selectedRecord.base_salary,
												)}
											</div>
										</div>
										<div>
											<Label
												htmlFor="adjAmount"
												className="font-bold text-slate-800 text-xs dark:text-slate-200"
											>
												{t("newAmount")} (₹) *
											</Label>
											<Input
												id="adjAmount"
												type="number"
												value={adjustAmountInput}
												onChange={(e) => setAdjustAmountInput(e.target.value)}
												className="mt-1 h-9 font-bold text-sm"
											/>
										</div>
										<div>
											<Label className="text-slate-500 text-xs">
												{t("difference")}
											</Label>
											<div className="font-bold text-sm">
												{(() => {
													const sys = Number(
														selectedRecord.system_calculated_amount ||
															selectedRecord.base_salary,
													);
													const nw = Number.parseFloat(adjustAmountInput) || 0;
													const diff = nw - sys;
													if (diff === 0)
														return <span className="text-slate-400">₹0</span>;
													return (
														<span
															className={
																diff > 0 ? "text-emerald-600" : "text-rose-600"
															}
														>
															{diff > 0
																? `+${formatINR(diff)}`
																: formatINR(diff)}
														</span>
													);
												})()}
											</div>
										</div>
									</div>

									<div>
										<Label
											htmlFor="adjReason"
											className="font-bold text-slate-800 text-xs dark:text-slate-200"
										>
											{t("adjustmentReason")} *
										</Label>
										<Textarea
											id="adjReason"
											placeholder={t("mandatoryReasonHint")}
											value={adjustReasonInput}
											onChange={(e) => setAdjustReasonInput(e.target.value)}
											rows={2}
											className="mt-1 text-xs"
										/>
									</div>
								</div>
							)}

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
							onClick={() => setEditModalOpen(false)}
						>
							{t("close")}
						</Button>

						{selectedRecord &&
							(selectedRecord.status === "draft" ||
								selectedRecord.status === "hr_review" ||
								selectedRecord.status === "returned_to_hr") && (
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={handleSaveAdjustment}
										disabled={
											adjustMutation.isPending || submitMutation.isPending
										}
										className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
									>
										{adjustMutation.isPending
											? t("saving")
											: t("saveAdjustment")}
									</Button>
									<Button
										size="sm"
										onClick={() => handleSingleSubmit(selectedRecord)}
										disabled={
											adjustMutation.isPending || submitMutation.isPending
										}
										className="gap-1.5 bg-amber-600 font-semibold text-white shadow-xs hover:bg-amber-700"
									>
										{submittingRowId === selectedRecord.id ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<Send className="h-3.5 w-3.5" />
										)}
										{t("submitToManager")}
									</Button>
								</div>
							)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm Submit Dialog */}
			<Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("confirmSubmitTitle")}</DialogTitle>
						<DialogDescription>{t("confirmSubmitDesc")}</DialogDescription>
					</DialogHeader>

					<div className="space-y-2 py-2 text-xs">
						<div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
							Submitting <strong>{pendingSubmissionCount}</strong> payroll
							record(s) for period <strong>{selectedMonth}</strong> to the
							Manager.
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setConfirmSubmitOpen(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							size="sm"
							className="bg-amber-600 text-white hover:bg-amber-700"
							disabled={submitMutation.isPending}
							onClick={() =>
								submitMutation.mutate({
									month: selectedMonth,
								})
							}
						>
							{submitMutation.isPending ? "Submitting..." : t("confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
