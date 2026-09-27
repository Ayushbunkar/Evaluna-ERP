"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	Bell,
	Box,
	Calendar,
	Check,
	CheckCheck,
	CheckSquare,
	Clock,
	CreditCard,
	FileText,
	HelpCircle,
	IndianRupee,
	Info,
	Loader2,
	Package,
	Package2,
	Receipt,
	ShieldAlert,
	ShieldCheck,
	ShoppingCart,
	Store,
	Tag,
	TrendingDown,
	Truck,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { normalizeRole } from "@/lib/permissions";
import { useTRPC } from "@/lib/trpc/client";

export interface NotificationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Format relative time (e.g., 'Just now', '5m ago', '2h ago', 'Yesterday')
 */
function formatRelativeTime(dateInput?: Date | string | null, locale = "en"): string {
	if (!dateInput) return "";
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.max(0, Math.floor(diffMs / 1000));
	const diffMin = Math.floor(diffSec / 60);
	const diffHours = Math.floor(diffMin / 60);
	const diffDays = Math.floor(diffHours / 24);

	const isHi = locale === "hi";

	if (diffSec < 45) {
		return isHi ? "अभी-अभी" : "Just now";
	}
	if (diffMin < 60) {
		return isHi ? `${diffMin} मिनट पहले` : `${diffMin}m ago`;
	}
	if (diffHours < 24) {
		return isHi ? `${diffHours} घंटे पहले` : `${diffHours}h ago`;
	}
	if (diffDays === 1) {
		return isHi ? "कल" : "Yesterday";
	}
	if (diffDays < 7) {
		return isHi ? `${diffDays} दिन पहले` : `${diffDays}d ago`;
	}
	return date.toLocaleDateString(isHi ? "hi-IN" : "en-IN", {
		month: "short",
		day: "numeric",
	});
}

/**
 * Extract localized string from bilingual "EN | HI" formatted messages
 */
function formatBilingualText(text?: string | null, locale = "en"): string {
	if (!text) return "";
	if (text.includes(" | ")) {
		const parts = text.split(" | ");
		if (locale === "hi" && parts[1]) {
			return parts[1].trim();
		}
		return parts[0].trim();
	}
	return text;
}

/**
 * Get role-specific title & header styling
 */
function getRoleHeaderDetails(rawRole?: string) {
	const role = normalizeRole(rawRole || "");
	switch (role) {
		case "sales_person":
			return {
				title: "Sales Inbox",
				subtitle: "Customer orders, price reviews, and callback requests",
				badgeText: "Sales",
				badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
			};
		case "picker":
			return {
				title: "Picker Queue",
				subtitle: "Assigned picklists, item checklists, and priority tasks",
				badgeText: "Picker",
				badgeClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
			};
		case "packer":
			return {
				title: "Packer Station",
				subtitle: "Packing tasks, item verifications, and shipping boxes",
				badgeText: "Packer",
				badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
			};
		case "driver":
			return {
				title: "Driver Route Updates",
				subtitle: "Dispatched trips, delivery stops, and customer handovers",
				badgeText: "Driver",
				badgeClass: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
			};
		case "finance":
			return {
				title: "Finance & Accounts",
				subtitle: "Driver collections, reconciliations, invoices, and payment verifications",
				badgeText: "Finance",
				badgeClass: "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
			};
		case "manager":
		case "warehouse_supervisor":
			return {
				title: "Manager Alerts",
				subtitle: "Approvals, escalations, staff attendance, and branch operations",
				badgeText: "Manager",
				badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
			};
		case "auditor":
			return {
				title: "Auditor Center",
				subtitle: "Discrepancy findings, price changes, inspections, and verifications",
				badgeText: "Auditor",
				badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
			};
		case "hr":
			return {
				title: "HR Notifications",
				subtitle: "Staff attendance, leave requests, and payroll updates",
				badgeText: "HR",
				badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
			};
		case "admin":
		case "super_admin":
			return {
				title: "Admin Notifications",
				subtitle: "System alerts, business events, security exceptions, and global activities",
				badgeText: "Admin",
				badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
			};
		default:
			return {
				title: "Notifications Inbox",
				subtitle: "Activities and workflow updates targeted to your account",
				badgeText: "Account",
				badgeClass: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
			};
	}
}

/**
 * Determine icon & colors for a notification category
 */
function getNotificationVisuals(notif: any) {
	const type = (notif.type || "").toLowerCase();
	const refType = (notif.reference_type || "").toLowerCase();
	const title = (notif.title || "").toLowerCase();

	if (
		type.includes("pick") ||
		refType.includes("pick") ||
		title.includes("pick")
	) {
		return {
			icon: <CheckSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />,
			bg: "bg-cyan-100 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800",
		};
	}
	if (
		type.includes("pack") ||
		refType.includes("package") ||
		title.includes("pack")
	) {
		return {
			icon: <Box className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
			bg: "bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
		};
	}
	if (
		type.includes("deliver") ||
		type.includes("driver") ||
		type.includes("trip") ||
		refType.includes("trip") ||
		title.includes("trip") ||
		title.includes("deliver")
	) {
		return {
			icon: <Truck className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
			bg: "bg-sky-100 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800",
		};
	}
	if (
		type.includes("sale") ||
		type.includes("order") ||
		type.includes("pos") ||
		type.includes("customer") ||
		refType.includes("order")
	) {
		return {
			icon: <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
			bg: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
		};
	}
	if (
		type.includes("finance") ||
		type.includes("payment") ||
		type.includes("cash") ||
		type.includes("invoice") ||
		title.includes("collect") ||
		title.includes("₹")
	) {
		return {
			icon: <IndianRupee className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
			bg: "bg-teal-100 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800",
		};
	}
	if (
		type.includes("approval") ||
		type.includes("manager") ||
		refType.includes("approval")
	) {
		return {
			icon: <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
			bg: "bg-purple-100 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800",
		};
	}
	if (
		type.includes("low_stock") ||
		type.includes("warning") ||
		type.includes("damage") ||
		title.includes("shortage")
	) {
		return {
			icon: <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
			bg: "bg-yellow-100 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800",
		};
	}
	if (type.includes("error") || notif.priority === "critical") {
		return {
			icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
			bg: "bg-rose-100 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
		};
	}

	return {
		icon: <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
		bg: "bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
	};
}

/**
 * Determine navigation action link based on reference type and role
 */
function getActionDetails(notif: any, rawRole?: string) {
	const role = normalizeRole(rawRole || "");
	const refType = (notif.reference_type || "").toLowerCase();
	const refId = notif.reference_id;
	const type = (notif.type || "").toLowerCase();
	const title = (notif.title || "").toLowerCase();

	if (refType === "orders" || refType === "order" || type.includes("order") || type.includes("sale")) {
		if (role === "picker") {
			return { href: refId ? `/picker/active?id=${refId}` : "/picker/pending", label: "Open Pick Task" };
		}
		if (role === "packer") {
			return { href: "/packer", label: "Open Packing" };
		}
		if (role === "sales_person") {
			return { href: refId ? `/sales/orders` : "/sales/orders", label: "Review Order" };
		}
		if (role === "driver") {
			return { href: "/driver", label: "View Deliveries" };
		}
		if (role === "finance") {
			return { href: "/finance/reconciliation", label: "View Payment" };
		}
		return { href: "/sales/orders", label: "View Order" };
	}

	if (refType === "pick_lists" || refType === "pick_list" || type.includes("picking")) {
		return { href: refId ? `/picker/active?id=${refId}` : "/picker/pending", label: "Open Pick Task" };
	}

	if (refType === "packages" || refType === "package" || type.includes("packing")) {
		return { href: "/packer", label: "Open Packing Station" };
	}

	if (refType === "trips" || refType === "delivery_trips" || type.includes("trip") || type.includes("delivery")) {
		if (role === "driver") {
			return { href: "/driver", label: "Open My Route" };
		}
		return { href: "/manager/dispatch", label: "View Trip" };
	}

	if (refType === "approvals" || type.includes("approval")) {
		return { href: role === "admin" ? "/admin/approvals" : "/manager/approvals", label: "Review Approval" };
	}

	if (refType === "audit_findings" || type.includes("audit")) {
		return { href: "/auditor/findings", label: "View Finding" };
	}

	if (type === "low_stock" || type === "expiry") {
		return { href: "/inventory", label: "View Stock" };
	}

	return null;
}

export function NotificationModal({ open, onOpenChange }: NotificationModalProps) {
	const router = useRouter();
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	let locale = "en";
	try {
		locale = useLocale();
	} catch {
		// Fallback
	}

	const sessionData = useSession();
	const user = sessionData.session?.user;
	const userRole = (user as any)?.role || "";
	const headerDetails = getRoleHeaderDetails(userRole);

	const [filterTab, setFilterTab] = useState<"all" | "unread">("all");

	// Query notifications scoped to user & role
	const {
		data: notificationsList = [],
		isLoading,
		isFetching,
		refetch,
	} = trpc.notifications.list.useQuery(
		{ limit: 40 },
		{ enabled: open, refetchInterval: 15000, refetchOnWindowFocus: true },
	);

	const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
		onSuccess: () => {
			utils.notifications.unreadCount.invalidate();
			void refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to mark as read");
		},
	});

	const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
		onSuccess: () => {
			toast.success("All notifications marked as read.");
			utils.notifications.unreadCount.invalidate();
			void refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to mark all as read");
		},
	});

	const unreadCount = useMemo(() => {
		return notificationsList.filter((n) => !n.is_read).length;
	}, [notificationsList]);

	const filteredList = useMemo(() => {
		if (filterTab === "unread") {
			return notificationsList.filter((n) => !n.is_read);
		}
		return notificationsList;
	}, [notificationsList, filterTab]);

	const handleItemClick = (notif: any) => {
		if (!notif.is_read) {
			markAsReadMutation.mutate({ id: notif.id });
		}
	};

	const handleActionClick = (notif: any, href: string) => {
		if (!notif.is_read) {
			markAsReadMutation.mutate({ id: notif.id });
		}
		onOpenChange(false);
		router.push(href);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] max-w-lg p-0 sm:max-w-xl flex flex-col gap-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
				{/* Top Header */}
				<div className="border-border/40 border-b p-4 sm:p-5 bg-card/60">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
								<Bell className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<DialogTitle className="font-bold text-base sm:text-lg tracking-tight">
										{headerDetails.title}
									</DialogTitle>
									<Badge
										variant="outline"
										className={`text-[10px] font-semibold uppercase tracking-wider py-0 px-2 h-5 ${headerDetails.badgeClass}`}
									>
										{headerDetails.badgeText}
									</Badge>
								</div>
								<DialogDescription className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
									{headerDetails.subtitle}
								</DialogDescription>
							</div>
						</div>

						{unreadCount > 0 && (
							<Button
								variant="outline"
								size="sm"
								className="h-8 px-2.5 text-xs gap-1.5 shrink-0 bg-background/80 hover:bg-accent hover:text-accent-foreground border-border/60 shadow-xs"
								disabled={markAllAsReadMutation.isPending}
								onClick={() => markAllAsReadMutation.mutate({})}
								title="Mark all as read"
							>
								{markAllAsReadMutation.isPending ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<CheckCheck className="h-3.5 w-3.5 text-primary" />
								)}
								<span className="hidden sm:inline">Mark all read</span>
								<span className="sm:hidden">All read</span>
							</Button>
						)}
					</div>

					{/* Filter Tabs */}
					<div className="flex items-center gap-2 mt-3 pt-2 border-border/30 border-t">
						<button
							type="button"
							onClick={() => setFilterTab("all")}
							className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
								filterTab === "all"
									? "bg-primary text-primary-foreground shadow-xs"
									: "bg-muted/60 text-muted-foreground hover:bg-muted"
							}`}
						>
							All ({notificationsList.length})
						</button>
						<button
							type="button"
							onClick={() => setFilterTab("unread")}
							className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
								filterTab === "unread"
									? "bg-primary text-primary-foreground shadow-xs"
									: "bg-muted/60 text-muted-foreground hover:bg-muted"
							}`}
						>
							<span>Unread</span>
							{unreadCount > 0 && (
								<span
									className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
										filterTab === "unread"
											? "bg-primary-foreground text-primary"
											: "bg-red-500 text-white"
									}`}
								>
									{unreadCount}
								</span>
							)}
						</button>
						{isFetching && !isLoading && (
							<span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
								<Loader2 className="h-3 w-3 animate-spin" /> Updating...
							</span>
						)}
					</div>
				</div>

				{/* Notifications Scrollable List */}
				<div className="flex-1 overflow-y-auto max-h-[50vh] sm:max-h-[54vh] divide-y divide-border/30 p-2 sm:p-3 space-y-1.5">
					{isLoading ? (
						<div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
							<Loader2 className="h-6 w-6 animate-spin text-primary" />
							<span className="text-xs">Loading notifications...</span>
						</div>
					) : filteredList.length > 0 ? (
						filteredList.map((notif: any) => {
							const visuals = getNotificationVisuals(notif);
							const action = getActionDetails(notif, userRole);
							const timeStr = formatRelativeTime(notif.created_at, locale);
							const localizedMessage = formatBilingualText(notif.message, locale);
							const isHighPriority =
								notif.priority === "high" || notif.priority === "critical";

							return (
								<div
									key={notif.id}
									onClick={() => handleItemClick(notif)}
									className={`group relative flex items-start gap-3 rounded-xl p-3 text-xs sm:text-sm transition-all border ${
										notif.is_read
											? "border-transparent bg-transparent hover:bg-muted/40"
											: "border-primary/20 bg-primary/5 shadow-xs hover:bg-primary/10"
									}`}
								>
									{/* Category Icon */}
									<div
										className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border ${visuals.bg} shadow-xs mt-0.5`}
									>
										{visuals.icon}
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0 space-y-1">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-1.5 min-w-0">
												{!notif.is_read && (
													<span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
												)}
												<h4
													className={`truncate font-semibold text-xs sm:text-sm ${
														notif.is_read ? "text-foreground/80" : "text-foreground"
													}`}
												>
													{notif.title}
												</h4>
											</div>

											<div className="flex items-center gap-1.5 shrink-0">
												{isHighPriority && (
													<Badge
														variant="outline"
														className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border-rose-500/20"
													>
														{notif.priority}
													</Badge>
												)}
												<span className="text-[10px] text-muted-foreground flex items-center gap-1">
													<Clock className="h-2.5 w-2.5 opacity-70" />
													{timeStr}
												</span>
											</div>
										</div>

										{localizedMessage && (
											<p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
												{localizedMessage}
											</p>
										)}

										{/* Action Button & Mark Read */}
										<div className="flex items-center justify-between pt-1 gap-2">
											{action ? (
												<Button
													type="button"
													variant="default"
													size="xs"
													onClick={(e) => {
														e.stopPropagation();
														handleActionClick(notif, action.href);
													}}
													className="h-6 px-2 text-[11px] font-medium gap-1 rounded-md shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
												>
													<span>{action.label}</span>
													<ArrowRight className="h-3 w-3" />
												</Button>
											) : <div />}

											{!notif.is_read && (
												<Button
													type="button"
													variant="ghost"
													size="xs"
													onClick={(e) => {
														e.stopPropagation();
														markAsReadMutation.mutate({ id: notif.id });
													}}
													disabled={markAsReadMutation.isPending}
													className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground opacity-80 group-hover:opacity-100"
													title="Mark as read"
												>
													<Check className="h-3 w-3 mr-1 text-emerald-500" />
													<span>Mark read</span>
												</Button>
											)}
										</div>
									</div>
								</div>
							);
						})
					) : (
						/* Empty State */
						<div className="flex h-52 flex-col items-center justify-center gap-2.5 text-center p-6 text-muted-foreground">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/40">
								<Bell className="h-7 w-7 text-muted-foreground/50" />
							</div>
							<div className="space-y-0.5">
								<p className="font-semibold text-sm text-foreground">
									{filterTab === "unread"
										? "No unread notifications"
										: "No notifications yet"}
								</p>
								<p className="text-xs text-muted-foreground max-w-[280px]">
									{filterTab === "unread"
										? "You've read all your updates! Check back later for new alerts."
										: `You're all caught up! Updates relevant to your ${headerDetails.badgeText} workflow will appear here.`}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<DialogFooter className="border-border/40 border-t p-3 sm:p-4 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
					<span className="text-[11px] text-muted-foreground">
						Showing {filteredList.length} of {notificationsList.length} updates
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						className="h-8 px-4 text-xs font-medium"
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
