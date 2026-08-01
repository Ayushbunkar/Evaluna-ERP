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

export function InventoryValueChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
				<defs>
					<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
						<stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="month" tickLine={false} axisLine={false} />
				<YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
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
						<Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

export function InventoryAbcChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
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
	return (
		<ChartContainer config={chartConfig} className="h-[250px] w-full">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="name" tickLine={false} axisLine={false} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="stock" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} barSize={30} />
			</BarChart>
		</ChartContainer>
	);
}
