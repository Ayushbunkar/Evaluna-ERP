"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SalesCashBookRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/sales");
	}, [router]);

	return null;
}
