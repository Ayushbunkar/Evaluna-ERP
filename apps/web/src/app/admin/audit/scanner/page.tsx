"use client";

import { useState } from "react";
import { 
  ScanBarcodeIcon, 
  CheckCircle2Icon, 
  AlertTriangleIcon, 
  XCircleIcon,
  Loader2Icon,
  PackageOpenIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Textarea } from "@/components/ui/textarea";

export default function AuditorScanner() {
  const [step, setStep] = useState<"scan" | "count" | "exception">("scan");
  const [productBarcode, setProductBarcode] = useState("");
  const [locationBarcode, setLocationBarcode] = useState("");
  const [count, setCount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [exceptionType, setExceptionType] = useState<"damage" | "expiry" | "missing" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock endpoints
  const submitCount = trpc.audit.submitAuditCount.useMutation({
    onSuccess: (data) => {
      if (data.status === 'mismatch') {
        toast.warning("Count mismatch. Please recount or escalate.");
      } else {
        toast.success("Count matched perfectly!");
        resetScanner();
      }
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    }
  });

  const reportDiscrepancy = trpc.audit.reportDiscrepancy.useMutation({
    onSuccess: () => {
      toast.error(`Stock marked as ${exceptionType}. Escalation created.`);
      resetScanner();
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    }
  });

  const resetScanner = () => {
    setProductBarcode("");
    setCount("");
    setNotes("");
    setExceptionType(null);
    setStep("scan");
  };

  const handleNext = () => {
    if (!productBarcode || !locationBarcode) {
      toast.error("Scan both location and product to begin counting.");
      return;
    }
    setStep("count");
  };

  const handleSubmitCount = () => {
    if (count === "") return toast.error("Enter a valid count");
    setIsSubmitting(true);
    // Mock simulation
    setTimeout(() => {
      submitCount.mutate({
        audit_id: 1,
        product_id: 1, // mocked from barcode
        counted_qty: Number(count),
      });
    }, 800);
  };

  const handleReportException = () => {
    if (!exceptionType) return toast.error("Select an exception type");
    setIsSubmitting(true);
    // Mock simulation
    setTimeout(() => {
      reportDiscrepancy.mutate({
        audit_item_id: 1,
        type: exceptionType,
        qty: Number(count) || 1, // Amount that is damaged/missing
        notes,
      });
    }, 800);
  };

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen bg-slate-950 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
      
      <Card className="w-full shadow-2xl border-0 overflow-hidden bg-white/5 backdrop-blur-xl ring-1 ring-white/10">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
        
        {step === "scan" && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-emerald-500/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <ScanBarcodeIcon className="h-10 w-10 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Blind Audit</CardTitle>
              <CardDescription className="text-slate-400">Scan items to verify inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold uppercase text-xs tracking-wider">Location Barcode</Label>
                <Input 
                  placeholder="Scan Bin..." 
                  className="h-14 text-lg bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 uppercase"
                  value={locationBarcode}
                  onChange={(e) => setLocationBarcode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold uppercase text-xs tracking-wider">Product Barcode</Label>
                <Input 
                  placeholder="Scan Item..." 
                  className="h-14 text-lg bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                  value={productBarcode}
                  onChange={(e) => setProductBarcode(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-8">
              <Button 
                className="w-full h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                onClick={handleNext}
                disabled={!locationBarcode || !productBarcode}
              >
                START COUNT
              </Button>
            </CardFooter>
          </>
        )}

        {step === "count" && (
          <div className="animate-in slide-in-from-right duration-300">
            <CardHeader className="text-center pb-2 border-b border-white/10">
              <CardTitle className="text-xl font-bold text-white">Physical Count</CardTitle>
              <CardDescription className="text-slate-400">Loc: {locationBarcode} | Item: {productBarcode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8 pb-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Label className="text-slate-300 font-medium text-lg">How many do you see?</Label>
                <Input 
                  type="number"
                  placeholder="0" 
                  className="h-32 text-center text-6xl font-black bg-slate-900 border-slate-700 text-white focus-visible:ring-emerald-500 rounded-2xl"
                  value={count}
                  onChange={(e) => setCount(e.target.value ? Number(e.target.value) : "")}
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button 
                  variant="outline"
                  className="h-14 font-bold border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => setStep("exception")}
                >
                  <AlertTriangleIcon className="mr-2 h-5 w-5" />
                  Exception
                </Button>
                <Button 
                  className="h-14 font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  onClick={handleSubmitCount}
                  disabled={isSubmitting || count === ""}
                >
                  {isSubmitting ? <Loader2Icon className="h-6 w-6 animate-spin" /> : <><CheckCircle2Icon className="mr-2 h-5 w-5" /> Submit</>}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="justify-center border-t border-white/10 pt-4">
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={resetScanner}>
                Cancel
              </Button>
            </CardFooter>
          </div>
        )}

        {step === "exception" && (
          <div className="animate-in slide-in-from-bottom duration-300 bg-red-950/20">
            <CardHeader className="border-b border-red-900/30">
              <CardTitle className="text-xl font-bold text-red-400 flex items-center">
                <AlertTriangleIcon className="mr-2 h-6 w-6" />
                Report Exception
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-3 gap-2">
                {(["damage", "expiry", "missing"] as const).map(type => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`h-16 flex flex-col gap-1 items-center justify-center border-slate-700 ${exceptionType === type ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-900 text-slate-400'}`}
                    onClick={() => setExceptionType(type)}
                  >
                    {type === "damage" ? <XCircleIcon className="h-5 w-5" /> : 
                     type === "expiry" ? <PackageOpenIcon className="h-5 w-5" /> : 
                     <AlertTriangleIcon className="h-5 w-5" />}
                    <span className="text-xs uppercase font-bold">{type}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold text-sm">Affected Quantity</Label>
                <Input 
                  type="number"
                  placeholder="How many items?" 
                  className="bg-slate-900 border-slate-700 text-white"
                  value={count}
                  onChange={(e) => setCount(e.target.value ? Number(e.target.value) : "")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold text-sm">Notes (Optional)</Label>
                <Textarea 
                  placeholder="Describe the issue..." 
                  className="bg-slate-900 border-slate-700 text-white resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4 bg-black/20 pt-4">
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setStep("count")}>
                Back
              </Button>
              <Button 
                className="font-bold bg-red-600 hover:bg-red-500 text-white"
                onClick={handleReportException}
                disabled={isSubmitting || !exceptionType}
              >
                {isSubmitting ? <Loader2Icon className="h-5 w-5 animate-spin" /> : "Escalate"}
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
      
    </div>
  );
}
