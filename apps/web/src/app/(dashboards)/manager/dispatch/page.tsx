"use client";

import { DeliveryManagementDashboard } from "@/components/delivery/delivery-management-dashboard";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ManagerDispatchPage() {
	const trpc = useTRPC();
	const { data: drivers = [] } = trpc.delivery.listDrivers.useQuery({});

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="font-bold text-2xl text-foreground tracking-tight">
					Route Assignment & Dispatch Control
				</h1>
				<p className="text-muted-foreground text-sm">
					Create delivery routes, assign drivers to vehicles, configure sequences, and dispatch trips.
				</p>
			</div>

			{/* Render Unified Delivery Management Component */}
			<div className="border border-border/50 rounded-xl bg-white shadow-sm overflow-hidden">
				<DeliveryManagementDashboard
					initialRoutes={[]}
					initialVehicles={[]}
					drivers={drivers}
					branches={[]}
					initialTrips={[]}
				/>
			</div>
		</PageTransition>
	);
}
