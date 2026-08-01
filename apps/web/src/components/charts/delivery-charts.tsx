"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@evaluna/ui/components/chart";
import { Cell, Pie, PieChart } from "recharts";

const chartConfig = {
	status: { label: "Status", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const statusColors = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
];

export function DeliveryStatusChart({ data }: { data: any[] }) {
	return (
		<ChartContainer config={chartConfig} className="h-[140px] w-full">
			<PieChart>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					innerRadius={40}
					outerRadius={60}
					paddingAngle={2}
				>
					{data.map((_entry: any, index: number) => (
						<Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}
