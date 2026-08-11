"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { ArrowLeftIcon, MapPinIcon, PackageCheckIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AssignedOrdersPage() {
	const t = useTranslations("nav");

	const mockOrders = [
		{ id: "ORD-9912", name: "Deepak Sharma", address: "123 Main St, Mumbai", status: "pending", items: 3 },
		{ id: "ORD-9913", name: "Ravi Kumar", address: "45 Andheri West, Mumbai", status: "delivered", items: 1 },
		{ id: "ORD-9914", name: "Neha Gupta", address: "88 Bandra East, Mumbai", status: "pending", items: 5 },
	];

	return (
		<div className="flex min-h-screen flex-col bg-muted/30 pb-20">
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 shadow-sm">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/driver">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">{t("assignedOrders")}</h1>
			</header>

			<main className="flex-1 space-y-4 p-4">
				{mockOrders.map((order) => (
					<Card key={order.id} className="overflow-hidden">
						<CardHeader className="bg-muted/50 pb-3 pt-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base font-bold">{order.id}</CardTitle>
								<Badge variant={order.status === "delivered" ? "default" : "secondary"}>
									{order.status === "delivered" ? "Delivered" : "Pending"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="pt-4">
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
									<div>
										<p className="font-medium">{order.name}</p>
										<p className="text-sm text-muted-foreground">{order.address}</p>
									</div>
								</div>
								
								<div className="flex items-center gap-3 border-t pt-3">
									<PackageCheckIcon className="h-5 w-5 text-muted-foreground" />
									<span className="text-sm font-medium">{order.items} Packages</span>
								</div>

								<div className="flex gap-2 pt-2">
									<Button className="w-full" variant="outline">
										<PhoneIcon className="mr-2 h-4 w-4" /> Call
									</Button>
									<Button className="w-full">View Details</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</main>
		</div>
	);
}
