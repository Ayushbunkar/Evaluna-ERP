"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@evaluna/ui/components/chart";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	Scatter,
	ScatterChart,
	XAxis,
	YAxis,
	ZAxis,
} from "recharts";

const chartConfig = {
	heatmap: { label: "Activity", color: "hsl(var(--chart-1))" },
	rack: { label: "Utilization", color: "hsl(var(--chart-2))" },
	fifo: { label: "Inventory Age", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const rackColors = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

const fifoColors = [
	"hsl(var(--chart-2))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
	"hsl(var(--chart-1))",
];

function EmptyChart({
	height = 220,
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
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			<p className="font-medium text-gray-400 text-sm">{message}</p>
			<p className="mt-1 text-gray-300 text-xs">
				Configure warehouse locations to see data
			</p>
		</div>
	);
}

export function WarehouseHeatmapChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart height={300} message="No warehouse location data" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
				<CartesianGrid strokeDasharray="3 3" opacity={0.2} />
				<XAxis
					type="number"
					dataKey="x"
					name="Zone"
					tickLine={false}
					axisLine={false}
				/>
				<YAxis
					type="number"
					dataKey="y"
					name="Stock"
					tickLine={false}
					axisLine={false}
				/>
				<ZAxis
					type="number"
					dataKey="activity"
					range={[50, 400]}
					name="Utilization %"
				/>
				<ChartTooltip
					cursor={{ strokeDasharray: "3 3" }}
					content={<ChartTooltipContent />}
				/>
				<Scatter
					name="Location Activity"
					data={data}
					fill="hsl(var(--chart-1))"
					opacity={0.6}
				/>
			</ScatterChart>
		</ChartContainer>
	);
}

export function WarehouseRackChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart message="No rack utilization data" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-[220px] w-full">
			<BarChart
				data={data}
				layout="vertical"
				margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
			>
				<CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
				<XAxis type="number" hide />
				<YAxis
					dataKey="name"
					type="category"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 11 }}
					width={100}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="used" radius={[0, 4, 4, 0]} barSize={16}>
					{data.map((_entry: any, index: number) => (
						<Cell
							key={`cell-${index}`}
							fill={rackColors[index % rackColors.length]}
						/>
					))}
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}

export function WarehouseFifoChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart message="No batch age data available" />;
	}

	return (
		<ChartContainer config={chartConfig} className="h-[220px] w-full">
			<PieChart>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Pie
					data={data}
					dataKey="value"
					nameKey="age"
					cx="50%"
					cy="50%"
					innerRadius={60}
					outerRadius={80}
					paddingAngle={2}
				>
					{data.map((_entry: any, index: number) => (
						<Cell
							key={`cell-${index}`}
							fill={fifoColors[index % fifoColors.length]}
						/>
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}
