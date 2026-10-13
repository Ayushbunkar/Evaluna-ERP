"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";

export default function SharedSettingsPage() {
	const router = useRouter();
	const sessionData = useSession();
	const role = (sessionData?.session?.user as any)?.role;

	useEffect(() => {
		if (role === "auditor") {
			router.replace("/auditor/settings");
		} else if (role === "admin" || role === "super_admin") {
			router.replace("/admin/settings");
		} else if (role === "manager") {
			router.replace("/manager/settings");
		} else if (role === "sales") {
			router.replace("/sales/settings");
		}
	}, [role, router]);

	return (
		<div className="flex min-h-[300px] items-center justify-center p-6 text-sm text-muted-foreground">
			Redirecting to settings...
		</div>
	);
}
