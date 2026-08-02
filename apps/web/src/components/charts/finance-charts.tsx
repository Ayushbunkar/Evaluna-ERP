"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@evaluna/ui/components/chart";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";

const chartConfig = {
	revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
	expenses: { label: "Expenses", color: "hsl(var(--chart-4))" },
	cashIn: { label: "Cash In", color: "hsl(var(--chart-2))" },
	cashOut: { label: "Cash Out", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const pieColors = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

export function FinanceProfitChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
				<defs>
					<linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
						<stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
					</linearGradient>
					<linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
						<stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="month" tickLine={false} axisLine={false} />
				<YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Area
					type="monotone"
					dataKey="revenue"
					stroke="hsl(var(--chart-2))"
					fillOpacity={1}
					fill="url(#colorRev)"
				/>
				<Area
					type="monotone"
					dataKey="expenses"
					stroke="hsl(var(--chart-4))"
					fillOpacity={1}
					fill="url(#colorExp)"
				/>
			</AreaChart>
		</ChartContainer>
	);
}

export function FinanceExpenseChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[300px] w-full">
			<PieChart>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Pie
					data={data}
					dataKey="amount"
					nameKey="category"
					cx="50%"
					cy="50%"
					innerRadius={60}
					outerRadius={90}
					paddingAngle={2}
				>
					{data.map((_entry: any, index: number) => (
						<Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

export function FinanceCashFlowChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
				<XAxis dataKey="day" tickLine={false} axisLine={false} />
				<YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="in" name="Cash In" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
				<Bar dataKey="out" name="Cash Out" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ChartContainer>
	);
}
