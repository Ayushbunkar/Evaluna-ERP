"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { ArrowLeftIcon, BanknoteIcon, ReceiptIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CashCollectionPage() {
	const t = useTranslations("nav");

	return (
		<div className="flex min-h-screen flex-col bg-muted/30 pb-20">
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 shadow-sm">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/driver">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">{t("cashCollection")}</h1>
			</header>

			<main className="flex-1 space-y-6 p-4">
				{/* Total Cash Card */}
				<div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
							<WalletIcon className="h-6 w-6 text-white" />
						</div>
						<div>
							<p className="font-medium text-primary-foreground/80">Pending Deposit</p>
							<h2 className="text-3xl font-bold tracking-tight">₹ 14,500.00</h2>
						</div>
					</div>
					<Button className="mt-6 w-full bg-white text-primary hover:bg-white/90" size="lg">
						Deposit to Branch
					</Button>
				</div>

				<h3 className="font-semibold text-lg px-1">Recent Collections</h3>

				<div className="space-y-3">
					{[
						{ id: "ORD-9912", amount: 2500, time: "10:30 AM", method: "Cash" },
						{ id: "ORD-9913", amount: 4200, time: "11:15 AM", method: "Cash" },
						{ id: "ORD-9914", amount: 7800, time: "01:45 PM", method: "Cash" },
					].map((collection, i) => (
						<Card key={i} className="overflow-hidden">
							<CardContent className="flex items-center justify-between p-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600">
										<BanknoteIcon className="h-5 w-5" />
									</div>
									<div>
										<p className="font-medium">{collection.id}</p>
										<p className="text-xs text-muted-foreground">{collection.time} • {collection.method}</p>
									</div>
								</div>
								<div className="text-right">
									<p className="font-bold text-green-600">+₹{collection.amount.toLocaleString()}</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</main>
		</div>
	);
}
