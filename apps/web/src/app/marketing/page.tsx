"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { motion } from "framer-motion";
import { GiftIcon, MegaphoneIcon, TicketIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

function KPICard({
	title,
	value,
	icon: Icon,
	colorClass,
}: {
	title: string;
	value: string | number;
	icon: any;
	colorClass: string;
}) {
	return (
		<Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-background/50 shadow-sm">
			<div
				className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 transition-opacity group-hover:opacity-100`}
			/>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="rounded-xl bg-muted p-3 text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
						<Icon className="h-6 w-6" />
					</div>
				</div>
				<div className="mt-4">
					<p className="font-medium text-muted-foreground text-sm">{title}</p>
					<h3 className="mt-1 font-bold text-2xl tracking-tight">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}

export default function MarketingDashboard() {
	const { activeBranchId } = useBranch();

	const { data: metrics, isLoading } = trpc.marketing.getMetrics.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: { staggerChildren: 0.05 },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 15 },
		show: {
			opacity: 1,
			y: 0,
			transition: { type: "spring", stiffness: 300, damping: 24 },
		},
	};

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pb-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Marketing Dashboard
					</h1>
					<p className="mt-1 text-muted-foreground">
						Manage promotions, coupons, and loyalty rewards.
					</p>
				</div>
				<div className="flex gap-4">
					<Link
						href="/marketing/coupons"
						className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
					>
						Manage Coupons
					</Link>
					<Link
						href="/marketing/rewards"
						className="rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80"
					>
						Loyalty Rewards
					</Link>
				</div>
			</div>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
			>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Active Campaigns"
						value={metrics?.activeCampaigns || 3}
						icon={MegaphoneIcon}
						colorClass="from-blue-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Coupons Redeemed"
						value={metrics?.couponsRedeemed || 142}
						icon={TicketIcon}
						colorClass="from-indigo-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="Loyalty Points Given"
						value={metrics?.pointsGiven || "45.2k"}
						icon={GiftIcon}
						colorClass="from-emerald-500/10 to-transparent"
					/>
				</motion.div>
				<motion.div variants={itemVariants}>
					<KPICard
						title="New Subscribers"
						value={metrics?.newSubscribers || 89}
						icon={UsersIcon}
						colorClass="from-purple-500/10 to-transparent"
					/>
				</motion.div>
			</motion.div>

			<motion.div
				variants={itemVariants}
				initial="hidden"
				animate="show"
				className="mt-8"
			>
				<Card>
					<CardHeader>
						<CardTitle>Recent Marketing Activities</CardTitle>
						<CardDescription>
							Overview of recent promotions and rewards claimed
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex justify-center p-8">
								<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
							</div>
						) : (
							<div className="mt-4 flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground">
								Marketing activity chart/list will be rendered here.
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
