"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	RefreshCw,
	ShoppingCart,
	Truck,
	WifiOff,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default function OfflineFallbackPage() {
	return (
		<div className="flex min-h-[85vh] items-center justify-center p-4">
			<Card className="w-full max-w-md border-slate-700 bg-slate-900 text-center text-slate-100 shadow-2xl">
				<CardHeader className="flex flex-col items-center pb-2">
					<div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30">
						<WifiOff className="h-8 w-8 animate-pulse" />
					</div>
					<CardTitle className="font-extrabold text-white text-xl">
						Evaluna ERP — Offline Mode
					</CardTitle>
					<CardDescription className="mt-1 text-slate-400 text-xs">
						You are currently offline. Your Sales POS, Driver Handover, and
						Offline Order Outbox are operating locally on your device.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3 pt-4">
					<Button
						asChild
						className="w-full bg-blue-600 font-semibold text-xs hover:bg-blue-700"
					>
						<Link href="/sales">
							<ShoppingCart className="mr-2 h-4 w-4" /> Open Sales & POS Console
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						className="w-full border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
					>
						<Link href="/driver">
							<Truck className="mr-2 h-4 w-4" /> Open Driver Logistics
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => window.location.reload()}
						className="mt-2 w-full text-slate-400 text-xs hover:text-white"
					>
						<RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try Reconnecting
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
