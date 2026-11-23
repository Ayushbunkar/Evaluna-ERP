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
	AlertTriangleIcon,
	CalendarCheckIcon,
	CheckCircle2Icon,
	ClockIcon,
	CreditCardIcon,
	FileTextIcon,
	HistoryIcon,
	IndianRupeeIcon,
	InfoIcon,
	Loader2Icon,
	LockIcon,
	SearchIcon,
	ShieldCheckIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function FinancePayrollPage() {
	const t = useTranslations("payroll");
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// Current month in YYYY-MM
	const currentMonth = new Date().toISOString().substring(0, 7);

	// Navigation Tabs
	const [activeTab, setActiveTab] = useState<
		"disbursements" | "advances" | "reimbursements"
	>("disbursements");

	// Filters
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const [statusFilter, setStatusFilter] = useState<
		"all" | "manager_approved" | "paid"
	>("manager_approved");
	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: summaryStats, isLoading: statsLoading } =
		trpc.payroll.getSummaryStats.useQuery({
			month: selectedMonth,
		});

	const { data: payrollList, isLoading: payrollLoading } =
		trpc.payroll.list.useQuery({
			month: selectedMonth,
			status: statusFilter === "all" ? undefined : statusFilter,
			search: searchQuery || undefined,
		});

	const { data: bankAccountsList, isLoading: bankAccountsLoading } =
		trpc.finance.getBankAccounts.useQuery();

	// Disbursement Modal State
	const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<{
		id: number;
		month: string;
		staff_id: number;
		net_payable: string;
		system_calculated_amount: string | null;
		adjustment_amount: string | null;
		adjustment_reason: string | null;
		staff?: {
			name: string;
			staff_code: string | null;
			role: string | null;
		} | null;
	} | null>(null);
	const [bankAccountId, setBankAccountId] = useState<number | null>(null);
	const [transactionRef, setTransactionRef] = useState("");
	const [paymentProofUrl, setPaymentProofUrl] = useState("");
	const [paymentNotes, setPaymentNotes] = useState("");
	const [paymentDate, setPaymentDate] = useState(
		new Date().toISOString().substring(0, 10),
	);

	// Details & Audit Modal State
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
	const [detailPayrollId, setDetailPayrollId] = useState<number | null>(null);

	const { data: detailRecord, isLoading: detailLoading } =
		trpc.payroll.getById.useQuery(
			{ id: detailPayrollId ?? 0 },
			{ enabled: detailPayrollId !== null },
		);

	const { data: auditLogs, isLoading: auditLoading } =
		trpc.payroll.getAuditHistory.useQuery(
			{ payrollId: detailPayrollId ?? 0 },
			{ enabled: detailPayrollId !== null },
		);

	// Mutations
	const markPaidMutation = trpc.payroll.markPaid.useMutation({
		onSuccess: () => {
			toast.success(
				"Salary disbursed successfully! Record marked as PAID and locked in ledger.",
			);
			utils.payroll.list.invalidate();
			utils.payroll.getSummaryStats.invalidate();
			utils.finance.getBankAccounts.invalidate();
			setIsDisburseModalOpen(false);
			resetDisburseForm();
		},
		onError: (err) => {
			toast.error(`Disbursement failed: ${err.message}`);
		},
	});

	const resetDisburseForm = () => {
		setSelectedRecord(null);
		setTransactionRef("");
		setPaymentProofUrl("");
		setPaymentNotes("");
		setPaymentDate(new Date().toISOString().substring(0, 10));
	};

	const openDisburseDialog = (record: NonNullable<typeof selectedRecord>) => {
		setSelectedRecord(record);
		if (bankAccountsList && bankAccountsList.length > 0 && !bankAccountId) {
			setBankAccountId(bankAccountsList[0].id);
		}
		setIsDisburseModalOpen(true);
	};

	const handleConfirmDisbursement = async () => {
		if (!selectedRecord) return;
		if (!transactionRef.trim()) {
			toast.error(
				"Transaction reference / UTR number is mandatory for payment audit.",
			);
			return;
		}
		if (!bankAccountId) {
			toast.error("Please select a bank account to disburse funds from.");
			return;
		}

		await markPaidMutation.mutateAsync({
			id: selectedRecord.id,
			payment_method_id: bankAccountId,
			transaction_reference: transactionRef.trim(),
			payment_date: paymentDate,
			payment_proof_url: paymentProofUrl.trim() || undefined,
			notes: paymentNotes.trim() || undefined,
		});
	};

	const openDetailDialog = (id: number) => {
		setDetailPayrollId(id);
		setIsDetailsModalOpen(true);
	};

	// Format currency
	const formatCurrency = (val: number | string | null | undefined) => {
		const num = Number(val || 0);
		return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const getStatusBadge = (status: string, isLocked: boolean) => {
		switch (status) {
			case "paid":
				return (
					<Badge
						variant="default"
						className="border-green-600 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
					>
						<CheckCircle2Icon className="mr-1 h-3 w-3" />
						{t("statusPaid")}{" "}
						{isLocked && <LockIcon className="ml-1 h-3 w-3" />}
					</Badge>
				);
			case "manager_approved":
				return (
					<Badge
						variant="outline"
						className="border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
					>
						<ShieldCheckIcon className="mr-1 h-3 w-3" />
						{t("statusManagerApproved")}
					</Badge>
				);
			case "submitted_to_manager":
				return (
					<Badge
						variant="outline"
						className="border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
					>
						<ClockIcon className="mr-1 h-3 w-3" />
						{t("statusSubmittedToManager")}
					</Badge>
				);
			case "returned_to_hr":
				return (
					<Badge
						variant="outline"
						className="border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
					>
						<AlertTriangleIcon className="mr-1 h-3 w-3" />
						{t("statusReturnedToHr")}
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="border-slate-300">
						{status}
					</Badge>
				);
		}
	};

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<IndianRupeeIcon className="h-6 w-6 text-green-600" />
						{t("financeQueue") || "Finance Payroll Disbursements"}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("financeQueueDesc") ||
							"Process manager-approved salary disbursements, record UTR/transaction references, and securely lock payroll entries."}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1 shadow-xs dark:bg-slate-950">
						<span className="whitespace-nowrap font-semibold text-muted-foreground text-xs">
							{t("period")}:
						</span>
						<input
							type="month"
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(e.target.value)}
							className="h-7 min-w-[145px] cursor-pointer border-0 bg-transparent p-0 font-bold text-foreground text-xs focus:outline-none sm:min-w-[160px] dark:text-slate-100"
						/>
					</div>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
				<Card className="overflow-hidden shadow-sm dark:border-slate-800">
					<CardHeader className="p-3 pb-2 sm:p-4">
						<CardDescription className="truncate text-xs">
							{t("totalEmployees")}
						</CardDescription>
						<CardTitle
							className="truncate font-bold text-xl tracking-tight sm:text-2xl"
							title={String(summaryStats?.totalEmployees ?? 0)}
						>
							{statsLoading ? (
								<Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
							) : (
								(summaryStats?.totalEmployees ?? 0)
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-4">
						<span className="truncate text-[11px] text-muted-foreground">
							Active payroll records
						</span>
					</CardContent>
				</Card>

				<Card className="overflow-hidden shadow-sm dark:border-slate-800">
					<CardHeader className="p-3 pb-2 sm:p-4">
						<CardDescription className="truncate text-xs">
							{t("totalNetPay")}
						</CardDescription>
						<CardTitle
							className="truncate font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100"
							title={formatCurrency(summaryStats?.totalNet)}
						>
							{statsLoading ? (
								<Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
							) : (
								formatCurrency(summaryStats?.totalNet)
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-4">
						<span className="truncate text-[11px] text-muted-foreground">
							Total net payable across period
						</span>
					</CardContent>
				</Card>

				<Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm dark:border-slate-800">
					<CardHeader className="p-3 pb-2 sm:p-4">
						<CardDescription className="truncate text-blue-600 text-xs dark:text-blue-400">
							Ready to Disburse
						</CardDescription>
						<CardTitle
							className="truncate font-bold text-blue-700 text-xl tracking-tight sm:text-2xl dark:text-blue-300"
							title={String(summaryStats?.statusCounts?.manager_approved ?? 0)}
						>
							{statsLoading ? (
								<Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
							) : (
								(summaryStats?.statusCounts?.manager_approved ?? 0)
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-4">
						<span className="truncate text-[11px] text-muted-foreground">
							Manager approved, awaiting payout
						</span>
					</CardContent>
				</Card>

				<Card className="overflow-hidden border-l-4 border-l-green-500 shadow-sm dark:border-slate-800">
					<CardHeader className="p-3 pb-2 sm:p-4">
						<CardDescription className="truncate text-green-600 text-xs dark:text-green-400">
							Disbursed & Locked
						</CardDescription>
						<CardTitle
							className="truncate font-bold text-green-700 text-xl tracking-tight sm:text-2xl dark:text-green-300"
							title={String(summaryStats?.statusCounts?.paid ?? 0)}
						>
							{statsLoading ? (
								<Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
							) : (
								(summaryStats?.statusCounts?.paid ?? 0)
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-4">
						<span className="truncate text-[11px] text-muted-foreground">
							Marked paid & ledger updated
						</span>
					</CardContent>
				</Card>
			</div>

			{/* Section Tabs */}
			<div className="flex space-x-4 overflow-x-auto border-gray-200 border-b">
				{[
					{
						id: "disbursements",
						label: "Salary Disbursements",
						icon: CalendarCheckIcon,
					},
					{ id: "advances", label: "Employee Advances", icon: IndianRupeeIcon },
					{ id: "reimbursements", label: "Settlement Desk", icon: InfoIcon },
				].map((tab) => {
					const Icon = tab.icon;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() =>
								setActiveTab(
									tab.id as "disbursements" | "advances" | "reimbursements",
								)
							}
							className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 font-semibold text-sm transition-colors ${
								activeTab === tab.id
									? "border-blue-600 text-blue-600"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Tab 1: SALARY DISBURSEMENTS */}
			{activeTab === "disbursements" && (
				<Card className="shadow-sm">
					<CardHeader className="flex flex-col items-start justify-between gap-3 pb-4 sm:flex-row sm:items-center">
						<div>
							<CardTitle className="font-bold text-base">
								Approved Payroll Queue
							</CardTitle>
							<CardDescription>
								Process authorized employee payments and record banking UTR
								references
							</CardDescription>
						</div>

						<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
							{/* Status Filter Toggle */}
							<div className="flex items-center rounded-lg border bg-slate-50 p-1 dark:bg-slate-900">
								<button
									type="button"
									onClick={() => setStatusFilter("manager_approved")}
									className={`rounded px-2.5 py-1 font-semibold text-xs transition-colors ${
										statusFilter === "manager_approved"
											? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Ready to Disburse
								</button>
								<button
									type="button"
									onClick={() => setStatusFilter("paid")}
									className={`rounded px-2.5 py-1 font-semibold text-xs transition-colors ${
										statusFilter === "paid"
											? "bg-white text-green-600 shadow-sm dark:bg-slate-800 dark:text-green-400"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Paid / History
								</button>
								<button
									type="button"
									onClick={() => setStatusFilter("all")}
									className={`rounded px-2.5 py-1 font-semibold text-xs transition-colors ${
										statusFilter === "all"
											? "bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									All Records
								</button>
							</div>

							{/* Search input */}
							<div className="relative w-full sm:w-60">
								<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search name, code, UTR..."
									className="h-8 pl-9 font-medium text-xs"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>

					<CardContent className="p-0 sm:p-6">
						{payrollLoading ? (
							<div className="flex justify-center py-12">
								<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : (
							<div className="-webkit-overflow-scrolling-touch w-full overflow-x-auto">
								<Table className="w-full min-w-[900px]">
									<TableHeader>
										<TableRow>
											<TableHead>{t("employee")}</TableHead>
											<TableHead>{t("team")}</TableHead>
											<TableHead>{t("payType")}</TableHead>
											<TableHead>{t("systemCalculated")}</TableHead>
											<TableHead>{t("hrAdjustment")}</TableHead>
											<TableHead>{t("finalPay")}</TableHead>
											<TableHead>{t("status")}</TableHead>
											<TableHead>Transaction / UTR</TableHead>
											<TableHead className="text-right">
												{t("actions")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{payrollList?.map((p) => {
											const isApproved = p.status === "manager_approved";
											const isPaid = p.status === "paid" || p.is_locked;
											const adj = Number(p.adjustment_amount || 0);

											return (
												<TableRow key={p.id}>
													<TableCell>
														<div className="font-bold text-slate-900 text-sm dark:text-slate-100">
															{p.staff?.name || "Employee"}
														</div>
														<div className="text-[11px] text-muted-foreground">
															{p.staff?.staff_code || `ID: #${p.staff_id}`}
														</div>
													</TableCell>
													<TableCell className="font-medium text-xs">
														{p.staff?.role || p.staff?.department || "General"}
													</TableCell>
													<TableCell>
														<span className="text-xs capitalize">
															{p.pay_type || "monthly"}
														</span>
													</TableCell>
													<TableCell className="font-medium text-xs">
														{formatCurrency(p.system_calculated_amount)}
													</TableCell>
													<TableCell className="text-xs">
														{adj !== 0 ? (
															<span
																className={`font-semibold ${adj > 0 ? "text-green-600" : "text-red-500"}`}
															>
																{adj > 0
																	? `+${formatCurrency(adj)}`
																	: formatCurrency(adj)}
															</span>
														) : (
															<span className="text-muted-foreground">
																₹0.00
															</span>
														)}
													</TableCell>
													<TableCell className="font-bold text-green-600 text-sm">
														{formatCurrency(p.net_payable)}
													</TableCell>
													<TableCell>
														{getStatusBadge(p.status, Boolean(p.is_locked))}
													</TableCell>
													<TableCell className="font-mono text-xs">
														{p.transaction_reference ? (
															<div className="flex flex-col">
																<span className="font-semibold text-slate-800 dark:text-slate-200">
																	{p.transaction_reference}
																</span>
																{p.payment_date && (
																	<span className="text-[10px] text-muted-foreground">
																		{new Date(
																			p.payment_date,
																		).toLocaleDateString()}
																	</span>
																)}
															</div>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex items-center justify-end gap-1.5">
															{isApproved ? (
																<Button
																	size="sm"
																	onClick={() => openDisburseDialog(p)}
																	className="h-8 gap-1 bg-green-600 text-white text-xs hover:bg-green-700"
																>
																	<CreditCardIcon className="h-3.5 w-3.5" />
																	Disburse Salary
																</Button>
															) : isPaid ? (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => openDetailDialog(p.id)}
																	className="h-8 gap-1 text-xs"
																>
																	<CheckCircle2Icon className="h-3.5 w-3.5 text-green-600" />
																	Receipt & Audit
																</Button>
															) : (
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() => openDetailDialog(p.id)}
																	className="h-8 text-muted-foreground text-xs"
																>
																	Details
																</Button>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})}

										{(!payrollList || payrollList.length === 0) && (
											<TableRow>
												<TableCell
													colSpan={9}
													className="py-12 text-center text-muted-foreground"
												>
													<CalendarCheckIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
													<p className="font-bold text-sm">
														{statusFilter === "manager_approved"
															? "No payroll records currently awaiting disbursement."
															: "No payroll records found matching current filters."}
													</p>
													<p className="mt-1 text-xs">
														Once Manager approves HR-submitted payroll, entries
														appear here for payment processing.
													</p>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Tab 2: EMPLOYEE ADVANCES */}
			{activeTab === "advances" && (
				<div className="grid gap-6 md:grid-cols-2">
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="font-bold text-base">
								Outstanding Employee Advances
							</CardTitle>
							<CardDescription>
								Track cash advances issued to employees for field operations
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-4">
							<div className="flex items-center justify-between border-b pb-2">
								<div className="flex flex-col">
									<span className="font-bold text-slate-800 text-xs">
										Rahul Sharma
									</span>
									<span className="text-[10px] text-muted-foreground">
										Travel advance issued Sept 1
									</span>
								</div>
								<Badge variant="secondary">₹10,000.00</Badge>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex flex-col">
									<span className="font-bold text-slate-800 text-xs">
										Priya Singh
									</span>
									<span className="text-[10px] text-muted-foreground">
										Client meal advance issued Aug 28
									</span>
								</div>
								<Badge variant="secondary">₹5,000.00</Badge>
							</div>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-blue-500 bg-white shadow-sm dark:bg-slate-950">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-bold text-base">
								<InfoIcon className="h-5 w-5 text-blue-600" /> Advance
								Settlement Rule
							</CardTitle>
							<CardDescription>
								How outstanding advance claims are settled
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 pt-2">
							<p className="font-semibold text-slate-600 text-xs leading-relaxed dark:text-slate-300">
								Once an advance is issued (e.g. ₹10,000), the employee logs
								actual bills. If actual travel receipts evaluate to ₹7,800, the
								remaining ₹2,200 is settled during final payroll generation,
								keeping the ledger perfectly consistent.
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Tab 3: SETTLEMENT DESK */}
			{activeTab === "reimbursements" && (
				<Card className="shadow-sm">
					<CardHeader className="border-b pb-3">
						<CardTitle className="font-bold text-base">
							Outstanding Reimbursement Liabilities
						</CardTitle>
						<CardDescription>
							Summary of approved expenses awaiting payroll disbursements
						</CardDescription>
					</CardHeader>
					<CardContent className="p-6 text-center text-slate-400">
						<CheckCircle2Icon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
						<p className="font-semibold text-slate-600 text-sm">
							All employee reimbursement liability lines settled.
						</p>
					</CardContent>
				</Card>
			)}

			{/* DISBURSE SALARY MODAL DIALOG */}
			<Dialog open={isDisburseModalOpen} onOpenChange={setIsDisburseModalOpen}>
				<DialogContent className="max-w-lg bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<IndianRupeeIcon className="h-5 w-5 text-green-600" />
							Disburse Employee Salary
						</DialogTitle>
						<DialogDescription>
							Record transaction details, update bank balances, and lock this
							payroll record.
						</DialogDescription>
					</DialogHeader>

					{selectedRecord && (
						<div className="space-y-4 py-2">
							{/* Summary Box */}
							<div className="rounded-lg border bg-slate-50 p-3.5 dark:bg-slate-950">
								<div className="flex items-start justify-between">
									<div>
										<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
											{selectedRecord.staff?.name}
										</h4>
										<p className="text-[11px] text-muted-foreground">
											{selectedRecord.staff?.staff_code ||
												`ID: #${selectedRecord.staff_id}`}{" "}
											• {selectedRecord.staff?.role || "Staff"} • Month:{" "}
											{selectedRecord.month}
										</p>
									</div>
									<div className="text-right">
										<div className="text-[11px] text-muted-foreground">
											Net Payable
										</div>
										<div className="font-bold text-green-600 text-lg">
											{formatCurrency(selectedRecord.net_payable)}
										</div>
									</div>
								</div>

								{/* HR Adjustment disclosure if present */}
								{Number(selectedRecord.adjustment_amount || 0) !== 0 && (
									<div className="mt-2.5 rounded border border-amber-200 bg-amber-50/70 p-2 text-amber-800 text-xs dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
										<span className="font-bold">Includes HR Adjustment:</span>{" "}
										{formatCurrency(selectedRecord.adjustment_amount)} (Reason:{" "}
										{selectedRecord.adjustment_reason || "Approved adjustment"})
									</div>
								)}
							</div>

							{/* Bank Account Selection */}
							<div className="space-y-1.5">
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-200">
									Source Bank Account <span className="text-red-500">*</span>
								</Label>
								{bankAccountsLoading ? (
									<div className="h-9 animate-pulse rounded bg-slate-100" />
								) : bankAccountsList && bankAccountsList.length > 0 ? (
									<select
										className="h-9 w-full rounded border bg-white p-2 font-medium text-xs dark:bg-slate-800"
										value={bankAccountId ?? bankAccountsList[0]?.id}
										onChange={(e) => setBankAccountId(Number(e.target.value))}
									>
										{bankAccountsList.map((b) => (
											<option key={b.id} value={b.id}>
												{b.bank_name} — {b.account_number} (Bal: ₹
												{Number(b.current_balance || 0).toLocaleString("en-IN")}
												)
											</option>
										))}
									</select>
								) : (
									<div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-700 text-xs">
										No bank accounts found. Please configure bank accounts in
										Finance settings.
									</div>
								)}
							</div>

							{/* Mandatory Transaction Reference / UTR */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label className="font-bold text-slate-700 text-xs dark:text-slate-200">
										Transaction Reference / UTR Number{" "}
										<span className="text-red-500">*</span>
									</Label>
									<span className="font-semibold text-[10px] text-red-500">
										Mandatory for audit
									</span>
								</div>
								<Input
									placeholder="e.g. UTR1234567890 / NEFT-REF-889"
									value={transactionRef}
									onChange={(e) => setTransactionRef(e.target.value)}
									className="h-9 font-mono text-xs"
								/>
							</div>

							{/* Payment Date & Proof */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="font-bold text-slate-700 text-xs dark:text-slate-200">
										Payment Date
									</Label>
									<Input
										type="date"
										value={paymentDate}
										onChange={(e) => setPaymentDate(e.target.value)}
										className="h-9 font-medium text-xs"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="font-bold text-slate-700 text-xs dark:text-slate-200">
										Payment Proof / Receipt URL
									</Label>
									<Input
										placeholder="https://... or doc reference"
										value={paymentProofUrl}
										onChange={(e) => setPaymentProofUrl(e.target.value)}
										className="h-9 font-medium text-xs"
									/>
								</div>
							</div>

							{/* Payment Notes */}
							<div className="space-y-1.5">
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-200">
									Finance Notes / Remarks (Optional)
								</Label>
								<Textarea
									placeholder="Any payment or bank disbursement remarks..."
									value={paymentNotes}
									onChange={(e) => setPaymentNotes(e.target.value)}
									rows={2}
									className="text-xs"
								/>
							</div>

							{/* Locking Banner */}
							<div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 text-xs dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
								<LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
								<div>
									<span className="font-bold">Irreversible Action:</span> Once
									marked as Paid, this record will be permanently{" "}
									<span className="font-bold">LOCKED</span>. It cannot be edited
									or altered by HR, Manager, or Finance.
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsDisburseModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleConfirmDisbursement}
							disabled={markPaidMutation.isPending || !transactionRef.trim()}
							className="gap-1 bg-green-600 text-white hover:bg-green-700"
						>
							{markPaidMutation.isPending ? (
								<>
									<Loader2Icon className="h-4 w-4 animate-spin" />
									Disbursing...
								</>
							) : (
								<>
									<CheckCircle2Icon className="h-4 w-4" />
									Confirm Disbursement & Lock
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* DETAILS & AUDIT DIALOG */}
			<Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
				<DialogContent className="max-w-2xl bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
							<FileTextIcon className="h-5 w-5 text-blue-600" />
							Payroll Details & Audit Trail
						</DialogTitle>
						<DialogDescription>
							Complete breakdown of attendance, calculations, authorization, and
							disbursement history.
						</DialogDescription>
					</DialogHeader>

					{detailLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : detailRecord ? (
						<div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
							{/* Employee Banner */}
							<div className="flex items-center justify-between rounded-lg border bg-slate-50 p-3 dark:bg-slate-950">
								<div className="flex items-center gap-2.5">
									<div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
										{detailRecord.staff?.name?.charAt(0) || "U"}
									</div>
									<div>
										<h4 className="font-bold text-sm">
											{detailRecord.staff?.name}
										</h4>
										<p className="text-[11px] text-muted-foreground">
											{detailRecord.staff?.staff_code ||
												`ID: #${detailRecord.staff_id}`}{" "}
											• Month: {detailRecord.month}
										</p>
									</div>
								</div>
								<div className="text-right">
									{getStatusBadge(
										detailRecord.status,
										Boolean(detailRecord.is_locked),
									)}
								</div>
							</div>

							{/* Financial Breakdown */}
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="rounded border p-2.5">
									<span className="text-[10px] text-muted-foreground">
										System Calculated
									</span>
									<p className="font-bold text-sm">
										{formatCurrency(detailRecord.system_calculated_amount)}
									</p>
								</div>
								<div className="rounded border p-2.5">
									<span className="text-[10px] text-muted-foreground">
										HR Adjustment
									</span>
									<p className="font-bold text-sm">
										{formatCurrency(detailRecord.adjustment_amount)}
									</p>
								</div>
								<div className="rounded border p-2.5">
									<span className="text-[10px] text-muted-foreground">
										Deductions
									</span>
									<p className="font-bold text-red-500 text-sm">
										-{formatCurrency(detailRecord.deductions)}
									</p>
								</div>
								<div className="rounded border border-green-200 bg-green-50/50 p-2.5 dark:bg-green-950/20">
									<span className="text-[10px] text-green-700 dark:text-green-300">
										Final Net Payable
									</span>
									<p className="font-bold text-green-600 text-sm dark:text-green-400">
										{formatCurrency(detailRecord.net_payable)}
									</p>
								</div>
							</div>

							{/* Disbursement details if paid */}
							{detailRecord.status === "paid" && (
								<div className="rounded-lg border border-green-300 bg-green-50/60 p-3 text-xs dark:border-green-900 dark:bg-green-950/30">
									<h5 className="flex items-center gap-1.5 font-bold text-green-800 dark:text-green-200">
										<CheckCircle2Icon className="h-4 w-4" /> Disbursement
										Confirmation
									</h5>
									<div className="mt-2 grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
										<div>
											<span className="text-muted-foreground">
												Transaction Reference / UTR:
											</span>
											<p className="font-bold font-mono">
												{detailRecord.transaction_reference || "N/A"}
											</p>
										</div>
										<div>
											<span className="text-muted-foreground">
												Payment Date:
											</span>
											<p className="font-semibold">
												{detailRecord.payment_date
													? new Date(
															detailRecord.payment_date,
														).toLocaleDateString()
													: "N/A"}
											</p>
										</div>
										{detailRecord.payment_proof_url && (
											<div className="col-span-2">
												<span className="text-muted-foreground">
													Proof Reference:
												</span>
												<p className="font-mono">
													{detailRecord.payment_proof_url}
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Audit History Timeline */}
							<div className="space-y-2">
								<h5 className="flex items-center gap-1.5 font-bold text-slate-800 text-xs dark:text-slate-200">
									<HistoryIcon className="h-4 w-4 text-blue-600" />
									Audit & Action Timeline
								</h5>

								{auditLoading ? (
									<div className="flex justify-center py-4">
										<Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
									</div>
								) : auditLogs && auditLogs.length > 0 ? (
									<div className="space-y-2 border-slate-200 border-l-2 pl-3 dark:border-slate-800">
										{auditLogs.map((log) => (
											<div key={log.id} className="relative text-xs">
												<div className="font-semibold text-slate-900 dark:text-slate-100">
													{log.action?.replace(/_/g, " ").toUpperCase()}
													<span className="ml-2 font-normal text-[11px] text-muted-foreground">
														{log.createdAt
															? new Date(log.createdAt).toLocaleString()
															: ""}
													</span>
												</div>
												<div className="text-[11px] text-muted-foreground">
													By: {log.changedByName || "System"} (Role:{" "}
													{log.role || "admin"})
												</div>
												{log.reason && (
													<div className="mt-0.5 rounded bg-slate-50 p-1.5 font-medium text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
														"{log.reason}"
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<p className="text-[11px] text-muted-foreground">
										No audit entries recorded for this record.
									</p>
								)}
							</div>
						</div>
					) : null}

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsDetailsModalOpen(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
