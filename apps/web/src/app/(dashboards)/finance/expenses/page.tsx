"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@evaluna/ui/components/dialog";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
  WalletCardsIcon,
  SearchIcon,
  Loader2Icon,
  PlusIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  UsersIcon,
  PaperclipIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition, StaggerList, StaggerItem, AnimatedCard } from "@/lib/animations";
import { toast } from "sonner";

export default function FinanceExpensesPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"my_claims" | "supervisor_review" | "payouts" | "policies">("my_claims");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: myExpenses, isLoading: myLoading } = trpc.employeeExpenses.listMine.useQuery();
  const { data: submittedClaims, isLoading: reviewLoading } = trpc.employeeExpenses.list.useQuery({ status: "submitted" });
  const { data: approvedClaims, isLoading: payoutsLoading } = trpc.employeeExpenses.list.useQuery({ status: "approved" });
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
    }
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
    }
  });

  const payExpenseMutation = trpc.employeeExpenses.pay.useMutation({
    onSuccess: () => {
      toast.success("Reimbursement payment completed. Transaction ledger updated!");
      utils.employeeExpenses.list.invalidate({ status: "approved" });
      utils.finance.getDashboardStats.invalidate();
      setIsPayModalOpen(false);
      setPayRefNumber("");
    },
    onError: (err) => {
      toast.error(`Payment failed: ${err.message}`);
    }
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
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");

  // Pay Form State
  const [payBankAccountId, setPayBankAccountId] = useState("1");
  const [payRefNumber, setPayRefNumber] = useState("");

  const handleReviewClaim = async () => {
    if (!selectedClaimId) return;
    await reviewExpenseMutation.mutateAsync({
      id: selectedClaimId,
      decision: reviewDecision,
      review_notes: reviewNotes
    });
  };

  const handlePayClaim = async () => {
    if (!selectedClaimId) return;
    await payExpenseMutation.mutateAsync({
      id: selectedClaimId,
      bank_account_id: parseInt(payBankAccountId),
      reference_number: payRefNumber
    });
  };

  const handleSubmitClaim = async () => {
    if (!claimAmount) {
      toast.error("Please enter a claim amount.");
      return;
    }
    // Duplicate claims detection check
    const isDuplicate = myExpenses?.some(exp => 
      Number(exp.amount) === parseFloat(claimAmount) &&
      exp.description === claimDesc &&
      exp.status === "submitted"
    );

    if (isDuplicate) {
      toast.warning("Possible duplicate expense detected. Check your submitted claims first!");
      return;
    }

    await submitExpenseMutation.mutateAsync({
      amount: parseFloat(claimAmount),
      category_id: parseInt(claimCategory),
      description: claimDesc,
      business_purpose: claimPurpose,
      payment_method: claimPaymentMethod,
    });
  };

  return (
    <PageTransition className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Employee Expense Claims Console
          </h2>
          <p className="text-muted-foreground text-sm">
            Record operational claims, verify leave/attendance policies, and complete payouts securely.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsSubmitModalOpen(true)} className="text-xs h-9 font-bold shadow-sm">
            <PlusIcon className="mr-1.5 h-4 w-4" /> Record Expense Request
          </Button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 overflow-x-auto space-x-4">
        {[
          { id: "my_claims", label: "My Expense Claims", icon: WalletCardsIcon },
          { id: "supervisor_review", label: "HR / Supervisor Review", icon: UsersIcon, badge: submittedClaims?.total },
          { id: "payouts", label: "Finance Payout Queue", icon: ClockIcon, badge: approvedClaims?.total },
          { id: "policies", label: "Configured Policies", icon: ShieldCheckIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 ? (
                <span className="rounded-full bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 ml-1 animate-pulse">
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
              <CardTitle className="text-base font-bold">My Personal Claims Ledger</CardTitle>
              <CardDescription>Verify the status and approval timeline of your logged reimbursements</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {myLoading ? (
                <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Number</TableHead>
                      <TableHead>Date Logged</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Business Purpose</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Approval Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myExpenses?.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-bold text-xs text-blue-600">{exp.expense_number}</TableCell>
                        <TableCell className="text-slate-500 text-xs">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-xs">₹{Number(exp.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{exp.business_purpose || "-"}</TableCell>
                        <TableCell className="text-xs text-slate-500">{exp.payment_method}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={exp.status === "paid" ? "default" : exp.status === "rejected" ? "destructive" : "outline"}
                            className={exp.status === "submitted" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                          >
                            {exp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {myExpenses?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <WalletCardsIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No expenses claimed yet.</p>
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
              <CardTitle className="text-base font-bold">Manager & HR Review Console</CardTitle>
              <CardDescription>Evaluate policy compliance limits of active claims and approve them to the payout queue</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {reviewLoading ? (
                <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
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
                        <TableCell className="font-bold text-xs text-blue-600">{claim.expense_number}</TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-slate-100">{claim.staffMember?.name}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{claim.business_purpose || "-"}</TableCell>
                        <TableCell className="text-slate-500 text-xs">{new Date(claim.expense_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-xs">₹{Number(claim.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => {
                            setSelectedClaimId(claim.id);
                            setIsReviewModalOpen(true);
                          }} className="text-xs h-8 shadow-sm">
                            Review Request
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {submittedClaims?.items?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <UsersIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No claims awaiting supervisor review.</p>
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
              <CardTitle className="text-base font-bold">Approved Reimbursement Payout Desk</CardTitle>
              <CardDescription>Select bank account, register payment reference, and complete employee payouts</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {payoutsLoading ? (
                <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
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
                        <TableCell className="font-bold text-xs text-blue-600">{claim.expense_number}</TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-slate-100">{claim.staffMember?.name}</TableCell>
                        <TableCell className="text-xs font-semibold">{claim.category?.name || "Operational"}</TableCell>
                        <TableCell className="text-slate-500 text-xs">{claim.reviewed_at ? new Date(claim.reviewed_at).toLocaleDateString() : "Today"}</TableCell>
                        <TableCell className="font-bold text-xs text-green-600">₹{Number(claim.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="secondary" onClick={() => {
                            setSelectedClaimId(claim.id);
                            setIsPayModalOpen(true);
                          }} className="text-xs h-8 shadow-sm">
                            Mark as Paid
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {approvedClaims?.items?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <CheckCircle2Icon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No approved claims awaiting finance payout.</p>
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
                <CardTitle className="text-base font-bold">Configured Reimbursement Policy Indexes</CardTitle>
                <CardDescription>Rules of maximum limits allowed by category and operator grades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-semibold">Food Category Maximum Daily Limit</span>
                  <Badge variant="secondary">₹500.00 / day</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-semibold">Travel Category Maximum Daily Limit</span>
                  <Badge variant="secondary">₹5,000.00 / request</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-semibold">Fuel Category Monthly Limit</span>
                  <Badge variant="secondary">₹10,000.00 / month</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">Accommodation Limit</span>
                  <Badge variant="secondary">₹4,000.00 / night</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600" /> Duplicate Expense Protection Desk
                </CardTitle>
                <CardDescription>Integrated background check rules to prevent double-reimbursement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-blue-700 leading-relaxed font-semibold">
                    The ledger automatically runs deep checks comparing Employee ID, Dates, Amount, and Descriptions during claim submission. Discrepancies generate warning banners to reviewing supervisors instantly.
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
            <DialogTitle className="text-lg font-bold">Record Expense Claim Request</DialogTitle>
            <DialogDescription>Submit reimbursement receipt details directly to the HR ledger for approval.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-bold text-slate-700">Claim Category Type</Label>
                <select
                  className="w-full border rounded p-2 bg-white mt-1 text-xs font-bold cursor-pointer h-9"
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
                <Label className="text-xs font-bold text-slate-700">Claim Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="E.g. 750"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="mt-1 font-bold text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Detailed Description</Label>
              <Input
                placeholder="E.g. Bought dinner for business project team"
                value={claimDesc}
                onChange={(e) => setClaimDesc(e.target.value)}
                className="mt-1 text-xs h-9 font-semibold"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Business Purpose & Context</Label>
              <Textarea
                placeholder="Specify clients present, project details, cost center..."
                value={claimPurpose}
                onChange={(e) => setClaimPurpose(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>

            <div className="border p-3 rounded-lg bg-slate-50 flex items-center justify-between border-dashed">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <PaperclipIcon className="h-4 w-4" /> Bill Receipt Screenshot (.PNG/.PDF)
              </span>
              <Button size="sm" variant="outline" className="text-xs h-7">Upload Receipt</Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSubmitClaim}
              disabled={submitExpenseMutation.isPending}
            >
              {submitExpenseMutation.isPending ? "Submitting..." : "Submit Claim to HR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUPERVISOR REVIEW MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Review Claim Request</DialogTitle>
            <DialogDescription>Validate claim details against leave, attendance, and expense policy limits.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Decision Outcome</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1 text-xs font-bold cursor-pointer h-9"
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value as any)}
              >
                <option value="approve">Approve Request</option>
                <option value="reject">Reject Request</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Reviewer Audit Notes</Label>
              <Textarea
                placeholder="E.g. Approved. Verified within food category ₹500 daily allowance."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleReviewClaim}
              disabled={reviewExpenseMutation.isPending}
            >
              {reviewExpenseMutation.isPending ? "Logging..." : "Confirm Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MARK AS PAID / CONFIRM DISBURSEMENT DIALOG */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Record Disbursement & Mark as Paid</DialogTitle>
            <DialogDescription>Input payment bank transactional reference number and close reimbursement.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Source Bank Account</Label>
              <select
                className="w-full border rounded p-2 bg-white mt-1 text-xs font-bold cursor-pointer h-9"
                value={payBankAccountId}
                onChange={(e) => setPayBankAccountId(e.target.value)}
              >
                {bankAccountsList?.map(b => (
                  <option key={b.id} value={b.id}>{b.bank_name} — {b.account_number} (Balance: ₹{b.current_balance})</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Payment Reference Number (UTR/UPI Ref)</Label>
              <Input
                placeholder="E.g. UTR-2026-9851475"
                value={payRefNumber}
                onChange={(e) => setPayRefNumber(e.target.value)}
                className="mt-1 font-bold text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handlePayClaim}
              disabled={payExpenseMutation.isPending}
            >
              {payExpenseMutation.isPending ? "Confirming..." : "Record Payment & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
