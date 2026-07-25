import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentModal({ open, onOpenChange, totalAmount, onConfirm }: any) {
  const [payments, setPayments] = useState([{ methodId: 1, amount: totalAmount.toString() }]); // 1: Cash, 2: Card, 3: UPI
  const [tendered, setTendered] = useState("");

  // Reset when opened
  useEffect(() => {
    if (open) {
      setPayments([{ methodId: 1, amount: totalAmount.toString() }]);
      setTendered("");
    }
  }, [open, totalAmount]);

  const totalPaid = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const changeDue = Math.max(0, (parseFloat(tendered) || totalPaid) - totalAmount);
  const remaining = Math.max(0, totalAmount - totalPaid);

  const addPaymentMethod = () => {
    setPayments([...payments, { methodId: 2, amount: remaining.toString() }]);
  };

  const updatePayment = (index: number, field: string, value: string | number) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
            <span className="text-xl font-medium">Total Due</span>
            <span className="text-3xl font-bold">₹{totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-4">
            <Label>Payment Methods</Label>
            {payments.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select 
                  className="flex h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={p.methodId} 
                  onChange={(e) => updatePayment(i, "methodId", parseInt(e.target.value))}
                >
                  <option value={1}>Cash</option>
                  <option value={2}>Card</option>
                  <option value={3}>UPI</option>
                  <option value={4}>Store Credit</option>
                </select>
                <Input 
                  type="number" 
                  value={p.amount} 
                  onChange={(e) => updatePayment(i, "amount", e.target.value)}
                  className="text-right font-medium"
                />
              </div>
            ))}
            
            {remaining > 0 && (
              <Button variant="outline" size="sm" onClick={addPaymentMethod} className="w-full">
                + Add Split Payment (₹{remaining.toFixed(2)} remaining)
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cash Tendered</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 2000" 
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  className="text-xl h-12"
                />
              </div>
              <div>
                <Label>Change Due</Label>
                <div className="text-3xl font-bold text-green-600 h-12 flex items-center">
                  ₹{changeDue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            size="lg" 
            disabled={totalPaid < totalAmount - 0.01} // allow tiny float issues
            onClick={() => {
              onConfirm(payments);
              onOpenChange(false);
            }}
          >
            Confirm & Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
