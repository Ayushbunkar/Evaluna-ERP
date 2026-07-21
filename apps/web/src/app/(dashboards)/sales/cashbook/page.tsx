"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function CashBookPage() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  const utils = trpc.useUtils();
  const { data: summary, isLoading: loadingSummary } = trpc.cashbook.getDailySummary.useQuery({});
  const { data: ledger, isLoading: loadingLedger } = trpc.cashbook.getLedger.useQuery({ limit: 100 });

  const addEntry = trpc.cashbook.addEntry.useMutation({
    onSuccess: () => {
      toast.success("Cash entry added");
      setOpen(false);
      setAmount("");
      setDescription("");
      utils.cashbook.getDailySummary.invalidate();
      utils.cashbook.getLedger.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount))) return toast.error("Valid amount required");
    if (!description) return toast.error("Description required");
    
    addEntry.mutate({
      amount: parseFloat(amount),
      type,
      description,
      category: "manual",
      user_uid: "current-user", // In a real app, from auth context
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cash Book</h1>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setType("in")} className="bg-green-600 hover:bg-green-700">
                <ArrowDownRight className="w-4 h-4 mr-2" /> Cash In
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button onClick={() => setType("out")} variant="destructive">
                <ArrowUpRight className="w-4 h-4 mr-2" /> Cash Out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cash {type === "in" ? "In" : "Out"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Amount</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Reason for cash entry" />
                </div>
                <Button onClick={handleSave} disabled={addEntry.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cash In</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">₹{summary?.totalIn?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">Sales: ₹{summary?.sales?.toFixed(2) || "0.00"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cash Out</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">₹{summary?.totalOut?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">Expenses: ₹{summary?.expenses?.toFixed(2) || "0.00"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Daily Flow</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">₹{summary?.net?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger?.items?.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2">{format(new Date(tx.created_at || new Date()), "PP p")}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs ${tx.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="capitalize">{tx.category || "manual"}</td>
                  <td>{tx.description || "-"}</td>
                  <td className={`text-right font-medium ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'in' ? '+' : '-'}₹{tx.amount}
                  </td>
                </tr>
              ))}
              {ledger?.items?.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">No recent transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
