"use client";

import { Button } from "@evaluna/ui/components/button";
import { ArrowLeftIcon, MapIcon, Navigation2Icon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NavigationPage() {
	const t = useTranslations("nav");

	return (
		<div className="flex h-screen flex-col bg-muted/30">
			{/* Floating Header */}
			<header className="absolute top-0 left-0 right-0 z-10 flex items-center gap-4 bg-gradient-to-b from-background/80 to-transparent p-4 pb-10">
				<Button variant="secondary" size="icon" className="rounded-full shadow-lg" asChild>
					<Link href="/driver/route">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
			</header>

			{/* Map Placeholder Area */}
			<main className="relative flex-1 bg-[url('https://maps.gstatic.com/mapfiles/maps_lite/pwa/desktop/3x_v1.png')] bg-cover bg-center">
				<div className="absolute inset-0 bg-background/20 backdrop-blur-[2px]" />
				
				{/* Simulated Map UI Elements */}
				<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/30">
						<Navigation2Icon className="h-6 w-6 text-white" />
					</div>
				</div>

				{/* Floating Bottom Card */}
				<div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t bg-background p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold text-foreground">12 min</h2>
							<p className="text-sm text-muted-foreground">4.2 km • ETA 10:45 AM</p>
						</div>
						<Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
							<MapIcon className="h-5 w-5" />
						</Button>
					</div>

					<div className="mb-6 rounded-xl bg-muted/50 p-4">
						<p className="font-medium">45 Andheri West, Mumbai</p>
						<p className="text-sm text-muted-foreground">Drop-off for Ravi Kumar</p>
					</div>

					<div className="flex gap-3">
						<Button variant="destructive" className="flex-1 py-6 text-lg rounded-xl" asChild>
							<Link href="/driver/scan">
								Exit
							</Link>
						</Button>
						<Button variant="default" className="flex-[2] py-6 text-lg rounded-xl">
							<PhoneIcon className="mr-2 h-5 w-5" /> Contact Customer
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
}
