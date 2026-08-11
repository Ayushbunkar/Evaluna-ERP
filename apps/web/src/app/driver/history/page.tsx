"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { ArrowLeftIcon, HistoryIcon, MapPinIcon, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HistoryPage() {
	const t = useTranslations("nav");

	return (
		<div className="flex min-h-screen flex-col bg-muted/30 pb-20">
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 shadow-sm">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/driver">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">{t("deliveryHistory")}</h1>
			</header>

			<main className="flex-1 space-y-4 p-4">
				{[
					{ date: "Yesterday, Oct 24", trips: 2, deliveries: 14, earnings: "₹ 34,000" },
					{ date: "Monday, Oct 23", trips: 1, deliveries: 8, earnings: "₹ 18,500" },
					{ date: "Saturday, Oct 21", trips: 3, deliveries: 22, earnings: "₹ 52,100" },
				].map((day, i) => (
					<Card key={i} className="overflow-hidden">
						<div className="bg-muted/50 px-4 py-3 border-b">
							<h3 className="font-semibold">{day.date}</h3>
						</div>
						<CardContent className="p-0">
							<div className="grid grid-cols-3 divide-x text-center">
								<div className="p-4">
									<p className="text-sm text-muted-foreground">Trips</p>
									<p className="font-bold text-lg">{day.trips}</p>
								</div>
								<div className="p-4">
									<p className="text-sm text-muted-foreground">Deliveries</p>
									<p className="font-bold text-lg text-primary">{day.deliveries}</p>
								</div>
								<div className="p-4">
									<p className="text-sm text-muted-foreground">Collected</p>
									<p className="font-bold text-lg text-green-600">{day.earnings}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

				<Button variant="outline" className="w-full mt-4">
					Load More History
				</Button>
			</main>
		</div>
	);
}
