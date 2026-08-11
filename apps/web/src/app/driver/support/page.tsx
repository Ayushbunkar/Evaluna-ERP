"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { ArrowLeftIcon, HeadphonesIcon, LifeBuoyIcon, MessageSquareIcon, PhoneCallIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose
} from "@evaluna/ui/components/dialog";
import { Textarea } from "@evaluna/ui/components/textarea";

export default function SupportPage() {
	const t = useTranslations("nav");
	
	const { data: supportInfo, isLoading: isLoadingPhone } = trpc.driver.getSupportInfo.useQuery({});
	const submitTicketMutation = trpc.driver.submitSupportTicket.useMutation();
	const reportBreakdownMutation = trpc.driver.reportVehicleBreakdown.useMutation();

	const [chatMessage, setChatMessage] = useState("");
	const [chatOpen, setChatOpen] = useState(false);
	const [breakdownOpen, setBreakdownOpen] = useState(false);

	const handleChatSubmit = async () => {
		if (!chatMessage.trim()) return;
		try {
			await submitTicketMutation.mutateAsync({ message: chatMessage });
			toast.success("Message sent! Support will contact you shortly.");
			setChatMessage("");
			setChatOpen(false);
		} catch (e: any) {
			toast.error(e.message || "Failed to send message");
		}
	};

	const handleBreakdownReport = async () => {
		try {
			await reportBreakdownMutation.mutateAsync();
			toast.success("Emergency logged. Dispatch has been notified.");
			setBreakdownOpen(false);
		} catch (e: any) {
			toast.error(e.message || "Failed to report breakdown");
		}
	};

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
					{/* Call Dispatcher */}
					<a href={supportInfo?.dispatcherPhone ? `tel:${supportInfo.dispatcherPhone}` : "#"} className={isLoadingPhone ? "pointer-events-none opacity-50" : ""}>
						<Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/20">
							<CardContent className="flex items-center gap-4 p-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
									{isLoadingPhone ? <Loader2Icon className="h-6 w-6 animate-spin" /> : <PhoneCallIcon className="h-6 w-6" />}
								</div>
								<div className="flex-1">
									<h3 className="font-semibold text-foreground">Call Dispatcher</h3>
									<p className="text-sm text-muted-foreground">Emergency & urgent route issues</p>
								</div>
							</CardContent>
						</Card>
					</a>

					{/* Live Chat */}
					<Dialog open={chatOpen} onOpenChange={setChatOpen}>
						<DialogTrigger asChild>
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
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Send a Message</DialogTitle>
								<DialogDescription>
									Describe the issue you're facing. Our support team will reply to you.
								</DialogDescription>
							</DialogHeader>
							<div className="py-4">
								<Textarea
									value={chatMessage}
									onChange={(e) => setChatMessage(e.target.value)}
									placeholder="Type your message here..."
									className="min-h-[120px]"
								/>
							</div>
							<DialogFooter className="sm:justify-between">
								<DialogClose asChild>
									<Button type="button" variant="secondary">Cancel</Button>
								</DialogClose>
								<Button type="button" onClick={handleChatSubmit} disabled={!chatMessage.trim() || submitTicketMutation.isPending}>
									{submitTicketMutation.isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
									Send Message
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* Vehicle Breakdown */}
					<Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
						<DialogTrigger asChild>
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
						</DialogTrigger>
						<DialogContent className="sm:max-w-md border-orange-500/20">
							<DialogHeader>
								<DialogTitle className="text-orange-500">Confirm Vehicle Breakdown</DialogTitle>
								<DialogDescription>
									Are you sure you want to report a vehicle breakdown? This will pause your current route and alert dispatch immediately to send assistance.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter className="sm:justify-between mt-4">
								<DialogClose asChild>
									<Button type="button" variant="outline">Cancel</Button>
								</DialogClose>
								<Button type="button" variant="destructive" onClick={handleBreakdownReport} disabled={reportBreakdownMutation.isPending} className="bg-orange-500 hover:bg-orange-600">
									{reportBreakdownMutation.isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
									Confirm Breakdown
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</main>
		</div>
	);
}
