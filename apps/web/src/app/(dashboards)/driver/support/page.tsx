"use client";

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
			(selectedCategoryFilter === "Open" && ticket.status.toLowerCase() === "open") ||
			(selectedCategoryFilter === "Closed" && ticket.status.toLowerCase() === "closed") ||
			ticket.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase());

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
				<Badge variant="outline" className="gap-1 border-blue-400 bg-blue-50 text-blue-700 py-0.5 px-2">
					<AlertCircle className="h-3 w-3" /> Open
				</Badge>
			);
		}
		if (s === "in_progress" || s === "in progress") {
			return (
				<Badge variant="outline" className="gap-1 border-amber-400 bg-amber-50 text-amber-700 py-0.5 px-2">
					<Clock className="h-3 w-3" /> In Progress
				</Badge>
			);
		}
		return (
			<Badge variant="outline" className="gap-1 border-emerald-400 bg-emerald-50 text-emerald-700 py-0.5 px-2">
				<CheckCircle className="h-3 w-3" /> Closed
			</Badge>
		);
	};

	return (
		<PageTransition className="container mx-auto max-w-5xl py-6 space-y-6">
			{/* Top Bar Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-foreground text-2xl tracking-tight flex items-center gap-2">
						<Headphones className="h-6 w-6 text-blue-600" />
						Driver Support &amp; Dispatch
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
						Log technical/route issues, report payment disputes, or connect with dispatch.
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
						className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
						onClick={() => setIsNewTicketOpen(true)}
					>
						<Plus className="h-4 w-4" /> Create Support Ticket
					</Button>
				</div>
			</div>

			{/* Search & Filter Bar */}
			<Card className="shadow-sm border-gray-100 dark:border-gray-800">
				<CardContent className="p-4 space-y-3">
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search ticket title, ID, or description..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 text-xs"
							/>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{["All", "Open", "Closed", "Technical Support", "Finance / COD Support"].map((filter) => (
								<Button
									key={filter}
									type="button"
									variant={selectedCategoryFilter === filter ? "default" : "outline"}
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
						<MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
						<h3 className="font-semibold text-gray-700 dark:text-gray-300">
							No support tickets found
						</h3>
						<p className="text-xs text-gray-500 mt-1 max-w-sm">
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
							className="shadow-sm hover:shadow-md transition-all border-gray-200 dark:border-gray-800"
						>
							<CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2 border-b bg-gray-50/50 dark:bg-gray-800/40">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="font-mono text-[11px]">
											{ticket.id}
										</Badge>
										<CardTitle className="text-base font-bold text-gray-900 dark:text-white">
											{ticket.title}
										</CardTitle>
									</div>
									<CardDescription className="text-xs flex items-center gap-1.5 text-gray-500">
										<Wrench className="h-3 w-3" /> {ticket.category}
									</CardDescription>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-xs text-gray-500 font-mono">
										Logged: {ticket.createdAt}
									</span>
									{getStatusBadge(ticket.status)}
								</div>
							</CardHeader>
							<CardContent className="pt-3 space-y-3">
								<p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
									{ticket.description}
								</p>

								<div className="flex justify-between items-center pt-2 border-t text-xs">
									<span className="text-gray-500 text-[11px]">
										Assigned to: Central ERP Dispatch Desk
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs text-blue-600 hover:text-blue-700 gap-1"
										onClick={() => {
											toast.info(`Contacting dispatch regarding ticket ${ticket.id}...`);
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
							Submit a issue report directly to the Central ERP Logistics &amp; Finance Desk.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleCreateTicket} className="space-y-4 py-2">
						<div className="space-y-1">
							<Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
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
							<Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
								Category *
							</Label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
							>
								{CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
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
								className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
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
							Direct telephone lines for active route assistance and emergency support.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-3">
						<div className="rounded-lg border p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
							<div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
								Branch Dispatch Desk Hotline:
							</div>
							<div className="font-mono text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">
								{supportInfo?.dispatcherPhone || "+1 (800) 555-0199"}
							</div>
							<div className="text-[11px] text-gray-500 mt-1">
								Available 24/7 during active delivery shift hours.
							</div>
						</div>

						<div className="rounded-lg border p-3 bg-gray-50 text-xs space-y-1.5 dark:bg-gray-800">
							<div className="font-semibold text-gray-800 dark:text-gray-200">
								Emergency Protocols:
							</div>
							<ul className="list-disc pl-4 space-y-1 text-gray-600 dark:text-gray-400">
								<li>Vehicle Breakdown: Call hotline immediately &amp; hit breakdown button.</li>
								<li>Customer Refusal: Log returned item in handover page before leaving stop.</li>
							</ul>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
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
