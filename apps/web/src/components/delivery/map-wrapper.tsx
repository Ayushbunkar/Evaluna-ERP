"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@evaluna/ui/components/skeleton";

// Dynamically import the LiveMap component to disable SSR since Leaflet requires window
const LiveMap = dynamic(() => import("./live-map"), {
	ssr: false,
	loading: () => (
		<div className="flex h-full w-full items-center justify-center rounded-xl bg-muted/20">
			<Skeleton className="h-[90%] w-[95%] rounded-lg" />
		</div>
	),
});

export function MapWrapper({ trips }: { trips: any[] }) {
	return (
		<div className="h-full w-full overflow-hidden rounded-xl border">
			<LiveMap trips={trips} />
		</div>
	);
}
