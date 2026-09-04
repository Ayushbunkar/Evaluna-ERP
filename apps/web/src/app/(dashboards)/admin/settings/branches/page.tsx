"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageTransition } from "@/lib/animations";

/**
 * /admin/settings/branches → canonical branch management lives at /admin/branches.
 * Redirect immediately to avoid duplicate pages.
 */
export default function AdminSettingsBranchesPage() {
	const router = useRouter();
	useEffect(() => {
		router.replace("/admin/branches");
	}, [router]);
	return (
		<PageTransition className="flex items-center justify-center p-12">
			<span className="text-muted-foreground text-sm">
				Redirecting to Branches…
			</span>
		</PageTransition>
	);
}
