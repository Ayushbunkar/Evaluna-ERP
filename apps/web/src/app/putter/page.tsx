"use client";

import {
	Card,
	CardContent,
} from "@evaluna/ui/components/card";
import { useTRPC } from "@/lib/trpc/client";
import { Package } from "lucide-react";

export default function PutterDashboard() {
	const { data: stats, isLoading } =
		useTRPC().putter.getDashboardStats.useQuery(
			{},
			{ staleTime: 30_000, refetchOnWindowFocus: false },
		);

	return (
		<div className="space-y-6 p-4">
			<h1 className="font-bold text-3xl capitalize">putter Dashboard</h1>
			{isLoading ? (
				<p>Loading stats...</p>
			) : (
				<div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
					{stats &&
						Object.entries(stats).map(([key, value]) => {
							if (Array.isArray(value)) return null;
							const title = key.replace(/([A-Z])/g, " $1").trim();
							// capitalize first letter
							const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
							return (
								<Card
									key={key}
									className="h-full border-border bg-card shadow-sm rounded-xl transition-all hover:shadow-md"
								>
									<CardContent className="p-5 flex flex-col justify-between">
										<div className="flex items-start justify-between">
											<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/80">
												<Package className="h-6 w-6 text-foreground" />
											</div>
										</div>
										<div className="mt-6 space-y-1">
											<p className="font-medium text-muted-foreground text-sm">
												{formattedTitle}
											</p>
											<p className="font-bold text-3xl tracking-tight">{value as any}</p>
										</div>
									</CardContent>
								</Card>
							);
						})}
				</div>
			)}
		</div>
	);
}
