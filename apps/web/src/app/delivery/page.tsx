import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeliveryBoyDashboard } from "@/components/delivery/delivery-boy-dashboard";
import { getServerClient } from "@/lib/trpc/server";

export const metadata: Metadata = {
	title: "Driver Dashboard | Evaluna ERP",
	description:
		"Manage your delivery routes, collect payments, and log returns.",
	viewport:
		"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mobile optimized
};

export default async function DeliveryPage() {
	const trpc = await getServerClient();

	// Ensure the user is a delivery boy/driver
	const session = await (trpc as any).auth.getSession();
	if (
		!session ||
		(session.user.role !== "delivery_boy" &&
			session.user.role !== "driver" &&
			session.user.role !== "admin")
	) {
		redirect("/");
	}

	const myTrips = await (trpc as any).delivery.myTrips();

	// Find the currently active trip
	const activeTrip = myTrips.find(
		(t: any) => t.status === "active" || t.status === "pending",
	);

	return (
		<div className="flex h-screen flex-col bg-slate-50">
			<DeliveryBoyDashboard activeTrip={activeTrip} allTrips={myTrips} />
		</div>
	);
}
