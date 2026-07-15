"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useBranch } from "@/lib/branch-context";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@evaluna/ui/components/button";
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
import { Badge } from "@evaluna/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@evaluna/ui/components/dialog";
import { BanknoteIcon, CalculatorIcon, CheckCircleIcon, PlayIcon, PrinterIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";

export default function PayrollPage() {
  const { activeBranchId } = useBranch();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const { data: payrollList, isLoading, refetch } = trpc.payroll.list.useQuery({ 
    branch_id: activeBranchId, 
    month: selectedMonth 
  });

  const { data: paymentMethods } = trpc.paymentMethods.list.useQuery();

  const generateMutation = trpc.payroll.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.generated} draft payroll records`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.payroll.update.useMutation({
    onSuccess: () => {
      toast.success("Payroll record updated");
      setSelectedRecord(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const approveMutation = trpc.payroll.approve.useMutation({
    onSuccess: () => {
      toast.success("Payroll approved");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const payMutation = trpc.payroll.pay.useMutation({
    onSuccess: () => {
      toast.success("Payroll marked as paid and expense recorded");
      setSelectedRecord(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = () => {
    generateMutation.mutate({ month: selectedMonth });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedRecord.id,
      overtime_pay: formData.get("overtime_pay") as string,
      bonus: formData.get("bonus") as string,
      deductions: formData.get("deductions") as string,
      advance_deduction: formData.get("advance_deduction") as string,
      notes: formData.get("notes") as string,
    });
  };

  const handlePay = () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    payMutation.mutate({
      id: selectedRecord.id,
      payment_method_id: parseInt(paymentMethod)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 space-y-4 p-4 md:p-8 pt-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll</h2>
          <p className="text-muted-foreground mt-1">Manage monthly salaries and generate payslips.</p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={generateMutation.isPending}
            className="gap-2"
          >
            <CalculatorIcon className="h-4 w-4" />
            Generate Drafts
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Base Salary</TableHead>
              <TableHead>Extras (OT+Bonus)</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Payable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading payroll data...</TableCell>
              </TableRow>
            )}
            {!isLoading && (!payrollList || payrollList.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <BanknoteIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No payroll records found for {selectedMonth}. Click "Generate Drafts" to start.
                </TableCell>
              </TableRow>
            )}
            {payrollList?.map((record: any, i: number) => (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="border-b transition-colors hover:bg-muted/30"
              >
                <TableCell className="font-medium">{record.staff.name}</TableCell>
                <TableCell>{parseFloat(record.base_salary).toFixed(2)}</TableCell>
                <TableCell className="text-green-600">
                  +{(parseFloat(record.overtime_pay) + parseFloat(record.bonus)).toFixed(2)}
                </TableCell>
                <TableCell className="text-red-600">
                  -{(parseFloat(record.deductions) + parseFloat(record.advance_deduction)).toFixed(2)}
                </TableCell>
                <TableCell className="font-bold">{parseFloat(record.net_payable).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={
                    record.status === 'paid' ? 'default' : 
                    record.status === 'approved' ? 'secondary' : 'outline'
                  } className="capitalize">
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {record.status === "draft" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRecord({ ...record, action: 'edit' })}>Edit</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => approveMutation.mutate({ id: record.id })}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  {record.status === "approved" && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setSelectedRecord({ ...record, action: 'pay' })}
                    >
                      <PlayIcon className="h-3.5 w-3.5 mr-1" /> Pay Now
                    </Button>
                  )}
                  {record.status === "paid" && (
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.print()}>
                      <PrinterIcon className="h-3.5 w-3.5" /> Slip
                    </Button>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={selectedRecord?.action === 'edit'} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Salary Details</DialogTitle>
            <DialogDescription>Adjust additions and deductions for {selectedRecord?.staff?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="overtime_pay">Overtime Pay (+)</Label>
                  <Input id="overtime_pay" name="overtime_pay" type="number" step="0.01" defaultValue={selectedRecord?.overtime_pay} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bonus">Bonus (+)</Label>
                  <Input id="bonus" name="bonus" type="number" step="0.01" defaultValue={selectedRecord?.bonus} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deductions">Other Deductions (-)</Label>
                  <Input id="deductions" name="deductions" type="number" step="0.01" defaultValue={selectedRecord?.deductions} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="advance_deduction">Advance Recovery (-)</Label>
                  <Input id="advance_deduction" name="advance_deduction" type="number" step="0.01" defaultValue={selectedRecord?.advance_deduction} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" defaultValue={selectedRecord?.notes} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedRecord(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={selectedRecord?.action === 'pay'} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Paying {selectedRecord?.staff?.name} a net total of <strong>{selectedRecord?.net_payable}</strong>.
              This will automatically record an expense in the cashbook.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.filter(m => m.is_active).map(method => (
                    <SelectItem key={method.id} value={method.id.toString()}>{method.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedRecord(null)}>Cancel</Button>
            <Button onClick={handlePay} disabled={payMutation.isPending} className="bg-green-600 hover:bg-green-700">
              <CheckCircleIcon className="h-4 w-4 mr-2" /> Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </motion.div>
  );
}
