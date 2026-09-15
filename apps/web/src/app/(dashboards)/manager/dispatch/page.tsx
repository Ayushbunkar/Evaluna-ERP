"use client";

import { useTranslations } from "next-intl";
import { DeliveryManagementDashboard } from "@/components/delivery/delivery-management-dashboard";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ManagerDispatchPage() {
	const t = useTranslations("manager");
	const trpc = useTRPC();
	const { data: drivers = [] } = trpc.delivery.listDrivers.useQuery({});

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="font-bold text-2xl text-foreground tracking-tight">
					{t("dispatchControlTitle")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("dispatchControlSub")}
				</p>
			</div>

			{/* Render Unified Delivery Management Component */}
			<div className="overflow-hidden rounded-xl border border-border/50 bg-white shadow-sm">
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
