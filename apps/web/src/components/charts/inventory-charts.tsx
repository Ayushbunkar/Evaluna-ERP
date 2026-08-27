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
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	XAxis,
	YAxis,
} from "recharts";

const chartConfig = {
	value: { label: "Stock Value", color: "hsl(var(--chart-1))" },
	category: { label: "Category", color: "hsl(var(--chart-2))" },
	abc: { label: "ABC Class", color: "hsl(var(--chart-3))" },
	warehouse: { label: "Warehouse", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const categoryColors = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

function EmptyChart({
	height = 250,
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
				Data will appear once inventory is configured
			</p>
		</div>
	);
}

export function InventoryValueChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart height={300} message="No inventory trend data" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<AreaChart
				data={data}
				margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
			>
				<defs>
					<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
				<XAxis dataKey="month" tickLine={false} axisLine={false} />
				<YAxis
					tickLine={false}
					axisLine={false}
					tickFormatter={(v) => `â‚¹${v / 1000}k`}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Area
					type="monotone"
					dataKey="value"
					stroke="hsl(var(--chart-1))"
					fillOpacity={1}
					fill="url(#colorValue)"
				/>
			</AreaChart>
		</ChartContainer>
	);
}

export function InventoryCategoryChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart message="No category distribution data" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<PieChart>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					innerRadius={60}
					outerRadius={80}
					paddingAngle={2}
				>
					{data.map((_entry: any, index: number) => (
						<Cell
							key={`cell-${index}`}
							fill={categoryColors[index % categoryColors.length]}
						/>
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

export function InventoryAbcChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart message="No ABC classification data" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<RadarChart
				data={data}
				margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
			>
				<PolarGrid />
				<PolarAngleAxis dataKey="class" />
				<PolarRadiusAxis angle={30} domain={[0, 100]} />
				<Radar
					name="Value %"
					dataKey="value"
					stroke="hsl(var(--chart-1))"
					fill="hsl(var(--chart-1))"
					fillOpacity={0.5}
				/>
				<Radar
					name="Volume %"
					dataKey="percentage"
					stroke="hsl(var(--chart-2))"
					fill="hsl(var(--chart-2))"
					fillOpacity={0.5}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
			</RadarChart>
		</ChartContainer>
	);
}

export function InventoryWarehouseChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart message="No warehouse distribution data" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="name" tickLine={false} axisLine={false} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar
					dataKey="stock"
					fill="hsl(var(--chart-3))"
					radius={[4, 4, 0, 0]}
					barSize={30}
				/>
			</BarChart>
		</ChartContainer>
	);
}

