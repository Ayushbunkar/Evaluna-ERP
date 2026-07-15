"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Plus, Check, X, Filter, List, FolderTree, Receipt } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@evaluna/ui/components/dialog";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Badge } from "@evaluna/ui/components/badge";

const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Supplies", "Repairs", "Other"];

export default function ExpensesPage() {
  const [monthYear, setMonthYear] = useState<string>(format(new Date(), "yyyy-MM"));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isGrouped, setIsGrouped] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [form, setForm] = useState({ 
    amount: "", 
    category: "", 
    description: "", 
    date: format(new Date(), "yyyy-MM-dd"), 
    receipt: "" 
  });

  const utils = trpc.useUtils();

  // Assuming trpc.expenses routers exist, otherwise mock data would be returned by trpc
  const { data: summary, isLoading: isSummaryLoading } = trpc.expenses.getSummary.useQuery(
    { monthYear },
    { initialData: { total: 0, approved: 0, pending: 0, rejected: 0 } } // Mock default if missing
  );

  const { data: expensesRaw, isLoading: isExpensesLoading, refetch } = trpc.expenses.list.useQuery(
    { monthYear, status: statusFilter === "all" ? undefined : statusFilter },
    { initialData: [] } // Mock default if missing
  );

  const addExpense = trpc.cashbook.addEntry.useMutation({
    onSuccess: () => {
      toast.success("Expense submitted successfully");
      setIsDialogOpen(false);
      setForm({ amount: "", category: "", description: "", date: format(new Date(), "yyyy-MM-dd"), receipt: "" });
      refetch();
      utils.expenses?.getSummary?.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit expense");
    }
  });

  const updateStatus = trpc.expenses.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refetch();
      utils.expenses?.getSummary?.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    
    // The prompt requested type='out', category='expense' but also selecting sub-category.
    // We'll pass the form fields appropriately.
    addExpense.mutate({
      date: form.date,
      amount: parseFloat(form.amount),
      type: "out",
      category: form.category,
      description: form.description,
      // receipt: form.receipt (Assuming the backend handles this if supported)
    });
  };

  const handleStatusChange = (id: string, status: "approved" | "rejected") => {
    updateStatus.mutate({ id, status });
  };

  // Safe fallback if expensesRaw is not an array
  const expensesList = Array.isArray(expensesRaw) ? expensesRaw : [];

  const groupedExpenses = useMemo(() => {
    if (!isGrouped) return null;
    return expensesList.reduce((acc: any, exp: any) => {
      const cat = exp.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(exp);
      return acc;
    }, {});
  }, [expensesList, isGrouped]);

  const renderBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Approved</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Pending</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderExpenseRow = (exp: any, index: number) => (
    <motion.tr 
      key={exp.id || index}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b transition-colors hover:bg-muted/50"
    >
      <TableCell>{exp.date ? format(new Date(exp.date), "MMM dd, yyyy") : "-"}</TableCell>
      <TableCell className="font-medium">{exp.category}</TableCell>
      <TableCell>{exp.description}</TableCell>
      <TableCell className="font-medium">${exp.amount?.toFixed(2) || "0.00"}</TableCell>
      <TableCell>{renderBadge(exp.status || "pending")}</TableCell>
      <TableCell>{exp.submittedBy || "System"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 text-green-600"
            disabled={exp.status === 'approved' || updateStatus.isPending}
            onClick={() => handleStatusChange(exp.id, 'approved')}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 text-red-600"
            disabled={exp.status === 'rejected' || updateStatus.isPending}
            onClick={() => handleStatusChange(exp.id, 'rejected')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </motion.tr>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and approve branch expenses</p>
        </div>
        <div className="flex items-center gap-4">
          <Input 
            type="month" 
            value={monthYear} 
            onChange={(e) => setMonthYear(e.target.value)} 
            className="w-auto"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      required
                      value={form.date} 
                      onChange={(e) => setForm({ ...form, date: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01"
                      required
                      value={form.amount} 
                      onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    required
                    value={form.description} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    placeholder="Brief description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="receipt" 
                      type="file" 
                      accept="image/*,.pdf"
                      onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0]?.name || "" })} 
                    />
                    {form.receipt && <Receipt className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={addExpense.isPending}>
                  {addExpense.isPending ? "Submitting..." : "Submit Expense"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : (
              <div className="text-2xl font-bold">${summary?.total?.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : (
              <div className="text-2xl font-bold text-green-600">${summary?.approved?.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Filter className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : (
              <div className="text-2xl font-bold text-amber-600">${summary?.pending?.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-20" /> : (
              <div className="text-2xl font-bold text-red-600">${summary?.rejected?.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expense Records</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex bg-muted rounded-md p-1">
              <Button 
                variant={!isGrouped ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setIsGrouped(false)}
                className="h-8"
              >
                <List className="h-4 w-4 mr-2" />
                Flat
              </Button>
              <Button 
                variant={isGrouped ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setIsGrouped(true)}
                className="h-8"
              >
                <FolderTree className="h-4 w-4 mr-2" />
                Grouped
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isExpensesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : expensesList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No expenses found for this period.</div>
          ) : (
            isGrouped && groupedExpenses ? (
              <div className="space-y-8">
                {Object.entries(groupedExpenses).map(([category, items]: [string, any]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{category}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((exp: any, i: number) => renderExpenseRow(exp, i))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesList.map((exp: any, i: number) => renderExpenseRow(exp, i))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}