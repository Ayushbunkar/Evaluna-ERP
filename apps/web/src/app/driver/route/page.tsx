"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { ArrowLeftIcon, MapPinIcon, NavigationIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RoutePage() {
	const t = useTranslations("nav");

	const routeStops = [
		{ id: 1, address: "Warehouse (Origin)", status: "completed", time: "09:00 AM" },
		{ id: 2, address: "123 Main St, Mumbai", status: "completed", time: "09:45 AM" },
		{ id: 3, address: "45 Andheri West, Mumbai", status: "next", time: "--:--" },
		{ id: 4, address: "88 Bandra East, Mumbai", status: "pending", time: "--:--" },
		{ id: 5, address: "Warehouse (Return)", status: "pending", time: "--:--" },
	];

	return (
		<div className="flex min-h-screen flex-col bg-muted/30 pb-20">
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 shadow-sm">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/driver">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">{t("todaysRoute")}</h1>
			</header>

			<main className="flex-1 p-4">
				<Card>
					<CardContent className="p-6">
						<div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
							{routeStops.map((stop) => (
								<div key={stop.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
									{/* Icon */}
									<div
										className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background shadow md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
											stop.status === "completed"
												? "bg-primary text-primary-foreground"
												: stop.status === "next"
													? "bg-blue-500 text-white animate-pulse"
													: "bg-muted text-muted-foreground"
										}`}
									>
										<MapPinIcon className="h-5 w-5" />
									</div>

									{/* Content */}
									<div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-xl border bg-background p-4 shadow-sm">
										<div className="flex flex-col gap-1">
											<span
												className={`font-bold ${
													stop.status === "completed"
														? "text-primary"
														: stop.status === "next"
															? "text-blue-500"
															: "text-muted-foreground"
												}`}
											>
												{stop.status === "completed"
													? "Completed"
													: stop.status === "next"
														? "Next Stop"
														: "Pending"}
											</span>
											<p className="font-medium text-foreground">{stop.address}</p>
											<p className="text-xs text-muted-foreground">{stop.time}</p>
										</div>
										{stop.status === "next" && (
											<Button className="mt-3 w-full gap-2" variant="default" asChild>
												<Link href="/driver/navigation">
													<NavigationIcon className="h-4 w-4" /> Start Navigation
												</Link>
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
