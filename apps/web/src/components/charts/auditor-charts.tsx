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
				Data will appear once audit records exist
			</p>
		</div>
	);
}

export function AuditorExpiryChart({ data }: { data: any[] }) {
	if (!data || data.length === 0) {
		return <EmptyChart height={300} message="No expiry risk data available" />;
	}

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
	if (!data || data.length === 0) {
		return <EmptyChart message="No damage data recorded" />;
	}

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
	if (!data || data.length === 0) {
		return <EmptyChart message="No discrepancy issues found" />;
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
							fill={issueColors[index % issueColors.length]}
						/>
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

