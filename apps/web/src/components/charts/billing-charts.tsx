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

function EmptyChart({
	height = 200,
	message = "No data available yet",
}: {
	height?: number;
	message?: string;
}) {
	return (
		<div
			className="flex w-full flex-col items-center justify-center rounded-lg border border-gray-200 border-dashed bg-gray-50/50 text-center"
			style={{ height }}
		>
			<svg
				className="mb-2 h-8 w-8 text-gray-300"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
				/>
			</svg>
			<p className="font-medium text-gray-400 text-sm">{message}</p>
			<p className="mt-1 text-gray-300 text-xs">
				Data will appear once transactions are recorded
			</p>
		</div>
	);
}

export function BillingSalesChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart height={300} message="No sales trend data available" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<AreaChart
				data={data}
				margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
			>
				<defs>
					<linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="5%"
							stopColor="hsl(var(--chart-1))"
							stopOpacity={0.3}
						/>
						<stop
							offset="95%"
							stopColor="hsl(var(--chart-1))"
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="time" tickLine={false} axisLine={false} />
				<YAxis
					tickLine={false}
					axisLine={false}
					tickFormatter={(v) => `₹${v / 1000}k`}
				/>
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
	if (!data || data.length === 0) {
		return <EmptyChart message="No hourly sales data available" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-[200px] w-full">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
				<XAxis
					dataKey="hour"
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 10 }}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar
					dataKey="amount"
					fill="hsl(var(--chart-2))"
					radius={[4, 4, 0, 0]}
					barSize={20}
				/>
			</BarChart>
		</ChartContainer>
	);
}

export function BillingPaymentChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart message="No payment distribution data available" />;
	}

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
						<Cell
							key={`cell-${index}`}
							fill={paymentColors[index % paymentColors.length]}
						/>
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}
