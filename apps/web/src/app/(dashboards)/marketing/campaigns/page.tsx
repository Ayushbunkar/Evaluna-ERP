"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Calendar,
	CheckCircle,
	Flame,
	Layers,
	Megaphone,
	Plus,
	Target,
	TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingCampaignsPage() {
	const [createOpen, setCreateOpen] = useState(false);
	const [name, setName] = useState("");
	const [objective, setObjective] = useState("Lead Generation & App Installs");
	const [description, setDescription] = useState("");
	const [budget, setBudget] = useState(25000);

	const trpc = useTRPC();
	const campaignsQuery = trpc.instagram.getCampaigns.useQuery();

	const createMutation = trpc.instagram.createCampaign.useMutation({
		onSuccess: () => {
			toast.success("Campaign launched successfully!");
			setCreateOpen(false);
			setName("");
			setDescription("");
			campaignsQuery.refetch();
		},
	});

	const campaigns = campaignsQuery.data || [];

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Please enter a campaign name.");
			return;
		}

		createMutation.mutate({
			name: name.trim(),
			objective,
			description: description.trim(),
			budget,
		});
	};

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			{/* Top Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Marketing Campaign Manager
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Track multi-post campaigns, promotional objectives, budgets, and customer acquisition
					</p>
				</div>

				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs">
							<Plus className="h-3.5 w-3.5" />
							New Campaign
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-base">Launch Marketing Campaign</DialogTitle>
							<DialogDescription className="text-xs">
								Group reels, stories, and carousels under a unified business objective.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleCreate} className="space-y-4 pt-2">
							<div className="space-y-1.5">
								<Label htmlFor="camp-name" className="text-xs font-semibold">
									Campaign Name
								</Label>
								<Input
									id="camp-name"
									placeholder="e.g. Festive Staples Pre-Booking Q4"
									className="text-xs h-8"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Campaign Objective</Label>
								<select
									className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs"
									value={objective}
									onChange={(e) => setObjective(e.target.value)}
								>
									<option value="Lead Generation & App Installs">Lead Generation & App Installs</option>
									<option value="Brand Awareness & Trust">Brand Awareness & Trust</option>
									<option value="Wholesale Slabs Clearance">Wholesale Slabs Clearance</option>
									<option value="Regional Expansion (Vidisha/Sehore)">Regional Expansion</option>
								</select>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="camp-desc" className="text-xs font-semibold">
									Description & Strategy
								</Label>
								<Input
									id="camp-desc"
									placeholder="Strategy notes for marketing team..."
									className="text-xs h-8"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="camp-budget" className="text-xs font-semibold">
									Budget (INR ₹)
								</Label>
								<Input
									id="camp-budget"
									type="number"
									className="text-xs h-8"
									value={budget}
									onChange={(e) => setBudget(Number(e.target.value))}
									required
								/>
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setCreateOpen(false)}
									className="text-xs"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={createMutation.isPending}
									className="text-xs bg-primary text-primary-foreground"
								>
									Launch Campaign
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Campaigns List */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{campaigns.map((camp) => (
					<Card key={camp.id} className="rounded-xl border-border/70 shadow-xs">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<div>
								<CardTitle className="text-sm font-bold flex items-center gap-1.5">
									<Megaphone className="h-4 w-4 text-primary" />
									{camp.name}
								</CardTitle>
								<CardDescription className="text-xs mt-0.5">
									Objective: {camp.objective}
								</CardDescription>
							</div>
							<Badge
								variant={camp.status === "ACTIVE" ? "default" : "secondary"}
								className="text-[10px]"
							>
								{camp.status}
							</Badge>
						</CardHeader>

						<CardContent className="space-y-4 pt-2">
							{camp.description && (
								<p className="text-xs text-muted-foreground line-clamp-2">
									{camp.description}
								</p>
							)}

							<div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-center text-xs">
								<div>
									<p className="font-bold text-foreground">
										₹{Number(camp.budget).toLocaleString()}
									</p>
									<p className="text-[10px] text-muted-foreground">Allocated Budget</p>
								</div>
								<div>
									<p className="font-bold text-foreground">{camp.linkedPostsCount || 0}</p>
									<p className="text-[10px] text-muted-foreground">Linked Posts</p>
								</div>
								<div>
									<p className="font-bold text-emerald-600">
										{(camp.totalReach || 0).toLocaleString()}
									</p>
									<p className="text-[10px] text-muted-foreground">Campaign Reach</p>
								</div>
							</div>

							<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
								<span>
									Started: {camp.startDate ? new Date(camp.startDate).toLocaleDateString("en-IN") : "Active"}
								</span>
								<span className="font-medium text-primary">
									Ongoing Campaign
								</span>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
