// @ts-nocheck
import { getServerClient } from "@/lib/trpc/server";
import { DeliveryManagementDashboard } from "@/components/delivery/delivery-management-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Delivery Management | Evaluna ERP",
	description: "Manage delivery routes, vehicles, and track drivers live.",
};

export default async function DeliveryManagementPage() {
	const trpc = await getServerClient();
	const branches = await (trpc as any).branches.list();
	
	// Fetch initial data for the current user's branch
	const routes = await trpc.delivery.listRoutes({});
	const vehicles = await (trpc as any).vehicles.list({});
	const staff = await (trpc as any).staff.list({}); // Assuming staff list includes drivers

	// Filter staff to find delivery drivers
	const drivers = staff.filter(s => s.role === "delivery_boy" || s.role === "driver");

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
				<p className="text-muted-foreground">
					Assign routes, track deliveries live, and manage your vehicle fleet.
				</p>
			</div>
			<DeliveryManagementDashboard
				initialRoutes={routes}
				initialVehicles={vehicles}
				drivers={drivers}
				branches={branches}
			/>
		</div>
	);
}


