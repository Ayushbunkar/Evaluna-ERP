import { getServerClient } from "@/lib/trpc/server";
import { DeliveryBoyDashboard } from "@/components/delivery/delivery-boy-dashboard";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Driver Dashboard | Evaluna ERP",
	description: "Manage your delivery routes, collect payments, and log returns.",
	viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mobile optimized
};

export default async function DeliveryPage() {
	const trpc = await getServerClient();
	
	// Ensure the user is a delivery boy/driver
	const session = await trpc.auth.getSession();
	if (!session || (session.user.role !== "delivery_boy" && session.user.role !== "driver" && session.user.role !== "admin")) {
		redirect("/");
	}
	
	const myTrips = await trpc.delivery.myTrips();
	
	// Find the currently active trip
	const activeTrip = myTrips.find(t => t.status === "active" || t.status === "pending");

	return (
		<div className="flex flex-col h-screen bg-slate-50">
			<DeliveryBoyDashboard activeTrip={activeTrip} allTrips={myTrips} />
		</div>
	);
}
