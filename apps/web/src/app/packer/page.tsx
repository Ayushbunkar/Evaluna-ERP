"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { Box, PackageCheck, TrendingUp } from "lucide-react";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const StatCard = ({
	title,
	value,
	sub,
	icon: Icon,
}: {
	title: string;
	value: string | number;
	sub?: string;
	icon: any;
}) => (
	<AnimatedCard>
		<Card className="h-full rounded-xl border-border bg-card shadow-sm transition-all hover:shadow-md">
			<CardContent className="flex flex-col justify-between p-5">
				<div className="flex items-start justify-between">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/80">
						<Icon className="h-6 w-6 text-foreground" />
					</div>
					{sub && (
						<div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-[11px] text-emerald-600">
							{sub}
						</div>
					)}
				</div>
				<div className="mt-6 space-y-1">
					<p className="font-medium text-muted-foreground text-sm">{title}</p>
					<p className="font-bold text-3xl tracking-tight">{value}</p>
				</div>
			</CardContent>
		</Card>
	</AnimatedCard>
);

export default function PackerDashboard() {
	const { data: stats, isLoading } =
		useTRPC().packer.getDashboardStats.useQuery(
			undefined,
			{ staleTime: 30_000, refetchOnWindowFocus: false },
		);

	const { data: pendingToPack } = useTRPC().packer.getPendingToPack.useQuery(
		undefined,
		{ staleTime: 30_000 },
	);

	return (
		<PageTransition>
			<div className="flex flex-col gap-6 p-1">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Packer Dashboard
					</h1>
					<p className="text-muted-foreground text-sm">
						Your packaging tasks and performance
					</p>
				</div>

				{isLoading ? (
					<div className="grid gap-4 md:grid-cols-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<Card key={i} className="h-28 animate-pulse bg-muted/50" />
						))}
					</div>
				) : (
					<StaggerList className="grid gap-4 md:grid-cols-3">
						<StaggerItem>
							<StatCard
								title="Pending to Pack"
								value={stats?.pendingToPack ?? 0}
								icon={Box}
							/>
						</StaggerItem>
						<StaggerItem>
							<StatCard
								title="Packed Today"
								value={stats?.packedToday ?? 0}
								icon={PackageCheck}
								sub="+12% from yesterday"
							/>
						</StaggerItem>
						<StaggerItem>
							<StatCard
								title="Efficiency Rate"
								value={`${stats?.packingEfficiency ?? 0}%`}
								icon={TrendingUp}
							/>
						</StaggerItem>
					</StaggerList>
				)}

				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<div className="p-6">
							<h3 className="font-semibold text-lg">Needs Packing</h3>
							<p className="mb-4 text-muted-foreground text-sm">
								Pick lists that are completed and ready for packaging.
							</p>
							<div className="space-y-4">
								{pendingToPack?.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">{item.id}</p>
											<p className="text-muted-foreground text-sm">
												Ref: {item.order_ref}
											</p>
										</div>
										<Badge variant="outline">{item.completed_at}</Badge>
									</div>
								))}
								{pendingToPack?.length === 0 && (
									<div className="py-6 text-center text-muted-foreground text-sm">
										No pending pick lists to pack.
									</div>
								)}
							</div>
						</div>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
