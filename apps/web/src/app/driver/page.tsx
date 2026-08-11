"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { DataTable } from "@evaluna/ui/components/data-table";
import { DatePickerWithRange } from "@evaluna/ui/components/date-range-picker";
import { Input } from "@evaluna/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@evaluna/ui/components/dialog";
import {
	AlertTriangleIcon,
	BanknoteIcon,
	BatteryIcon,
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
	ListIcon,
	MapPinIcon,
	MoreVerticalIcon,
	NavigationIcon,
	PackageCheckIcon,
	PhoneIcon,
	PrinterIcon,
	ReceiptIcon,
	RefreshCwIcon,
	SignalIcon,
	StarIcon,
	Undo2Icon,
	UploadIcon,
	UserIcon,
	WifiOffIcon,
	XCircleIcon,
} from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// Simple media query hook replacement
function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(query);
		if (media.matches !== matches) {
			setMatches(media.matches);
		}
		const listener = () => setMatches(media.matches);
		media.addListener(listener);
		return () => media.removeListener(listener);
	}, [matches, query]);

	return matches;
}

// Simple currency formatter
function formatCurrency(amount: number, locale: string = "en-IN"): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

// Type definitions
interface DeliveryData {
	orderId: string;
	customerName: string;
	address: string;
	landmark: string;
	contactName: string;
	contactPhone: string;
	paymentType: string;
	amountToCollect: number;
	packages: number;
	estimatedDuration: string;
	eta: string;
	items: Array<{
		name: string;
		quantity: number;
		returnQuantity: number;
		reason: string;
	}>;
}

interface DriverDashboardData {
	driverName: string;
	status: string;
	batteryLevel: number | null;
	currentLocation: string | null;
	nextDelivery: DeliveryData | null;
	delivered: number;
	assignedOrders: number;
	codCollected: number;
	successfulCollections: number;
	returnsProcessed: number;
	returnRate: number;
	customerRating: number;
	positiveReviews: number;
	deliveryHistory: Array<any>;
	returnHistory: Array<any>;
	notifications: Array<{ message: string; time: string }>;
	vehicleStatus: {
		fuelLevel: string | null;
		odometer: string | null;
		maintenanceDue: boolean;
	} | null;
	routeStops: Array<{
		address: string;
		time: string;
		status: string;
	}>;
}

// Enhanced Mini Map Component with better responsiveness
function EnhancedMiniMap() {
	return (
		<div className="relative h-40 w-full overflow-hidden rounded-t-xl border-border/50 border-b bg-slate-900 md:h-48">
			<div
				className="absolute inset-0 opacity-20"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>

			{/* Route Line */}
			<svg
				className="absolute inset-0 h-full w-full"
				preserveAspectRatio="none"
			>
				<path
					d="M 30 100 Q 100 100, 120 60 T 300 70"
					fill="none"
					stroke="hsl(var(--primary))"
					strokeWidth="4"
					strokeDasharray="8,8"
					className="animate-[dash_1.5s_linear_infinite]"
				/>
			</svg>

			{/* Origin */}
			<div className="absolute top-[100px] left-[30px] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 md:top-[120px] md:left-[40px] md:h-6 md:w-6" />

			{/* Destination */}
			<div className="absolute top-[70px] left-[300px] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-bounce items-center justify-center rounded-full border-2 border-white bg-primary md:top-[80px] md:left-[350px] md:h-10 md:w-10">
				<MapPinIcon className="h-4 w-4 text-white md:h-5 md:w-5" />
			</div>
		</div>
	);
}

// Return Order Form Component
function ReturnOrderForm({ onSubmit, onCancel, deliveryData }: {
	onSubmit: (data: any) => void;
	onCancel: () => void;
	deliveryData: DeliveryData | null;
}) {
	const [returnReason, setReturnReason] = useState("");
	const [condition, setCondition] = useState("good");
	const [notes, setNotes] = useState("");
	const [returnItems, setReturnItems] = useState<Array<{
		name: string;
		quantity: number;
		returnQuantity: number;
		reason: string;
	}>>(deliveryData?.items?.map(item => ({
		...item,
		returnQuantity: 0,
		reason: ""
	})) || []);

	const handleItemChange = (index: number, field: keyof typeof returnItems[0], value: string | number) => {
		const updatedItems = [...returnItems];
		(updatedItems[index][field] as any) = value;
		setReturnItems(updatedItems);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			returnReason,
			condition,
			notes,
			items: returnItems.filter(item => item.returnQuantity > 0)
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<h3 className="text-lg font-semibold">Return Order Details</h3>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Select value={returnReason} onValueChange={setReturnReason} required>
					<SelectTrigger>
						<SelectValue placeholder="Select return reason" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="customer_refused">Customer Refused</SelectItem>
						<SelectItem value="damaged">Damaged Goods</SelectItem>
						<SelectItem value="wrong_item">Wrong Item</SelectItem>
						<SelectItem value="address_issue">Address Issue</SelectItem>
						<SelectItem value="other">Other</SelectItem>
					</SelectContent>
				</Select>

				<Select value={condition} onValueChange={setCondition}>
					<SelectTrigger>
						<SelectValue placeholder="Item condition" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="good">Good</SelectItem>
						<SelectItem value="damaged">Damaged</SelectItem>
						<SelectItem value="opened">Opened</SelectItem>
						<SelectItem value="used">Used</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Input
				placeholder="Additional notes"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>

			<h4 className="font-medium">Return Items</h4>
			<div className="max-h-60 overflow-y-auto rounded-lg border">
				<table className="w-full text-sm">
					<thead className="sticky top-0 bg-muted">
						<tr>
							<th className="p-2 text-left">Item</th>
							<th className="p-2 text-center">Qty</th>
							<th className="p-2 text-center">Return</th>
							<th className="p-2">Reason</th>
						</tr>
					</thead>
					<tbody>
						{returnItems.map((item, index) => (
							<tr key={index} className="border-t">
								<td className="p-2">{item.name}</td>
								<td className="p-2 text-center">{item.quantity}</td>
								<td className="p-2">
									<Input
										type="number"
										min="0"
										max={item.quantity}
										value={item.returnQuantity}
										onChange={(e) => handleItemChange(index, 'returnQuantity', parseInt(e.target.value) || 0)}
										className="w-16 text-center"
									/>
								</td>
								<td className="p-2">
									<Select value={item.reason} onValueChange={(value) => handleItemChange(index, 'reason', value)}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select reason" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="customer_refused">Customer Refused</SelectItem>
											<SelectItem value="damaged">Damaged</SelectItem>
											<SelectItem value="wrong_item">Wrong Item</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectContent>
									</Select>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="flex gap-2 pt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" className="flex-1">
					<UploadIcon className="mr-2 h-4 w-4" />
					Submit Return
				</Button>
			</div>
		</form>
	);
}

// Bill Generation Component
function BillGeneration({ deliveryData, onGenerate }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Generate Delivery Receipt</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">Order ID</p>
						<p className="font-medium">{deliveryData.orderId}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Customer</p>
						<p className="font-medium">{deliveryData.customerName}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Amount</p>
						<p className="font-medium text-green-600">
							{formatCurrency(deliveryData.amount, "en-IN")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Payment Method</p>
						<p className="font-medium">{deliveryData.paymentMethod}</p>
					</div>
				</div>

				<Button onClick={onGenerate} className="w-full">
					<PrinterIcon className="mr-2 h-4 w-4" />
					Generate and Print Receipt
				</Button>

				<Button variant="outline" className="w-full">
					<FileTextIcon className="mr-2 h-4 w-4" />
					Email Receipt to Customer
				</Button>
			</CardContent>
		</Card>
	);
}

export default function EnhancedDriverDashboard() {
	const { activeBranchId } = useBranch();
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const t = useTranslations("nav");

	// State management
	const [activeTab, setActiveTab] = useState("dashboard");
	const [showReturnForm, setShowReturnForm] = useState(false);
	const [showBillGeneration, setShowBillGeneration] = useState(false);
	const [timeRange, setTimeRange] = useState({
		from: new Date(new Date().setDate(new Date().getDate() - 7)),
		to: new Date(),
	});

	// Fetch driver dashboard data
	const { data: mobileData, isLoading: mobileLoading, isError, error, refetch: mobileRefetch } = trpc.driver.getMobileDashboard.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	const isLoading = mobileLoading;
	const data = mobileData;
	const refetch = () => { mobileRefetch(); };

	const updateStatus = trpc.delivery.updateStopStatus.useMutation({
		onSuccess: () => refetch(),
	});

	const createReturnOrder = trpc.delivery.createReturnOrder.useMutation({
		onSuccess: () => {
			refetch();
			setShowReturnForm(false);
		},
	});

	const handleUpdateStatus = (status) => {
		if (data?.nextDelivery?.stop_id) {
			updateStatus.mutate({
				stopId: data.nextDelivery.stop_id,
				status,
				reason: status === "failed" ? "Customer not available" : undefined,
			});
		}
	};

	const handleReturnSubmit = (returnData) => {
		if (data?.nextDelivery?.stop_id) {
			createReturnOrder.mutate({
				stopId: data.nextDelivery.stop_id,
				orderId: data.nextDelivery.order_id,
				...returnData,
			});
		}
	};

	const handleGenerateBill = () => {
		// Navigate to the assigned orders page for billing
		window.location.href = '/driver/assigned';
	};

	if (isLoading) {
		return (
			<div className="flex h-full min-h-[400px] items-center justify-center">
				<div className="h-10 w-10 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center p-8">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
					<span className="font-bold text-xl">!</span>
				</div>
				<div>
					<h2 className="text-xl font-bold text-red-600">Error Loading Dashboard</h2>
					<p className="text-muted-foreground mt-2">{error?.message || "Unknown error occurred"}</p>
				</div>
			</div>
		);
	}

	if (!data?.nextDelivery) {
		return (
			<div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center p-8">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
					<PackageCheckIcon className="h-10 w-10 text-muted-foreground" />
				</div>
				<div>
					<h2 className="text-xl font-bold">No Active Trip</h2>
					<p className="text-muted-foreground mt-2">You have no active delivery trip assigned. Contact your branch admin.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col bg-muted/30">
			{/* Enhanced Header with Desktop Navigation */}
			<div className="sticky top-0 z-50 border-border/50 border-b bg-background shadow-sm">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary md:h-12 md:w-12 md:text-xl">
							{data.driverName.charAt(0)}
						</div>
						<div>
							<h1 className="font-bold leading-none md:text-lg">
								{data.driverName}
							</h1>
							<div className="mt-1 flex items-center gap-1 font-medium text-[10px] text-emerald-500 md:text-sm">
								<div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
								{data.status}
							</div>
						</div>
					</div>

					{isDesktop && (
						<div className="flex items-center gap-2">
							<Button
								variant={activeTab === "dashboard" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("dashboard")}
							>
								Dashboard
							</Button>
							<Button
								variant={activeTab === "deliveries" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("deliveries")}
							>
								Deliveries
							</Button>
							<Button
								variant={activeTab === "returns" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("returns")}
							>
								Returns
							</Button>
							<Button
								variant={activeTab === "reports" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setActiveTab("reports")}
							>
								Reports
							</Button>
						</div>
					)}

					<div className="flex items-center gap-3 text-muted-foreground">
						{data.batteryLevel !== null && (
							<div className="flex items-center gap-1">
								<BatteryIcon className="h-4 w-4" />{" "}
								<span className="font-bold text-[10px] md:text-sm">
									{data.batteryLevel}%
								</span>
							</div>
						)}
						<Button size="icon" variant="ghost" onClick={refetch}>
							<RefreshCwIcon className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Desktop-specific secondary navigation */}
				{isDesktop && (
					<div className="border-t border-border/50 bg-muted/50 px-4 py-2">
						<div className="flex items-center gap-4 text-sm">
							<div className="flex items-center gap-1">
								<ClockIcon className="h-4 w-4" />
								<span>{new Date().toLocaleTimeString()}</span>
							</div>
							<div className="flex items-center gap-1">
								<MapPinIcon className="h-4 w-4" />
								<span>{data.currentLocation || "Loading location..."}</span>
							</div>
							<div className="ml-auto flex items-center gap-2">
								<Button size="sm" variant="outline">
									<FileTextIcon className="mr-2 h-4 w-4" />
									Generate Report
								</Button>
								<Button size="sm" variant="outline">
									<UploadIcon className="mr-2 h-4 w-4" />
									Sync Data
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="flex flex-1 overflow-hidden p-4">
				{/* Main Content Area */}
				<div className="flex flex-1 gap-6 overflow-hidden">
					{/* Left Column - Main Dashboard */}
					<div className={`flex flex-1 flex-col ${isDesktop ? 'w-2/3' : 'w-full'}`}>
						{activeTab === "dashboard" && (
							<>
								{/* Next Delivery Card - Enhanced */}
								{data.nextDelivery && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
									>
										<Card className="overflow-hidden border-primary/30 bg-background shadow-lg">
											<EnhancedMiniMap />
											<CardContent className="relative p-4 pt-5">
												<div className="absolute top-0 right-4 flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-popover px-3 py-1 font-bold text-[10px] text-popover-foreground shadow-md md:text-sm">
													<ClockIcon className="h-3 w-3 md:h-4 md:w-4" />{" "}
													{data.nextDelivery.eta
														? `ETA ${data.nextDelivery.eta}`
														: "En route"}
												</div>

												<div className="mb-3 flex items-start justify-between">
													<div>
														<p className="mb-1 font-bold text-[10px] text-primary uppercase tracking-wider md:text-sm">
															Next Drop-off
														</p>
														<h2 className="font-bold text-xl leading-tight md:text-2xl">
															{data.nextDelivery.customerName}
														</h2>
														<p className="mt-0.5 text-muted-foreground text-xs md:text-sm">
															Order #{data.nextDelivery.orderId}
														</p>
													</div>
													<div className="flex gap-2">
														<a href={`tel:${data.nextDelivery.phone ?? ''}`}>
															<Button
																size="icon"
																variant="outline"
																className="h-10 w-10 shrink-0 rounded-full border-primary/20 bg-primary/5 text-primary"
																disabled={!data.nextDelivery.phone}
															>
																<PhoneIcon className="h-4 w-4" />
															</Button>
														</a>
														<Button
															size="icon"
															variant="outline"
															className="h-10 w-10 shrink-0 rounded-full border-green-500/20 bg-green-500/5 text-green-600"
															onClick={() => setShowBillGeneration(true)}
														>
															<ReceiptIcon className="h-4 w-4" />
														</Button>
													</div>
												</div>

												<div className="mb-4 grid grid-cols-1 gap-2 rounded-lg bg-muted/50 p-3 md:grid-cols-2">
													<div className="flex items-center gap-2">
														<MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
														<div>
															<p className="font-medium text-sm leading-tight">
																{data.nextDelivery.address}
															</p>
															<p className="mt-1 text-muted-foreground text-xs">
																Landmark: {data.nextDelivery.landmark}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2">
														<UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
														<div>
															<p className="font-medium text-sm">
																Contact: {data.nextDelivery.customerName}
															</p>
															<p className="text-muted-foreground text-xs">
																{data.nextDelivery.phone ?? 'No phone'}
															</p>
														</div>
													</div>
												</div>

												<div className="mb-5 grid grid-cols-1 gap-2 md:grid-cols-3">
													<div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 md:col-span-1">
														<BanknoteIcon className="h-5 w-5 text-amber-600" />
														<div>
															<p className="font-bold text-[9px] text-amber-600/80 uppercase">
																Collect {data.nextDelivery.paymentType}
															</p>
															<p className="font-bold text-amber-700 text-sm md:text-base">
																{formatCurrency(
																	data.nextDelivery.amountToCollect,
																	"en-IN"
																)}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 md:col-span-1">
														<PackageCheckIcon className="h-5 w-5 text-blue-600" />
														<div>
															<p className="font-bold text-[9px] text-blue-600/80 uppercase">
																Packages
															</p>
															<p className="font-bold text-blue-700 text-sm md:text-base">
																{data.nextDelivery.packages} Items
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 p-2 md:col-span-1">
														<ClockIcon className="h-5 w-5 text-purple-600" />
														<div>
															<p className="font-bold text-[9px] text-purple-600/80 uppercase">
																Estimated Time
															</p>
															<p className="font-bold text-purple-700 text-sm md:text-base">
																{data.nextDelivery.estimatedDuration}
															</p>
														</div>
													</div>
												</div>

												<div className="flex flex-col gap-2 sm:flex-row">
													<Button className="h-14 flex-1 gap-2 rounded-xl font-bold text-lg shadow-md shadow-primary/20">
														<NavigationIcon className="h-5 w-5" /> Start Navigation
													</Button>
													<Button
														variant="outline"
														className="h-14 gap-2 rounded-xl font-bold text-lg shadow-sm"
														onClick={() => setShowReturnForm(true)}
													>
														<Undo2Icon className="h-5 w-5 text-amber-500" />
														Process Return
													</Button>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								)}

								{/* Action Buttons - Enhanced for Desktop */}
								<div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
									<Button
										variant="outline"
										onClick={() => handleUpdateStatus("arrived")}
										disabled={updateStatus.isPending}
										className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted md:h-24"
									>
										<MapPinIcon className="h-6 w-6 text-primary" />
										<span className="font-bold text-xs">Reached</span>
									</Button>
									<Button
										variant="outline"
										onClick={() => handleUpdateStatus("delivered")}
										disabled={updateStatus.isPending}
										className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted md:h-24"
									>
										<CheckCircle2Icon className="h-6 w-6 text-emerald-500" />
										<span className="font-bold text-xs">Delivered</span>
									</Button>
									<Button
										variant="outline"
										onClick={() => handleUpdateStatus("failed")}
										disabled={updateStatus.isPending}
										className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted md:h-24"
									>
										<XCircleIcon className="h-6 w-6 text-rose-500" />
										<span className="font-bold text-xs">Failed</span>
									</Button>
									<Button
										variant="outline"
										onClick={() => setShowReturnForm(true)}
										disabled={updateStatus.isPending}
										className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted md:h-24"
									>
										<Undo2Icon className="h-6 w-6 text-amber-500" />
										<span className="font-bold text-xs">Return</span>
									</Button>
								</div>

								{/* Performance Metrics - Enhanced */}
								<div className="mt-6">
									<h3 className="mb-3 px-1 font-bold text-muted-foreground text-sm uppercase tracking-wider">
										Today's Performance
									</h3>
									<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
										<Card className="rounded-xl border-border bg-card shadow-sm transition-all hover:shadow-md">
											<CardContent className="flex h-full flex-col justify-between p-4">
												<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80">
													<PackageCheckIcon className="h-5 w-5 text-foreground" />
												</div>
												<div className="mt-4 space-y-1">
													<p className="font-medium text-muted-foreground text-xs">
														Delivered
													</p>
													<p className="font-bold text-2xl tracking-tight">
														{data.delivered}/{data.assignedOrders}
													</p>
													<p className="text-xs text-muted-foreground">
														{Math.round((data.delivered / data.assignedOrders) * 100)}% completion
													</p>
												</div>
											</CardContent>
										</Card>

										<Card className="rounded-xl border-border bg-card shadow-sm transition-all hover:shadow-md">
											<CardContent className="flex h-full flex-col justify-between p-4">
												<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80">
													<BanknoteIcon className="h-5 w-5 text-foreground" />
												</div>
												<div className="mt-4 space-y-1">
													<p className="font-medium text-muted-foreground text-xs">
														COD Collected
													</p>
													<p className="font-bold text-2xl text-amber-600 tracking-tight">
														{formatCurrency(data.codCollected, "en-IN")}
													</p>
													<p className="text-xs text-muted-foreground">
														{data.successfulCollections} collections
													</p>
												</div>
											</CardContent>
										</Card>

										<Card className="rounded-xl border-border bg-card shadow-sm transition-all hover:shadow-md">
											<CardContent className="flex h-full flex-col justify-between p-4">
												<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80">
													<Undo2Icon className="h-5 w-5 text-foreground" />
												</div>
												<div className="mt-4 space-y-1">
													<p className="font-medium text-muted-foreground text-xs">
														Returns
													</p>
													<p className="font-bold text-2xl tracking-tight">
														{data.returnsProcessed}
													</p>
													<p className="text-xs text-muted-foreground">
														{data.returnRate}% rate
													</p>
												</div>
											</CardContent>
										</Card>

										<Card className="rounded-xl border-border bg-card shadow-sm transition-all hover:shadow-md">
											<CardContent className="flex h-full flex-col justify-between p-4">
												<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80">
													<StarIcon className="h-5 w-5 text-foreground" />
												</div>
												<div className="mt-4 space-y-1">
													<p className="font-medium text-muted-foreground text-xs">
														Rating
													</p>
													<p className="font-bold text-2xl text-yellow-600 tracking-tight">
														{data.customerRating}/5
													</p>
													<p className="text-xs text-muted-foreground">
														{data.positiveReviews} reviews
													</p>
												</div>
											</CardContent>
										</Card>
									</div>
								</div>

								{/* Route Timeline - Enhanced */}
								<Card className="mt-6 border-border/50 bg-background shadow-sm">
									<CardHeader className="flex flex-row items-center justify-between pb-3">
										<CardTitle className="text-sm">Today's Route Progress</CardTitle>
										<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
											<MoreVerticalIcon className="h-4 w-4" />
										</Button>
									</CardHeader>
									<CardContent>
										<div className="relative space-y-6 pb-2 pl-6 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-px before:bg-border/50 md:before:mx-auto md:before:translate-x-0">
											{data.routeStops?.map((stop, idx) => (
												<div key={idx} className="relative">
													<div
														className={`absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-background ring-2 ring-background ${
															stop.status === "completed"
																? "bg-emerald-500 text-white"
																: stop.status === "next"
																	? "animate-pulse bg-primary text-white"
																	: "border-muted-foreground/30 bg-muted"
														}`}
													>
														{stop.status === "completed" && (
															<CheckCircle2Icon className="h-3 w-3" />
														)}
													</div>
													<div className="flex items-start justify-between">
														<p
															className={`font-medium text-sm ${stop.status === "pending" ? "text-muted-foreground" : ""}`}
														>
															{stop.address}
														</p>
														<div className="flex items-center gap-2">
															<p
																className={`font-bold text-[10px] ${stop.status === "completed" ? "text-emerald-500" : "text-muted-foreground"}`}
															>
																{stop.time}
															</p>
															{stop.status === "completed" && (
																<CheckCircle2Icon className="h-3 w-3 text-emerald-500" />
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</>
						)}

						{activeTab === "deliveries" && (
							<div className="space-y-4">
								<h2 className="text-xl font-bold">Delivery History</h2>
								<Card>
									<CardContent className="pt-6">
										<DataTable
											columns={[
												{ accessorKey: "orderId", header: "Order ID" },
												{ accessorKey: "customer", header: "Customer" },
												{ accessorKey: "status", header: "Status" },
												{ accessorKey: "time", header: "Time" },
												{ accessorKey: "amount", header: "Amount" },
											]}
											data={data.deliveryHistory || []}
											isLoading={isLoading}
										/>
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === "returns" && (
							<div className="space-y-4">
								<h2 className="text-xl font-bold">Return History</h2>
								<Card>
									<CardContent className="pt-6">
										<DataTable
											columns={[
												{ accessorKey: "returnId", header: "Return ID" },
												{ accessorKey: "orderId", header: "Order ID" },
												{ accessorKey: "reason", header: "Reason" },
												{ accessorKey: "date", header: "Date" },
												{ accessorKey: "status", header: "Status" },
											]}
											data={data.returnHistory || []}
											isLoading={isLoading}
										/>
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === "reports" && (
							<div className="space-y-4">
								<h2 className="text-xl font-bold">Performance Reports</h2>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<Card>
										<CardHeader>
											<CardTitle>Daily Summary</CardTitle>
										</CardHeader>
										<CardContent>
											{/* Daily summary content */}
											<p>Comprehensive daily performance report</p>
										</CardContent>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle>Weekly Analytics</CardTitle>
										</CardHeader>
										<CardContent>
											{/* Weekly analytics content */}
											<p>Weekly performance trends and insights</p>
										</CardContent>
									</Card>
								</div>
							</div>
						)}
					</div>

					{/* Right Column - Sidebar (Desktop only) */}
					{isDesktop && (
						<div className="w-1/3 space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									<Button className="w-full justify-start" variant="ghost">
										<RefreshCwIcon className="mr-2 h-4 w-4" />
										Refresh Data
									</Button>
									<Button className="w-full justify-start" variant="ghost">
										<FileTextIcon className="mr-2 h-4 w-4" />
										Generate Report
									</Button>
									<Button className="w-full justify-start" variant="ghost">
										<UploadIcon className="mr-2 h-4 w-4" />
										Sync with Server
									</Button>
									<Button className="w-full justify-start" variant="ghost">
										<UserIcon className="mr-2 h-4 w-4" />
										Profile Settings
									</Button>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Notifications</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{data.notifications?.map((notif, idx) => (
											<div key={idx} className="rounded-lg border p-3">
												<p className="font-medium text-sm">{notif.message}</p>
												<p className="text-xs text-muted-foreground">{notif.time}</p>
											</div>
										)) || <p className="text-muted-foreground">No new notifications</p>}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Vehicle Status</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Fuel Level</span>
										<span className="font-medium">{data.vehicleStatus?.fuelLevel || 'N/A'}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Odometer</span>
										<span className="font-medium">{data.vehicleStatus?.odometer || 'N/A'}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Maintenance</span>
										<span className={`font-medium ${data.vehicleStatus?.maintenanceDue ? 'text-rose-500' : 'text-emerald-500'}`}>
											{data.vehicleStatus?.maintenanceDue ? 'Due' : 'OK'}
										</span>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			</div>

			{/* Return Order Form Dialog */}
			<Dialog open={showReturnForm} onOpenChange={setShowReturnForm}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Process Return Order</DialogTitle>
					</DialogHeader>
					<ReturnOrderForm
						onSubmit={handleReturnSubmit}
						onCancel={() => setShowReturnForm(false)}
						deliveryData={data.nextDelivery}
					/>
				</DialogContent>
			</Dialog>

			{/* Bill Generation Dialog */}
			<Dialog open={showBillGeneration} onOpenChange={setShowBillGeneration}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Generate Delivery Receipt</DialogTitle>
					</DialogHeader>
					<BillGeneration
						deliveryData={data.nextDelivery}
						onGenerate={handleGenerateBill}
					/>
				</DialogContent>
			</Dialog>

			{/* Emergency Button - Fixed at bottom for mobile */}
			{!isDesktop && (
				<div className="sticky bottom-0 z-50 bg-background p-4 shadow-lg">
					<Button
						variant="destructive"
						className="h-12 w-full gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 font-bold text-rose-600 shadow-none hover:bg-rose-500/20"
					>
						<AlertTriangleIcon className="h-4 w-4" /> Report Issue / Emergency
					</Button>
				</div>
			)}
		</div>
	);
}