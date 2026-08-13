"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Separator } from "@evaluna/ui/components/separator";
import {
	ArrowLeftIcon,
	MapPinIcon,
	PackageCheckIcon,
	PhoneIcon,
	Loader2Icon,
	UserIcon,
	IndianRupeeIcon,
	MinusIcon,
	PlusIcon,
	CheckCircle2Icon,
	RotateCcwIcon,
	FileTextIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@evaluna/ui/components/tabs";

type OrderItem = {
	id: number;
	name: string;
	qty: number;
	price: number;
};

type Stop = {
	id: number;
	status: string;
	rawStatus: string;
	time: string;
	address: string;
	customerName: string;
	phone: string | null;
	orderId: number | null;
	amountToCollect: number;
	packages: number;
	orderItems: OrderItem[];
};

function OrderDetailModal({ stop, open, onClose }: { stop: Stop; open: boolean; onClose: () => void }) {
	const router = useRouter();
	// Editable quantities (for returns/adjustments at door)
	const [quantities, setQuantities] = useState<Record<number, number>>(
		Object.fromEntries(stop.orderItems.map((item) => [item.id, item.qty]))
	);

	const adjustQty = (id: number, delta: number) => {
		setQuantities((prev) => ({
			...prev,
			[id]: Math.max(0, Math.min(stop.orderItems.find((i) => i.id === id)?.qty ?? 0, prev[id] + delta)),
		}));
	};

	const adjustedItems = useMemo(
		() =>
			stop.orderItems.map((item) => ({
				...item,
				deliveredQty: quantities[item.id] ?? item.qty,
				returnedQty: item.qty - (quantities[item.id] ?? item.qty),
				subtotal: (quantities[item.id] ?? item.qty) * item.price,
			})),
		[quantities, stop.orderItems]
	);

	const originalTotal = stop.amountToCollect;
	const adjustedTotal = adjustedItems.reduce((acc, i) => acc + i.subtotal, 0);
	const returnedTotal = originalTotal - adjustedTotal;
	const hasReturns = adjustedItems.some((i) => i.returnedQty > 0);

	const handleProceed = () => {
		onClose();
		toast.success(`Bill finalised for ${stop.customerName}. Proceed to OTP & cash collection.`);
		const params = new URLSearchParams({
			phone: stop.phone ?? "",
			orderId: String(stop.orderId ?? ""),
			customerName: stop.customerName,
		});
		router.push(`/driver/otp?${params.toString()}`);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
				<DialogHeader className="sticky top-0 z-10 bg-background px-6 pt-6 pb-4 border-b">
					<DialogTitle className="text-xl font-bold">Order Details</DialogTitle>
					<div className="flex items-center gap-2 mt-1">
						<Badge variant={stop.status === "completed" ? "default" : stop.status === "next" ? "secondary" : "outline"}>
							{stop.status === "completed" ? "Delivered" : stop.status === "next" ? "Next Drop" : "Pending"}
						</Badge>
						{stop.orderId && <span className="text-xs text-muted-foreground">Order #{stop.orderId}</span>}
					</div>
				</DialogHeader>

				<Tabs defaultValue="details" className="flex-1">
					<TabsList className="w-full rounded-none border-b px-6">
						<TabsTrigger value="details" className="flex-1">Customer</TabsTrigger>
						<TabsTrigger value="items" className="flex-1">Items & Returns</TabsTrigger>
						<TabsTrigger value="bill" className="flex-1">Final Bill</TabsTrigger>
					</TabsList>

					{/* ── Tab 1: Customer Details ── */}
					<TabsContent value="details" className="p-6 space-y-4">
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<UserIcon className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="font-bold text-lg leading-tight">{stop.customerName}</p>
								<p className="text-sm text-muted-foreground">{stop.phone ?? "No phone"}</p>
							</div>
						</div>
						<Separator />
						<div className="space-y-3">
							<div className="flex gap-3 items-start">
								<MapPinIcon className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Delivery Address</p>
									<p className="font-medium">{stop.address}</p>
								</div>
							</div>
							<div className="flex gap-3 items-start">
								<PackageCheckIcon className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Packages</p>
									<p className="font-medium">{stop.packages} items in this order</p>
								</div>
							</div>
							<div className="flex gap-3 items-start">
								<IndianRupeeIcon className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Amount to Collect</p>
									<p className="font-bold text-lg text-primary">₹{originalTotal.toLocaleString("en-IN")}</p>
									<p className="text-xs text-muted-foreground">Cash on Delivery</p>
								</div>
							</div>
						</div>
						{stop.phone && (
							<a href={`tel:${stop.phone}`} className="block">
								<Button className="w-full mt-2 h-12 gap-2">
									<PhoneIcon className="h-4 w-4" /> Call {stop.customerName}
								</Button>
							</a>
						)}
					</TabsContent>

					{/* ── Tab 2: Items & Returns ── */}
					<TabsContent value="items" className="p-6 space-y-4">
						<p className="text-sm text-muted-foreground">
							Adjust quantities if the customer is returning any items at the door. Reduce the number to mark it as a return.
						</p>
						{stop.orderItems.length === 0 && (
							<div className="text-center py-8 text-muted-foreground text-sm">No item-level details available.</div>
						)}
						{adjustedItems.map((item) => (
							<Card key={item.id} className={`overflow-hidden ${item.returnedQty > 0 ? "border-orange-500/30 bg-orange-500/5" : ""}`}>
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-3">
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{item.name}</p>
											<p className="text-sm text-muted-foreground">₹{item.price.toLocaleString("en-IN")} each</p>
										</div>
										{item.returnedQty > 0 && (
											<Badge variant="outline" className="ml-2 shrink-0 text-orange-500 border-orange-500/50">
												{item.returnedQty} returned
											</Badge>
										)}
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="icon"
												className="h-9 w-9 rounded-full"
												onClick={() => adjustQty(item.id, -1)}
												disabled={quantities[item.id] === 0}
											>
												<MinusIcon className="h-4 w-4" />
											</Button>
											<span className="w-10 text-center font-bold text-lg">{quantities[item.id]}</span>
											<Button
												variant="outline"
												size="icon"
												className="h-9 w-9 rounded-full"
												onClick={() => adjustQty(item.id, +1)}
												disabled={quantities[item.id] >= item.qty}
											>
												<PlusIcon className="h-4 w-4" />
											</Button>
										</div>
										<p className="font-semibold text-right">
											₹{item.subtotal.toLocaleString("en-IN")}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</TabsContent>

					{/* ── Tab 3: Final Bill ── */}
					<TabsContent value="bill" className="p-6 space-y-4">
						<div className="rounded-xl border bg-muted/30 p-4 space-y-3">
							<h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Bill Summary</h3>
							{adjustedItems.map((item) => (
								<div key={item.id} className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										{item.name} × {item.deliveredQty}
										{item.returnedQty > 0 && (
											<span className="text-orange-500 ml-1">(-{item.returnedQty} returned)</span>
										)}
									</span>
									<span className="font-medium">₹{item.subtotal.toLocaleString("en-IN")}</span>
								</div>
							))}
							<Separator />
							{hasReturns && (
								<div className="flex justify-between text-sm">
									<span className="text-orange-500 flex items-center gap-1">
										<RotateCcwIcon className="h-3.5 w-3.5" /> Return Deduction
									</span>
									<span className="font-medium text-orange-500">-₹{returnedTotal.toLocaleString("en-IN")}</span>
								</div>
							)}
							<div className="flex justify-between text-base font-bold pt-1">
								<span>Total to Collect</span>
								<span className="text-primary">₹{adjustedTotal.toLocaleString("en-IN")}</span>
							</div>
						</div>

						{adjustedTotal === 0 ? (
							<div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
								<CheckCircle2Icon className="h-5 w-5 text-green-500" />
								<p className="text-sm font-medium text-green-600">No payment required — full return.</p>
							</div>
						) : (
							<div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
								<IndianRupeeIcon className="h-5 w-5 text-primary" />
								<p className="text-sm font-medium text-primary">
									Collect <span className="font-bold">₹{adjustedTotal.toLocaleString("en-IN")}</span> from customer
								</p>
							</div>
						)}

						<Button className="w-full h-14 rounded-xl text-lg font-semibold gap-2 shadow-lg shadow-primary/20" onClick={handleProceed}>
							<FileTextIcon className="h-5 w-5" />
							{adjustedTotal === 0 ? "Confirm Full Return" : "Verify OTP & Collect Payment"}
						</Button>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

export default function AssignedOrdersPage() {
	const t = useTranslations("nav");
	const { data, isLoading } = trpc.driver.getMobileDashboard.useQuery({});
	const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

	const stops: Stop[] = (data?.routeStops ?? []) as Stop[];

	return (
		<div className="flex min-h-screen flex-col bg-muted/30 pb-20">
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 shadow-sm">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/driver">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">{t("assignedOrders")}</h1>
				{data && (
					<Badge variant="secondary" className="ml-auto">
						{stops.filter((s) => s.status !== "completed").length} remaining
					</Badge>
				)}
			</header>

			<main className="flex-1 space-y-4 p-4">
				{isLoading && (
					<div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
						<Loader2Icon className="h-10 w-10 animate-spin text-primary" />
						<p className="text-sm">Loading your assigned orders…</p>
					</div>
				)}

				{!isLoading && stops.length === 0 && (
					<div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
						<PackageCheckIcon className="h-16 w-16 text-muted-foreground/40" />
						<div>
							<p className="font-semibold text-lg">No Assigned Orders</p>
							<p className="text-sm text-muted-foreground">Your trip has no stops yet.</p>
						</div>
						<Button variant="outline" asChild>
							<Link href="/driver">← Go to Dashboard</Link>
						</Button>
					</div>
				)}

				{stops.map((stop) => (
					<Card key={stop.id} className={`overflow-hidden transition-all ${stop.status === "next" ? "border-primary/50 shadow-md shadow-primary/10" : ""}`}>
						<CardHeader className="bg-muted/50 pb-3 pt-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base font-bold">
									{stop.orderId ? `ORD-${stop.orderId}` : `STOP-${stop.id}`}
								</CardTitle>
								<Badge
									variant={
										stop.status === "completed"
											? "default"
											: stop.status === "next"
												? "secondary"
												: "outline"
									}
								>
									{stop.status === "completed" ? "Delivered" : stop.status === "next" ? "Next Drop" : "Pending"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="pt-4">
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
									<div>
										<p className="font-medium">{stop.customerName}</p>
										<p className="text-sm text-muted-foreground">{stop.address}</p>
									</div>
								</div>

								<div className="flex items-center justify-between border-t pt-3">
									<div className="flex items-center gap-2 text-sm font-medium">
										<PackageCheckIcon className="h-4 w-4 text-muted-foreground" />
										{stop.packages > 0 ? `${stop.packages} pkg` : "No items"}
									</div>
									{stop.amountToCollect > 0 && (
										<div className="flex items-center gap-1 text-sm font-bold text-primary">
											<IndianRupeeIcon className="h-4 w-4" />
											{stop.amountToCollect.toLocaleString("en-IN")} COD
										</div>
									)}
								</div>

								<div className="flex gap-2 pt-1">
									{stop.phone ? (
										<a href={`tel:${stop.phone}`} className="w-full">
											<Button className="w-full" variant="outline">
												<PhoneIcon className="mr-2 h-4 w-4" /> Call
											</Button>
										</a>
									) : (
										<Button className="w-full" variant="outline" disabled>
											<PhoneIcon className="mr-2 h-4 w-4" /> No Phone
										</Button>
									)}
									<Button
										className="w-full"
										onClick={() => setSelectedStop(stop)}
									>
										View Details
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</main>

			{selectedStop && (
				<OrderDetailModal
					stop={selectedStop}
					open={!!selectedStop}
					onClose={() => setSelectedStop(null)}
				/>
			)}
		</div>
	);
}
