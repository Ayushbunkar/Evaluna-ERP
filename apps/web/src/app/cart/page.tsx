"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartRedirectPage() {
	const router = useRouter();
	useEffect(() => {
		router.replace("/customer/cart");
	}, [router]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-3">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
				<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
					Loading Cart...
				</p>
			</div>
		</div>
	);
}
