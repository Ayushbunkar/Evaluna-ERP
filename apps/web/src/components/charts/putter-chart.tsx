"use client";

import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export function PutterTrendChart({ data }: { data: any[] }) {
	return (
		<div className="h-[280px] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
						stroke="hsl(var(--muted-foreground)/0.2)"
					/>
					<XAxis
						dataKey="date"
						axisLine={false}
						tickLine={false}
						tick={{
							fill: "hsl(var(--muted-foreground))",
							fontSize: 12,
						}}
						dy={10}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{
							fill: "hsl(var(--muted-foreground))",
							fontSize: 12,
						}}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "hsl(var(--card))",
							border: "1px solid hsl(var(--border))",
							borderRadius: "0.5rem",
							boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
						}}
					/>
					<Line
						type="monotone"
						dataKey="received"
						name="Goods Received"
						stroke="#2563eb"
						strokeWidth={3}
						dot={{ r: 4, strokeWidth: 2 }}
						activeDot={{ r: 6 }}
					/>
					<Line
						type="monotone"
						dataKey="putAway"
						name="Items Put Away"
						stroke="#16a34a"
						strokeWidth={3}
						dot={{ r: 4, strokeWidth: 2 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

export default PutterTrendChart;
