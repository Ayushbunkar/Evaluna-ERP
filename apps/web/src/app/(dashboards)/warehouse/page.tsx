"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WarehouseRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/dashboard/warehouse");
	}, [router]);

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center bg-background">
			<div className="flex flex-col items-center space-y-3">
				<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
				<p className="font-medium text-muted-foreground text-sm">
					Redirecting to Warehouse Operations Control Center...
				</p>
			</div>
		</div>
	);
}
