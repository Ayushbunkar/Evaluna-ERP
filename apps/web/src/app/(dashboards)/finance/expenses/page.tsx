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
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PaperclipIcon,
	PlusIcon,
	SearchIcon,
	ShieldCheckIcon,
	UsersIcon,
	WalletCardsIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function FinanceExpensesPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [activeTab, setActiveTab] = useState<
		"my_claims" | "supervisor_review" | "payouts" | "policies"
	>("my_claims");
	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: myExpenses, isLoading: myLoading } =
		trpc.employeeExpenses.listMine.useQuery();
	const { data: submittedClaims, isLoading: reviewLoading } =
		trpc.employeeExpenses.list.useQuery({ status: "submitted" });
	const { data: approvedClaims, isLoading: payoutsLoading } =
		trpc.employeeExpenses.list.useQuery({ status: "approved" });
	const { data: bankAccountsList } = trpc.finance.getBankAccounts.useQuery();

	// Mutations
	const submitExpenseMutation = trpc.employeeExpenses.submit.useMutation({
		onSuccess: () => {
			toast.success("Expense request successfully submitted to HR!");
			utils.employeeExpenses.listMine.invalidate();
			utils.finance.getDashboardStats.invalidate();
			setIsSubmitModalOpen(false);
			setClaimAmount("");
			setClaimCategory("1");
			setClaimDesc("");
			setClaimPurpose("");
		},
		onError: (err) => {
			toast.error(`Submission failed: ${err.message}`);
		},
	});

	const reviewExpenseMutation = trpc.employeeExpenses.review.useMutation({
		onSuccess: () => {
			toast.success("Review decision successfully logged!");
			utils.employeeExpenses.list.invalidate({ status: "submitted" });
			utils.employeeExpenses.list.invalidate({ status: "approved" });
			utils.finance.getDashboardStats.invalidate();
			setIsReviewModalOpen(false);
			setReviewNotes("");
		},
		onError: (err) => {
			toast.error(`Review failed: ${err.message}`);
		},
	});

	const payExpenseMutation = trpc.employeeExpenses.pay.useMutation({
		onSuccess: () => {
			toast.success(
				"Reimbursement payment completed. Transaction ledger updated!",
			);
			utils.employeeExpenses.list.invalidate({ status: "approved" });
			utils.finance.getDashboardStats.invalidate();
			setIsPayModalOpen(false);
			setPayRefNumber("");
		},
		onError: (err) => {
			toast.error(`Payment failed: ${err.message}`);
		},
	});

	// Modal State
	const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
	const [isPayModalOpen, setIsPayModalOpen] = useState(false);

	// Submit Claim Form State
	const [claimAmount, setClaimAmount] = useState("");
	const [claimCategory, setClaimCategory] = useState("1"); // 1 for Food, 2 for Travel etc.
	const [claimDesc, setClaimDesc] = useState("");
	const [claimPurpose, setClaimPurpose] = useState("");
	const [claimPaymentMethod, setClaimPaymentMethod] = useState("Cash");

	// Review Form State
	const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
	const [reviewDecision, setReviewDecision] = useState<"approve" | "reject">(
		"approve",
	);
	const [reviewNotes, setReviewNotes] = useState("");

	// Pay Form State
	const [payBankAccountId, setPayBankAccountId] = useState("1");
	const [payRefNumber, setPayRefNumber] = useState("");

	const handleReviewClaim = async () => {
		if (!selectedClaimId) return;
		await reviewExpenseMutation.mutateAsync({
			id: selectedClaimId,
			decision: reviewDecision,
			review_notes: reviewNotes,
		});
	};

	const handlePayClaim = async () => {
		if (!selectedClaimId) return;
		await payExpenseMutation.mutateAsync({
			id: selectedClaimId,
			bank_account_id: Number.parseInt(payBankAccountId),
			reference_number: payRefNumber,
		});
	};

	const handleSubmitClaim = async () => {
		if (!claimAmount) {
			toast.error("Please enter a claim amount.");
			return;
		}
		// Duplicate claims detection check
		const isDuplicate = myExpenses?.some(
			(exp) =>
				Number(exp.amount) === Number.parseFloat(claimAmount) &&
				exp.description === claimDesc &&
				exp.status === "submitted",
		);

		if (isDuplicate) {
			toast.warning(
				"Possible duplicate expense detected. Check your submitted claims first!",
			);
			return;
		}

		await submitExpenseMutation.mutateAsync({
			amount: Number.parseFloat(claimAmount),
			category_id: Number.parseInt(claimCategory),
			description: claimDesc,
			business_purpose: claimPurpose,
			payment_method: claimPaymentMethod,
		});
	};

	return (
		<PageTransition className="container mx-auto space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Employee Expense Claims Console
					</h2>
					<p className="text-muted-foreground text-sm">
						Record operational claims, verify leave/attendance policies, and
						complete payouts securely.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={() => setIsSubmitModalOpen(true)}
						className="h-9 font-bold text-xs shadow-sm"
					>
						<PlusIcon className="mr-1.5 h-4 w-4" /> Record Expense Request
					</Button>
				</div>
			</div>

			{/* Tabs Selector */}
			<div className="flex space-x-4 overflow-x-auto border-gray-200 border-b">
				{[
					{
						id: "my_claims",
						label: "My Expense Claims",
						icon: WalletCardsIcon,
					},
					{
						id: "supervisor_review",
						label: "HR / Supervisor Review",
						icon: UsersIcon,
						badge: submittedClaims?.total,
					},
					{
						id: "payouts",
						label: "Finance Payout Queue",
						icon: ClockIcon,
						badge: approvedClaims?.total,
					},
					{
						id: "policies",
						label: "Configured Policies",
						icon: ShieldCheckIcon,
					},
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
							{tab.badge !== undefined && tab.badge > 0 ? (
								<span className="ml-1 animate-pulse rounded-full bg-blue-500 px-1.5 py-0.5 font-bold text-[10px] text-white">
									{tab.badge}
								</span>
							) : null}
						</button>
					);
				})}
			</div>

			{/* TABS CONTENT */}
			<div className="min-h-[300px]">
				{/* MY CLAIMS TAB */}
				{activeTab === "my_claims" && (
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="font-bold text-base">
								My Personal Claims Ledger
							</CardTitle>
							<CardDescription>
								Verify the status and approval timeline of your logged
								reimbursements
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{myLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Claim Number</TableHead>
											<TableHead>Date Logged</TableHead>
											<TableHead>Total Amount</TableHead>
											<TableHead>Business Purpose</TableHead>
											<TableHead>Payment Method</TableHead>
											<TableHead className="text-right">
												Approval Status
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{myExpenses?.map((exp) => (
											<TableRow key={exp.id}>
												<TableCell className="font-bold text-blue-600 text-xs">
													{exp.expense_number}
												</TableCell>
												<TableCell className="text-slate-500 text-xs">
													{new Date(exp.expense_date).toLocaleDateString()}
												</TableCell>
												<TableCell className="font-bold text-xs">
													₹{Number(exp.amount).toFixed(2)}
												</TableCell>
												<TableCell className="max-w-[200px] truncate text-xs">
													{exp.business_purpose || "-"}
												</TableCell>
												<TableCell className="text-slate-500 text-xs">
													{exp.payment_method}
												</TableCell>
												<TableCell className="text-right">
													<Badge
														variant={
															exp.status === "paid"
																? "default"
																: exp.status === "rejected"
																	? "destructive"
																	: "outline"
														}
														className={
															exp.status === "submitted"
																? "border-amber-200 bg-amber-50 text-amber-700"
																: ""
														}
													>
														{exp.status}
													</Badge>
												</TableCell>
											</TableRow>
										))}
										{myExpenses?.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={6}
													className="py-12 text-center text-muted-foreground"
												>
													<WalletCardsIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
													<p className="font-bold text-sm">
														No expenses claimed yet.
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

				{/* SUPERVISOR REVIEW TAB */}
				{activeTab === "supervisor_review" && (
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="font-bold text-base">
								Manager & HR Review Console
							</CardTitle>
							<CardDescription>
								Evaluate policy compliance limits of active claims and approve
								them to the payout queue
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{reviewLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Claim ID</TableHead>
											<TableHead>Employee Name</TableHead>
											<TableHead>Business Purpose</TableHead>
											<TableHead>Requested Date</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{submittedClaims?.items?.map((claim: any) => (
											<TableRow key={claim.id}>
												<TableCell className="font-bold text-blue-600 text-xs">
													{claim.expense_number}
												</TableCell>
												<TableCell className="font-bold text-slate-900 dark:text-slate-100">
													{claim.staffMember?.name}
												</TableCell>
												<TableCell className="max-w-[200px] truncate text-xs">
													{claim.business_purpose || "-"}
												</TableCell>
												<TableCell className="text-slate-500 text-xs">
													{new Date(claim.expense_date).toLocaleDateString()}
												</TableCell>
												<TableCell className="font-bold text-xs">
													₹{Number(claim.amount).toFixed(2)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														onClick={() => {
															setSelectedClaimId(claim.id);
															setIsReviewModalOpen(true);
														}}
														className="h-8 text-xs shadow-sm"
													>
														Review Request
													</Button>
												</TableCell>
											</TableRow>
										))}
										{submittedClaims?.items?.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={6}
													className="py-12 text-center text-muted-foreground"
												>
													<UsersIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
													<p className="font-bold text-sm">
														No claims awaiting supervisor review.
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

				{/* APPROVED PAYOUTS TAB */}
				{activeTab === "payouts" && (
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="font-bold text-base">
								Approved Reimbursement Payout Desk
							</CardTitle>
							<CardDescription>
								Select bank account, register payment reference, and complete
								employee payouts
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{payoutsLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Claim ID</TableHead>
											<TableHead>Employee Name</TableHead>
											<TableHead>Category Type</TableHead>
											<TableHead>Approved Date</TableHead>
											<TableHead>Net Payable</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{approvedClaims?.items?.map((claim: any) => (
											<TableRow key={claim.id}>
												<TableCell className="font-bold text-blue-600 text-xs">
													{claim.expense_number}
												</TableCell>
												<TableCell className="font-bold text-slate-900 dark:text-slate-100">
													{claim.staffMember?.name}
												</TableCell>
												<TableCell className="font-semibold text-xs">
													{claim.category?.name || "Operational"}
												</TableCell>
												<TableCell className="text-slate-500 text-xs">
													{claim.reviewed_at
														? new Date(claim.reviewed_at).toLocaleDateString()
														: "Today"}
												</TableCell>
												<TableCell className="font-bold text-green-600 text-xs">
													₹{Number(claim.amount).toFixed(2)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														variant="secondary"
														onClick={() => {
															setSelectedClaimId(claim.id);
															setIsPayModalOpen(true);
														}}
														className="h-8 text-xs shadow-sm"
													>
														Mark as Paid
													</Button>
												</TableCell>
											</TableRow>
										))}
										{approvedClaims?.items?.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={6}
													className="py-12 text-center text-muted-foreground"
												>
													<CheckCircle2Icon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
													<p className="font-bold text-sm">
														No approved claims awaiting finance payout.
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

				{/* CONFIGURABLE POLICIES TAB */}
				{activeTab === "policies" && (
					<div className="grid gap-6 md:grid-cols-2">
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="font-bold text-base">
									Configured Reimbursement Policy Indexes
								</CardTitle>
								<CardDescription>
									Rules of maximum limits allowed by category and operator
									grades
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between border-b pb-2">
									<span className="font-semibold text-xs">
										Food Category Maximum Daily Limit
									</span>
									<Badge variant="secondary">₹500.00 / day</Badge>
								</div>
								<div className="flex items-center justify-between border-b pb-2">
									<span className="font-semibold text-xs">
										Travel Category Maximum Daily Limit
									</span>
									<Badge variant="secondary">₹5,000.00 / request</Badge>
								</div>
								<div className="flex items-center justify-between border-b pb-2">
									<span className="font-semibold text-xs">
										Fuel Category Monthly Limit
									</span>
									<Badge variant="secondary">₹10,000.00 / month</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-semibold text-xs">
										Accommodation Limit
									</span>
									<Badge variant="secondary">₹4,000.00 / night</Badge>
								</div>
							</CardContent>
						</Card>

						<Card className="border-l-4 border-l-blue-500 bg-white shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<ShieldCheckIcon className="h-5 w-5 text-blue-600" />{" "}
									Duplicate Expense Protection Desk
								</CardTitle>
								<CardDescription>
									Integrated background check rules to prevent
									double-reimbursement
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 pt-2">
								<div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
									<InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
									<p className="font-semibold text-[11px] text-blue-700 leading-relaxed">
										The ledger automatically runs deep checks comparing Employee
										ID, Dates, Amount, and Descriptions during claim submission.
										Discrepancies generate warning banners to reviewing
										supervisors instantly.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* RECORD EXPENSE REQUEST MODAL */}
			<Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
				<DialogContent className="max-w-xl bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Record Expense Claim Request
						</DialogTitle>
						<DialogDescription>
							Submit reimbursement receipt details directly to the HR ledger for
							approval.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label className="font-bold text-slate-700 text-xs">
									Claim Category Type
								</Label>
								<select
									className="mt-1 h-9 w-full cursor-pointer rounded border bg-white p-2 font-bold text-xs"
									value={claimCategory}
									onChange={(e) => setClaimCategory(e.target.value)}
								>
									<option value="1">Food & Meals (Max ₹500)</option>
									<option value="2">Travel & Transport (Max ₹5000)</option>
									<option value="3">Fuel & Logistics</option>
									<option value="4">Office Supplies</option>
								</select>
							</div>
							<div>
								<Label className="font-bold text-slate-700 text-xs">
									Claim Amount (₹)
								</Label>
								<Input
									type="number"
									placeholder="E.g. 750"
									value={claimAmount}
									onChange={(e) => setClaimAmount(e.target.value)}
									className="mt-1 h-9 font-bold text-xs"
								/>
							</div>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Detailed Description
							</Label>
							<Input
								placeholder="E.g. Bought dinner for business project team"
								value={claimDesc}
								onChange={(e) => setClaimDesc(e.target.value)}
								className="mt-1 h-9 font-semibold text-xs"
							/>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Business Purpose & Context
							</Label>
							<Textarea
								placeholder="Specify clients present, project details, cost center..."
								value={claimPurpose}
								onChange={(e) => setClaimPurpose(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>

						<div className="flex items-center justify-between rounded-lg border border-dashed bg-slate-50 p-3">
							<span className="flex items-center gap-1.5 font-semibold text-muted-foreground text-xs">
								<PaperclipIcon className="h-4 w-4" /> Bill Receipt Screenshot
								(.PNG/.PDF)
							</span>
							<Button size="sm" variant="outline" className="h-7 text-xs">
								Upload Receipt
							</Button>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsSubmitModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSubmitClaim}
							disabled={submitExpenseMutation.isPending}
						>
							{submitExpenseMutation.isPending
								? "Submitting..."
								: "Submit Claim to HR"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* SUPERVISOR REVIEW MODAL */}
			<Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Review Claim Request
						</DialogTitle>
						<DialogDescription>
							Validate claim details against leave, attendance, and expense
							policy limits.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Decision Outcome
							</Label>
							<select
								className="mt-1 h-9 w-full cursor-pointer rounded border bg-white p-2 font-bold text-xs"
								value={reviewDecision}
								onChange={(e) => setReviewDecision(e.target.value as any)}
							>
								<option value="approve">Approve Request</option>
								<option value="reject">Reject Request</option>
							</select>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Reviewer Audit Notes
							</Label>
							<Textarea
								placeholder="E.g. Approved. Verified within food category ₹500 daily allowance."
								value={reviewNotes}
								onChange={(e) => setReviewNotes(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsReviewModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleReviewClaim}
							disabled={reviewExpenseMutation.isPending}
						>
							{reviewExpenseMutation.isPending
								? "Logging..."
								: "Confirm Decision"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* MARK AS PAID / CONFIRM DISBURSEMENT DIALOG */}
			<Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Record Disbursement & Mark as Paid
						</DialogTitle>
						<DialogDescription>
							Input payment bank transactional reference number and close
							reimbursement.
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
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Payment Reference Number (UTR/UPI Ref)
							</Label>
							<Input
								placeholder="E.g. UTR-2026-9851475"
								value={payRefNumber}
								onChange={(e) => setPayRefNumber(e.target.value)}
								className="mt-1 h-9 font-bold text-xs"
							/>
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
							onClick={handlePayClaim}
							disabled={payExpenseMutation.isPending}
						>
							{payExpenseMutation.isPending
								? "Confirming..."
								: "Record Payment & Complete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
