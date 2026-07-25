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
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  PackageIcon,
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  SearchIcon,
  BoxIcon,
  WarehouseIcon,
  MapPinIcon,
  ShieldAlertIcon,
  TimerIcon,
  ActivityIcon,
  UsersIcon,
  CheckSquareIcon,
  AlertTriangleIcon
} from "lucide-react";
import { useBranch } from "@/lib/branch-context";

// Premium Animated KPI Card
function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  colorClass
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  colorClass: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-background to-background/50 border-border/50 shadow-sm overflow-hidden relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:bg-background group-hover:text-primary transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-xl font-bold mt-1 tracking-tight">{value}</h3>
          {trend && <p className="text-[10px] text-muted-foreground mt-1">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WarehouseDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.warehouse.getStats.useQuery(
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

  const rackColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
  const fifoColors = ["hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1))"];

  const chartConfig = {
    activity: { label: "Activity", color: "hsl(var(--chart-1))" },
    used: { label: "Used Space", color: "hsl(var(--chart-2))" },
    value: { label: "Units", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Warehouse Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time logistics and inventory tracking.</p>
      </div>

      {/* KPIs Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3"
      >
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Received" value={data.itemsReceived || 0} icon={ArrowDownToLineIcon} colorClass="from-blue-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Put Away" value={data.itemsPutAway || 0} icon={ArrowUpToLineIcon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Pick Queue" value={data.pickingQueue || 0} icon={SearchIcon} colorClass="from-indigo-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Pack Queue" value={data.packingQueue || 0} icon={BoxIcon} colorClass="from-cyan-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Capacity" value={`${data.warehouseCapacity || 0}%`} icon={WarehouseIcon} colorClass="from-purple-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Locations" value={data.locationsUsed || 0} icon={MapPinIcon} colorClass="from-amber-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Damaged" value={data.damageItems || 0} icon={ShieldAlertIcon} colorClass="from-rose-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Expired" value={data.expiredProducts || 0} icon={TimerIcon} colorClass="from-orange-500/10 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Main Widgets Bento Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Warehouse Heatmap */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Live Warehouse Heatmap</CardTitle>
              <CardDescription>Real-time activity across zones</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              {data.heatmapData ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" dataKey="x" name="Aisle" tickLine={false} axisLine={false} />
                    <YAxis type="number" dataKey="y" name="Rack" tickLine={false} axisLine={false} />
                    <ZAxis type="number" dataKey="activity" range={[50, 400]} name="Activity" />
                    <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
                    <Scatter name="Activity" data={data.heatmapData} fill="hsl(var(--chart-1))" opacity={0.6} />
                  </ScatterChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No heatmap data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Realtime Alerts & Recent Activity */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <Card className="border-border/50 shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><ActivityIcon className="h-4 w-4 text-primary" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentActivity?.map((act: any) => (
                <div key={act.id} className="flex flex-col border-l-2 border-primary/30 pl-3 relative">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{act.action}</p>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-muted-foreground">
                    <span>{act.user}</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-rose-500/5 border-rose-500/20 flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-rose-700 flex items-center gap-2"><AlertTriangleIcon className="h-4 w-4" /> Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 mt-2">
              {data.inventoryAlerts?.map((alert: any) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm text-rose-800">
                  <ShieldAlertIcon className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-70" />
                  <div>
                    <p className="leading-tight font-medium">{alert.message}</p>
                    <span className="text-[10px] opacity-70">{alert.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Rack Utilization */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Rack Utilization</CardTitle>
              <CardDescription>Capacity usage by zone</CardDescription>
            </CardHeader>
            <CardContent>
              {data.rackUtilization ? (
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <BarChart data={data.rackUtilization} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="used" radius={[0, 4, 4, 0]} barSize={16}>
                      {data.rackUtilization.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={rackColors[index % rackColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* FIFO Status */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>FIFO Status (Inventory Age)</CardTitle>
              <CardDescription>Units grouped by age in warehouse</CardDescription>
            </CardHeader>
            <CardContent>
              {data.fifoStatus ? (
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={data.fifoStatus} dataKey="value" nameKey="age" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                      {data.fifoStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={fifoColors[index % fifoColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Worker Performance & Pending Tasks */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> Worker Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.workerPerformance?.map((worker: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors">
                  <div>
                    <h4 className="text-sm font-medium">{worker.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase">{worker.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{worker.items} items</div>
                    <div className="text-[10px] text-emerald-500 font-medium">{worker.accuracy}% acc</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><CheckSquareIcon className="h-4 w-4 text-primary" /> Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pendingTasks?.map((task: any) => (
                <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/30 transition-colors bg-muted/20">
                  <div className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                    task.priority === 'high' ? 'bg-rose-500' :
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <div>
                    <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{task.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}
