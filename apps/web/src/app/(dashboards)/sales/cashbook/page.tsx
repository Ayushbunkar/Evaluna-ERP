"use client";

import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageTransition, AnimatedCard, StaggerList, StaggerItem } from "@/lib/animations";
import { useQueryClient } from "@tanstack/react-query";

export default function CashBookPage() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const { data: summary, isLoading: loadingSummary } = trpc.cashbook.getDailySummary.useQuery({});
  const { data: ledger, isLoading: loadingLedger } = trpc.cashbook.getLedger.useQuery({ limit: 100 });

  const addEntry = trpc.cashbook.addEntry.useMutation({
    onSuccess: () => {
      toast.success("Cash entry added");
      setOpen(false);
      setAmount("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: [['cashbook', 'getDailySummary']] });
      queryClient.invalidateQueries({ queryKey: [['cashbook', 'getLedger']] });
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
    <PageTransition className="flex flex-col gap-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Cashbook</h1>
          <p className="text-muted-foreground text-sm">Manage register cash flows and track expenses.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setType("in")} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 shadow-lg">
                <ArrowDownRight className="w-4 h-4 mr-2" /> Cash In
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button onClick={() => setType("out")} variant="destructive" className="shadow-red-900/20 shadow-lg">
                <ArrowUpRight className="w-4 h-4 mr-2" /> Cash Out
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Cash {type === "in" ? "In" : "Out"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Amount</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-lg" />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Reason for cash entry" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={addEntry.isPending} className="w-full">
                  {addEntry.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <StaggerList className="grid gap-4 md:grid-cols-3" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Cash In</CardTitle>
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">₹{summary?.totalIn?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground mt-1">Sales: ₹{summary?.sales?.toFixed(2) || "0.00"}</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Cash Out</CardTitle>
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">₹{summary?.totalOut?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground mt-1">Expenses: ₹{summary?.expenses?.toFixed(2) || "0.00"}</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Daily Flow</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">₹{summary?.net?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground mt-1">Net movement today</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      <Card className="border-border/50 bg-card/50 shadow-sm flex-1">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-3 font-medium">Date & Time</th>
                  <th className="font-medium">Type</th>
                  <th className="font-medium">Category</th>
                  <th className="font-medium">Description</th>
                  <th className="text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger?.items?.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{format(new Date(tx.created_at || new Date()), "PP p")}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="capitalize text-muted-foreground">{tx.category || "manual"}</td>
                    <td className="font-medium max-w-[200px] truncate">{tx.description || "-"}</td>
                    <td className={`text-right font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'in' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!ledger?.items || ledger.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No recent cash transactions today</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
