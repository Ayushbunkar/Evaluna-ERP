"use client";

import { format } from "date-fns";
import { Calendar, Gift, Percent, Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

export default function SchemesPage() {
	const { data: schemes, isLoading } = trpc.schemes.getActiveSchemes.useQuery();

	if (isLoading)
		return (
			<div className="animate-pulse p-8 text-muted-foreground">
				Loading schemes...
			</div>
		);

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-8">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Promotion Schemes Engine
					</h1>
					<p className="text-muted-foreground">
						Manage active promotions, BOGO rules, and discounts.
					</p>
				</div>
				<Button className="shrink-0 gap-2">
					<Plus className="h-4 w-4" />
					Create Scheme
				</Button>
			</div>

			{schemes?.length === 0 ? (
				<Card className="flex flex-col items-center justify-center border-dashed p-12">
					<Tag className="mb-4 h-12 w-12 text-muted-foreground" />
					<p className="font-medium text-foreground text-lg">
						No active schemes
					</p>
					<p className="text-muted-foreground text-sm">
						Create a promotion scheme to boost sales.
					</p>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{schemes?.map((scheme) => (
						<Card
							key={scheme.id}
							className="group transition-colors hover:border-primary/50"
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<Badge
										variant="outline"
										className="mb-2 font-medium uppercase"
									>
										{scheme.type.replace("_", " ")}
									</Badge>
									<Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
										Active
									</Badge>
								</div>
								<CardTitle className="line-clamp-1 text-xl">
									{scheme.name}
								</CardTitle>
								<CardDescription className="flex items-center gap-2 pt-1 text-xs">
									<Calendar className="h-3.5 w-3.5" />
									{scheme.start_date
										? format(new Date(scheme.start_date), "MMM d, yyyy")
										: "Always Active"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="rounded-lg bg-muted/50 p-3 text-sm">
									<div className="mb-1 flex items-center gap-2 font-medium">
										{scheme.type === "free_gift" ? (
											<Gift className="h-4 w-4 text-primary" />
										) : (
											<Percent className="h-4 w-4 text-primary" />
										)}
										Rule Configuration
									</div>
									<pre className="mt-2 overflow-hidden text-ellipsis font-mono text-muted-foreground text-xs">
										{JSON.stringify(scheme.rules_json, null, 2)}
									</pre>
								</div>
								<div className="mt-4 flex gap-2">
									<Button variant="outline" className="w-full" size="sm">
										Edit
									</Button>
									<Button variant="destructive" className="w-full" size="sm">
										Deactivate
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
