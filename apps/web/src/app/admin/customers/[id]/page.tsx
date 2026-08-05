"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import { format } from "date-fns";
import {
	ArrowLeft,
	Gift,
	HandCoins,
	IndianRupee,
	Landmark,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function CustomerIntelligencePage() {
	const { id } = useParams();
	const router = useRouter();
	const customerId = Number.parseInt(id as string, 10);

	const { data, isLoading } = trpc.customers.getById.useQuery({
		id: customerId,
	});
	const utils = trpc.useUtils();

	const [ledgerOpen, setLedgerOpen] = useState(false);
	const [ledgerType, setLedgerType] = useState<"points" | "credit">("credit");
	const [ledgerAmount, setLedgerAmount] = useState("");
	const [ledgerReason, setLedgerReason] = useState("");

	const _updateCustomer = trpc.customers.update.useMutation({
		onSuccess: () => {
			toast.success("Profile updated");
			utils.customers.getById.invalidate();
		},
	});

	const adjustLedger = trpc.customers.adjustLedger.useMutation({
		onSuccess: () => {
			toast.success("Ledger adjusted successfully");
			setLedgerOpen(false);
			setLedgerAmount("");
			setLedgerReason("");
			utils.customers.getById.invalidate();
		},
	});

	if (isLoading)
		return (
			<div className="animate-pulse p-8 text-center text-muted-foreground">
				Loading Customer Intelligence...
			</div>
		);
	if (!data?.customer)
		return (
			<div className="p-8 text-center text-red-500">
				Customer not found in the database.
			</div>
		);

	const { customer, ledger } = data;

	const handleAdjust = () => {
		if (!ledgerAmount || Number.isNaN(Number.parseFloat(ledgerAmount)))
			return toast.error("Valid amount required");
		if (!ledgerReason) return toast.error("Reason required");

		adjustLedger.mutate({
			id: customerId,
			type: ledgerType,
			amount: Number.parseFloat(ledgerAmount),
			reason: ledgerReason,
		});
	};

	const ledgerColumns: Column<any>[] = [
		{
			key: "date",
			header: "Date",
			render: (row) => row.created_at ? format(new Date(row.created_at), "dd MMM yyyy, p") : "N/A",
		},
		{
			key: "type",
			header: "Type",
			render: (row) => (
				<Badge
					variant={row.type === "credit" ? "default" : "secondary"}
					className="capitalize"
				>
					{row.type}
				</Badge>
			),
		},
		{
			key: "reason",
			header: "Reason",
			accessorFn: (row) => row.reason,
		},
		{
			key: "amount",
			header: "Amount",
			headerClassName: "text-right",
			className: "text-right",
			render: (row) => {
				const amt = Number.parseFloat(row.amount);
				const isPositive = amt > 0;
				return (
					<span
						className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
					>
						{isPositive ? "+" : ""}
						{amt}
					</span>
				);
			},
		},
	];

	const orderColumns: Column<any>[] = [
		{
			key: "id",
			header: "Order ID",
			render: (row) => <span className="font-medium">#{row.id}</span>,
		},
		{
			key: "date",
			header: "Date",
			render: (row) => row.created_at ? format(new Date(row.created_at), "dd MMM yyyy") : "N/A",
		},
		{
			key: "status",
			header: "Status",
			render: (row) => {
				const isCompleted = row.status === "completed";
				const isPending = row.status === "pending";
				return (
					<Badge
						variant="outline"
						className={`${isCompleted ? "border-green-200 bg-green-50 text-green-700" : isPending ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "border-red-200 bg-red-50 text-red-700"} capitalize`}
					>
						{row.status || "Pending"}
					</Badge>
				);
			},
		},
		{
			key: "total",
			header: "Total Value",
			headerClassName: "text-right",
			className: "text-right",
			render: (row) => (
				<span className="font-semibold">
					₹
					{Number.parseFloat(row.total_amount).toLocaleString("en-IN", {
						minimumFractionDigits: 2,
					})}
				</span>
			),
		},
	];

	return (
		<div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/customers")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl tracking-tight">{customer.name}</h1>
					<p className="mt-1 flex items-center gap-2 text-muted-foreground">
						<span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
							{customer.customer_code || "N/A"}
						</span>
						&bull; Customer since{" "}
						{format(new Date(customer.created_at || new Date()), "MMMM yyyy")}
					</p>
				</div>
				<div className="ml-auto flex items-center gap-3">
					<Badge
						variant={customer.status === "active" ? "default" : "destructive"}
						className="text-xs uppercase tracking-wider"
					>
						{customer.status || "Active"}
					</Badge>
					<div
						className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold text-sm capitalize shadow-sm ${
							customer.loyalty_tier === "gold"
								? "bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-900"
								: customer.loyalty_tier === "silver"
									? "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800"
									: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900"
						}`}
					>
						<Gift className="h-4 w-4" />
						{customer.loyalty_tier || "Bronze"} Member
					</div>
				</div>
			</div>

			{/* KPI Row */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between font-medium text-indigo-800 text-sm">
							Lifetime Value
							<TrendingUp className="h-4 w-4 text-indigo-500 opacity-80" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-indigo-950">
							₹
							{Number.parseFloat(customer.lifetime_value || "0").toLocaleString(
								"en-IN",
							)}
						</div>
						<p className="mt-1 text-indigo-600/80 text-xs">
							Total revenue generated
						</p>
					</CardContent>
				</Card>

				<Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between font-medium text-emerald-800 text-sm">
							Store Credit
							<Wallet className="h-4 w-4 text-emerald-500 opacity-80" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-emerald-950">
							₹
							{Number.parseFloat(customer.store_credit || "0").toLocaleString(
								"en-IN",
							)}
						</div>
						<p className="mt-1 text-emerald-600/80 text-xs">
							Available balance
						</p>
					</CardContent>
				</Card>

				<Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between font-medium text-orange-800 text-sm">
							Loyalty Points
							<HandCoins className="h-4 w-4 text-orange-500 opacity-80" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-orange-950">
							{customer.loyalty_points?.toLocaleString("en-IN") || 0} pts
						</div>
						<p className="mt-1 text-orange-600/80 text-xs">
							Redeemable rewards
						</p>
					</CardContent>
				</Card>

				<Card className="shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between font-medium text-muted-foreground text-sm">
							Credit Limit
							<Landmark className="h-4 w-4 text-slate-400" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							₹
							{Number.parseFloat(customer.credit_limit || "0").toLocaleString(
								"en-IN",
							)}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">Approved limit</p>
					</CardContent>
				</Card>

				<Card className="shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between font-medium text-muted-foreground text-sm">
							Credit Used
							<IndianRupee className="h-4 w-4 text-slate-400" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-amber-700">
							₹
							{Number.parseFloat(customer.credit_used || "0").toLocaleString(
								"en-IN",
							)}
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Outstanding dues
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
				{/* Left Sidebar: Profile Details */}
				<Card className="h-fit shadow-sm lg:col-span-1">
					<CardHeader className="border-b bg-muted/20 pb-4">
						<CardTitle className="text-lg">Customer Profile</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5 pt-6">
						<div className="flex items-start gap-3">
							<Mail className="mt-1 h-4 w-4 text-primary" />
							<div>
								<p className="font-medium text-sm leading-none">
									Email Address
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{customer.email}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<Phone className="mt-1 h-4 w-4 text-primary" />
							<div>
								<p className="font-medium text-sm leading-none">Phone Number</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{customer.phone || "Not provided"}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<MapPin className="mt-1 h-4 w-4 text-primary" />
							<div>
								<p className="font-medium text-sm leading-none">
									Billing Address
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{customer.address || "Not provided"}
								</p>
							</div>
						</div>
						{customer.gst_number && (
							<div className="flex items-start gap-3">
								<ShieldCheck className="mt-1 h-4 w-4 text-primary" />
								<div>
									<p className="font-medium text-sm leading-none">GST Number</p>
									<p className="mt-1 font-mono text-muted-foreground text-sm">
										{customer.gst_number}
									</p>
								</div>
							</div>
						)}
						<div className="flex items-start gap-3">
							<Activity className="mt-1 h-4 w-4 text-primary" />
							<div>
								<p className="font-medium text-sm leading-none">
									Marketing Opt-in
								</p>
								<Badge
									variant={customer.marketing_opt_in ? "default" : "secondary"}
									className="mt-1"
								>
									{customer.marketing_opt_in ? "Subscribed" : "Opted Out"}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Main Content Tabs */}
				<div className="lg:col-span-3">
					<Tabs defaultValue="ledger" className="w-full">
						<TabsList className="h-12 w-full justify-start rounded-none border-b bg-transparent p-0">
							<TabsTrigger
								value="ledger"
								className="h-full rounded-none px-6 font-medium data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none"
							>
								Transactions & Ledger
							</TabsTrigger>
							<TabsTrigger
								value="orders"
								className="h-full rounded-none px-6 font-medium data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none"
							>
								Recent Orders
							</TabsTrigger>
						</TabsList>

						<TabsContent value="ledger" className="m-0 space-y-6 pt-6">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold text-lg">Ledger History</h3>
									<p className="text-muted-foreground text-sm">
										Trace of all credit and points adjustments.
									</p>
								</div>
								<div className="flex gap-2">
									<Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
										<DialogTrigger asChild>
											<Button
												onClick={() => setLedgerType("credit")}
												variant="default"
												className="gap-2"
											>
												<Wallet className="h-4 w-4" /> Adjust Credit
											</Button>
										</DialogTrigger>
										<DialogTrigger asChild>
											<Button
												onClick={() => setLedgerType("points")}
												variant="outline"
												className="gap-2"
											>
												<Gift className="h-4 w-4" /> Adjust Points
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>
													Adjust{" "}
													{ledgerType === "credit"
														? "Store Credit"
														: "Loyalty Points"}
												</DialogTitle>
											</DialogHeader>
											<div className="grid gap-4 py-4">
												<div className="space-y-2">
													<Label>Amount</Label>
													<Input
														type="number"
														value={ledgerAmount}
														onChange={(e) => setLedgerAmount(e.target.value)}
														placeholder="e.g. 500 (use -500 to deduct)"
													/>
													<p className="text-muted-foreground text-xs">
														Enter a positive number to add, or negative to
														subtract.
													</p>
												</div>
												<div className="space-y-2">
													<Label>Reason for adjustment</Label>
													<Input
														value={ledgerReason}
														onChange={(e) => setLedgerReason(e.target.value)}
														placeholder="e.g. Refund, Promotional Bonus, Manual Deduction"
													/>
												</div>
												<Button
													onClick={handleAdjust}
													disabled={adjustLedger.isPending}
													className="mt-2 w-full"
												>
													{adjustLedger.isPending
														? "Processing..."
														: "Confirm Adjustment"}
												</Button>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</div>

							<Card className="border-muted shadow-sm">
								<DataTable data={ledger || []} columns={ledgerColumns} />
							</Card>
						</TabsContent>

						<TabsContent value="orders" className="m-0 space-y-6 pt-6">
							<div>
								<h3 className="font-semibold text-lg">Recent Purchases</h3>
								<p className="text-muted-foreground text-sm">
									Latest orders placed by this customer.
								</p>
							</div>
							<Card className="border-muted shadow-sm">
								<DataTable
									data={customer.orders || []}
									columns={orderColumns}
								/>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
