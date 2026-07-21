"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useBranch } from "@/lib/branch-context";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Button } from "@evaluna/ui/components/button";
import { SaveIcon, StoreIcon, FileTextIcon, PrinterIcon, HashIcon } from "lucide-react";

export default function SettingsPage() {
  const { activeBranchId } = useBranch();
  
  // Fetch settings for the active branch (or global if null)
  const { data: settings, isLoading, refetch } = trpc.settings.getAll.useQuery(
    { branch_id: activeBranchId },
    {
      refetchOnWindowFocus: false,
    }
  );

  const mutation = trpc.settings.setMany.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      refetch();
    },
    onError: (err) => {
      toast.error(`Failed to save settings: ${err.message}`);
    },
  });

  // Local state for forms
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Merge loaded settings with local unsaved changes
  const getValue = (key: string, defaultValue: string = "") => {
    return formData[key] !== undefined ? formData[key] : (settings?.[key] || defaultValue);
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (Object.keys(formData).length === 0) {
      toast.info("No changes to save");
      return;
    }
    
    // Convert form data strings to proper types if needed, but strings are fine for most
    mutation.mutate({
      branch_id: activeBranchId,
      settings: formData,
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Business Settings</h2>
        <Button onClick={handleSave} disabled={mutation.isPending} className="gap-2">
          <SaveIcon className="h-4 w-4" />
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        Manage your business profile, numbering rules, and system configurations.
        {activeBranchId ? " (Editing for specific branch)" : " (Editing global settings)"}
      </p>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="general" className="gap-2"><StoreIcon className="h-4 w-4 hidden sm:block"/> General</TabsTrigger>
          <TabsTrigger value="financials" className="gap-2"><FileTextIcon className="h-4 w-4 hidden sm:block"/> Financials</TabsTrigger>
          <TabsTrigger value="printing" className="gap-2"><PrinterIcon className="h-4 w-4 hidden sm:block"/> Printing</TabsTrigger>
          <TabsTrigger value="series" className="gap-2"><HashIcon className="h-4 w-4 hidden sm:block"/> Series</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Your main shop identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input 
                  id="business_name" 
                  value={getValue("business_name", "Evaluna ERP")}
                  onChange={(e) => handleChange("business_name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={getValue("address")}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gstin">Tax ID / GSTIN</Label>
                <Input 
                  id="gstin" 
                  value={getValue("gstin")}
                  onChange={(e) => handleChange("gstin", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>Currency, tax rates, and accounting defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currency_symbol">Currency Symbol</Label>
                <Input 
                  id="currency_symbol" 
                  value={getValue("currency_symbol", "$")}
                  onChange={(e) => handleChange("currency_symbol", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="financial_year_start">Financial Year Start (MM-DD)</Label>
                <Input 
                  id="financial_year_start" 
                  placeholder="04-01"
                  value={getValue("financial_year_start", "04-01")}
                  onChange={(e) => handleChange("financial_year_start", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Printing</CardTitle>
              <CardDescription>Configure receipt headers, footers, and paper sizes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="receipt_header">Receipt Header Message</Label>
                <Input 
                  id="receipt_header" 
                  value={getValue("receipt_header", "Thank you for shopping!")}
                  onChange={(e) => handleChange("receipt_header", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="receipt_footer">Receipt Footer Message</Label>
                <Input 
                  id="receipt_footer" 
                  value={getValue("receipt_footer", "Visit again soon.")}
                  onChange={(e) => handleChange("receipt_footer", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="series" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Number Series</CardTitle>
              <CardDescription>Prefixes for auto-generated documents (e.g. Invoices).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                <Input 
                  id="invoice_prefix" 
                  value={getValue("invoice_prefix", "INV-")}
                  onChange={(e) => handleChange("invoice_prefix", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="po_prefix">Purchase Order Prefix</Label>
                <Input 
                  id="po_prefix" 
                  value={getValue("po_prefix", "PO-")}
                  onChange={(e) => handleChange("po_prefix", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="return_prefix">Return Prefix</Label>
                <Input 
                  id="return_prefix" 
                  value={getValue("return_prefix", "RET-")}
                  onChange={(e) => handleChange("return_prefix", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
