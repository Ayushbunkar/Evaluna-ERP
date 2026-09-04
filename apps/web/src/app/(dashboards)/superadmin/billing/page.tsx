"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	BanknoteIcon,
	CreditCardIcon,
	DownloadIcon,
	DollarSignIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/list-shell";
import { PageTransition } from "@/lib/animations";

export default function SuperAdminBillingPage() {
	const [billingLogs] = useState([
		{ id: "INV-1001", company: "Acme Corp", amount: "$499.00", status: "Paid", date: "2026-09-01" },
		{ id: "INV-1002", company: "Globex Ltd", amount: "$299.00", status: "Paid", date: "2026-09-01" },
		{ id: "INV-1003", company: "Initech", amount: "$149.00", status: "Paid", date: "2026-08-28" },
		{ id: "INV-1004", company: "Umbrella Corp", amount: "$999.00", status: "Pending", date: "2026-08-25" },
	]);

	const handleDownload = (id: string) => {
		toast.success(`Downloading invoice ${id} PDF...`);
	};

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Global SaaS Billing & Subscriptions"
				description="Track system-wide subscription tiers, company billing plans, and SaaS transaction history."
				actions={
					<Button size="sm" onClick={() => toast.success("Opening plan configuration...")}>
						<CreditCardIcon className="mr-2 h-4 w-4" /> Manage Pricing Plans
					</Button>
				}
			/>

			{/* Stats cards */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-blue-500/10 rounded-full">
							<DollarSignIcon className="h-6 w-6 text-blue-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Monthly Recurring Revenue</p>
							<p className="font-bold text-2xl">$1,946.00</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-green-500/10 rounded-full">
							<TrendingUpIcon className="h-6 w-6 text-green-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Annual Contract Value</p>
							<p className="font-bold text-2xl">$23,352.00</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-yellow-500/10 rounded-full">
							<UsersIcon className="h-6 w-6 text-yellow-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">SaaS Customers</p>
							<p className="font-bold text-2xl">4 Active Tenants</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Invoice table card */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg">Recent Tenant Invoices</CardTitle>
					<CardDescription>System-wide transactional record for SaaS subscriptions.</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader className="bg-muted/40 backdrop-blur">
							<TableRow>
								<TableHead>Invoice ID</TableHead>
								<TableHead>Company</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Issue Date</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{billingLogs.map((log) => (
								<TableRow key={log.id} className="hover:bg-muted/30">
									<TableCell className="font-medium font-mono text-sm">{log.id}</TableCell>
									<TableCell>{log.company}</TableCell>
									<TableCell>{log.amount}</TableCell>
									<TableCell>
										<span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.status === "Paid" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-600"}`}>
											{log.status}
										</span>
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">{log.date}</TableCell>
									<TableCell className="text-right">
										<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(log.id)}>
											<DownloadIcon className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
