"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Plus, ArrowDown, ArrowUp, DollarSign, Wallet } from "lucide-react";
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

export default function CashbookPage() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", type: "in", description: "", category: "" });

  const utils = trpc.useUtils();

  const { data: summary, isLoading: isSummaryLoading } = trpc.cashbook.getDailySummary.useQuery({ date: selectedDate });
  const { data: ledger, isLoading: isLedgerLoading } = trpc.cashbook.getLedger.useQuery({ date: selectedDate });

  const addEntry = trpc.cashbook.addEntry.useMutation({
    onSuccess: () => {
      toast.success("Entry recorded successfully");
      setIsDialogOpen(false);
      setForm({ amount: "", type: "in", description: "", category: "" });
      utils.cashbook.getDailySummary.invalidate();
      utils.cashbook.getLedger.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to record entry");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    addEntry.mutate({
      date: selectedDate,
      amount: parseFloat(form.amount),
      type: form.type as "in" | "out",
      description: form.description,
      category: form.category
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Book</h1>
          <p className="text-muted-foreground">{format(new Date(selectedDate), "MMMM do, yyyy")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="w-auto"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Cash Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Cash In</SelectItem>
                        <SelectItem value="out">Cash Out</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Input 
                    id="category" 
                    required
                    value={form.category} 
                    onChange={(e) => setForm({ ...form, category: e.target.value })} 
                    placeholder="e.g., Sales, Supplies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={form.description} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    placeholder="Brief description"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addEntry.isPending}>
                  {addEntry.isPending ? "Recording..." : "Save Entry"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash In</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">${summary?.cashIn?.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Out</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">${summary?.cashOut?.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">${summary?.sales?.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className={`text-2xl font-bold ${summary && summary.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${summary?.netBalance?.toFixed(2) || "0.00"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLedgerLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : ledger?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No entries found for this date.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger?.map((entry: any, i: number) => {
                  return (
                    <motion.tr 
                      key={entry.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell>{format(new Date(entry.createdAt), "HH:mm")}</TableCell>
                      <TableCell>{entry.description || "-"}</TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${entry.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {entry.type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${entry.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'in' ? '+' : '-'}${entry.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${entry.runningBalance?.toFixed(2) || "0.00"}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}