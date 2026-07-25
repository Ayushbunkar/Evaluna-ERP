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
  DollarSignIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UsersIcon,
  ClockIcon,
  CheckCircle2Icon,
  TruckIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  PackageIcon,
  StarIcon,
  WalletIcon,
  ActivityIcon,
  CheckSquareIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-muted rounded-lg text-muted-foreground group-hover:bg-background group-hover:text-primary transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          {trendValue && (
            <div className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${trendIsPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {trendIsPositive ? '↑' : '↓'} {trendValue}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-xl font-bold mt-1 tracking-tight">{value}</h3>
          {trend && <p className="text-[10px] text-muted-foreground mt-1">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BranchManagerDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.dashboard.getKpis.useQuery(
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branch Operations</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time metrics for your branch.</p>
      </div>

      {/* KPIs Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
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
            title="Today's Bills" 
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
            title="Net Profit" 
            value={formatCurrency(data.todayProfit, 'en-US')} 
            icon={TrendingUpIcon} 
            trendValue="8%" 
            trendIsPositive={data.todayProfit >= 0}
            colorClass="from-emerald-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Footfall" 
            value={data.footfall || 0} 
            icon={UsersIcon} 
            colorClass="from-orange-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Pending Orders" 
            value={data.pendingDeliveries || 0} 
            icon={ClockIcon} 
            colorClass="from-amber-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Orders Ready" 
            value={data.ordersReady || 0} 
            icon={CheckCircle2Icon} 
            colorClass="from-emerald-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Delivery Pending" 
            value={data.pendingDeliveries || 0} 
            icon={TruckIcon} 
            colorClass="from-cyan-500/10 to-transparent" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard 
            title="Returns" 
            value={data.returnsCount || 0} 
            icon={RotateCcwIcon} 
            trendValue="Action needed"
            trendIsPositive={false}
            colorClass="from-rose-500/10 to-transparent" 
          />
        </motion.div>
      </motion.div>

      {/* Main Widgets Bento Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Today's Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><ActivityIcon className="h-5 w-5 text-primary" /> Today's Timeline</CardTitle>
              <CardDescription>Live feed of branch operations</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="relative border-l-2 border-muted ml-3 space-y-6">
                {data.todayTimeline?.map((item: any, i: number) => (
                  <div key={item.id} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background ${
                      item.type === 'system' ? 'bg-blue-500' :
                      item.type === 'delivery' ? 'bg-amber-500' :
                      item.type === 'alert' ? 'bg-rose-500' :
                      item.type === 'finance' ? 'bg-emerald-500' :
                      'bg-purple-500'
                    }`} />
                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Selling Products & Low Stock */}
        <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border-border/50 shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><PackageIcon className="h-5 w-5 text-primary" /> Top Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topSellingProducts?.map((product: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(product.revenue, 'en-US')}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm bg-rose-500/5 border-rose-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-rose-600 flex items-center gap-2"><AlertTriangleIcon className="h-4 w-4" /> Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-700">{data.lowStockCount || 0} Items</div>
              <p className="text-xs text-rose-600/80 mt-1">Requires immediate re-ordering.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Staff & Cash */}
        <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border-border/50 shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" /> Staff Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.staffPerformance?.map((staff: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {staff.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{staff.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{staff.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">{formatCurrency(staff.sales, 'en-US')}</div>
                    <div className="text-[10px] text-amber-500 flex items-center justify-end"><StarIcon className="h-3 w-3 mr-0.5 fill-current" /> {staff.rating}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-700 flex items-center gap-2"><WalletIcon className="h-4 w-4" /> Cash Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-emerald-600/80 text-xs">Cash</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(data.cashCollection?.cash || 0, 'en-US')}</p>
                </div>
                <div>
                  <p className="text-emerald-600/80 text-xs">Card</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(data.cashCollection?.card || 0, 'en-US')}</p>
                </div>
                <div>
                  <p className="text-emerald-600/80 text-xs">UPI</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(data.cashCollection?.upi || 0, 'en-US')}</p>
                </div>
                <div>
                  <p className="text-amber-600/80 text-xs">Pending</p>
                  <p className="font-bold text-amber-700">{formatCurrency(data.cashCollection?.pending || 0, 'en-US')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Manager Tasks & Realtime Alerts */}
        <motion.div variants={itemVariants} className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><CheckSquareIcon className="h-5 w-5 text-primary" /> Manager Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.managerTasks?.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground'}`}>
                    {task.status === 'completed' && <CheckCircle2Icon className="h-3 w-3 text-white" />}
                  </div>
                  <h4 className={`text-sm font-medium flex-1 ${task.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</h4>
                  <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                    task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {task.priority}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><AlertTriangleIcon className="h-5 w-5 text-primary" /> Realtime Alerts & Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentNotifications?.map((notif: any) => (
                <div key={notif.id} className="flex items-start gap-4 p-2 rounded-xl group cursor-pointer">
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
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">{notif.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    <span className="text-[10px] text-muted-foreground/70 mt-1 block">{notif.time}</span>
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
