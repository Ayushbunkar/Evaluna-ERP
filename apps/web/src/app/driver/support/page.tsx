"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { ArrowLeftIcon, HeadphonesIcon, LifeBuoyIcon, MessageSquareIcon, PhoneCallIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SupportPage() {
	const t = useTranslations("nav");

	return (
		<div className="flex min-h-screen flex-col bg-muted/30 pb-20">
			<header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 shadow-sm">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/driver">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">{t("support")}</h1>
			</header>

			<main className="flex-1 space-y-6 p-4">
				<div className="text-center py-6">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<HeadphonesIcon className="h-8 w-8 text-primary" />
					</div>
					<h2 className="text-2xl font-bold tracking-tight">How can we help?</h2>
					<p className="text-muted-foreground mt-2">Get in touch with the dispatch or support team immediately.</p>
				</div>

				<div className="grid gap-4">
					<Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/20">
						<CardContent className="flex items-center gap-4 p-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
								<PhoneCallIcon className="h-6 w-6" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-foreground">Call Dispatcher</h3>
								<p className="text-sm text-muted-foreground">Emergency & urgent route issues</p>
							</div>
						</CardContent>
					</Card>

					<Card className="hover:bg-muted/50 transition-colors cursor-pointer">
						<CardContent className="flex items-center gap-4 p-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
								<MessageSquareIcon className="h-6 w-6" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-foreground">Live Chat</h3>
								<p className="text-sm text-muted-foreground">App issues or delivery questions</p>
							</div>
						</CardContent>
					</Card>

					<Card className="hover:bg-muted/50 transition-colors cursor-pointer">
						<CardContent className="flex items-center gap-4 p-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
								<LifeBuoyIcon className="h-6 w-6" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-foreground">Vehicle Breakdown</h3>
								<p className="text-sm text-muted-foreground">Report maintenance emergency</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
