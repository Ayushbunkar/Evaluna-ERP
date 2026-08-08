"use client";

import {
	Card,
	CardContent,
} from "@evaluna/ui/components/card";
import {
	ClipboardCheck,
	PackageSearch,
	ShieldCheck,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { Badge } from "@evaluna/ui/components/badge";

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
		<Card className="h-full border-border bg-card shadow-sm rounded-xl transition-all hover:shadow-md">
			<CardContent className="p-5 flex flex-col justify-between">
				<div className="flex items-start justify-between">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/80">
						<Icon className="h-6 w-6 text-foreground" />
					</div>
					{sub && (
						<div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
							{sub}
						</div>
					)}
				</div>
				<div className="mt-6 space-y-1">
					<p className="font-medium text-muted-foreground text-sm">
						{title}
					</p>
					<p className="font-bold text-3xl tracking-tight">{value}</p>
				</div>
			</CardContent>
		</Card>
	</AnimatedCard>
);

export default function CheckerDashboard() {
	const { data: stats, isLoading } =
		useTRPC().checker.getDashboardStats.useQuery(
			{},
			{ staleTime: 30_000, refetchOnWindowFocus: false },
		);

	const { data: pendingToCheck } = useTRPC().checker.getPendingToCheck.useQuery(
		{},
		{ staleTime: 30_000 }
	);

	return (
		<PageTransition>
			<div className="flex flex-col gap-6 p-1">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Checker Dashboard</h1>
					<p className="text-muted-foreground text-sm">
						Your verification tasks and performance
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
								title="Pending to Check"
								value={stats?.pendingToCheck ?? 0}
								icon={PackageSearch}
							/>
						</StaggerItem>
						<StaggerItem>
							<StatCard
								title="Checked Today"
								value={stats?.checkedToday ?? 0}
								icon={ClipboardCheck}
								sub="+5% from yesterday"
							/>
						</StaggerItem>
						<StaggerItem>
							<StatCard
								title="Accuracy Rate"
								value={`${stats?.checkingAccuracy ?? 0}%`}
								icon={ShieldCheck}
							/>
						</StaggerItem>
					</StaggerList>
				)}

				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<div className="p-6">
							<h3 className="font-semibold text-lg">Needs Verification</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Packages that are packed and awaiting final checking.
							</p>
							<div className="space-y-4">
								{pendingToCheck?.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">{item.package_number}</p>
											<p className="text-sm text-muted-foreground">
												Ref: {item.order_ref}
											</p>
										</div>
										<Badge variant="outline">{item.packed_at}</Badge>
									</div>
								))}
								{pendingToCheck?.length === 0 && (
									<div className="text-center py-6 text-muted-foreground text-sm">
										No pending packages to check.
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
