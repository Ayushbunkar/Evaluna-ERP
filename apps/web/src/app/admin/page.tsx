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
  Pie,
  PieChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  DollarSignIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  PackageIcon,
  TruckIcon,
  WarehouseIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useBranch } from "@/lib/branch-context";

// Premium Animated KPI Card
function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  trendIsPositive,
  colorClass
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  trendValue?: string;
  trendIsPositive?: boolean;
  colorClass: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-background to-background/50 border-border/50 shadow-sm overflow-hidden relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-muted rounded-xl text-muted-foreground group-hover:bg-background group-hover:text-primary transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          {trendValue && (
            <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${trendIsPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {trendIsPositive ? '↑' : '↓'} {trendValue}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
          {trend && <p className="text-xs text-muted-foreground mt-2">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompanyAdminDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.dashboard.getKpis.useQuery(
    activeBranchId ? { branch_id: activeBranchId } : {}
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
    expense: { label: "Expense", color: "hsl(var(--chart-2))" },
    sales: { label: "Sales", color: "hsl(var(--chart-3))" },
    amount: { label: "Amount", color: "hsl(var(--chart-4))" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time metrics and insights for your company.</p>
      </div>

      {/* KPIs Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Today's Sales" 
            value={formatCurrency(data.todaySales, 'en-US')} 
            icon={DollarSignIcon} 
            trend="vs yesterday" 
            trendValue="12%" 
            trendIsPositive={true}
            colorClass="from-blue-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Today's Orders" 
            value={data.todayOrders || 0} 
            icon={ShoppingCartIcon} 
            trend="vs yesterday" 
            trendValue="5%" 
            trendIsPositive={true}
            colorClass="from-indigo-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Today's Profit" 
            value={formatCurrency(data.todayProfit, 'en-US')} 
            icon={TrendingUpIcon} 
            trendValue="8%" 
            trendIsPositive={data.todayProfit >= 0}
            colorClass="from-emerald-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Total Products" 
            value={data.totalProducts} 
            icon={PackageIcon} 
            colorClass="from-orange-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Pending Deliveries" 
            value={data.pendingDeliveries || 0} 
            icon={TruckIcon} 
            colorClass="from-amber-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Warehouse Capacity" 
            value={`${data.warehouseCapacity || 0}%`} 
            icon={WarehouseIcon} 
            trend="Utilized space"
            colorClass="from-purple-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Active Employees" 
            value={data.activeEmployees || 0} 
            icon={UsersIcon} 
            colorClass="from-cyan-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Low Stock Items" 
            value={data.lowStockCount || 0} 
            icon={AlertTriangleIcon} 
            trendValue="Action needed"
            trendIsPositive={false}
            colorClass="from-rose-500/10 to-transparent" 
          />
        </motion.div>
      </motion.div>

      {/* Main Charts & Widgets Bento */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Sales & Revenue Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Revenue & Expenses Trend</CardTitle>
              <CardDescription>Monthly comparison across all branches</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              {data.revenueTrend ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Feed */}
        <motion.div variants={itemVariants} className="flex flex-col">
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentNotifications?.map((notif: any) => (
                <div key={notif.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    notif.type === 'low_stock' ? 'bg-rose-500/10 text-rose-500' :
                    notif.type === 'approval' ? 'bg-amber-500/10 text-amber-500' :
                    notif.type === 'sale' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {notif.type === 'low_stock' && <AlertTriangleIcon className="h-4 w-4" />}
                    {notif.type === 'approval' && <ClockIcon className="h-4 w-4" />}
                    {notif.type === 'sale' && <CheckCircle2Icon className="h-4 w-4" />}
                    {notif.type === 'delivery' && <TruckIcon className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{notif.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{notif.message}</p>
                    <span className="text-[10px] text-muted-foreground/70 mt-1 block">{notif.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Branch Performance */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
              <CardDescription>Sales vs Targets</CardDescription>
            </CardHeader>
            <CardContent>
              {data.branchPerformance ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={data.branchPerformance} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cash Flow */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Daily net cash balance</CardDescription>
            </CardHeader>
            <CardContent>
              {data.cashFlowTrend ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={data.cashFlowTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Inventory Value (Premium Widget) */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white border-0 shadow-lg h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <PackageIcon className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-white/90">Total Inventory Value</CardTitle>
              <CardDescription className="text-indigo-200">Across all warehouses</CardDescription>
            </CardHeader>
            <CardContent className="mt-8">
              <h2 className="text-4xl font-black">{formatCurrency(data.inventoryValue || 0, 'en-US')}</h2>
              <div className="mt-4 flex items-center text-sm font-medium text-emerald-400 bg-black/20 w-fit px-3 py-1 rounded-full">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                +2.4% this month
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
