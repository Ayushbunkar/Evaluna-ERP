"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { motion } from "framer-motion";
import {
	AlertTriangleIcon,
	BanknoteIcon,
	BatteryIcon,
	CheckCircle2Icon,
	ClockIcon,
	MapPinIcon,
	MoreVerticalIcon,
	NavigationIcon,
	PackageCheckIcon,
	PhoneIcon,
	SignalIcon,
	StarIcon,
	Undo2Icon,
	WifiOffIcon,
	XCircleIcon,
} from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

// Simple simulated mini-map
function MiniMapPreview() {
	return (
		<div className="relative h-32 w-full overflow-hidden rounded-t-xl border-border/50 border-b bg-slate-900">
			<div
				className="absolute inset-0 opacity-20"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
					backgroundSize: "15px 15px",
				}}
			/>

			{/* Route Line */}
			<svg
				className="absolute inset-0 h-full w-full"
				preserveAspectRatio="none"
			>
				<path
					d="M 20 80 Q 80 80, 100 40 T 250 50"
					fill="none"
					stroke="hsl(var(--primary))"
					strokeWidth="3"
					strokeDasharray="5,5"
					className="animate-[dash_1s_linear_infinite]"
				/>
			</svg>

			{/* Origin */}
			<div className="absolute top-[80px] left-[20px] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500" />

			{/* Destination */}
			<div className="absolute top-[50px] left-[250px] flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-bounce items-center justify-center rounded-full border-2 border-white bg-primary">
				<MapPinIcon className="h-3 w-3 text-white" />
			</div>
		</div>
	);
}

export default function DriverDashboard() {
	const { activeBranchId } = useBranch();

	const { data, isLoading, refetch } = trpc.driver.getMobileDashboard.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	const updateStatus = trpc.delivery.updateStopStatus.useMutation({
		onSuccess: () => {
			// In a real app we'd show a toast here
			refetch();
		},
	});

	const handleUpdateStatus = (status: "reached" | "delivered" | "failed") => {
		if (data?.nextDelivery?.stop_id) {
			updateStatus.mutate({
				stop_id: data.nextDelivery.stop_id,
				status,
				reason: status === "failed" ? "Customer not available" : undefined,
			});
		}
	};

	if (isLoading || !data) {
		return (
			<div className="flex h-full min-h-[400px] items-center justify-center">
				<div className="h-10 w-10 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col bg-muted/30 pb-20">
			{/* Mobile Top App Bar */}
			<div className="sticky top-0 z-50 flex items-center justify-between border-border/50 border-b bg-background px-4 py-3 shadow-sm">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
						{data.driverName.charAt(0)}
					</div>
					<div>
						<h1 className="font-bold text-sm leading-none">
							{data.driverName}
						</h1>
						<div className="mt-1 flex items-center gap-1 font-medium text-[10px] text-emerald-500">
							<div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
							{data.status}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-3 text-muted-foreground">
					<div className="flex items-center gap-1 font-bold text-[10px]">
						<WifiOffIcon className="h-3 w-3 text-amber-500" /> Offline Sync
					</div>
					<div className="flex items-center gap-1">
						<SignalIcon className="h-4 w-4" />
					</div>
					<div className="flex items-center gap-1">
						<BatteryIcon className="h-4 w-4" />{" "}
						<span className="font-bold text-[10px]">{data.batteryLevel}%</span>
					</div>
				</div>
			</div>

			<div className="space-y-5 p-4">
				{/* Next Delivery Mega Card */}
				{data.nextDelivery && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Card className="overflow-hidden border-primary/30 bg-background shadow-lg">
							<MiniMapPreview />
							<CardContent className="relative p-4 pt-5">
								<div className="absolute top-0 right-4 flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-popover px-3 py-1 font-bold text-[10px] text-popover-foreground shadow-md">
									<ClockIcon className="h-3 w-3" /> ETA {data.nextDelivery.eta}
								</div>

								<div className="mb-3 flex items-start justify-between">
									<div>
										<p className="mb-1 font-bold text-[10px] text-primary uppercase tracking-wider">
											Next Drop-off
										</p>
										<h2 className="font-bold text-xl leading-tight">
											{data.nextDelivery.customerName}
										</h2>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{data.nextDelivery.id}
										</p>
									</div>
									<Button
										size="icon"
										variant="outline"
										className="h-10 w-10 shrink-0 rounded-full border-primary/20 bg-primary/5 text-primary"
									>
										<PhoneIcon className="h-4 w-4" />
									</Button>
								</div>

								<div className="mb-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
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

								<div className="mb-5 grid grid-cols-2 gap-2">
									<div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
										<BanknoteIcon className="h-5 w-5 text-amber-600" />
										<div>
											<p className="font-bold text-[9px] text-amber-600/80 uppercase">
												Collect {data.nextDelivery.paymentType}
											</p>
											<p className="font-bold text-amber-700 text-sm">
												{formatCurrency(
													data.nextDelivery.amountToCollect,
													"en-US",
												)}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
										<PackageCheckIcon className="h-5 w-5 text-blue-600" />
										<div>
											<p className="font-bold text-[9px] text-blue-600/80 uppercase">
												Packages
											</p>
											<p className="font-bold text-blue-700 text-sm">
												{data.nextDelivery.packages} Items
											</p>
										</div>
									</div>
								</div>

								<Button className="h-14 w-full gap-2 rounded-xl font-bold text-lg shadow-md shadow-primary/20">
									<NavigationIcon className="h-5 w-5" /> Start Navigation
								</Button>
							</CardContent>
						</Card>
					</motion.div>
				)}

				{/* Massive Quick Action Buttons (Optimized for one-hand thumb reach) */}
				<div className="grid grid-cols-2 gap-3">
					<Button
						variant="outline"
						onClick={() => handleUpdateStatus("reached")}
						disabled={updateStatus.isPending}
						className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted"
					>
						<MapPinIcon className="h-6 w-6 text-primary" />
						<span className="font-bold text-xs">Reached</span>
					</Button>
					<Button
						variant="outline"
						onClick={() => handleUpdateStatus("delivered")}
						disabled={updateStatus.isPending}
						className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted"
					>
						<CheckCircle2Icon className="h-6 w-6 text-emerald-500" />
						<span className="font-bold text-xs">Delivered</span>
					</Button>
					<Button
						variant="outline"
						onClick={() => handleUpdateStatus("failed")}
						disabled={updateStatus.isPending}
						className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted"
					>
						<XCircleIcon className="h-6 w-6 text-rose-500" />
						<span className="font-bold text-xs">Failed</span>
					</Button>
					<Button
						variant="outline"
						className="h-20 flex-col gap-2 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted"
					>
						<Undo2Icon className="h-6 w-6 text-amber-500" />
						<span className="font-bold text-xs">Return</span>
					</Button>
				</div>

				{/* Emergency Button */}
				<Button
					variant="destructive"
					className="h-12 w-full gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 font-bold text-rose-600 shadow-none hover:bg-rose-500/20"
				>
					<AlertTriangleIcon className="h-4 w-4" /> Report Issue / Emergency
				</Button>

				{/* Mini KPI Dashboard */}
				<div className="mt-2 rounded-xl border border-border/50 bg-background p-4 shadow-sm">
					<h3 className="mb-4 font-bold text-muted-foreground text-xs uppercase tracking-wider">
						Today's Performance
					</h3>
					<div className="grid grid-cols-3 gap-x-2 gap-y-5">
						<div className="text-center">
							<div className="font-black text-xl">
								{data.delivered}/{data.assignedOrders}
							</div>
							<div className="mt-0.5 text-[10px] text-muted-foreground">
								Delivered
							</div>
						</div>
						<div className="border-border border-x text-center">
							<div className="font-black text-amber-600 text-xl">
								{formatCurrency(data.codCollected, "en-US")}
							</div>
							<div className="mt-0.5 text-[10px] text-muted-foreground">
								COD Collected
							</div>
						</div>
						<div className="flex flex-col items-center text-center">
							<div className="flex items-center gap-1 font-black text-xl">
								{data.rating}{" "}
								<StarIcon className="h-3 w-3 fill-amber-400 text-amber-400" />
							</div>
							<div className="mt-0.5 text-[10px] text-muted-foreground">
								Avg Rating
							</div>
						</div>
					</div>
				</div>

				{/* Today's Route Timeline */}
				<Card className="border-border/50 bg-background shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<CardTitle className="text-sm">Today's Route</CardTitle>
						<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
							<MoreVerticalIcon className="h-4 w-4" />
						</Button>
					</CardHeader>
					<CardContent>
						<div className="relative space-y-6 pb-2 pl-6 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-px before:bg-border/50 md:before:mx-auto md:before:translate-x-0">
							{data.routeStops?.map((stop: any, idx: number) => (
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
										<p
											className={`font-bold text-[10px] ${stop.status === "completed" ? "text-emerald-500" : "text-muted-foreground"}`}
										>
											{stop.time}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
