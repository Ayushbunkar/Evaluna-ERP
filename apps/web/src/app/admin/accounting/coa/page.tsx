"use client";

import { useState } from "react";
import { PageTransition, StaggerList, StaggerItem, motion } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@evaluna/ui/components/dialog";
import { PlusIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";

// Dummy TRPC hook
const trpc = {
  accounting: {
    getAccounts: {
      useQuery: () => ({
        data: [
          { id: 1, code: "1000", name: "Assets", type: "Asset", balanceType: "Debit" },
          { id: 2, code: "2000", name: "Liabilities", type: "Liability", balanceType: "Credit" },
          { id: 3, code: "3000", name: "Equity", type: "Equity", balanceType: "Credit" },
          { id: 4, code: "4000", name: "Revenue", type: "Revenue", balanceType: "Credit" },
          { id: 5, code: "5000", name: "Expenses", type: "Expense", balanceType: "Debit" }
        ],
        isLoading: false
      })
    }
  }
};

export default function ChartOfAccountsPage() {
  const { data: accounts, isLoading } = trpc.accounting.getAccounts.useQuery();
  const [open, setOpen] = useState(false);

  return (
    <PageTransition>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
            <p className="text-muted-foreground mt-2">
              Manage your accounting ledgers.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Account
              </motion.button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Account Code</Label>
                  <Input placeholder="e.g. 1000" />
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input placeholder="e.g. Cash" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asset">Asset</SelectItem>
                      <SelectItem value="Liability">Liability</SelectItem>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Revenue">Revenue</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Balance Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select balance type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Debit">Debit</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => setOpen(false)}>Save Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accounts List</CardTitle>
            <CardDescription>A list of all accounts in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-4 gap-4 p-4 font-semibold border-b bg-muted/50">
                  <div>Code</div>
                  <div>Name</div>
                  <div>Type</div>
                  <div>Balance Type</div>
                </div>
                <StaggerList>
                  {accounts?.map((acc) => (
                    <StaggerItem key={acc.id}>
                      <div className="grid grid-cols-4 gap-4 p-4 border-b last:border-0 hover:bg-muted/30">
                        <div className="font-medium">{acc.code}</div>
                        <div>{acc.name}</div>
                        <div>{acc.type}</div>
                        <div>{acc.balanceType}</div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
