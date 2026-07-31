"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { motion } from "framer-motion";
import { HeartIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { LoyaltySummary } from "@/components/loyalty-summary";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

const TIER_BADGES: Record<string, { label: string; class: string }> = {
	gold: {
		label: "🥇 Gold",
		class: "bg-amber-50 text-amber-700 border-amber-200",
	},
	silver: {
		label: "🥈 Silver",
		class: "bg-slate-100 text-slate-700 border-slate-300",
	},
	bronze: {
		label: "🥉 Bronze",
		class: "bg-orange-50 text-orange-700 border-orange-200",
	},
};

export default function LoyaltyPage() {
	const { activeBranchId } = useBranch();
	const [search, setSearch] = useState("");
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

	const { data: customers, isLoading } = trpc.customers.list.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	const filtered = customers?.filter(
		(c: any) =>
			c.name.toLowerCase().includes(search.toLowerCase()) ||
			c.email?.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="flex-1 space-y-4 p-4 pt-6 md:p-8"
		>
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">Loyalty Program</h2>
					<p className="mt-1 text-muted-foreground">
						Track customer tiers, points, and lifetime spend. Tiers: Bronze →
						Silver (₹10,000) → Gold (₹50,000).
					</p>
				</div>
			</div>

			<div className="relative max-w-sm">
				<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search customers..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			<div className="rounded-md border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Customer</TableHead>
							<TableHead>Tier</TableHead>
							<TableHead>Points</TableHead>
							<TableHead>Total Spent</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="py-10 text-center text-muted-foreground"
								>
									Loading customers...
								</TableCell>
							</TableRow>
						)}
						{!isLoading && (!filtered || filtered.length === 0) && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="py-10 text-center text-muted-foreground"
								>
									<HeartIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
									No customers found.
								</TableCell>
							</TableRow>
						)}
						{filtered?.map((customer: any, i: number) => {
							const tier = customer.loyalty_tier ?? "bronze";
							const tierBadge = TIER_BADGES[tier] ?? TIER_BADGES.bronze;
							return (
								<motion.tr
									key={customer.id}
									initial={{ opacity: 0, x: -12 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: i * 0.05, duration: 0.3 }}
									className="border-b transition-colors hover:bg-muted/30"
								>
									<TableCell>
										<div className="font-medium">{customer.name}</div>
										<div className="text-muted-foreground text-xs">
											{customer.email}
										</div>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs ${tierBadge.class}`}
										>
											{tierBadge.label}
										</span>
									</TableCell>
									<TableCell className="font-mono font-semibold">
										{customer.loyalty_points ?? 0} pts
									</TableCell>
									<TableCell className="font-mono">
										₹
										{Number.parseFloat(
											customer.total_spent ?? "0",
										).toLocaleString("en-IN")}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setSelectedCustomer(customer)}
											className="gap-2"
										>
											<HeartIcon className="h-3.5 w-3.5 text-rose-500" />
											View
										</Button>
									</TableCell>
								</motion.tr>
							);
						})}
					</TableBody>
				</Table>
			</div>

			<Dialog
				open={!!selectedCustomer}
				onOpenChange={(o) => !o && setSelectedCustomer(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{selectedCustomer?.name} — Loyalty Profile
						</DialogTitle>
					</DialogHeader>
					{selectedCustomer && (
						<LoyaltySummary customerId={selectedCustomer.id} />
					)}
				</DialogContent>
			</Dialog>
		</motion.div>
	);
}
