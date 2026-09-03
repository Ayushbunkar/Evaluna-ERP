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
  FileSpreadsheetIcon,
  AlertTriangleIcon,
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
  const { data: isEWayBillConfigured } = trpc.warehouse.isEWayBillConfigured.useQuery();

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

  const generateEWayBillMutation = trpc.warehouse.generateEWayBill.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Government E-Way Bill generated: ${res.eWayBillNo}`);
        utils.warehouse.getPackingQueue.invalidate();
      } else {
        toast.error(`E-Way Bill Error: ${res.error}`);
      }
    },
    onError: (err) => {
      toast.error(`API Gate Failure: ${err.message}`);
    }
  });

  // Packing Modal State
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [pkgWeight, setPkgWeight] = useState("");
  const [pkgDimensions, setPkgDimensions] = useState("");
  const [pkgNotes, setPkgNotes] = useState("");

  // E-Way Bill Modal State
  const [selectedEWayPackage, setSelectedEWayPackage] = useState<any>(null);
  const [isEWayModalOpen, setIsEWayModalOpen] = useState(false);
  const [vehicleNo, setVehicleNo] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [approxDistance, setApproxDistance] = useState("120");
  const [modeOfTransport, setModeOfTransport] = useState<"road" | "rail" | "air" | "ship">("road");

  const openPackingModal = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsPackingModalOpen(true);
  };

  const openEWayModal = (pkg: any) => {
    setSelectedEWayPackage(pkg);
    setIsEWayModalOpen(true);
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

  const handleGenerateEWayBill = async () => {
    if (!selectedEWayPackage) return;
    await generateEWayBillMutation.mutateAsync({
      orderId: selectedEWayPackage.order_id,
      vehicleNo: vehicleNo,
      modeOfTransport: modeOfTransport,
      approxDistanceKm: parseInt(approxDistance, 10) || 100,
      transporterName: transporterName || undefined
    });
    setIsEWayModalOpen(false);
    setVehicleNo("");
    setTransporterName("");
    setApproxDistance("120");
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
                    <TableHead>E-Way Bill Status</TableHead>
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
                      <TableCell>
                        {pkg.e_way_bill_no ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-mono text-[10px]">
                            {pkg.e_way_bill_no}
                          </Badge>
                        ) : Number(pkg.total_amount || 0) >= 50000 ? (
                          <Badge variant="destructive" className="animate-pulse text-[10px]">
                            Required (₹{Number(pkg.total_amount).toLocaleString()})
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Optional</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pkg.status === "packing" ? (
                            <Button size="sm" onClick={() => openPackingModal(pkg)} className="text-xs shadow-sm h-8">
                              Seal Box Container
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              {!pkg.e_way_bill_no && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEWayModal(pkg)}
                                  className="text-xs shadow-sm h-8 border-blue-200 hover:bg-blue-50 text-blue-600"
                                >
                                  <FileSpreadsheetIcon className="mr-1 h-3.5 w-3.5" />
                                  E-Way Bill
                                </Button>
                              )}
                              <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                                <CheckCircle2Icon className="h-4 w-4" /> Sealed
                              </div>
                            </div>
                          )}
                        </div>
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

      {/* GENERATE GOVERNMENT E-WAY BILL MODAL */}
      <Dialog open={isEWayModalOpen} onOpenChange={setIsEWayModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1.5 text-slate-900">
              <FileSpreadsheetIcon className="h-5 w-5 text-blue-500" />
              Government GST E-Way Bill Integration
            </DialogTitle>
            <DialogDescription>
              Register inter-state logistics transits for Order ORD-#{selectedEWayPackage?.order_id} directly with GST NIC Portal.
            </DialogDescription>
          </DialogHeader>

          {!isEWayBillConfigured ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md my-2 text-xs flex gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="text-red-700 space-y-1">
                <p className="font-bold">E-Way Bill integration not configured</p>
                <p className="leading-relaxed">
                  Missing GSP credentials or configuration API endpoints. Please set <code className="bg-white px-1 py-0.5 border font-mono">EWAY_BILL_USERNAME</code> and <code className="bg-white px-1 py-0.5 border font-mono">EWAY_BILL_API_KEY</code> environment variables to initiate official connections.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md my-2 text-[11px] text-blue-800 font-medium">
              API Active: Government Sandbox Endpoint is configured and ready.
            </div>
          )}

          <div className="space-y-4 my-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Vehicle Number (Required)</Label>
                <Input
                  placeholder="E.g. MP-04-HE-1234"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="mt-1 text-xs h-9 uppercase font-bold"
                  disabled={!isEWayBillConfigured}
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Approx. Distance (km)</Label>
                <Input
                  type="number"
                  placeholder="E.g. 150"
                  value={approxDistance}
                  onChange={(e) => setApproxDistance(e.target.value)}
                  className="mt-1 text-xs h-9"
                  disabled={!isEWayBillConfigured}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Transporter Name</Label>
                <Input
                  placeholder="E.g. DTDC Express"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  className="mt-1 text-xs h-9"
                  disabled={!isEWayBillConfigured}
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Transport Mode</Label>
                <select
                  value={modeOfTransport}
                  onChange={(e: any) => setModeOfTransport(e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm h-9"
                  disabled={!isEWayBillConfigured}
                >
                  <option value="road">Roadway</option>
                  <option value="rail">Railway</option>
                  <option value="air">Airway</option>
                  <option value="ship">Shipment</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEWayModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleGenerateEWayBill}
              disabled={!isEWayBillConfigured || generateEWayBillMutation.isPending}
            >
              {generateEWayBillMutation.isPending ? "Connecting..." : "Generate GST E-Way Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
