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
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  CalculatorIcon,
  ArrowRightCircleIcon,
  ArrowLeftCircleIcon,
  ActivityIcon,
  LandmarkIcon,
  ReceiptIcon,
  ClockIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useBranch } from "@/lib/branch-context";

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trendValue,
  trendIsPositive,
  colorClass
}: {
  title: string;
  value: string | number;
  icon: any;
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
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinanceDashboard() {
  const { activeBranchId } = useBranch();
  
  const { data, isLoading } = trpc.finance.getDashboardStats.useQuery(
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

  const pieColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1))"];

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
    expenses: { label: "Expenses", color: "hsl(var(--chart-4))" },
    in: { label: "Cash In", color: "hsl(var(--chart-2))" },
    out: { label: "Cash Out", color: "hsl(var(--chart-4))" },
    amount: { label: "Amount", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Command Center</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time accounting, taxation, and cash flow.</p>
      </div>

      {/* KPIs Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <KPICard title="Today's Cash" value={formatCurrency(data.todaysCash, 'en-US')} icon={WalletIcon} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Monthly Revenue" value={formatCurrency(data.monthlyRevenue, 'en-US')} icon={TrendingUpIcon} trendValue="12%" trendIsPositive={true} colorClass="from-blue-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Total Expenses" value={formatCurrency(data.totalExpenses, 'en-US')} icon={TrendingDownIcon} trendValue="4%" trendIsPositive={false} colorClass="from-rose-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Net Profit" value={formatCurrency(data.netProfit, 'en-US')} icon={DollarSignIcon} trendValue="15%" trendIsPositive={true} colorClass="from-emerald-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="GST Liability" value={formatCurrency(data.gstLiability, 'en-US')} icon={CalculatorIcon} colorClass="from-amber-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Receivables (To Collect)" value={formatCurrency(data.totalReceivables, 'en-US')} icon={ArrowRightCircleIcon} colorClass="from-indigo-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Payables (To Pay)" value={formatCurrency(data.totalPayables, 'en-US')} icon={ArrowLeftCircleIcon} colorClass="from-purple-500/10 to-transparent" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPICard title="Cash Flow" value={formatCurrency(data.cashFlow, 'en-US')} icon={ActivityIcon} colorClass="from-cyan-500/10 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Main Widgets Bento Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Profit Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Profit & Loss Trend</CardTitle>
              <CardDescription>Revenue vs. Expenses over 6 months</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              {data.profitChart ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={data.profitChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-4))" fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Categorized spending analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {data.expenseBreakdown ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={data.expenseBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {data.expenseBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cash Flow */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Weekly Cash Flow</CardTitle>
              <CardDescription>Incoming and outgoing cash analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {data.cashFlowData ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={data.cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="in" name="Cash In" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="out" name="Cash Out" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bank Balances & GST Summary */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 h-full">
          <Card className="border-border/50 shadow-sm flex-1 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><LandmarkIcon className="h-4 w-4 text-blue-600" /> Bank Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.bankBalances?.map((bank: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">{bank.account}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase">{bank.type}</p>
                  </div>
                  <div className="text-sm font-bold">{formatCurrency(bank.balance, 'en-US')}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-700 flex items-center gap-2"><ReceiptIcon className="h-4 w-4" /> GST Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Input Tax (Purchases)</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(data.gstSummary?.inputTax || 0, 'en-US')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Output Tax (Sales)</p>
                  <p className="font-semibold text-rose-600">{formatCurrency(data.gstSummary?.outputTax || 0, 'en-US')}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/20 flex justify-between items-center">
                <span className="text-sm font-medium">Net Liability</span>
                <span className="text-lg font-bold text-amber-700">{formatCurrency(data.gstSummary?.netLiability || 0, 'en-US')}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Outstanding Payments & Recent Transactions */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:col-span-3">
          <Card className="border-border/50 shadow-sm h-full lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><ClockIcon className="h-4 w-4 text-primary" /> Outstanding Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.outstandingPayments?.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center p-2.5 rounded-lg border border-border/40 hover:border-primary/30 transition-colors bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{payment.party}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${payment.type === 'Receivable' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {payment.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{payment.id}</span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold">{formatCurrency(payment.amount, 'en-US')}</div>
                    <div className={`text-[10px] ${payment.due === 'Overdue' ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>{payment.due}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-full lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><ActivityIcon className="h-4 w-4 text-primary" /> Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentTransactions?.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors bg-muted/20">
                  <div className={`p-2 rounded-full flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tx.type === 'credit' ? <ArrowRightCircleIcon className="h-4 w-4" /> : <ArrowLeftCircleIcon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium leading-tight">{tx.description}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{tx.date} • {tx.id}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, 'en-US')}
                    </div>
                    <div className={`text-[10px] uppercase font-bold mt-1 tracking-wider ${tx.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {tx.status}
                    </div>
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
