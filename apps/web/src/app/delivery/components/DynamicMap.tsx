"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the MapComponent with SSR disabled
const MapComponent = dynamic(() => import("./MapComponent"), {
	ssr: false,
	loading: () => (
		<div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-border/50 bg-[#1a1a1a]">
			<Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
			<p className="text-muted-foreground text-sm">Initializing Map...</p>
		</div>
	),
});

export function DynamicMap({ drivers }: { drivers: any[] }) {
	return <MapComponent drivers={drivers} />;
}
