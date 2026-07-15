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
import { ArrowLeft, Wallet, Building2, MapPin, Mail, Phone, Truck } from "lucide-react";
import { toast } from "sonner";

export default function SupplierProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const supplierId = parseInt(id as string, 10);

  const { data, isLoading } = trpc.suppliers.getById.useQuery({ id: supplierId });
  const utils = trpc.useUtils();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDesc, setPaymentDesc] = useState("");

  const paySupplier = trpc.suppliers.paySupplier.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded");
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentDesc("");
      utils.suppliers.getById.invalidate();
    }
  });

  if (isLoading) return <div className="p-8">Loading supplier profile...</div>;
  if (!data?.supplier) return <div className="p-8">Supplier not found</div>;

  const { supplier, ledger, purchaseHistory } = data;

  const handlePay = () => {
    if (!paymentAmount || isNaN(parseFloat(paymentAmount))) return toast.error("Valid amount required");
    
    paySupplier.mutate({
      supplier_id: supplierId,
      amount: parseFloat(paymentAmount),
      description: paymentDesc || "Payment to supplier"
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/suppliers/list')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground">{supplier.supplier_code || "No ID"} • Added {format(new Date(supplier.created_at || new Date()), "PP")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Contact & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{supplier.email || "No email"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{supplier.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{supplier.address || "No address"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>GST: {supplier.gst_number || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <span className="capitalize">{supplier.supplier_category} Supplier</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="ledger" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent">
              <TabsTrigger value="ledger" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Ledger & Payments</TabsTrigger>
              <TabsTrigger value="purchases" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Purchase History</TabsTrigger>
            </TabsList>

            <TabsContent value="ledger" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex justify-between">
                      Outstanding Balance
                      <Wallet className="w-4 h-4 text-red-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">₹{supplier.outstanding_balance || "0.00"}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                  <DialogTrigger asChild>
                    <Button>Record Payment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pay Supplier</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label>Amount (₹)</Label>
                        <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" />
                      </div>
                      <div>
                        <Label>Description / Reference</Label>
                        <Input value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} placeholder="e.g. Check #1234, Bank Transfer" />
                      </div>
                      <Button onClick={handlePay} disabled={paySupplier.isPending}>Submit Payment</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Log of all payments made to this supplier.</CardDescription>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Date</th>
                        <th>Reference</th>
                        <th className="text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger?.map((entry: any) => (
                        <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2">{format(new Date(entry.created_at), "PP p")}</td>
                          <td>{entry.description}</td>
                          <td className="text-right font-medium text-green-600">
                            -₹{entry.amount}
                          </td>
                        </tr>
                      ))}
                      {ledger?.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No payments recorded</td></tr>}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase GRNs</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Date</th>
                        <th>GRN #</th>
                        <th>Status</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory?.map((order: any) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2">{format(new Date(order.created_at), "PP")}</td>
                          <td className="font-medium text-primary">{order.grn_number || `PO-${order.id}`}</td>
                          <td className="capitalize">{order.status}</td>
                          <td className="text-right font-medium">₹{order.total_amount}</td>
                        </tr>
                      ))}
                      {purchaseHistory?.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No purchases yet</td></tr>}
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
