"use client";
import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Activity, Database, HardDrive, Server } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function HealthPage() {
	const trpc = useTRPC();
	const { data: health, isLoading } =
		trpc.superadmin.getSystemHealth.useQuery();

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-bold text-2xl tracking-tight">System Health</h2>
				<p className="text-muted-foreground">
					Monitor infrastructure and services.
				</p>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-32 animate-pulse rounded-md bg-muted" />
					))}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">CPU Usage</CardTitle>
							<Server className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{health?.cpu || "0"}%</div>
							<p className="text-muted-foreground text-xs">4 Cores Active</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Memory Usage
							</CardTitle>
							<HardDrive className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{health?.memory || "0"}%</div>
							<p className="text-muted-foreground text-xs">16 GB Total</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Database Latency
							</CardTitle>
							<Database className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{health?.dbLatency || "0"}ms
							</div>
							<p className="text-muted-foreground text-xs">Primary Instance</p>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
