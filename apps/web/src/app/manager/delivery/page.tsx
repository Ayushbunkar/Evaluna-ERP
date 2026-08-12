import { redirect } from "next/navigation";
import { DeliveryManagementDashboard } from "@/components/delivery/delivery-management-dashboard";
import { getServerClient } from "@/lib/trpc/server";

export default async function ManagerDeliveryPage() {
	const trpc = await getServerClient();
	const session = await (trpc as any).auth.getSession();

	if (
		!session ||
		(session.user.role !== "admin" &&
			session.user.role !== "manager" &&
			session.user.role !== "delivery_manager")
	) {
		redirect("/");
	}

	const branchId = session.user.branchId;

	// Fetch initial data
	const routes = await (trpc as any).delivery.listRoutes({ branchId });
	const vehicles = await (trpc as any).vehicles.list({ branchId });
	const drivers = await (trpc as any).delivery.listDrivers({ branchId });
	const trips = await (trpc as any).delivery.listAllTrips({ branchId });
	const branches = await (trpc as any).branches.list();

	return (
		<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="font-bold text-3xl tracking-tight">Dispatch Panel</h2>
			</div>
			<DeliveryManagementDashboard
				initialRoutes={routes}
				initialVehicles={vehicles}
				drivers={drivers}
				branches={branches}
				initialTrips={trips}
			/>
		</div>
	);
}
