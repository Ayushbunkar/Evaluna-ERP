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
	DownloadIcon,
	IndianRupeeIcon,
	TrendingUpIcon,
	UsersIcon,
	FileSpreadsheetIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/list-shell";
import { PageTransition } from "@/lib/animations";

import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "next-intl";

export default function SuperAdminBillingPage() {
	const locale = useLocale();
	const { data: stats, isLoading: statsLoading } = trpc.superadmin.getBillingStats.useQuery();
	const { data: invoices, isLoading: invoicesLoading } = trpc.superadmin.getBillingInvoices.useQuery();

	const handleDownload = (id: string) => {
		toast.success(`Downloading Supplier Invoice ${id} PDF...`);
	};

	const billingLogs = invoices || [];

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Procurement & Supplier Billing"
				description="Track system-wide material purchases, outstanding supplier balances, and procurement invoice histories."
				actions={
					<Button size="sm" onClick={() => toast.success("Exporting procurement report...")}>
						<FileSpreadsheetIcon className="mr-2 h-4 w-4" /> Export Ledger Report
					</Button>
				}
			/>

			{/* Stats cards */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-red-500/10 rounded-full">
							<IndianRupeeIcon className="h-6 w-6 text-red-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs flex items-center gap-1">Total Accounts Payable 🇮🇳</p>
							<p className="font-bold text-2xl">
								{statsLoading ? "..." : formatCurrency(stats?.mrr || 0, locale)}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-green-500/10 rounded-full">
							<TrendingUpIcon className="h-6 w-6 text-green-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs flex items-center gap-1">Total Value Procured 🇮🇳</p>
							<p className="font-bold text-2xl">
								{statsLoading ? "..." : formatCurrency(stats?.acv || 0, locale)}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-blue-500/10 rounded-full">
							<UsersIcon className="h-6 w-6 text-blue-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Active Registered Suppliers</p>
							<p className="font-bold text-2xl">
								{statsLoading ? "..." : `${stats?.activeTenants || 0} Suppliers`}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Invoice table card */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg">Recent Supplier Invoices</CardTitle>
					<CardDescription>System-wide transactional record for material purchases and raw goods.</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{invoicesLoading ? (
						<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
							Loading procurement invoices...
						</div>
					) : billingLogs.length === 0 ? (
						<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
							No supplier invoices recorded yet.
						</div>
					) : (
						<Table>
							<TableHeader className="bg-muted/40 backdrop-blur">
								<TableRow>
									<TableHead>Invoice / GRN Ref</TableHead>
									<TableHead>Supplier / Vendor</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Payment Status</TableHead>
									<TableHead>Purchase Date</TableHead>
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
											<span className={`px-2 py-0.5 rounded text-xs font-semibold ${
												log.status === "PAID" 
													? "bg-green-500/10 text-green-500" 
													: log.status === "PARTIAL" 
														? "bg-blue-500/10 text-blue-500" 
														: "bg-red-500/10 text-red-500"
											}`}>
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
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
