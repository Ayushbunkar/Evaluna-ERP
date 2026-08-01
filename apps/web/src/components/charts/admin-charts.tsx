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
	XAxis,
	YAxis,
} from "recharts";

const chartConfig = {
	sales: { label: "Sales", color: "hsl(var(--chart-1))" },
	revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
	target: { label: "Target", color: "hsl(var(--chart-3))" },
	balance: { label: "Balance", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

export function AdminSalesTrendChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
				<defs>
					<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
						<stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="month" tickLine={false} axisLine={false} />
				<YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Area
					type="monotone"
					dataKey="revenue"
					stroke="hsl(var(--chart-1))"
					fillOpacity={1}
					fill="url(#colorRevenue)"
				/>
			</AreaChart>
		</ChartContainer>
	);
}

export function AdminBranchPerformanceChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<BarChart
				data={data}
				layout="vertical"
				margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
			>
				<CartesianGrid strokeDasharray="3 3" horizontal={false} />
				<XAxis type="number" hide />
				<YAxis
					dataKey="name"
					type="category"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 12 }}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar
					dataKey="sales"
					fill="hsl(var(--chart-3))"
					radius={[0, 4, 4, 0]}
					barSize={20}
				/>
			</BarChart>
		</ChartContainer>
	);
}

export function AdminCashFlowChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="date" tickLine={false} axisLine={false} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar
					dataKey="amount"
					fill="hsl(var(--chart-4))"
					radius={[4, 4, 0, 0]}
				/>
			</BarChart>
		</ChartContainer>
	);
}
