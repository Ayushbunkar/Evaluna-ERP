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
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
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
  ClipboardListIcon,
  CheckCircle2Icon,
  SearchXIcon,
  PackageXIcon,
  ClockIcon,
  TargetIcon,
  BellIcon,
  AlertTriangleIcon,
  InfoIcon,
  ScanIcon
} from "lucide-react";
import { useBranch } from "@/lib/branch-context";

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
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuditorDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.auditor.getDashboardStats.useQuery(
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

  const issueColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  const chartConfig = {
    count: { label: "Count", color: "hsl(var(--chart-1))" },
    value: { label: "Value", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditor Control Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor stock integrity, cycle counts, and compliance.</p>
        </div>
        <Button className="gap-2"><ScanIcon className="h-4 w-4" /> Start Audit Scan</Button>
      </div>

      {/* KPIs Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <motion.div variants={itemVariants}>
          <KPICard title="Pending Audits" value={data.pendingAudits} icon={ClipboardListIcon} colorClass="from-blue-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Completed" value={data.completedAudits} icon={CheckCircle2Icon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Mismatch" value={data.mismatchCount} icon={SearchXIcon} colorClass="from-amber-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Damage" value={data.damageCount} icon={PackageXIcon} colorClass="from-rose-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Expiry" value={data.expiryCount} icon={ClockIcon} colorClass="from-orange-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Stock Accuracy" value={`${data.stockAccuracy}%`} icon={TargetIcon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Main Widgets Bento Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Expiry Timeline Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Expiry Risk Timeline</CardTitle>
              <CardDescription>Forecast of upcoming product expirations</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px]">
              {data.expiryTimeline ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={data.expiryTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpiry" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-4))" fillOpacity={1} fill="url(#colorExpiry)" />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Realtime Notifications Feed */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <Card className="border-border/50 shadow-sm h-full bg-background/40 backdrop-blur-md overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BellIcon className="h-4 w-4 text-primary" /> Live Audit Alerts</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-2">
              {data.notifications?.map((notif: any) => (
                <div key={notif.id} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                    notif.type === 'alert' ? 'bg-rose-500/20 text-rose-500' :
                    notif.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {notif.type === 'alert' && <AlertTriangleIcon className="h-3 w-3" />}
                    {notif.type === 'warning' && <ClockIcon className="h-3 w-3" />}
                    {notif.type === 'info' && <InfoIcon className="h-3 w-3" />}
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

        {/* Damage Timeline */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Damage Reports</CardTitle>
              <CardDescription>Monthly damaged units recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {data.damageTimeline ? (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={data.damageTimeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Warehouse Issues Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Warehouse Issues</CardTitle>
              <CardDescription>Breakdown by discrepancy type</CardDescription>
            </CardHeader>
            <CardContent>
              {data.warehouseIssues ? (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={data.warehouseIssues} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2}>
                      {data.warehouseIssues.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={issueColors[index % issueColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Product Mismatch Feed */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full bg-rose-500/5 border-rose-500/20">
            <CardHeader className="pb-3 border-b border-rose-500/10">
              <CardTitle className="text-base text-rose-700 flex items-center gap-2"><SearchXIcon className="h-4 w-4" /> Live Mismatches</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {data.productMismatch?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-rose-700">{item.id}</h4>
                    <p className="text-[10px] text-rose-600/70 mt-1">{item.location}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      Exp: <span className="font-medium text-foreground">{item.expected}</span><br/>
                      Act: <span className="font-medium text-foreground">{item.actual}</span>
                    </div>
                    <div className="bg-rose-100 dark:bg-rose-900/50 text-rose-700 font-bold px-2 py-1 rounded text-xs">
                      {item.diff}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Audit Queue & Recent Audits */}
        <motion.div variants={itemVariants} className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2"><ClipboardListIcon className="h-4 w-4 text-primary" /> Audit Queue</CardTitle>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2">View Schedule</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px]">ID / Area</TableHead>
                    <TableHead className="text-[10px]">Assigned To</TableHead>
                    <TableHead className="text-[10px] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.auditQueue?.map((audit: any) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        <div className="font-medium text-xs">{audit.id}</div>
                        <div className="text-[9px] text-muted-foreground">{audit.area}</div>
                      </TableCell>
                      <TableCell className="text-xs">{audit.assignedTo}</TableCell>
                      <TableCell className="text-right">
                        <div className={`text-[9px] uppercase font-bold tracking-wider inline-block px-2 py-0.5 rounded-full ${audit.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {audit.status}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2"><CheckCircle2Icon className="h-4 w-4 text-primary" /> Recent Audits</CardTitle>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2">History</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px]">ID / Area</TableHead>
                    <TableHead className="text-[10px]">Auditor</TableHead>
                    <TableHead className="text-[10px] text-right">Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentAudits?.map((audit: any) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        <div className="font-medium text-xs">{audit.id}</div>
                        <div className="text-[9px] text-muted-foreground">{audit.area}</div>
                      </TableCell>
                      <TableCell className="text-xs">{audit.completedBy}</TableCell>
                      <TableCell className="text-right">
                        <div className="text-xs font-bold text-emerald-500">{audit.accuracy}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">{audit.issues} issues found</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}
