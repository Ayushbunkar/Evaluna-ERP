"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

export default function WarehouseRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/dashboard/warehouse");
	}, [router]);

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center bg-background">
			<div className="flex flex-col items-center space-y-3">
				<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
				<p className="text-muted-foreground text-sm font-medium">
					Redirecting to Warehouse Operations Control Center...
				</p>
			</div>
		</div>
	);
}
