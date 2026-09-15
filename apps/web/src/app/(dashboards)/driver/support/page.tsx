"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	ActivityIcon,
	AlertCircle,
	CheckCircle,
	Clock,
	Headphones,
	MessageSquare,
	PhoneCall,
	Plus,
	RefreshCw,
	Search,
	ShieldAlert,
	Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

type SupportTicket = {
	id: string;
	title: string;
	category: string;
	description: string;
	status: string;
	createdAt: string;
};

const CATEGORIES = [
	"Technical Support",
	"Finance / COD Support",
	"Vehicle Breakdown",
	"Route Navigation",
	"Customer Handover Issue",
	"Other",
];

export default function DriverSupportPage() {
	const trpc = useTRPC();
	const {
		data: supportTickets,
		isLoading,
		error,
		refetch,
	} = trpc.driver.getSupportTickets.useQuery();

	const { data: supportInfo } = trpc.driver.getSupportInfo.useQuery({});

	const createTicketMutation = trpc.driver.submitSupportTicket.useMutation({
		onSuccess: () => {
			toast.success("Support ticket created and assigned to Dispatch team!");
			setIsNewTicketOpen(false);
			setTitle("");
			setCategory(CATEGORIES[0]);
			setDescription("");
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create support ticket.");
		},
	});

	// State
	const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
	const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
	const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");

	// Form State
	const [title, setTitle] = useState("");
	const [category, setCategory] = useState(CATEGORIES[0]);
	const [description, setDescription] = useState("");

	const ticketsList: SupportTicket[] = supportTickets ?? [];

	const filteredTickets = ticketsList.filter((ticket) => {
		const matchesCategory =
			selectedCategoryFilter === "All" ||
			(selectedCategoryFilter === "Open" &&
				ticket.status.toLowerCase() === "open") ||
			(selectedCategoryFilter === "Closed" &&
				ticket.status.toLowerCase() === "closed") ||
			ticket.category
				.toLowerCase()
				.includes(selectedCategoryFilter.toLowerCase());

		const matchesSearch =
			searchQuery.trim() === "" ||
			ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesCategory && matchesSearch;
	});

	const handleCreateTicket = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) {
			toast.error("Please enter a ticket title.");
			return;
		}
		if (!description.trim()) {
			toast.error("Please enter a description for dispatch.");
			return;
		}

		createTicketMutation.mutate({
			title,
			category,
			description,
		});
	};

	const getStatusBadge = (status: string) => {
		const s = status.toLowerCase();
		if (s === "open") {
			return (
				<Badge
					variant="outline"
					className="gap-1 border-blue-400 bg-blue-50 px-2 py-0.5 text-blue-700"
				>
					<AlertCircle className="h-3 w-3" /> Open
				</Badge>
			);
		}
		if (s === "in_progress" || s === "in progress") {
			return (
				<Badge
					variant="outline"
					className="gap-1 border-amber-400 bg-amber-50 px-2 py-0.5 text-amber-700"
				>
					<Clock className="h-3 w-3" /> In Progress
				</Badge>
			);
		}
		return (
			<Badge
				variant="outline"
				className="gap-1 border-emerald-400 bg-emerald-50 px-2 py-0.5 text-emerald-700"
			>
				<CheckCircle className="h-3 w-3" /> Closed
			</Badge>
		);
	};

	return (
		<PageTransition className="container mx-auto max-w-5xl space-y-6 py-6">
			{/* Top Bar Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<Headphones className="h-6 w-6 text-blue-600" />
						Driver Support &amp; Dispatch
					</h1>
					<p className="mt-0.5 text-muted-foreground text-xs sm:text-sm">
						Log technical/route issues, report payment disputes, or connect with
						dispatch.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
						onClick={() => setIsDispatchModalOpen(true)}
					>
						<PhoneCall className="h-4 w-4" /> Dispatch Hotline
					</Button>
					<Button
						size="sm"
						className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
						onClick={() => setIsNewTicketOpen(true)}
					>
						<Plus className="h-4 w-4" /> Create Support Ticket
					</Button>
				</div>
			</div>

			{/* Search & Filter Bar */}
			<Card className="border-gray-100 shadow-sm dark:border-gray-800">
				<CardContent className="space-y-3 p-4">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search ticket title, ID, or description..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 text-xs"
							/>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{[
								"All",
								"Open",
								"Closed",
								"Technical Support",
								"Finance / COD Support",
							].map((filter) => (
								<Button
									key={filter}
									type="button"
									variant={
										selectedCategoryFilter === filter ? "default" : "outline"
									}
									size="sm"
									className="h-9 text-xs"
									onClick={() => setSelectedCategoryFilter(filter)}
								>
									{filter}
								</Button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tickets List */}
			{isLoading ? (
				<div className="flex h-48 items-center justify-center space-x-2 text-gray-500">
					<RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
					<span className="text-sm">Loading support tickets...</span>
				</div>
			) : error ? (
				<Card className="border-red-200 bg-red-50/50">
					<CardContent className="py-8 text-center text-red-600 text-sm">
						Failed to load support tickets. Please click refresh to try again.
					</CardContent>
				</Card>
			) : filteredTickets.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center">
						<MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
						<h3 className="font-semibold text-gray-700 dark:text-gray-300">
							No support tickets found
						</h3>
						<p className="mt-1 max-w-sm text-gray-500 text-xs">
							{searchQuery || selectedCategoryFilter !== "All"
								? "No tickets match your search or filter criteria."
								: "You have no active support requests. Need help? Create a ticket above."}
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-4 gap-1.5"
							onClick={() => setIsNewTicketOpen(true)}
						>
							<Plus className="h-4 w-4" /> Open First Ticket
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{filteredTickets.map((ticket) => (
						<Card
							key={ticket.id}
							className="border-gray-200 shadow-sm transition-all hover:shadow-md dark:border-gray-800"
						>
							<CardHeader className="flex flex-col justify-between gap-2 border-b bg-gray-50/50 pb-2 sm:flex-row sm:items-center dark:bg-gray-800/40">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Badge
											variant="secondary"
											className="font-mono text-[11px]"
										>
											{ticket.id}
										</Badge>
										<CardTitle className="font-bold text-base text-gray-900 dark:text-white">
											{ticket.title}
										</CardTitle>
									</div>
									<CardDescription className="flex items-center gap-1.5 text-gray-500 text-xs">
										<Wrench className="h-3 w-3" /> {ticket.category}
									</CardDescription>
								</div>
								<div className="flex items-center gap-3">
									<span className="font-mono text-gray-500 text-xs">
										Logged: {ticket.createdAt}
									</span>
									{getStatusBadge(ticket.status)}
								</div>
							</CardHeader>
							<CardContent className="space-y-3 pt-3">
								<p className="text-gray-700 text-xs leading-relaxed sm:text-sm dark:text-gray-300">
									{ticket.description}
								</p>

								<div className="flex items-center justify-between border-t pt-2 text-xs">
									<span className="text-[11px] text-gray-500">
										Assigned to: Central ERP Dispatch Desk
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 gap-1 text-blue-600 text-xs hover:text-blue-700"
										onClick={() => {
											toast.info(
												`Contacting dispatch regarding ticket ${ticket.id}...`,
											);
											setIsDispatchModalOpen(true);
										}}
									>
										<PhoneCall className="h-3 w-3" /> Call Dispatch
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Modal: Create Support Ticket */}
			<Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Headphones className="h-5 w-5 text-blue-600" />
							Create Driver Support Ticket
						</DialogTitle>
						<DialogDescription className="text-xs">
							Submit a issue report directly to the Central ERP Logistics &amp;
							Finance Desk.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleCreateTicket} className="space-y-4 py-2">
						<div className="space-y-1">
							<Label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
								Ticket Subject / Title *
							</Label>
							<Input
								placeholder="e.g. Cash payment calculation discrepancy on Stop #3"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="text-xs"
								required
							/>
						</div>

						<div className="space-y-1">
							<Label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
								Category *
							</Label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
							>
								{CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-1">
							<Label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
								Detailed Description *
							</Label>
							<textarea
								rows={4}
								placeholder="Provide specific details (order #, customer name, location, error message)..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="w-full rounded-md border border-input bg-transparent p-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
								required
							/>
						</div>

						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsNewTicketOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
								disabled={createTicketMutation.isPending}
							>
								{createTicketMutation.isPending ? (
									<RefreshCw className="h-4 w-4 animate-spin" />
								) : (
									<Plus className="h-4 w-4" />
								)}
								Submit Ticket
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal: Dispatch Hotline Contact */}
			<Dialog open={isDispatchModalOpen} onOpenChange={setIsDispatchModalOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<PhoneCall className="h-5 w-5 text-emerald-600" />
							Logistics Dispatch Hotline
						</DialogTitle>
						<DialogDescription className="text-xs">
							Direct telephone lines for active route assistance and emergency
							support.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-3">
						<div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
							<div className="font-medium text-emerald-800 text-xs dark:text-emerald-300">
								Branch Dispatch Desk Hotline:
							</div>
							<div className="mt-0.5 font-bold font-mono text-emerald-900 text-lg dark:text-emerald-100">
								{supportInfo?.dispatcherPhone || "+1 (800) 555-0199"}
							</div>
							<div className="mt-1 text-[11px] text-gray-500">
								Available 24/7 during active delivery shift hours.
							</div>
						</div>

						<div className="space-y-1.5 rounded-lg border bg-gray-50 p-3 text-xs dark:bg-gray-800">
							<div className="font-semibold text-gray-800 dark:text-gray-200">
								Emergency Protocols:
							</div>
							<ul className="list-disc space-y-1 pl-4 text-gray-600 dark:text-gray-400">
								<li>
									Vehicle Breakdown: Call hotline immediately &amp; hit
									breakdown button.
								</li>
								<li>
									Customer Refusal: Log returned item in handover page before
									leaving stop.
								</li>
							</ul>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
							onClick={() => {
								window.location.href = `tel:${supportInfo?.dispatcherPhone || "+18005550199"}`;
							}}
						>
							<PhoneCall className="h-4 w-4" /> Call Now
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
