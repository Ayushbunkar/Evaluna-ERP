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
  ReceiptTextIcon,
  BanknoteIcon,
  TrendingUpIcon,
  Undo2Icon,
  CreditCardIcon,
  SmartphoneNfcIcon,
  ClockIcon,
  MonitorSmartphoneIcon,
  PlusCircleIcon,
  UserCheckIcon,
  HistoryIcon,
  ActivityIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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

export default function BillingDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.billing.getDashboardStats.useQuery(
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

  const paymentColors = ["hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--chart-3))"];

  const chartConfig = {
    sales: { label: "Sales", color: "hsl(var(--chart-1))" },
    amount: { label: "Amount", color: "hsl(var(--chart-2))" },
    value: { label: "Value", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & POS Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time point of sale and transaction metrics.</p>
      </div>

      {/* KPIs Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3"
      >
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Today's Bills" value={data.todaysBills} icon={ReceiptTextIcon} colorClass="from-blue-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
          <KPICard title="Revenue" value={formatCurrency(data.revenue, 'en-US')} icon={TrendingUpIcon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Avg Bill" value={formatCurrency(data.averageBill, 'en-US')} icon={ActivityIcon} colorClass="from-indigo-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Refunds" value={formatCurrency(data.refunds, 'en-US')} icon={Undo2Icon} colorClass="from-rose-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Cash" value={formatCurrency(data.cashCollected, 'en-US')} icon={BanknoteIcon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Card & UPI" value={formatCurrency(data.cardCollected + data.upiCollected, 'en-US')} icon={CreditCardIcon} colorClass="from-cyan-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <KPICard title="Pending" value={data.pendingBills} icon={ClockIcon} colorClass="from-amber-500/10 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Main Widgets Bento Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Sales Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Sales Timeline</CardTitle>
              <CardDescription>Intra-day sales progression</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px]">
              {data.salesChart ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={data.salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Top Cashier */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><MonitorSmartphoneIcon className="h-4 w-4 text-primary" /> Quick POS Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button className="w-full justify-start gap-2" size="sm"><PlusCircleIcon className="h-4 w-4" /> New Bill</Button>
              <Button className="w-full justify-start gap-2" variant="secondary" size="sm"><Undo2Icon className="h-4 w-4" /> Return</Button>
              <Button className="w-full justify-start gap-2" variant="outline" size="sm"><HistoryIcon className="h-4 w-4" /> Hold Bill</Button>
              <Button className="w-full justify-start gap-2" variant="outline" size="sm"><BanknoteIcon className="h-4 w-4" /> Day Close</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><UserCheckIcon className="h-4 w-4 text-emerald-600" /> Top Cashiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topCashiers?.map((cashier: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium leading-none">{cashier.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{cashier.bills} bills punched</p>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">{formatCurrency(cashier.revenue, 'en-US')}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly Sales */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Hourly Sales</CardTitle>
              <CardDescription>Revenue by the hour</CardDescription>
            </CardHeader>
            <CardContent>
              {data.hourlySales ? (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={data.hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Collection breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {data.paymentDistribution ? (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={data.paymentDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2}>
                      {data.paymentDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={paymentColors[index % paymentColors.length]} />
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

        {/* Recent Bills */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2"><ReceiptTextIcon className="h-4 w-4 text-primary" /> Recent Bills</CardTitle>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px]">Invoice</TableHead>
                    <TableHead className="text-[10px]">Customer</TableHead>
                    <TableHead className="text-[10px] text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentBills?.map((bill: any) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium text-xs">{bill.id}</TableCell>
                      <TableCell>
                        <div className="text-xs">{bill.customer}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">{bill.payment} • {bill.items} items</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xs font-bold">{formatCurrency(bill.amount, 'en-US')}</div>
                        <div className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 ${bill.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{bill.status}</div>
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
