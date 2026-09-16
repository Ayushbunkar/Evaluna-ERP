"use client";

import { format } from "date-fns";
import {
	ArrowLeft,
	Check,
	Copy,
	Gift,
	KeyRound,
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
	DialogFooter,
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

	// Customer Portal Provisioning State
	const [provisionOpen, setProvisionOpen] = useState(false);
	const [provisionEmail, setProvisionEmail] = useState("");
	const [provisionResult, setProvisionResult] = useState<{
		email: string;
		linked: boolean;
		temporaryPassword: string | null;
	} | null>(null);
	const [hasCopied, setHasCopied] = useState(false);

	const provisionMutation = trpc.customers.provisionLogin.useMutation({
		onSuccess: (res) => {
			utils.customers.getById.invalidate();
			setProvisionResult(res);
			toast.success(
				res.linked
					? "Customer portal account linked"
					: "Customer portal login created successfully",
			);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create portal account");
		},
	});

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
					onClick={() => router.push("/sales/customers")}
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
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setProvisionEmail(customer.email || "");
							setProvisionResult(null);
							setHasCopied(false);
							setProvisionOpen(true);
						}}
						className="gap-1.5"
					>
						<KeyRound className="h-4 w-4 text-primary" />
						Portal Login
					</Button>
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
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Profile Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span>{customer.email || <span className="text-muted-foreground italic">No email</span>}</span>
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
						<div className="pt-2">
							<Button
								variant="secondary"
								size="sm"
								className="w-full gap-2 text-xs"
								onClick={() => {
									setProvisionEmail(customer.email || "");
									setProvisionResult(null);
									setHasCopied(false);
									setProvisionOpen(true);
								}}
							>
								<KeyRound className="h-3.5 w-3.5" />
								{customer.email ? "Manage Portal Account" : "Create Portal Account"}
							</Button>
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

			{/* Customer Portal Account Modal */}
			<Dialog
				open={provisionOpen}
				onOpenChange={(open) => {
					setProvisionOpen(open);
					if (!open) {
						setProvisionResult(null);
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<KeyRound className="h-5 w-5 text-primary" />
							Customer Portal Access
						</DialogTitle>
					</DialogHeader>

					{provisionResult ? (
						<div className="space-y-4 py-2">
							<div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm">
								<p className="font-semibold text-green-700 dark:text-green-400">
									{provisionResult.linked
										? "Account linked to Customer Portal!"
										: "Customer Portal Account created successfully!"}
								</p>
								<p className="text-muted-foreground mt-1 text-xs">
									Guide the customer to sign in at{" "}
									<span className="font-mono font-medium text-foreground">/login</span> with these details:
								</p>
							</div>

							<div className="space-y-3 rounded-md bg-muted/60 p-4 font-mono text-sm border">
								<div>
									<span className="text-xs text-muted-foreground block">Email:</span>
									<span className="font-medium text-foreground">{provisionResult.email}</span>
								</div>
								{provisionResult.temporaryPassword ? (
									<div>
										<span className="text-xs text-muted-foreground block">Temporary Password:</span>
										<span className="font-semibold text-primary select-all">
											{provisionResult.temporaryPassword}
										</span>
									</div>
								) : (
									<div>
										<span className="text-xs text-muted-foreground block">Password:</span>
										<span className="italic text-muted-foreground text-xs">
											Existing password maintained. Customer can sign in directly.
										</span>
									</div>
								)}
							</div>

							<div className="flex justify-between items-center gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const text = provisionResult.temporaryPassword
											? `Evaluna Customer Portal Login:\nEmail: ${provisionResult.email}\nTemporary Password: ${provisionResult.temporaryPassword}\nLogin at: /login`
											: `Evaluna Customer Portal Login:\nEmail: ${provisionResult.email}\nLogin at: /login`;
										navigator.clipboard.writeText(text);
										setHasCopied(true);
										toast.success("Copied credentials to clipboard!");
										setTimeout(() => setHasCopied(false), 2000);
									}}
								>
									{hasCopied ? (
										<>
											<Check className="mr-2 h-4 w-4 text-green-500" />
											Copied!
										</>
									) : (
										<>
											<Copy className="mr-2 h-4 w-4" />
											Copy Credentials
										</>
									)}
								</Button>
								<Button
									size="sm"
									onClick={() => {
										setProvisionOpen(false);
										setProvisionResult(null);
									}}
								>
									Done
								</Button>
							</div>
						</div>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								const emailToUse = provisionEmail.trim() || customer.email;
								if (!emailToUse) {
									toast.error("Please enter a valid email address");
									return;
								}
								provisionMutation.mutate({
									id: customerId,
									email: emailToUse,
								});
							}}
							className="space-y-4 py-2"
						>
							<p className="text-sm text-muted-foreground">
								Set up customer self-service access for <strong>{customer.name}</strong>.
								They can check their orders, download invoices, and view loyalty balance.
							</p>

							<div className="space-y-2">
								<Label htmlFor="cust-portal-email">Customer Email Address</Label>
								<Input
									id="cust-portal-email"
									type="email"
									value={provisionEmail}
									onChange={(e) => setProvisionEmail(e.target.value)}
									placeholder="customer@example.com"
									required
									autoFocus
								/>
								{!customer.email && (
									<p className="text-xs text-amber-600 dark:text-amber-400">
										This customer has no email yet. Providing an email will save it to their profile and generate their login.
									</p>
								)}
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="secondary"
									onClick={() => setProvisionOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={provisionMutation.isPending || !provisionEmail.trim()}
								>
									{provisionMutation.isPending ? "Generating..." : "Generate Portal Login"}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
