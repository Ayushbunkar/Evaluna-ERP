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
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	ExternalLink,
	Eye,
	Heart,
	Layers,
	Plus,
	Video,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingContentPlannerPage() {
	const [viewType, setViewType] = useState<"MONTH" | "WEEK" | "DAY" | "AGENDA">("MONTH");
	const [currentDate, setCurrentDate] = useState(new Date());

	const trpc = useTRPC();
	const eventsQuery = trpc.instagram.getCalendarEvents.useQuery();

	const events = eventsQuery.data || [];

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth(); // 0 - 11

	// Month display calculations
	const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const prevMonth = () => {
		setCurrentDate(new Date(year, month - 1, 1));
	};

	const nextMonth = () => {
		setCurrentDate(new Date(year, month + 1, 1));
	};

	const monthName = currentDate.toLocaleString("en-IN", { month: "long" });

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Top Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Content Planner & Calendar
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Schedule posts, visualize upcoming campaigns, and avoid retail publishing gaps
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						size="sm"
						asChild
						className="h-8 gap-1.5 text-xs rounded-lg bg-primary text-primary-foreground shadow-xs"
					>
						<Link href="/marketing/create">
							<Plus className="h-3.5 w-3.5" />
							Schedule Post
						</Link>
					</Button>
				</div>
			</div>

			{/* Calendar Controls */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/70 bg-card p-3 shadow-xs">
				<div className="flex items-center gap-2">
					<h2 className="text-base font-bold text-foreground">
						{monthName} {year}
					</h2>
					<div className="flex items-center gap-1 ml-2">
						<Button
							variant="outline"
							size="icon"
							onClick={prevMonth}
							className="h-7 w-7 rounded-md"
						>
							<ChevronLeft className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={nextMonth}
							className="h-7 w-7 rounded-md"
						>
							<ChevronRight className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setCurrentDate(new Date())}
							className="h-7 text-xs px-2"
						>
							Today
						</Button>
					</div>
				</div>

				<div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 self-start sm:self-auto">
					{(["MONTH", "WEEK", "AGENDA"] as const).map((vt) => (
						<button
							key={vt}
							type="button"
							onClick={() => setViewType(vt)}
							className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
								viewType === vt
									? "bg-card text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{vt}
						</button>
					))}
				</div>
			</div>

			{/* Month Grid View */}
			{viewType === "MONTH" ? (
				<div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
					{/* Weekday headers */}
					<div className="grid grid-cols-7 border-b border-border/60 bg-muted/30 text-center text-xs font-semibold text-muted-foreground">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
							<div key={day} className="py-2.5 border-r border-border/40 last:border-0">
								{day}
							</div>
						))}
					</div>

					{/* Calendar Days */}
					<div className="grid grid-cols-7 divide-y divide-border/40">
						{/* Padding days for first week */}
						{Array.from({ length: firstDayIndex }).map((_, i) => (
							<div
								key={`pad-${i}`}
								className="min-h-[105px] border-r border-border/40 bg-muted/10 p-2 text-muted-foreground/40 last:border-0 text-xs"
							/>
						))}

						{/* Actual days */}
						{Array.from({ length: daysInMonth }).map((_, i) => {
							const dayNum = i + 1;
							const dateObj = new Date(year, month, dayNum);
							const isToday =
								new Date().toDateString() === dateObj.toDateString();

							// Find events on this date
							const dayEvents = events.filter((ev) => {
								if (!ev.date) return false;
								const evDate = new Date(ev.date);
								return (
									evDate.getFullYear() === year &&
									evDate.getMonth() === month &&
									evDate.getDate() === dayNum
								);
							});

							return (
								<div
									key={dayNum}
									className={`min-h-[110px] border-r border-border/40 p-1.5 last:border-0 transition-colors hover:bg-muted/20 relative group ${
										isToday ? "bg-primary/5" : ""
									}`}
								>
									<div className="flex items-center justify-between mb-1">
										<span
											className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
												isToday
													? "bg-primary text-primary-foreground"
													: "text-foreground"
											}`}
										>
											{dayNum}
										</span>

										<Link
											href={`/marketing/create`}
											className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-primary"
											title="Schedule on this day"
										>
											<Plus className="h-3 w-3" />
										</Link>
									</div>

									{/* Events List for Day */}
									<div className="space-y-1">
										{dayEvents.map((ev) => (
											<div
												key={ev.id}
												className={`rounded p-1 text-[10px] font-medium leading-tight flex items-center gap-1 truncate shadow-xs ${
													ev.status === "PUBLISHED"
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
														: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
												}`}
											>
												{ev.postType === "REEL" ? (
													<Video className="h-3 w-3 shrink-0" />
												) : (
													<Layers className="h-3 w-3 shrink-0" />
												)}
												<span className="truncate">{ev.title}</span>
											</div>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			) : (
				/* Agenda List View */
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-base font-semibold">
							Upcoming & Published Agenda
						</CardTitle>
						<CardDescription className="text-xs">
							Chronological publishing schedule for social media distribution
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{events.map((ev) => (
							<div
								key={ev.id}
								className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3"
							>
								<div className="flex items-center gap-3">
									<img
										src={ev.thumbnailUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"}
										alt=""
										className="h-12 w-12 rounded-lg object-cover ring-1 ring-border"
									/>
									<div>
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-[10px]">
												{ev.postType}
											</Badge>
											<Badge
												variant={ev.status === "PUBLISHED" ? "default" : "secondary"}
												className="text-[10px]"
											>
												{ev.status}
											</Badge>
										</div>
										<p className="line-clamp-1 font-medium text-xs text-foreground mt-1">
											{ev.fullCaption || "Untitled post"}
										</p>
									</div>
								</div>

								<div className="text-right text-xs text-muted-foreground">
									<p className="font-semibold text-foreground">
										{ev.date
											? new Date(ev.date).toLocaleDateString("en-IN", {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})
											: "No date set"}
									</p>
									{ev.status === "PUBLISHED" && (
										<p className="text-[10px] text-emerald-600">
											{(ev.reachCount || 0).toLocaleString()} reach
										</p>
									)}
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
