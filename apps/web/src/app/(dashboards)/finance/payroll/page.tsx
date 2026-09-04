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
	CalendarCheckIcon,
	CheckCircle2Icon,
	CreditCardIcon,
	DollarSignIcon,
	InfoIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function FinancePayrollPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [activeTab, setActiveTab] = useState<
		"payroll_runs" | "advances" | "reimbursements"
	>("payroll_runs");
	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: payrollList, isLoading: payrollLoading } =
		trpc.payroll.list.useQuery({});
	const { data: bankAccountsList } = trpc.finance.getBankAccounts.useQuery();

	// Mutations
	const generatePayrollMutation = trpc.payroll.generate.useMutation({
		onSuccess: (data) => {
			toast.success(
				`Generated salary drafts for ${data.generated} active employees!`,
			);
			utils.payroll.list.invalidate();
		},
		onError: (err) => {
			toast.error(`Generation failed: ${err.message}`);
		},
	});

	const payPayrollMutation = trpc.payroll.pay.useMutation({
		onSuccess: () => {
			toast.success(
				"Salary disbursement successfully completed. Finance ledger updated!",
			);
			utils.payroll.list.invalidate();
			utils.finance.getDashboardStats.invalidate();
			setIsPayModalOpen(false);
		},
		onError: (err) => {
			toast.error(`Payment failed: ${err.message}`);
		},
	});

	// Modal State
	const [isPayModalOpen, setIsPayModalOpen] = useState(false);
	const [selectedPayrollId, setSelectedSupplierId] = useState<number | null>(
		null,
	);
	const [payBankAccountId, setPayBankAccountId] = useState("1");

	const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
	const [genMonth, setGenMonth] = useState("2026-09");

	const handleGeneratePayroll = async () => {
		await generatePayrollMutation.mutateAsync({
			month: genMonth,
		});
		setIsGenerateModalOpen(false);
	};

	const handlePaySalary = async () => {
		if (!selectedPayrollId) return;
		await payPayrollMutation.mutateAsync({
			id: selectedPayrollId,
			payment_method_id: Number.parseInt(payBankAccountId),
		});
	};

	const filteredPayroll =
		payrollList?.filter(
			(p) =>
				p.staff?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.month.includes(searchQuery),
		) || [];

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						HR Payroll & Salary Disbursements
					</h2>
					<p className="text-muted-foreground text-sm">
						Process approved HR salary runs, manage employee advance
						settlements, and record banking transactions.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={() => setIsGenerateModalOpen(true)}
						className="h-9 font-bold text-xs shadow-sm"
					>
						<PlusIcon className="mr-1.5 h-4 w-4" /> Run Monthly Payroll
					</Button>
				</div>
			</div>

			{/* Tabs Selector */}
			<div className="flex space-x-4 overflow-x-auto border-gray-200 border-b">
				{[
					{
						id: "payroll_runs",
						label: "Salary Payroll Runs",
						icon: CalendarCheckIcon,
					},
					{ id: "advances", label: "Employee Advances", icon: DollarSignIcon },
					{ id: "reimbursements", label: "Settlement Desk", icon: InfoIcon },
				].map((tab) => {
					const Icon = tab.icon;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as any)}
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

			{/* Content body */}
			<div className="min-h-[300px]">
				{/* PAYROLL RUNS TAB */}
				{activeTab === "payroll_runs" && (
					<Card className="shadow-sm">
						<CardHeader className="flex flex-col items-start justify-between gap-2 pb-4 sm:flex-row sm:items-center">
							<div>
								<CardTitle className="font-bold text-base">
									HR Approved Payroll Runs
								</CardTitle>
								<CardDescription>
									Salary runs generated by HR team awaiting final financial
									payout
								</CardDescription>
							</div>
							<div className="relative w-full sm:w-64">
								<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search employee, month..."
									className="h-8 pl-9 font-semibold text-xs"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{payrollLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Employee Name</TableHead>
											<TableHead>Salary Month</TableHead>
											<TableHead>Base Salary</TableHead>
											<TableHead>Deductions</TableHead>
											<TableHead>Net Payable</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredPayroll.map((p) => (
											<TableRow key={p.id}>
												<TableCell className="font-bold text-slate-900 dark:text-slate-100">
													{p.staff?.name}
												</TableCell>
												<TableCell className="font-semibold text-slate-500 text-xs">
													{p.month}
												</TableCell>
												<TableCell className="font-medium text-xs">
													₹{Number(p.base_salary).toFixed(2)}
												</TableCell>
												<TableCell className="text-red-500 text-xs">
													-₹{Number(p.deductions || 0).toFixed(2)}
												</TableCell>
												<TableCell className="font-bold text-green-600 text-xs">
													₹{Number(p.net_payable).toFixed(2)}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															p.status === "paid" ? "default" : "outline"
														}
														className={
															p.status === "draft" || p.status === "approved"
																? "border-amber-200 bg-amber-50 text-amber-700"
																: ""
														}
													>
														{p.status}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													{p.status !== "paid" ? (
														<Button
															size="sm"
															onClick={() => {
																setSelectedSupplierId(p.id);
																setIsPayModalOpen(true);
															}}
															className="h-8 text-xs"
														>
															Disburse Salary
														</Button>
													) : (
														<span className="flex items-center justify-end gap-1 font-bold text-green-600 text-xs">
															<CheckCircle2Icon className="h-4 w-4" /> Disbursed
															✓
														</span>
													)}
												</TableCell>
											</TableRow>
										))}
										{filteredPayroll.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={7}
													className="py-12 text-center text-muted-foreground"
												>
													<CalendarCheckIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
													<p className="font-bold text-sm">
														No payroll runs found.
													</p>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				)}

				{/* ADVANCES TAB */}
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

						<Card className="border-l-4 border-l-blue-500 bg-white shadow-sm">
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
								<p className="font-semibold text-slate-600 text-xs leading-relaxed">
									Once an advance is issued (e.g. ₹10,000), the employee logs
									actual bills. If actual travel receipts evaluate to ₹7,800,
									the remaining ₹2,200 is settled during final payroll
									generation, keeping the ledger perfectly consistent.
								</p>
							</CardContent>
						</Card>
					</div>
				)}

				{/* REIMBURSEMENTS TAB */}
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
			</div>

			{/* GENERATE PAYROLL MODAL DIALOG */}
			<Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Run Monthly Payroll
						</DialogTitle>
						<DialogDescription>
							Run auto-calculations of base salaries and deductions across
							active employees.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Salary Payout Month
							</Label>
							<Input
								type="month"
								value={genMonth}
								onChange={(e) => setGenMonth(e.target.value)}
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsGenerateModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleGeneratePayroll}
							disabled={generatePayrollMutation.isPending}
						>
							{generatePayrollMutation.isPending
								? "Generating..."
								: "Generate Salary Drafts"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* DISBURSE SALARY DIALOG */}
			<Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Disburse Employee Salary
						</DialogTitle>
						<DialogDescription>
							Authorize bank account transfer, creating transactions and
							decrementing bank balances.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Source Bank Account
							</Label>
							<select
								className="mt-1 h-9 w-full cursor-pointer rounded border bg-white p-2 font-bold text-xs"
								value={payBankAccountId}
								onChange={(e) => setPayBankAccountId(e.target.value)}
							>
								{bankAccountsList?.map((b) => (
									<option key={b.id} value={b.id}>
										{b.bank_name} — {b.account_number} (Balance: ₹
										{b.current_balance})
									</option>
								))}
							</select>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPayModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handlePaySalary}
							disabled={payPayrollMutation.isPending}
						>
							{payPayrollMutation.isPending
								? "Confirming..."
								: "Disburse Salary"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
