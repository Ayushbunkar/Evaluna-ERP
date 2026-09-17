import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { DeliveryBoyDashboard } from "@/components/delivery/delivery-boy-dashboard";
import { getAuthUser } from "@/lib/auth-guard";
import { getServerClient } from "@/lib/trpc/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Driver Dashboard | Evaluna ERP",
	description:
		"Manage your delivery routes, collect payments, and log returns.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default async function DeliveryPage() {
	const user = await getAuthUser();
	if (
		!user ||
		(user.role !== "delivery_boy" &&
			user.role !== "driver" &&
			user.role !== "admin")
	) {
		redirect("/");
	}

	const trpc = await getServerClient();
	const myTrips = (await (trpc as any).delivery?.myTrips?.()) || [];

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
