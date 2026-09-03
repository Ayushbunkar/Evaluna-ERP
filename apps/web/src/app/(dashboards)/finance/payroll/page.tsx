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
  CalendarCheckIcon,
  SearchIcon,
  Loader2Icon,
  PlusIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  DollarSignIcon,
  InfoIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import { toast } from "sonner";

export default function FinancePayrollPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"payroll_runs" | "advances" | "reimbursements">("payroll_runs");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: payrollList, isLoading: payrollLoading } = trpc.payroll.list.useQuery({});
  const { data: bankAccountsList } = trpc.finance.getBankAccounts.useQuery();

  // Mutations
  const generatePayrollMutation = trpc.payroll.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated salary drafts for ${data.generated} active employees!`);
      utils.payroll.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
    }
  });

  const payPayrollMutation = trpc.payroll.pay.useMutation({
    onSuccess: () => {
      toast.success("Salary disbursement successfully completed. Finance ledger updated!");
      utils.payroll.list.invalidate();
      utils.finance.getDashboardStats.invalidate();
      setIsPayModalOpen(false);
    },
    onError: (err) => {
      toast.error(`Payment failed: ${err.message}`);
    }
  });

  // Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayrollId, setSelectedSupplierId] = useState<number | null>(null);
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
      payment_method_id: parseInt(payBankAccountId),
    });
  };

  const filteredPayroll = payrollList?.filter(p => 
    p.staff?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.month.includes(searchQuery)
  ) || [];

  return (
    <PageTransition className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            HR Payroll & Salary Disbursements
          </h2>
          <p className="text-muted-foreground text-sm">
            Process approved HR salary runs, manage employee advance settlements, and record banking transactions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsGenerateModalOpen(true)} className="text-xs h-9 font-bold shadow-sm">
            <PlusIcon className="mr-1.5 h-4 w-4" /> Run Monthly Payroll
          </Button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 overflow-x-auto space-x-4">
        {[
          { id: "payroll_runs", label: "Salary Payroll Runs", icon: CalendarCheckIcon },
          { id: "advances", label: "Employee Advances", icon: DollarSignIcon },
          { id: "reimbursements", label: "Settlement Desk", icon: InfoIcon },
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
            </button>
          );
        })}
      </div>

      {/* Content body */}
      <div className="min-h-[300px]">
        {/* PAYROLL RUNS TAB */}
        {activeTab === "payroll_runs" && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4">
              <div>
                <CardTitle className="text-base font-bold">HR Approved Payroll Runs</CardTitle>
                <CardDescription>Salary runs generated by HR team awaiting final financial payout</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee, month..."
                  className="pl-9 h-8 text-xs font-semibold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {payrollLoading ? (
                <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
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
                        <TableCell className="font-bold text-slate-900 dark:text-slate-100">{p.staff?.name}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-500">{p.month}</TableCell>
                        <TableCell className="text-xs font-medium">₹{Number(p.base_salary).toFixed(2)}</TableCell>
                        <TableCell className="text-red-500 text-xs">-₹{Number(p.deductions || 0).toFixed(2)}</TableCell>
                        <TableCell className="font-bold text-xs text-green-600">₹{Number(p.net_payable).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={p.status === "paid" ? "default" : "outline"}
                            className={p.status === "draft" || p.status === "approved" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status !== "paid" ? (
                            <Button size="sm" onClick={() => {
                              setSelectedSupplierId(p.id);
                              setIsPayModalOpen(true);
                            }} className="text-xs h-8">
                              Disburse Salary
                            </Button>
                          ) : (
                            <span className="text-xs text-green-600 font-bold flex justify-end items-center gap-1">
                              <CheckCircle2Icon className="h-4 w-4" /> Disbursed ✓
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPayroll.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <CalendarCheckIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No payroll runs found.</p>
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
                <CardTitle className="text-base font-bold">Outstanding Employee Advances</CardTitle>
                <CardDescription>Track cash advances issued to employees for field operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Rahul Sharma</span>
                    <span className="text-[10px] text-muted-foreground">Travel advance issued Sept 1</span>
                  </div>
                  <Badge variant="secondary">₹10,000.00</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Priya Singh</span>
                    <span className="text-[10px] text-muted-foreground">Client meal advance issued Aug 28</span>
                  </div>
                  <Badge variant="secondary">₹5,000.00</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <InfoIcon className="h-5 w-5 text-blue-600" /> Advance Settlement Rule
                </CardTitle>
                <CardDescription>How outstanding advance claims are settled</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Once an advance is issued (e.g. ₹10,000), the employee logs actual bills. If actual travel receipts evaluate to ₹7,800, the remaining ₹2,200 is settled during final payroll generation, keeping the ledger perfectly consistent.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* REIMBURSEMENTS TAB */}
        {activeTab === "reimbursements" && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Outstanding Reimbursement Liabilities</CardTitle>
              <CardDescription>Summary of approved expenses awaiting payroll disbursements</CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center text-slate-400">
              <CheckCircle2Icon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">All employee reimbursement liability lines settled.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* GENERATE PAYROLL MODAL DIALOG */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Run Monthly Payroll</DialogTitle>
            <DialogDescription>Run auto-calculations of base salaries and deductions across active employees.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Salary Payout Month</Label>
              <Input
                type="month"
                value={genMonth}
                onChange={(e) => setGenMonth(e.target.value)}
                className="mt-1 font-bold text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleGeneratePayroll}
              disabled={generatePayrollMutation.isPending}
            >
              {generatePayrollMutation.isPending ? "Generating..." : "Generate Salary Drafts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DISBURSE SALARY DIALOG */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Disburse Employee Salary</DialogTitle>
            <DialogDescription>Authorize bank account transfer, creating transactions and decrementing bank balances.</DialogDescription>
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
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handlePaySalary}
              disabled={payPayrollMutation.isPending}
            >
              {payPayrollMutation.isPending ? "Confirming..." : "Disburse Salary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
