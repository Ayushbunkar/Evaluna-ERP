"use client";

import { format } from "date-fns";
import {
	ArrowLeft,
	Building2,
	Mail,
	MapPin,
	Phone,
	Truck,
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

export default function SupplierProfilePage() {
	const { id } = useParams();
	const router = useRouter();
	const supplierId = Number.parseInt(id as string, 10);

	const { data, isLoading } = trpc.suppliers.getById.useQuery({
		id: supplierId,
	});
	const utils = trpc.useUtils();

	const [paymentOpen, setPaymentOpen] = useState(false);
	const [paymentAmount, setPaymentAmount] = useState("");
	const [paymentDesc, setPaymentDesc] = useState("");

	const paySupplier = trpc.suppliers.paySupplier.useMutation({
		onSuccess: () => {
			toast.success("Payment recorded");
			setPaymentOpen(false);
			setPaymentAmount("");
			setPaymentDesc("");
			utils.suppliers.getById.invalidate();
		},
	});

	if (isLoading) return <div className="p-8">Loading supplier profile...</div>;
	if (!data?.supplier) return <div className="p-8">Supplier not found</div>;

	const { supplier, ledger, purchaseHistory } = data;

	const handlePay = () => {
		if (!paymentAmount || Number.isNaN(Number.parseFloat(paymentAmount)))
			return toast.error("Valid amount required");

		paySupplier.mutate({
			supplier_id: supplierId,
			amount: Number.parseFloat(paymentAmount),
			description: paymentDesc || "Payment to supplier",
		});
	};

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push("/admin/suppliers/list")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-3xl">{supplier.name}</h1>
					<p className="text-muted-foreground">
						{supplier.supplier_code || "No ID"} • Added{" "}
						{format(new Date(supplier.created_at || new Date()), "PP")}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{/* Left Sidebar */}
				<Card className="h-fit md:col-span-1">
					<CardHeader>
						<CardTitle>Contact & Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span>{supplier.email || "No email"}</span>
						</div>
						<div className="flex items-center gap-3">
							<Phone className="h-4 w-4 text-muted-foreground" />
							<span>{supplier.phone || "No phone"}</span>
						</div>
						<div className="flex items-center gap-3">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span>{supplier.address || "No address"}</span>
						</div>
						<div className="flex items-center gap-3">
							<Building2 className="h-4 w-4 text-muted-foreground" />
							<span>GST: {supplier.gst_number || "N/A"}</span>
						</div>
						<div className="flex items-center gap-3">
							<Truck className="h-4 w-4 text-muted-foreground" />
							<span className="capitalize">
								{supplier.supplier_category} Supplier
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Main Content Tabs */}
				<div className="md:col-span-2">
					<Tabs defaultValue="ledger" className="w-full">
						<TabsList className="w-full justify-start rounded-none border-b bg-transparent">
							<TabsTrigger
								value="ledger"
								className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2"
							>
								Ledger & Payments
							</TabsTrigger>
							<TabsTrigger
								value="purchases"
								className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2"
							>
								Purchase History
							</TabsTrigger>
						</TabsList>

						<TabsContent value="ledger" className="space-y-4 pt-4">
							<div className="grid grid-cols-1 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="flex justify-between font-medium text-sm">
											Outstanding Balance
											<Wallet className="h-4 w-4 text-red-500" />
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="font-bold text-3xl text-red-600">
											₹{supplier.outstanding_balance || "0.00"}
										</div>
									</CardContent>
								</Card>
							</div>

							<div className="flex justify-end gap-2">
								<Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
									<DialogTrigger asChild>
										<Button>Record Payment</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Pay Supplier</DialogTitle>
										</DialogHeader>
										<div className="grid gap-4 py-4">
											<div>
												<Label>Amount (₹)</Label>
												<Input
													type="number"
													value={paymentAmount}
													onChange={(e) => setPaymentAmount(e.target.value)}
													placeholder="0.00"
												/>
											</div>
											<div>
												<Label>Description / Reference</Label>
												<Input
													value={paymentDesc}
													onChange={(e) => setPaymentDesc(e.target.value)}
													placeholder="e.g. Check #1234, Bank Transfer"
												/>
											</div>
											<Button
												onClick={handlePay}
												disabled={paySupplier.isPending}
											>
												Submit Payment
											</Button>
										</div>
									</DialogContent>
								</Dialog>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Payment History</CardTitle>
									<CardDescription>
										Log of all payments made to this supplier.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<table className="w-full border-collapse text-left text-sm">
										<thead>
											<tr className="border-b">
												<th className="py-2">Date</th>
												<th>Reference</th>
												<th className="text-right">Amount Paid</th>
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
													<td>{entry.description}</td>
													<td className="text-right font-medium text-green-600">
														-₹{entry.amount}
													</td>
												</tr>
											))}
											{ledger?.length === 0 && (
												<tr>
													<td
														colSpan={3}
														className="py-4 text-center text-muted-foreground"
													>
														No payments recorded
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="purchases" className="space-y-4 pt-4">
							<Card>
								<CardHeader>
									<CardTitle>Purchase GRNs</CardTitle>
								</CardHeader>
								<CardContent>
									<table className="w-full border-collapse text-left text-sm">
										<thead>
											<tr className="border-b">
												<th className="py-2">Date</th>
												<th>GRN #</th>
												<th>Status</th>
												<th className="text-right">Total</th>
											</tr>
										</thead>
										<tbody>
											{purchaseHistory?.map((order: any) => (
												<tr
													key={order.id}
													className="border-b last:border-0 hover:bg-muted/50"
												>
													<td className="py-2">
														{format(new Date(order.created_at), "PP")}
													</td>
													<td className="font-medium text-primary">
														{order.grn_number || `PO-${order.id}`}
													</td>
													<td className="capitalize">{order.status}</td>
													<td className="text-right font-medium">
														₹{order.total_amount}
													</td>
												</tr>
											))}
											{purchaseHistory?.length === 0 && (
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
