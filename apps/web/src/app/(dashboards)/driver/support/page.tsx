"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { ActivityIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverSupportPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: supportTickets,
		isLoading,
		error,
	} = trpc.driver.getSupportTickets.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading support tickets
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Driver Support
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Contact dispatch and view support tickets
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Driver Activities
					</Button>
				</div>
			</div>

			{!supportTickets || supportTickets.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No support tickets found
				</div>
			) : (
				<div className="space-y-6">
					{supportTickets.map((ticket) => (
						<div key={ticket.id} className="border-border/50 p-4">
							<Card className="border-border/50 bg-card/50 shadow-sm">
								<CardHeader className="flex flex-row items-center justify-between pb-1">
									<div className="space-y-0.5">
										<CardTitle className="text-base sm:text-lg">
											{ticket.title}
										</CardTitle>
										<CardDescription className="text-xs sm:text-sm">
											{ticket.category}
										</CardDescription>
									</div>
									<div className="text-right text-gray-500 text-xs">
										{ticket.createdAt}
									</div>
								</CardHeader>
								<CardContent className="pt-1">
									<p className="text-sm">{ticket.description}</p>
									{ticket.status && (
										<div className="mt-2">
											<span
												className={`rounded-full px-2 py-0.5 text-xs ${ticket.status === "open" ? "bg-blue-100 text-blue-800" : ticket.status === "in_progress" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
											>
												{ticket.status}
											</span>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					))}
				</div>
			)}
		</PageTransition>
	);
}
