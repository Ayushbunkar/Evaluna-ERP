"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { useTRPC } from "@/lib/trpc/client";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="space-y-1">
			<p className="text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</p>
			<p className="font-medium text-sm">{value || "—"}</p>
		</div>
	);
}

export default function CustomerProfilePage() {
	const trpc = useTRPC();
	const { data: p, isLoading } = trpc.customer.getMyProfile.useQuery();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">My Profile</h1>
				<p className="text-muted-foreground text-sm">
					Contact our team if any of these details need updating.
				</p>
			</div>

			{isLoading || !p ? (
				<p className="text-muted-foreground text-sm">Loading…</p>
			) : (
				<>
					<Card className="border-border/50">
						<CardHeader>
							<CardTitle className="text-base">Account</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-5 sm:grid-cols-2">
							<Field label="Name" value={p.name} />
							<Field label="Customer Code" value={p.customer_code} />
							<Field label="Email" value={p.email} />
							<Field label="Phone" value={p.phone} />
							<Field label="Address" value={p.address} />
							<Field label="Customer Type" value={p.customer_type} />
						</CardContent>
					</Card>

					<Card className="border-border/50">
						<CardHeader>
							<CardTitle className="text-base">Loyalty & Wallet</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-5 sm:grid-cols-3">
							<Field
								label="Loyalty Tier"
								value={
									<span className="capitalize">{p.loyalty_tier ?? "bronze"}</span>
								}
							/>
							<Field label="Loyalty Points" value={p.loyalty_points ?? 0} />
							<Field
								label="Wallet Balance"
								value={`₹${Number(p.store_credit ?? 0).toLocaleString("en-IN")}`}
							/>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
