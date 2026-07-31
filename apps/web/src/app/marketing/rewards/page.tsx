"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";

export default function RewardsPage() {
	const { data, isLoading } = trpc.loyalty.getRewards.useQuery();

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pb-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Loyalty Rewards</h1>
					<p className="mt-1 text-muted-foreground">
						Configure customer loyalty programs and rewards.
					</p>
				</div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<Card>
					<CardHeader>
						<CardTitle>Reward Tiers & Items</CardTitle>
						<CardDescription>
							Rewards available for points redemption
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex justify-center p-8">
								<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
							</div>
						) : (
							<div className="text-sm">
								{data && data.length > 0 ? (
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
										{data.map((reward: any) => (
											<div
												key={reward.id}
												className="rounded-md border p-4 shadow-sm"
											>
												<p className="font-semibold text-lg">{reward.name}</p>
												<p className="mt-1 text-muted-foreground">
													{reward.description}
												</p>
												<div className="mt-4 flex items-center justify-between">
													<span className="font-medium text-sm">
														{reward.pointsRequired} pts
													</span>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="py-8 text-center text-muted-foreground">
										No rewards configured.
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
