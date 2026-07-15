"use client";

import { useState, useMemo } from "react";
import { PageTransition, StaggerList, StaggerItem, motion } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { PlusIcon, TrashIcon, SaveIcon } from "lucide-react";

const trpc = {
  accounting: {
    getAccounts: {
      useQuery: () => ({
        data: [
          { id: 1, name: "Cash (1000)" },
          { id: 2, name: "Accounts Receivable (1100)" },
          { id: 3, name: "Sales Revenue (4000)" },
          { id: 4, name: "Office Expenses (5000)" }
        ],
        isLoading: false
      })
    },
    postJournalEntry: {
      useMutation: () => ({
        mutate: (data: any) => {
          console.log("Journal Posted", data);
          alert("Journal Entry Posted Successfully!");
        },
        isPending: false
      })
    }
  }
};

type JournalLine = {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
};

export default function JournalVoucherPage() {
  const { data: accounts } = trpc.accounting.getAccounts.useQuery();
  const { mutate: postJournal, isPending } = trpc.accounting.postJournalEntry.useMutation();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountId: "", debit: 0, credit: 0 },
    { id: "2", accountId: "", debit: 0, credit: 0 }
  ]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), accountId: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const totalDebit = useMemo(() => lines.reduce((sum, line) => sum + (line.debit || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, line) => sum + (line.credit || 0), 0), [lines]);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = () => {
    postJournal({ date, description, lines });
  };

  return (
    <PageTransition>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Voucher Entry</h1>
          <p className="text-muted-foreground mt-2">
            Create a manual double-entry journal voucher.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Voucher Details</CardTitle>
            <CardDescription>Enter the date and description for this journal entry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description / Memo</Label>
                <Input placeholder="e.g. Initial capital investment" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Journal Lines</CardTitle>
            <CardDescription>Enter debits and credits. Total must be balanced.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_150px_150px_50px] gap-4 font-semibold pb-2 border-b">
                <div>Account</div>
                <div>Debit</div>
                <div>Credit</div>
                <div></div>
              </div>
              
              <StaggerList className="space-y-3">
                {lines.map((line) => (
                  <StaggerItem key={line.id}>
                    <div className="grid grid-cols-[1fr_150px_150px_50px] gap-4 items-center">
                      <Select value={line.accountId} onValueChange={(val) => updateLine(line.id, "accountId", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts?.map(acc => (
                            <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateLine(line.id, "debit", val);
                          if (val > 0) updateLine(line.id, "credit", 0);
                        }}
                        placeholder="0.00"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateLine(line.id, "credit", val);
                          if (val > 0) updateLine(line.id, "debit", 0);
                        }}
                        placeholder="0.00"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeLine(line.id)} disabled={lines.length <= 2}>
                        <TrashIcon className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerList>
              
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={addLine} className="gap-2">
                  <PlusIcon className="w-4 h-4" /> Add Line
                </Button>
              </div>

              <div className="flex justify-end pt-4 border-t gap-8 font-semibold text-lg">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Debit</div>
                  <div className={isBalanced ? "text-green-600" : "text-destructive"}>${totalDebit.toFixed(2)}</div>
                </div>
                <div className="text-right pr-[66px]">
                  <div className="text-sm text-muted-foreground">Total Credit</div>
                  <div className={isBalanced ? "text-green-600" : "text-destructive"}>${totalCredit.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={isBalanced ? { scale: 1.02 } : {}}
                whileTap={isBalanced ? { scale: 0.98 } : {}}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-10 px-4 py-2 gap-2 ${isBalanced ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground'}`}
                onClick={handleSubmit}
                disabled={!isBalanced || isPending}
              >
                <SaveIcon className="w-4 h-4" />
                Post Journal Entry
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
