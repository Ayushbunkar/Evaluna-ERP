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

export function WarehouseHeatmapChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
				<CartesianGrid strokeDasharray="3 3" opacity={0.2} />
				<XAxis
					type="number"
					dataKey="x"
					name="Aisle"
					tickLine={false}
					axisLine={false}
				/>
				<YAxis
					type="number"
					dataKey="y"
					name="Rack"
					tickLine={false}
					axisLine={false}
				/>
				<ZAxis
					type="number"
					dataKey="activity"
					range={[50, 400]}
					name="Activity"
				/>
				<ChartTooltip
					cursor={{ strokeDasharray: "3 3" }}
					content={<ChartTooltipContent />}
				/>
				<Scatter
					name="Activity"
					data={data}
					fill="hsl(var(--chart-1))"
					opacity={0.6}
				/>
			</ScatterChart>
		</ChartContainer>
	);
}

export function WarehouseRackChart({ data }: { data: any[] }) {
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
