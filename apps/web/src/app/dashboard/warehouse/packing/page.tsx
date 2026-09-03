"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@evaluna/ui/components/dialog";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
  PackageIcon,
  SearchIcon,
  Loader2Icon,
  UsersIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import { toast } from "sonner";

export default function PackingPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: packingQueue, isLoading: packingLoading } = trpc.warehouse.getPackingQueue.useQuery();

  // Mutations
  const packPackageMutation = trpc.warehouse.packPackage.useMutation({
    onSuccess: () => {
      toast.success("Package successfully sealed & routed to fleet hand-off!");
      utils.warehouse.getOverviewStats.invalidate();
      utils.warehouse.getPackingQueue.invalidate();
    },
    onError: (err) => {
      toast.error(`Packing failed: ${err.message}`);
    }
  });

  // Modal State
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [pkgWeight, setPkgWeight] = useState("");
  const [pkgDimensions, setPkgDimensions] = useState("");
  const [pkgNotes, setPkgNotes] = useState("");

  const openPackingModal = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsPackingModalOpen(true);
  };

  const handleCompletePacking = async () => {
    if (!selectedPackage) return;
    await packPackageMutation.mutateAsync({
      packageId: selectedPackage.id,
      weight: parseFloat(pkgWeight) || undefined,
      dimensions: pkgDimensions,
      notes: pkgNotes
    });
    setIsPackingModalOpen(false);
    setPkgWeight("");
    setPkgDimensions("");
    setPkgNotes("");
  };

  const filteredPackages = packingQueue?.filter(pkg => 
    pkg.package_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(pkg.order_id).includes(searchQuery)
  ) || [];

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Outbound Packing & Fleet Hand-off
          </h2>
          <p className="text-muted-foreground text-sm">
            Check picked lines, pack box containers with weights/sizes, and generate routing hand-offs.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search package ref, order ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">In-Progress Packing & Dispatch Handoff Queue</CardTitle>
          <CardDescription>Perform quality audits on items, pack them in boxes and register shipment volumetric dimensions</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {packingLoading ? (
            <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package Number</TableHead>
                    <TableHead>Sales Order ID</TableHead>
                    <TableHead>Current State</TableHead>
                    <TableHead>Sealed Operator</TableHead>
                    <TableHead>Fulfillment Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{pkg.package_number}</TableCell>
                      <TableCell className="font-bold text-slate-800">ORD-#{pkg.order_id}</TableCell>
                      <TableCell>
                        <Badge
                          variant={pkg.status === "packed" ? "default" : "outline"}
                          className={pkg.status === "packing" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                        >
                          {pkg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <UsersIcon className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{pkg.worker_name ?? "System Picker"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(pkg.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {pkg.status === "packing" ? (
                          <Button size="sm" onClick={() => openPackingModal(pkg)} className="text-xs shadow-sm h-8">
                            Seal Box Container
                          </Button>
                        ) : (
                          <div className="flex justify-end items-center gap-1 text-xs text-green-600 font-bold">
                            <CheckCircle2Icon className="h-4 w-4" /> Sealed & Sent
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPackages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <PackageIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No packages in dispatch queue.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PACK BOX DIALOG MODAL */}
      <Dialog open={isPackingModalOpen} onOpenChange={setIsPackingModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Seal Package Box — {selectedPackage?.package_number}</DialogTitle>
            <DialogDescription>Validate container dimensions, weight, and hand-off to the shipping fleet.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Lot Weight (kg)</Label>
              <Input
                type="number"
                placeholder="E.g. 5.4"
                value={pkgWeight}
                onChange={(e) => setPkgWeight(e.target.value)}
                className="mt-1 font-bold text-xs h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Box Dimensions (L x W x H cm)</Label>
              <Input
                placeholder="E.g. 30x20x15"
                value={pkgDimensions}
                onChange={(e) => setPkgDimensions(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Fulfillment Sealing Notes</Label>
              <Textarea
                placeholder="Bubble wrapped, fragile label attached..."
                value={pkgNotes}
                onChange={(e) => setPkgNotes(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPackingModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleCompletePacking}
              disabled={packPackageMutation.isPending}
            >
              {packPackageMutation.isPending ? "Sealing..." : "Seal Container & Fleet Handoff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
