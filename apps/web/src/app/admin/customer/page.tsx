"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { useTRPC } from "@/lib/trpc/client";

export default function CustomerDashboard() {
	const { data: stats, isLoading } =
		useTRPC().customer.getPortalStats.useQuery();

	return (
		<div className="space-y-6 p-4">
			<h1 className="font-bold text-3xl capitalize">customer Dashboard</h1>
			{isLoading ? (
				<p>Loading stats...</p>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{stats &&
						Object.entries(stats).map(([key, value]) => {
							if (Array.isArray(value)) return null;
							return (
								<Card
									key={key}
									className="border-border/50 bg-card/50 backdrop-blur-xl"
								>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="font-medium text-sm capitalize">
											{key.replace(/([A-Z])/g, " ₹1").trim()}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="font-bold text-2xl">{value as any}</div>
									</CardContent>
								</Card>
							);
						})}
				</div>
			)}
		</div>
	);
}
