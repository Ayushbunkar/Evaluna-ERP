"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@evaluna/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@evaluna/ui/components/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@evaluna/ui/components/dialog";
import { AlertTriangle, CheckCircle, PackageMinus, PackageX, Trash2, ArrowRight } from "lucide-react";
import { PageTransition, AnimatedCard, StaggerList, StaggerItem } from "@/lib/animations";

// Mocks
const mockDiscrepancies = [
  { id: "D-1001", product: "Paracetamol 500mg", branch: "Downtown Pharmacy", expected: 500, actual: 480, status: "pending", date: "2026-07-20" },
  { id: "D-1002", product: "Amoxicillin 250mg", branch: "Westside Clinic", expected: 200, actual: 215, status: "resolved", date: "2026-07-21" },
  { id: "D-1003", product: "Ibuprofen 400mg", branch: "Downtown Pharmacy", expected: 1000, actual: 950, status: "pending", date: "2026-07-22" },
];

const mockDamages = [
  { id: "DM-201", product: "Cough Syrup 100ml", branch: "Downtown Pharmacy", quantity: 5, reason: "Broken bottle", status: "reported", value: 45.00 },
  { id: "DM-202", product: "Bandages Box", branch: "Eastside Store", quantity: 2, reason: "Water damage", status: "verified", value: 12.50 },
];

const mockExpiries = [
  { batch: "B-8832", product: "Vitamin C 1000mg", branch: "Downtown Pharmacy", quantity: 120, expiryDate: "2026-08-15", status: "warning" },
  { batch: "B-9912", product: "Aspirin 75mg", branch: "Northside Pharmacy", quantity: 45, expiryDate: "2026-07-30", status: "critical" },
];

export default function AuditorDiscrepanciesPage() {
  const [activeTab, setActiveTab] = useState("stock");
  
  // Stock Discrepancies State
  const [discrepancies, setDiscrepancies] = useState(mockDiscrepancies);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<any>(null);

  // Damage State
  const [damages, setDamages] = useState(mockDamages);
  
  // Handlers
  const handleResolveDiscrepancy = (id: string, action: "approve" | "reject") => {
    setDiscrepancies((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: action === "approve" ? "resolved" : "rejected" } : d))
    );
    setSelectedDiscrepancy(null);
  };

  const handleVerifyDamage = (id: string) => {
    setDamages((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "verified" } : d))
    );
  };

  const handleApproveWriteOff = (id: string) => {
    setDamages((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "written_off" } : d))
    );
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 p-6 min-h-screen bg-background">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Discrepancy Resolution
          </h1>
          <p className="text-muted-foreground">
            Review and resolve stock discrepancies, reported damages, and monitor expiring batches across branches.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-6">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <PackageMinus className="h-4 w-4" />
              Stock Differences
            </TabsTrigger>
            <TabsTrigger value="damage" className="flex items-center gap-2">
              <PackageX className="h-4 w-4" />
              Damage
            </TabsTrigger>
            <TabsTrigger value="expiry" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Expiry
            </TabsTrigger>
          </TabsList>

          {/* STOCK DIFFERENCES TAB */}
          <TabsContent value="stock" className="mt-0 outline-none">
            <AnimatedCard className="bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Audit Discrepancies</CardTitle>
                <CardDescription>
                  Review variances identified during audits and approve or reject write-offs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discrepancies.map((item) => {
                      const variance = item.actual - item.expected;
                      const isShortage = variance < 0;
                      return (
                        <TableRow key={item.id} className="group hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.product}</TableCell>
                          <TableCell>{item.branch}</TableCell>
                          <TableCell className="text-right">{item.expected}</TableCell>
                          <TableCell className="text-right">{item.actual}</TableCell>
                          <TableCell className={`text-right font-medium ${isShortage ? 'text-destructive' : 'text-emerald-500'}`}>
                            {variance > 0 ? "+" : ""}{variance}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === "pending" ? "outline" : item.status === "resolved" ? "default" : "destructive"}>
                              {item.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.status === "pending" ? (
                              <Dialog open={selectedDiscrepancy === item.id} onOpenChange={(open) => setSelectedDiscrepancy(open ? item.id : null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="secondary">Resolve</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Resolve Discrepancy {item.id}</DialogTitle>
                                    <DialogDescription>
                                      Review the variance for {item.product} at {item.branch}.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                                      <span className="text-sm font-medium">Variance</span>
                                      <span className={`font-bold ${isShortage ? 'text-destructive' : 'text-emerald-500'}`}>
                                        {variance} units
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      By approving, you authorize the write-off for this stock difference. Rejecting will require the branch to recount.
                                    </p>
                                  </div>
                                  <DialogFooter className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => handleResolveDiscrepancy(item.id, "reject")}>
                                      Reject
                                    </Button>
                                    <Button variant="default" onClick={() => handleResolveDiscrepancy(item.id, "approve")}>
                                      Approve Write-off
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Button size="sm" variant="ghost" disabled>
                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                Done
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </AnimatedCard>
          </TabsContent>

          {/* DAMAGE TAB */}
          <TabsContent value="damage" className="mt-0 outline-none">
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {damages.map((damage) => (
                <StaggerItem key={damage.id}>
                  <Card className="h-full bg-card/80 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{damage.product}</CardTitle>
                          <CardDescription>{damage.id} • {damage.branch}</CardDescription>
                        </div>
                        <Badge variant={damage.status === "reported" ? "secondary" : damage.status === "verified" ? "default" : "outline"}>
                          {damage.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Reason for damage</span>
                        <span className="font-medium text-sm">{damage.reason}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">Quantity</span>
                          <span className="font-semibold">{damage.quantity}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">Est. Value</span>
                          <span className="font-semibold">${damage.value.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-2 border-t border-border/50">
                      {damage.status === "reported" && (
                        <Button size="sm" onClick={() => handleVerifyDamage(damage.id)}>
                          Verify Damage
                        </Button>
                      )}
                      {damage.status === "verified" && (
                        <Button size="sm" variant="destructive" onClick={() => handleApproveWriteOff(damage.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Approve Write-off
                        </Button>
                      )}
                      {damage.status === "written_off" && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Written Off
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerList>
          </TabsContent>

          {/* EXPIRY TAB */}
          <TabsContent value="expiry" className="mt-0 outline-none">
            <AnimatedCard className="bg-card/80 backdrop-blur-xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Expiring Batches</CardTitle>
                <CardDescription>
                  Monitor batches approaching their expiration date across all branches.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExpiries.map((batch) => (
                      <TableRow key={batch.batch} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{batch.batch}</TableCell>
                        <TableCell>{batch.product}</TableCell>
                        <TableCell>{batch.branch}</TableCell>
                        <TableCell className="text-right">{batch.quantity}</TableCell>
                        <TableCell>{batch.expiryDate}</TableCell>
                        <TableCell>
                          <Badge variant={batch.status === "critical" ? "destructive" : "secondary"} className="capitalize">
                            {batch.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="gap-2">
                            Recall Batch <ArrowRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </AnimatedCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
