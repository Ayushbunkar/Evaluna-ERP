"use client";

import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@evaluna/ui/components/card";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
  type ChartConfig,
} from "@evaluna/ui/components/chart";
import {
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Button } from "@evaluna/ui/components/button";
import {
  PackageIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  BanknoteIcon,
  TrendingUpIcon,
  TimerIcon,
  CarIcon,
  UserCheckIcon,
  PackageSearchIcon,
  AlertTriangleIcon,
  MapIcon,
  PhoneIcon,
  NavigationIcon,
  UserPlusIcon,
  ActivityIcon,
  BellIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useBranch } from "@/lib/branch-context";
import { useState, useEffect } from "react";

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass
}: {
  title: string;
  value: string | number;
  icon: any;
  colorClass: string;
}) {
  return (
    <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-sm overflow-hidden relative group hover:border-primary/50 transition-colors">
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="p-1.5 bg-muted/50 rounded-lg text-muted-foreground group-hover:bg-background group-hover:text-primary transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-lg font-bold mt-0.5 tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

// Simulated Live Map Component
function SimulatedLiveMap({ drivers }: { drivers: any[] }) {
  const [dots, setDots] = useState(drivers);

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.map(d => ({
        ...d,
        lat: d.lat + (Math.random() - 0.5) * 0.001,
        lng: d.lng + (Math.random() - 0.5) * 0.001
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden border border-border/50">
      {/* Fake Map Grid Background */}
      <div className="absolute inset-0" style={{ 
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* Pulsing Central Hub */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          <div className="relative h-6 w-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
            <MapIcon className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      {/* Driver Markers */}
      {dots.map((driver, i) => (
        <div key={driver.id} className="absolute transition-all duration-1000 ease-linear"
             style={{ 
               top: `calc(50% + ${(driver.lat - 28.6139) * 10000}px)`,
               left: `calc(50% + ${(driver.lng - 77.2090) * 10000}px)`
             }}>
          <div className="relative group cursor-pointer">
            <div className={`h-4 w-4 rounded-full border-2 border-white shadow-lg ${driver.status === 'delivering' ? 'bg-amber-500' : driver.status === 'idle' ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
              <p className="font-bold">{driver.name}</p>
              <p className="capitalize text-muted-foreground">{driver.status}</p>
              <div className="mt-1 w-full bg-muted rounded-full h-1">
                <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${driver.battery}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-md p-2 rounded text-[10px] border border-border">
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Driving</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Delivering</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Idle</span>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.delivery.getDashboard.useQuery(
    activeBranchId ? { branch_id: activeBranchId } : {}
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const statusColors = ["hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-3))", "hsl(var(--chart-1))"];

  const chartConfig = {
    value: { label: "Orders", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-5 w-full max-w-[1400px] mx-auto pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Command Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time delivery & logistics management.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Tracking Active
        </div>
      </div>

      {/* KPIs Grid - Highly dense glass cards */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3"
      >
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Today's Deliveries" value={data.todaysDeliveries} icon={PackageIcon} colorClass="from-blue-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Completed" value={data.completedDeliveries} icon={CheckCircle2Icon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Pending" value={data.pendingDeliveries} icon={ClockIcon} colorClass="from-amber-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Failed" value={data.failedDeliveries} icon={XCircleIcon} colorClass="from-rose-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="COD Collected" value={formatCurrency(data.codCollection, 'en-US')} icon={BanknoteIcon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Success Rate" value={`${data.deliverySuccessRate}%`} icon={TrendingUpIcon} colorClass="from-blue-500/10 to-transparent" />
        </motion.div>
        
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Avg Time" value={data.averageDeliveryTime} icon={TimerIcon} colorClass="from-purple-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Active Vehicles" value={data.vehiclesActive} icon={CarIcon} colorClass="from-indigo-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Drivers Online" value={data.driversOnline} icon={UserCheckIcon} colorClass="from-cyan-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Orders Waiting" value={data.ordersWaiting} icon={PackageSearchIcon} colorClass="from-orange-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Late Deliveries" value={data.lateDeliveries} icon={AlertTriangleIcon} colorClass="from-rose-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 xl:col-span-2">
          <KPICard title="Distance Traveled" value={`${data.distanceTravelled} km`} icon={MapIcon} colorClass="from-zinc-500/10 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Main Grid Layout */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-auto lg:h-[450px]"
      >
        {/* Live Map Widget */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col h-full">
          <Card className="h-full border-border/50 shadow-sm flex flex-col overflow-hidden bg-background/40 backdrop-blur-md">
            <CardHeader className="pb-3 z-10 bg-background/80 backdrop-blur flex flex-row items-center justify-between border-b border-border/50">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><MapIcon className="h-4 w-4 text-primary" /> Live Tracking Map</CardTitle>
                <CardDescription className="text-xs">Real-time driver locations & route tracking</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs">View Full Map</Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative h-[300px] lg:h-auto">
              {data.activeDrivers && <SimulatedLiveMap drivers={data.activeDrivers} />}
            </CardContent>
          </Card>
        </motion.div>

        {/* Side Widgets */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-5 h-full">
          
          {/* Order Status Breakdown */}
          <Card className="border-border/50 shadow-sm flex-1 bg-background/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Orders by Status</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              {data.ordersByStatus ? (
                <ChartContainer config={chartConfig} className="h-[140px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={data.ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2}>
                      {data.ordersByStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : null}
            </CardContent>
          </Card>

          {/* Realtime Notifications Feed */}
          <Card className="border-border/50 shadow-sm flex-1 bg-background/40 backdrop-blur-md overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BellIcon className="h-4 w-4" /> Live Alerts</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-2">
              {data.notifications?.map((notif: any) => (
                <div key={notif.id} className="flex items-start gap-2.5 group">
                  <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                    notif.type === 'emergency' ? 'bg-rose-500/20 text-rose-500' :
                    notif.type === 'delay' ? 'bg-amber-500/20 text-amber-500' : 
                    notif.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {notif.type === 'emergency' && <AlertTriangleIcon className="h-3 w-3" />}
                    {notif.type === 'delay' && <ClockIcon className="h-3 w-3" />}
                    {notif.type === 'traffic' && <CarIcon className="h-3 w-3" />}
                    {notif.type === 'success' && <BanknoteIcon className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-semibold leading-tight truncate">{notif.title}</h4>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap ml-2">{notif.time}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-tight">{notif.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </motion.div>
      </motion.div>

      {/* Bottom Section - Tables */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Active Delivery Orders Table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm bg-background/40 backdrop-blur-md">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2"><PackageIcon className="h-4 w-4" /> Live Delivery Orders</CardTitle>
              <Button size="sm" variant="secondary" className="h-7 text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Driver</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.deliveryOrders?.map((order: any) => (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-medium text-xs">{order.id}</TableCell>
                    <TableCell className="text-xs">
                      <div>{order.customer}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{order.address}</div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${
                        order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                        order.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                        order.status === 'out_for_delivery' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{order.driver}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-6 w-6"><NavigationIcon className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"><PhoneIcon className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"><ActivityIcon className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Drivers */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm bg-background/40 backdrop-blur-md">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2"><UserCheckIcon className="h-4 w-4" /> Top Drivers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {data.topDrivers?.map((driver: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium leading-none">{driver.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">⭐ {driver.rating} Rating</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{driver.deliveries}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Deliveries</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}
