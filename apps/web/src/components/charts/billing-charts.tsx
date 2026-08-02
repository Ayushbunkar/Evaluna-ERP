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
	sales: { label: "Sales", color: "hsl(var(--chart-1))" },
	hourly: { label: "Revenue", color: "hsl(var(--chart-2))" },
	payment: { label: "Method", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const paymentColors = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

export function BillingSalesChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
				<defs>
					<linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
						<stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="day" tickLine={false} axisLine={false} />
				<YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Area
					type="monotone"
					dataKey="sales"
					stroke="hsl(var(--chart-1))"
					fillOpacity={1}
					fill="url(#colorSales)"
				/>
			</AreaChart>
		</ChartContainer>
	);
}

export function BillingHourlyChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[200px] w-full">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
				<XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={20} />
			</BarChart>
		</ChartContainer>
	);
}

export function BillingPaymentChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[200px] w-full">
			<PieChart>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					innerRadius={50}
					outerRadius={70}
					paddingAngle={2}
				>
					{data.map((_entry: any, index: number) => (
						<Cell key={`cell-${index}`} fill={paymentColors[index % paymentColors.length]} />
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}
