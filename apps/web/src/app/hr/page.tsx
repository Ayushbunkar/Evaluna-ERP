"use client";

import { Card, CardContent } from "@evaluna/ui/components/card";
import {
	BanknoteIcon,
	BriefcaseIcon,
	CalendarIcon,
	ClockIcon,
	TrendingUpIcon,
	UserCheckIcon,
	UserMinusIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import { useTRPC } from "@/lib/trpc/client";

function KPICard({
	title,
	value,
	icon: Icon,
	trend,
	trendValue,
	trendIsPositive,
}: {
	title: string;
	value: string | number;
	icon: any;
	trend?: string;
	trendValue?: string;
	trendIsPositive?: boolean;
}) {
	return (
		<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-lg">
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
						<Icon className="h-6 w-6" />
					</div>
					{trendValue && (
						<div
							className={`rounded-full px-2 py-1 font-semibold text-xs ${
								trendIsPositive
									? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
									: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
							}`}
						>
							{trendIsPositive ? "↑" : "↓"} {trendValue}
						</div>
					)}
				</div>
				<div className="mt-4">
					<p className="font-medium text-muted-foreground text-sm capitalize">
						{title.replace(/([A-Z])/g, " $1").trim()}
					</p>
					<h3 className="mt-1 font-bold text-3xl text-foreground tracking-tight">
						{value}
					</h3>
					{trend && (
						<p className="mt-2 text-muted-foreground text-xs">{trend}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function HrDashboard() {
	const { data: stats, isLoading: statsLoading } =
		useTRPC().hr.getDashboardStats.useQuery(
			{},
			{ staleTime: 30_000, refetchOnWindowFocus: false },
		);

	const { data: employees, isLoading: employeesLoading } =
		useTRPC().hr.getEmployees.useQuery(
			{},
			{ staleTime: 30_000, refetchOnWindowFocus: false },
		);

	const getIconForKey = (key: string) => {
		switch (key) {
			case "totalEmployees":
				return UsersIcon;
			case "presentToday":
				return UserCheckIcon;
			case "onLeave":
				return CalendarIcon;
			case "payrollPending":
				return ClockIcon;
			case "newHiresThisMonth":
				return BriefcaseIcon;
			case "attritionRate":
				return UserMinusIcon;
			case "openPositions":
				return BriefcaseIcon;
			case "avgSalary":
				return BanknoteIcon;
			default:
				return TrendingUpIcon;
		}
	};

	// Generate department distribution data
	const departmentData = useMemo(() => {
		if (!employees) return [];
		const counts = employees.reduce((acc: any, emp) => {
			const dept = emp.department || "General";
			acc[dept] = (acc[dept] || 0) + 1;
			return acc;
		}, {});
		return Object.entries(counts).map(([name, value]) => ({ name, value }));
	}, [employees]);

	const COLORS = [
		"#3b82f6",
		"#10b981",
		"#f59e0b",
		"#ef4444",
		"#8b5cf6",
		"#ec4899",
		"#06b6d4",
	];

	// Mock historical data for smooth charts since ERP just started
	const growthData = [
		{ name: "Jan", hires: 4, attr: 1 },
		{ name: "Feb", hires: 7, attr: 2 },
		{ name: "Mar", hires: 5, attr: 1 },
		{ name: "Apr", hires: 12, attr: 3 },
		{ name: "May", hires: 8, attr: 2 },
		{ name: "Jun", hires: 15, attr: 4 },
		{
			name: "Jul",
			hires: Math.max(10, stats?.newHiresThisMonth || 0),
			attr: 2,
		},
	];

	return (
		<div className="space-y-8 p-6 pb-20">
			{/* Header */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl text-foreground tracking-tight">
						HR Overview
					</h1>
					<p className="text-muted-foreground">
						Monitor your workforce metrics and team distribution.
					</p>
				</div>
			</div>

			{/* KPIs */}
			{statsLoading ? (
				<div className="grid animate-pulse gap-6 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
						<Card key={i} className="h-[160px] bg-muted/20" />
					))}
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{stats &&
						Object.entries(stats).map(([key, value]) => {
							if (Array.isArray(value)) return null;
							let displayValue: string | number = value as any;
							let trendIsPositive = true;
							let trendValue = "";

							if (key === "avgSalary") {
								displayValue = new Intl.NumberFormat("en-IN", {
									style: "currency",
									currency: "INR",
									maximumFractionDigits: 0,
								}).format(Number(value));
							}
							if (key === "attritionRate") {
								displayValue = `${value}%`;
								trendIsPositive = false;
								trendValue = "1.2%";
							}
							if (key === "totalEmployees") {
								trendValue = "12%";
							}
							if (key === "presentToday") {
								trendValue = "98%";
							}
							if (key === "newHiresThisMonth") {
								trendValue = "5%";
							}

							return (
								<KPICard
									key={key}
									title={key}
									value={displayValue}
									icon={getIconForKey(key)}
									trendValue={trendValue || undefined}
									trendIsPositive={trendIsPositive}
								/>
							);
						})}
				</div>
			)}

			{/* Charts */}
			<div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
				{/* Growth Chart */}
				<Card className="col-span-full border-border/50 bg-card/50 shadow-sm md:col-span-4 lg:col-span-4">
					<CardContent className="p-6">
						<div className="mb-6">
							<h3 className="font-semibold text-lg">Workforce Growth</h3>
							<p className="text-muted-foreground text-sm">
								Hires vs Attrition over the last 6 months
							</p>
						</div>
						<div className="h-[300px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={growthData}
									margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke="hsl(var(--border))"
									/>
									<XAxis
										dataKey="name"
										stroke="hsl(var(--muted-foreground))"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										stroke="hsl(var(--muted-foreground))"
										fontSize={12}
										tickLine={false}
										axisLine={false}
										tickFormatter={(value) => `${value}`}
									/>
									<RechartsTooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											borderColor: "hsl(var(--border))",
											borderRadius: "8px",
											boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
										}}
									/>
									<Bar
										dataKey="hires"
										name="New Hires"
										fill="#3b82f6"
										radius={[4, 4, 0, 0]}
									/>
									<Bar
										dataKey="attr"
										name="Attrition"
										fill="#ef4444"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Distribution Chart */}
				<Card className="col-span-full border-border/50 bg-card/50 shadow-sm md:col-span-3 lg:col-span-3">
					<CardContent className="p-6">
						<div className="mb-6">
							<h3 className="font-semibold text-lg">Department Distribution</h3>
							<p className="text-muted-foreground text-sm">
								Headcount across all departments
							</p>
						</div>
						<div className="h-[300px] w-full">
							{departmentData.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={departmentData}
											cx="50%"
											cy="50%"
											innerRadius={70}
											outerRadius={100}
											paddingAngle={5}
											dataKey="value"
											stroke="none"
										>
											{departmentData.map((entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<RechartsTooltip
											contentStyle={{
												backgroundColor: "hsl(var(--card))",
												borderColor: "hsl(var(--border))",
												borderRadius: "8px",
											}}
											itemStyle={{ color: "hsl(var(--foreground))" }}
										/>
									</PieChart>
								</ResponsiveContainer>
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									No department data available
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Employees Table */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardContent className="p-6">
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-lg">Recent Employees</h3>
							<p className="text-muted-foreground text-sm">
								Latest additions to your workforce
							</p>
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-border border-b text-muted-foreground">
									<th className="pb-3 font-medium">Employee</th>
									<th className="pb-3 font-medium">Role</th>
									<th className="pb-3 font-medium">Department</th>
									<th className="pb-3 font-medium">Join Date</th>
									<th className="pb-3 text-right font-medium">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{employeesLoading ? (
									Array.from({ length: 5 }).map((_, i) => (
										<tr key={i} className="animate-pulse">
											<td className="py-4">
												<div className="h-4 w-32 rounded bg-muted/40" />
											</td>
											<td className="py-4">
												<div className="h-4 w-24 rounded bg-muted/40" />
											</td>
											<td className="py-4">
												<div className="h-4 w-24 rounded bg-muted/40" />
											</td>
											<td className="py-4">
												<div className="h-4 w-20 rounded bg-muted/40" />
											</td>
											<td className="py-4 text-right">
												<div className="ml-auto h-6 w-16 rounded-full bg-muted/40" />
											</td>
										</tr>
									))
								) : employees && employees.length > 0 ? (
									employees.slice(0, 7).map((emp) => (
										<tr
											key={emp.id}
											className="transition-colors hover:bg-muted/30"
										>
											<td className="py-4">
												<div className="font-medium text-foreground">
													{emp.name}
												</div>
												<div className="text-muted-foreground text-xs">
													{emp.emp_code}
												</div>
											</td>
											<td className="py-4 capitalize">
												{emp.role.replace(/_/g, " ")}
											</td>
											<td className="py-4">
												<span className="rounded-md bg-secondary px-2 py-1 text-xs">
													{emp.department}
												</span>
											</td>
											<td className="py-4 text-muted-foreground">
												{emp.join_date}
											</td>
											<td className="py-4 text-right">
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
														emp.status === "Active"
															? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
															: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
													}`}
												>
													{emp.status}
												</span>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={5}
											className="py-8 text-center text-muted-foreground"
										>
											No employees found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
