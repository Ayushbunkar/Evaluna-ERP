"use client";

import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import {
  PackageCheckIcon,
  NavigationIcon,
  QrCodeIcon,
  KeyRoundIcon,
  BanknoteIcon,
  PhoneIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  Undo2Icon,
  WifiOffIcon,
  StarIcon,
  BatteryIcon,
  SignalIcon,
  MoreVerticalIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useBranch } from "@/lib/branch-context";

// Simple simulated mini-map
function MiniMapPreview() {
  return (
    <div className="relative w-full h-32 bg-slate-900 rounded-t-xl overflow-hidden border-b border-border/50">
      <div className="absolute inset-0 opacity-20" style={{ 
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
        backgroundSize: '15px 15px'
      }}></div>
      
      {/* Route Line */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path d="M 20 80 Q 80 80, 100 40 T 250 50" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="5,5" className="animate-[dash_1s_linear_infinite]" />
      </svg>
      
      {/* Origin */}
      <div className="absolute left-[20px] top-[80px] w-4 h-4 bg-emerald-500 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Destination */}
      <div className="absolute left-[250px] top-[50px] w-6 h-6 bg-primary rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-bounce">
        <MapPinIcon className="w-3 h-3 text-white" />
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.driver.getMobileDashboard.useQuery(
    activeBranchId ? { branch_id: activeBranchId } : {}
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full pb-20 bg-muted/30">
      {/* Mobile Top App Bar */}
      <div className="bg-background px-4 py-3 border-b border-border/50 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {data.driverName.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none">{data.driverName}</h1>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-500 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {data.status}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1 text-[10px] font-bold"><WifiOffIcon className="h-3 w-3 text-amber-500" /> Offline Sync</div>
          <div className="flex items-center gap-1"><SignalIcon className="h-4 w-4" /></div>
          <div className="flex items-center gap-1"><BatteryIcon className="h-4 w-4" /> <span className="text-[10px] font-bold">{data.batteryLevel}%</span></div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Next Delivery Mega Card */}
        {data.nextDelivery && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 shadow-lg overflow-hidden bg-background">
              <MiniMapPreview />
              <CardContent className="p-4 pt-5 relative">
                <div className="absolute top-0 right-4 -translate-y-1/2 bg-popover text-popover-foreground px-3 py-1 rounded-full text-[10px] font-bold shadow-md border border-border flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" /> ETA {data.nextDelivery.eta}
                </div>
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Next Drop-off</p>
                    <h2 className="text-xl font-bold leading-tight">{data.nextDelivery.customerName}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{data.nextDelivery.id}</p>
                  </div>
                  <Button size="icon" variant="outline" className="rounded-full h-10 w-10 shrink-0 border-primary/20 text-primary bg-primary/5">
                    <PhoneIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-start gap-2 mb-4 bg-muted/50 p-3 rounded-lg">
                  <MapPinIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{data.nextDelivery.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">Landmark: {data.nextDelivery.landmark}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-2">
                    <BanknoteIcon className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-[9px] uppercase font-bold text-amber-600/80">Collect {data.nextDelivery.paymentType}</p>
                      <p className="text-sm font-bold text-amber-700">{formatCurrency(data.nextDelivery.amountToCollect, 'en-US')}</p>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 flex items-center gap-2">
                    <PackageCheckIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-[9px] uppercase font-bold text-blue-600/80">Packages</p>
                      <p className="text-sm font-bold text-blue-700">{data.nextDelivery.packages} Items</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full h-14 text-lg font-bold shadow-md shadow-primary/20 gap-2 rounded-xl">
                  <NavigationIcon className="h-5 w-5" /> Start Navigation
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Massive Quick Action Buttons (Optimized for one-hand thumb reach) */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background hover:bg-muted shadow-sm">
            <QrCodeIcon className="h-6 w-6 text-primary" />
            <span className="text-xs font-bold">Scan Package</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background hover:bg-muted shadow-sm">
            <KeyRoundIcon className="h-6 w-6 text-indigo-500" />
            <span className="text-xs font-bold">Enter OTP</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background hover:bg-muted shadow-sm">
            <CheckCircle2Icon className="h-6 w-6 text-emerald-500" />
            <span className="text-xs font-bold">Mark Delivered</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background hover:bg-muted shadow-sm">
            <Undo2Icon className="h-6 w-6 text-amber-500" />
            <span className="text-xs font-bold">Return</span>
          </Button>
        </div>

        {/* Emergency Button */}
        <Button variant="destructive" className="w-full h-12 bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 gap-2 font-bold shadow-none rounded-xl">
          <AlertTriangleIcon className="h-4 w-4" /> Report Issue / Emergency
        </Button>

        {/* Mini KPI Dashboard */}
        <div className="bg-background rounded-xl p-4 border border-border/50 shadow-sm mt-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Today's Performance</h3>
          <div className="grid grid-cols-3 gap-y-5 gap-x-2">
            <div className="text-center">
              <div className="text-xl font-black">{data.delivered}/{data.assignedOrders}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Delivered</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-xl font-black text-amber-600">{formatCurrency(data.codCollected, 'en-US')}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">COD Collected</div>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="text-xl font-black flex items-center gap-1">{data.rating} <StarIcon className="h-3 w-3 fill-amber-400 text-amber-400" /></div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Today's Route Timeline */}
        <Card className="border-border/50 shadow-sm bg-background">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Today's Route</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreVerticalIcon className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:w-px md:before:mx-auto md:before:translate-x-0 before:h-full before:bg-border/50 pb-2">
              {data.routeStops?.map((stop: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[30px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-background ring-2 ring-background
                    ${stop.status === 'completed' ? 'bg-emerald-500 text-white' : 
                      stop.status === 'next' ? 'bg-primary text-white animate-pulse' : 'bg-muted border-muted-foreground/30'}`}>
                    {stop.status === 'completed' && <CheckCircle2Icon className="h-3 w-3" />}
                  </div>
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${stop.status === 'pending' ? 'text-muted-foreground' : ''}`}>{stop.address}</p>
                    <p className={`text-[10px] font-bold ${stop.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground'}`}>{stop.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
