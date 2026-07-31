"use client";

import { format } from "date-fns";
import {
	ArrowLeft,
	Gift,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";

export default function CustomerProfilePage() {
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
			toast.success("Ledger adjusted");
			setLedgerOpen(false);
			setLedgerAmount("");
			setLedgerReason("");
			utils.customers.getById.invalidate();
		},
	});

	if (isLoading) return <div className="p-8">Loading customer profile...</div>;
	if (!data?.customer) return <div className="p-8">Customer not found</div>;

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

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/customers")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl">{customer.name}</h1>
					<p className="text-muted-foreground">
						{customer.customer_code || "No ID"} • Joined{" "}
						{format(new Date(customer.created_at || new Date()), "PP")}
					</p>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<span
						className={`rounded-full px-3 py-1 font-semibold text-sm capitalize ${customer.loyalty_tier === "gold" ? "bg-yellow-100 text-yellow-800" : customer.loyalty_tier === "silver" ? "bg-gray-200 text-gray-800" : "bg-orange-100 text-orange-800"}`}
					>
						{customer.loyalty_tier || "Bronze"} Tier
					</span>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{/* Left Sidebar */}
				<Card className="h-fit md:col-span-1">
					<CardHeader>
						<CardTitle>Profile Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span>{customer.email}</span>
						</div>
						<div className="flex items-center gap-3">
							<Phone className="h-4 w-4 text-muted-foreground" />
							<span>{customer.phone || "No phone"}</span>
						</div>
						<div className="flex items-center gap-3">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span>{customer.address || "No address"}</span>
						</div>
						<div className="flex items-center gap-3">
							<ShieldCheck className="h-4 w-4 text-muted-foreground" />
							<span>
								Marketing:{" "}
								{customer.marketing_opt_in ? "Opted In" : "Opted Out"}
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Main Content Tabs */}
				<div className="md:col-span-2">
					<Tabs defaultValue="wallet" className="w-full">
						<TabsList className="w-full justify-start rounded-none border-b bg-transparent">
							<TabsTrigger
								value="wallet"
								className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2"
							>
								Wallet & Loyalty
							</TabsTrigger>
							<TabsTrigger
								value="orders"
								className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2"
							>
								Purchase History
							</TabsTrigger>
						</TabsList>

						<TabsContent value="wallet" className="space-y-4 pt-4">
							<div className="grid grid-cols-2 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="flex justify-between font-medium text-sm">
											Store Credit
											<Wallet className="h-4 w-4 text-blue-500" />
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="font-bold text-2xl">
											₹{customer.store_credit || "0.00"}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="flex justify-between font-medium text-sm">
											Loyalty Points
											<Gift className="h-4 w-4 text-orange-500" />
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="font-bold text-2xl">
											{customer.loyalty_points || 0} pts
										</div>
									</CardContent>
								</Card>
							</div>

							<div className="flex justify-end gap-2">
								<Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
									<DialogTrigger asChild>
										<Button onClick={() => setLedgerType("credit")}>
											Adjust Credit
										</Button>
									</DialogTrigger>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											onClick={() => setLedgerType("points")}
										>
											Adjust Points
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
											<div>
												<Label>Amount (Use negative to deduct)</Label>
												<Input
													type="number"
													value={ledgerAmount}
													onChange={(e) => setLedgerAmount(e.target.value)}
													placeholder="0"
												/>
											</div>
											<div>
												<Label>Reason</Label>
												<Input
													value={ledgerReason}
													onChange={(e) => setLedgerReason(e.target.value)}
													placeholder="e.g. Refund, Bonus"
												/>
											</div>
											<Button
												onClick={handleAdjust}
												disabled={adjustLedger.isPending}
											>
												Save
											</Button>
										</div>
									</DialogContent>
								</Dialog>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Ledger History</CardTitle>
									<CardDescription>
										Trace of all credit and points adjustments.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<table className="w-full border-collapse text-left text-sm">
										<thead>
											<tr className="border-b">
												<th className="py-2">Date</th>
												<th>Type</th>
												<th>Reason</th>
												<th className="text-right">Amount</th>
											</tr>
										</thead>
										<tbody>
											{ledger?.map((entry: any) => (
												<tr
													key={entry.id}
													className="border-b last:border-0 hover:bg-muted/50"
												>
													<td className="py-2">
														{format(new Date(entry.created_at), "PP p")}
													</td>
													<td className="capitalize">{entry.type}</td>
													<td>{entry.reason}</td>
													<td
														className={`text-right font-medium ${Number.parseFloat(entry.amount) > 0 ? "text-green-600" : "text-red-600"}`}
													>
														{Number.parseFloat(entry.amount) > 0 ? "+" : ""}
														{entry.amount}
													</td>
												</tr>
											))}
											{ledger?.length === 0 && (
												<tr>
													<td
														colSpan={4}
														className="py-4 text-center text-muted-foreground"
													>
														No ledger entries
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="orders" className="space-y-4 pt-4">
							<Card>
								<CardHeader>
									<CardTitle>Purchase History</CardTitle>
								</CardHeader>
								<CardContent>
									<table className="w-full border-collapse text-left text-sm">
										<thead>
											<tr className="border-b">
												<th className="py-2">Date</th>
												<th>Order ID</th>
												<th>Status</th>
												<th className="text-right">Total</th>
											</tr>
										</thead>
										<tbody>
											{customer.orders?.map((order: any) => (
												<tr
													key={order.id}
													className="border-b last:border-0 hover:bg-muted/50"
												>
													<td className="py-2">
														{format(new Date(order.created_at), "PP")}
													</td>
													<td>#{order.id}</td>
													<td className="capitalize">{order.status}</td>
													<td className="text-right font-medium">
														₹{order.total_amount}
													</td>
												</tr>
											))}
											{customer.orders?.length === 0 && (
												<tr>
													<td
														colSpan={4}
														className="py-4 text-center text-muted-foreground"
													>
														No purchases yet
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
