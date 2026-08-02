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
	expiry: { label: "Expiry Risk", color: "hsl(var(--chart-4))" },
	damage: { label: "Damaged Units", color: "hsl(var(--chart-1))" },
	issue: { label: "Discrepancy", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const issueColors = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

export function AuditorExpiryChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-full w-full">
			<AreaChart
				data={data}
				margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
			>
				<defs>
					<linearGradient id="colorExpiry" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="5%"
							stopColor="hsl(var(--chart-4))"
							stopOpacity={0.3}
						/>
						<stop
							offset="95%"
							stopColor="hsl(var(--chart-4))"
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="month" tickLine={false} axisLine={false} />
				<YAxis tickLine={false} axisLine={false} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Area
					type="monotone"
					dataKey="count"
					stroke="hsl(var(--chart-4))"
					fillOpacity={1}
					fill="url(#colorExpiry)"
				/>
			</AreaChart>
		</ChartContainer>
	);
}

export function AuditorDamageChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[200px] w-full">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
				<XAxis
					dataKey="month"
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 10 }}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar
					dataKey="count"
					fill="hsl(var(--chart-1))"
					radius={[4, 4, 0, 0]}
					barSize={24}
				/>
			</BarChart>
		</ChartContainer>
	);
}

export function AuditorIssuesChart({ data }: { data: any[] }) {
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
							fill={issueColors[index % issueColors.length]}
						/>
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}
