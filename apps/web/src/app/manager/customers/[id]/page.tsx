"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ArrowLeft, Wallet, Gift, ShoppingBag, MapPin, Mail, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const customerId = parseInt(id as string, 10);

  const { data, isLoading } = trpc.customers.getById.useQuery({ id: customerId });
  const utils = trpc.useUtils();

  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerType, setLedgerType] = useState<"points" | "credit">("credit");
  const [ledgerAmount, setLedgerAmount] = useState("");
  const [ledgerReason, setLedgerReason] = useState("");

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.customers.getById.invalidate();
    }
  });

  const adjustLedger = trpc.customers.adjustLedger.useMutation({
    onSuccess: () => {
      toast.success("Ledger adjusted");
      setLedgerOpen(false);
      setLedgerAmount("");
      setLedgerReason("");
      utils.customers.getById.invalidate();
    }
  });

  if (isLoading) return <div className="p-8">Loading customer profile...</div>;
  if (!data?.customer) return <div className="p-8">Customer not found</div>;

  const { customer, ledger } = data;

  const handleAdjust = () => {
    if (!ledgerAmount || isNaN(parseFloat(ledgerAmount))) return toast.error("Valid amount required");
    if (!ledgerReason) return toast.error("Reason required");
    
    adjustLedger.mutate({
      id: customerId,
      type: ledgerType,
      amount: parseFloat(ledgerAmount),
      reason: ledgerReason
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/customers')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.customer_code || "No ID"} • Joined {format(new Date(customer.created_at || new Date()), "PP")}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${customer.loyalty_tier === 'gold' ? 'bg-yellow-100 text-yellow-800' : customer.loyalty_tier === 'silver' ? 'bg-gray-200 text-gray-800' : 'bg-orange-100 text-orange-800'}`}>
            {customer.loyalty_tier || "Bronze"} Tier
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{customer.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{customer.address || "No address"}</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span>Marketing: {customer.marketing_opt_in ? "Opted In" : "Opted Out"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent">
              <TabsTrigger value="wallet" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Wallet & Loyalty</TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Purchase History</TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex justify-between">
                      Store Credit
                      <Wallet className="w-4 h-4 text-blue-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{customer.store_credit || "0.00"}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex justify-between">
                      Loyalty Points
                      <Gift className="w-4 h-4 text-orange-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customer.loyalty_points || 0} pts</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setLedgerType("credit")}>Adjust Credit</Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setLedgerType("points")}>Adjust Points</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust {ledgerType === "credit" ? "Store Credit" : "Loyalty Points"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label>Amount (Use negative to deduct)</Label>
                        <Input type="number" value={ledgerAmount} onChange={e => setLedgerAmount(e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Input value={ledgerReason} onChange={e => setLedgerReason(e.target.value)} placeholder="e.g. Refund, Bonus" />
                      </div>
                      <Button onClick={handleAdjust} disabled={adjustLedger.isPending}>Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ledger History</CardTitle>
                  <CardDescription>Trace of all credit and points adjustments.</CardDescription>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Date</th>
                        <th>Type</th>
                        <th>Reason</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger?.map((entry: any) => (
                        <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2">{format(new Date(entry.created_at), "PP p")}</td>
                          <td className="capitalize">{entry.type}</td>
                          <td>{entry.reason}</td>
                          <td className={`text-right font-medium ${parseFloat(entry.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(entry.amount) > 0 ? '+' : ''}{entry.amount}
                          </td>
                        </tr>
                      ))}
                      {ledger?.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No ledger entries</td></tr>}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase History</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Date</th>
                        <th>Order ID</th>
                        <th>Status</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders?.map((order: any) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2">{format(new Date(order.created_at), "PP")}</td>
                          <td>#{order.id}</td>
                          <td className="capitalize">{order.status}</td>
                          <td className="text-right font-medium">₹{order.total_amount}</td>
                        </tr>
                      ))}
                      {customer.orders?.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No purchases yet</td></tr>}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
