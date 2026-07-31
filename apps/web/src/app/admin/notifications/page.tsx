"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertTriangle,
	Bell,
	BellRing,
	Calendar,
	CheckCheck,
	Clock,
	CreditCard,
	ExternalLink,
	Filter,
	Gift,
	Inbox,
	Info,
	Megaphone,
	Package,
	RefreshCw,
	Settings,
	ShoppingCart,
	Star,
	Truck,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

// ── Type Definitions ──────────────────────────────────────────────────────────
type NotifType =
	| "low_stock"
	| "expiry"
	| "damage"
	| "purchase"
	| "sale"
	| "payment_due"
	| "birthday"
	| "loyalty"
	| "campaign"
	| "info"
	| "warning"
	| "error";

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
	NotifType,
	{
		icon: React.ElementType;
		color: string;
		bg: string;
		border: string;
		label: string;
	}
> = {
	low_stock: {
		icon: Package,
		color: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
		label: "Low Stock",
	},
	expiry: {
		icon: Calendar,
		color: "text-orange-400",
		bg: "bg-orange-500/10",
		border: "border-orange-500/20",
		label: "Expiry",
	},
	damage: {
		icon: XCircle,
		color: "text-red-400",
		bg: "bg-red-500/10",
		border: "border-red-500/20",
		label: "Damage",
	},
	purchase: {
		icon: Truck,
		color: "text-blue-400",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		label: "Purchase",
	},
	sale: {
		icon: ShoppingCart,
		color: "text-emerald-400",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
		label: "Sale",
	},
	payment_due: {
		icon: CreditCard,
		color: "text-rose-400",
		bg: "bg-rose-500/10",
		border: "border-rose-500/20",
		label: "Payment Due",
	},
	birthday: {
		icon: Gift,
		color: "text-pink-400",
		bg: "bg-pink-500/10",
		border: "border-pink-500/20",
		label: "Birthday",
	},
	loyalty: {
		icon: Star,
		color: "text-yellow-400",
		bg: "bg-yellow-500/10",
		border: "border-yellow-500/20",
		label: "Loyalty",
	},
	campaign: {
		icon: Megaphone,
		color: "text-purple-400",
		bg: "bg-purple-500/10",
		border: "border-purple-500/20",
		label: "Campaign",
	},
	info: {
		icon: Info,
		color: "text-cyan-400",
		bg: "bg-cyan-500/10",
		border: "border-cyan-500/20",
		label: "Info",
	},
	warning: {
		icon: AlertTriangle,
		color: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
		label: "Warning",
	},
	error: {
		icon: XCircle,
		color: "text-red-400",
		bg: "bg-red-500/10",
		border: "border-red-500/20",
		label: "Error",
	},
};

const PRIORITY_BADGE: Record<string, string> = {
	critical: "bg-red-500 text-white",
	high: "bg-orange-500 text-white",
	normal: "bg-slate-600 text-slate-200",
	low: "bg-slate-700 text-slate-400",
};

function timeAgo(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	const diff = (Date.now() - d.getTime()) / 1000;
	if (diff < 60) return "Just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
}

// ── Notification Card ─────────────────────────────────────────────────────────
function NotificationCard({
	notif,
	onMarkRead,
}: {
	notif: any;
	onMarkRead: (id: number) => void;
}) {
	const cfg = TYPE_CONFIG[notif.type as NotifType] ?? TYPE_CONFIG.info;
	const Icon = cfg.icon;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			className={`flex gap-4 rounded-xl border p-4 transition-all duration-200 ${
				notif.is_read
					? "border-white/5 bg-slate-800/30 opacity-70"
					: `${cfg.bg} ${cfg.border} border`
			}`}
		>
			<div
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} border ${cfg.border}`}
			>
				<Icon className={`h-5 w-5 ${cfg.color}`} />
			</div>

			<div className="min-w-0 flex-1">
				<div className="mb-1 flex items-start justify-between gap-2">
					<p
						className={`truncate font-semibold text-sm ${notif.is_read ? "text-slate-400" : "text-white"}`}
					>
						{notif.title}
					</p>
					<div className="flex shrink-0 items-center gap-2">
						{notif.priority && notif.priority !== "normal" && (
							<span
								className={`rounded px-1.5 py-0.5 font-medium text-xs ${PRIORITY_BADGE[notif.priority]}`}
							>
								{notif.priority}
							</span>
						)}
						{!notif.is_read && (
							<button
								onClick={() => onMarkRead(notif.id)}
								title="Mark as read"
								className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
							>
								<CheckCheck className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
				</div>
				<p className="line-clamp-2 text-slate-400 text-sm">{notif.message}</p>
				<div className="mt-2 flex items-center gap-3">
					<span
						className={`rounded-full px-2 py-0.5 text-xs ${cfg.bg} ${cfg.color} font-medium`}
					>
						{cfg.label}
					</span>
					<span className="flex items-center gap-1 text-slate-500 text-xs">
						<Clock className="h-3 w-3" />
						{timeAgo(notif.created_at)}
					</span>
					{notif.reference_type && (
						<span className="flex items-center gap-1 text-slate-500 text-xs">
							<ExternalLink className="h-3 w-3" />
							{notif.reference_type} #{notif.reference_id}
						</span>
					)}
				</div>
			</div>
		</motion.div>
	);
}

// ── Preferences Panel ─────────────────────────────────────────────────────────
const PREF_TYPES: NotifType[] = [
	"low_stock",
	"expiry",
	"damage",
	"purchase",
	"sale",
	"payment_due",
	"birthday",
	"loyalty",
	"campaign",
];

const CHANNELS = [
	{ key: "in_app_enabled", label: "In-App", icon: Bell },
	{ key: "email_enabled", label: "Email", icon: Info },
	{ key: "sms_enabled", label: "SMS", icon: BellRing },
	{ key: "whatsapp_enabled", label: "WhatsApp", icon: Megaphone },
	{ key: "push_enabled", label: "Push", icon: BellRing },
];

function PreferencesPanel() {
	const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>(
		() => {
			const init: Record<string, Record<string, boolean>> = {};
			PREF_TYPES.forEach((t) => {
				init[t] = {
					in_app_enabled: true,
					email_enabled: true,
					sms_enabled: false,
					whatsapp_enabled: false,
					push_enabled: true,
				};
			});
			return init;
		},
	);
	const savePref = trpc.notifications.savePreference.useMutation();

	const toggle = (type: NotifType, channel: string) => {
		setPrefs((p) => ({
			...p,
			[type]: { ...p[type], [channel]: !p[type][channel] },
		}));
	};

	const handleSave = async () => {
		for (const type of PREF_TYPES) {
			await savePref.mutateAsync({ userId: 1, type, ...prefs[type] } as any);
		}
	};

	return (
		<div className="space-y-4">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="font-semibold text-white">Notification Preferences</h3>
				<button
					onClick={handleSave}
					disabled={savePref.isPending}
					className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
				>
					{savePref.isPending ? "Saving…" : "Save Preferences"}
				</button>
			</div>

			<div className="overflow-x-auto rounded-xl border border-white/10">
				<table className="w-full min-w-[600px] text-sm">
					<thead className="bg-slate-700/40">
						<tr>
							<th className="px-4 py-3 text-left font-medium text-slate-300">
								Alert Type
							</th>
							{CHANNELS.map((c) => (
								<th
									key={c.key}
									className="px-4 py-3 text-center font-medium text-slate-300"
								>
									{c.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{PREF_TYPES.map((type, i) => {
							const cfg = TYPE_CONFIG[type];
							const Icon = cfg.icon;
							return (
								<tr
									key={type}
									className={`border-white/5 border-t ${i % 2 === 0 ? "bg-slate-800/20" : ""}`}
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<Icon className={`h-4 w-4 ${cfg.color}`} />
											<span className="text-white">{cfg.label}</span>
										</div>
									</td>
									{CHANNELS.map((c) => (
										<td key={c.key} className="px-4 py-3 text-center">
											<button
												onClick={() => toggle(type, c.key)}
												className={`relative h-5 w-10 rounded-full transition-colors ${
													prefs[type]?.[c.key]
														? "bg-violet-600"
														: "bg-slate-600"
												}`}
											>
												<span
													className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
														prefs[type]?.[c.key]
															? "translate-x-5"
															: "translate-x-0.5"
													}`}
												/>
											</button>
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className="rounded-xl border border-white/5 bg-slate-700/30 p-3 text-slate-400 text-sm">
				<p className="flex items-center gap-2">
					<Info className="h-4 w-4 shrink-0 text-cyan-400" />
					SMS and WhatsApp require API configuration in your environment
					variables. Push notifications require FCM setup.
				</p>
			</div>
		</div>
	);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = "center" | "preferences" | "queue";

export default function NotificationsPage() {
	const [tab, setTab] = useState<Tab>("center");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [readFilter, setReadFilter] = useState<string>("all");

	const {
		data: notifData,
		refetch,
		isLoading,
	} = trpc.notifications.list.useQuery(
		{
			is_read:
				readFilter === "unread"
					? false
					: readFilter === "read"
						? true
						: undefined,
			limit: 100,
		},
		{ refetchInterval: 30_000 },
	);

	const { data: countData } = trpc.notifications.unreadCount.useQuery(
		{},
		{ refetchInterval: 15_000 },
	);

	const markAsRead = trpc.notifications.markAsRead.useMutation({
		onSuccess: () => refetch(),
	});
	const markAllRead = trpc.notifications.markAllAsRead.useMutation({
		onSuccess: () => refetch(),
	});
	const processQueue = trpc.notifications.processQueue.useMutation();

	const { data: queueData } = trpc.notifications.listQueue.useQuery({
		limit: 50,
	});

	const notifications = (notifData ?? []).filter(
		(n: any) => typeFilter === "all" || n.type === typeFilter,
	);

	const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
		{ id: "center", label: "Notification Center", icon: Bell },
		{ id: "preferences", label: "Preferences", icon: Settings },
		{ id: "queue", label: "Delivery Queue", icon: Inbox },
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="mx-auto max-w-5xl"
			>
				{/* Header */}
				<div className="mb-8 flex items-start justify-between">
					<div>
						<h1 className="flex items-center gap-3 font-bold text-3xl text-white">
							<div className="relative">
								<div className="rounded-xl border border-violet-500/30 bg-violet-600/20 p-2">
									<Bell className="h-7 w-7 text-violet-400" />
								</div>
								{(countData?.count ?? 0) > 0 && (
									<motion.span
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs"
									>
										{countData?.count}
									</motion.span>
								)}
							</div>
							Notifications
						</h1>
						<p className="mt-1 text-slate-400">
							{countData?.count ? (
								<span className="font-medium text-amber-400">
									{countData.count} unread
								</span>
							) : (
								"All caught up"
							)}
							{" · "}Unified multi-channel alert center
						</p>
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => refetch()}
							className="rounded-lg border border-slate-600/50 bg-slate-700/50 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
							title="Refresh"
						>
							<RefreshCw className="h-4 w-4" />
						</button>
						{(countData?.count ?? 0) > 0 && (
							<button
								onClick={() => markAllRead.mutate({})}
								className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-600/20 px-4 py-2 text-sm text-violet-300 transition-colors hover:bg-violet-600/30"
							>
								<CheckCheck className="h-4 w-4" /> Mark All Read
							</button>
						)}
					</div>
				</div>

				{/* Tabs */}
				<div className="mb-6 flex w-fit gap-1 rounded-xl border border-white/10 bg-slate-800/60 p-1">
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							onClick={() => setTab(id)}
							className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-all ${
								tab === id
									? "bg-violet-600 text-white"
									: "text-slate-400 hover:bg-white/5 hover:text-white"
							}`}
						>
							<Icon className="h-4 w-4" />
							{label}
						</button>
					))}
				</div>

				{/* Content */}
				<AnimatePresence mode="wait">
					{/* ── Notification Center ── */}
					{tab === "center" && (
						<motion.div
							key="center"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							{/* Filters */}
							<div className="mb-5 flex flex-wrap gap-3">
								<div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/60 p-1">
									{["all", "unread", "read"].map((f) => (
										<button
											key={f}
											onClick={() => setReadFilter(f)}
											className={`rounded-md px-3 py-1.5 font-medium text-sm capitalize transition-colors ${
												readFilter === f
													? "bg-violet-600 text-white"
													: "text-slate-400 hover:text-white"
											}`}
										>
											{f}
										</button>
									))}
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Filter className="h-4 w-4 text-slate-500" />
									{["all", ...Object.keys(TYPE_CONFIG)].map((t) => {
										const cfg =
											t !== "all" ? TYPE_CONFIG[t as NotifType] : null;
										return (
											<button
												key={t}
												onClick={() => setTypeFilter(t)}
												className={`rounded-lg border px-3 py-1 font-medium text-xs capitalize transition-colors ${
													typeFilter === t
														? `${cfg?.bg ?? "bg-violet-600/20"} ${cfg?.color ?? "text-violet-300"} ${cfg?.border ?? "border-violet-500/30"}`
														: "border-white/5 bg-slate-800/40 text-slate-500 hover:border-white/20"
												}`}
											>
												{t === "all" ? "All Types" : cfg?.label}
											</button>
										);
									})}
								</div>
							</div>

							{/* Notification List */}
							{isLoading ? (
								<div className="space-y-3">
									{[...Array(5)].map((_, i) => (
										<div
											key={i}
											className="h-20 animate-pulse rounded-xl bg-slate-800/40"
										/>
									))}
								</div>
							) : notifications.length === 0 ? (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="py-20 text-center"
								>
									<Bell className="mx-auto mb-4 h-16 w-16 text-slate-600" />
									<p className="font-semibold text-lg text-white">
										No notifications
									</p>
									<p className="mt-1 text-slate-400">You're all caught up!</p>
								</motion.div>
							) : (
								<div className="space-y-2">
									<AnimatePresence>
										{notifications.map((n: any) => (
											<NotificationCard
												key={n.id}
												notif={n}
												onMarkRead={(id) => markAsRead.mutate({ id })}
											/>
										))}
									</AnimatePresence>
								</div>
							)}
						</motion.div>
					)}

					{/* ── Preferences ── */}
					{tab === "preferences" && (
						<motion.div
							key="preferences"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-xl"
						>
							<PreferencesPanel />
						</motion.div>
					)}

					{/* ── Queue ── */}
					{tab === "queue" && (
						<motion.div
							key="queue"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-xl">
								<div className="mb-4 flex items-center justify-between">
									<h3 className="font-semibold text-white">Delivery Queue</h3>
									<button
										onClick={() => processQueue.mutate()}
										disabled={processQueue.isPending}
										className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
									>
										{processQueue.isPending ? (
											<>
												<RefreshCw className="h-4 w-4 animate-spin" />{" "}
												Processing…
											</>
										) : (
											<>
												<RefreshCw className="h-4 w-4" /> Process Queue
											</>
										)}
									</button>
								</div>
								<div className="overflow-x-auto rounded-xl border border-white/5">
									<table className="w-full text-sm">
										<thead className="bg-slate-700/40">
											<tr>
												{[
													"ID",
													"Channel",
													"Recipient",
													"Status",
													"Retries",
													"Created",
												].map((h) => (
													<th
														key={h}
														className="px-4 py-3 text-left font-medium text-slate-300"
													>
														{h}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{(queueData ?? []).length === 0 ? (
												<tr>
													<td
														colSpan={6}
														className="px-4 py-8 text-center text-slate-500"
													>
														Queue is empty
													</td>
												</tr>
											) : (
												(queueData ?? []).map((item: any) => (
													<tr
														key={item.id}
														className="border-white/5 border-t hover:bg-white/5"
													>
														<td className="px-4 py-3 font-mono text-slate-400">
															#{item.id}
														</td>
														<td className="px-4 py-3 text-white capitalize">
															{item.channel}
														</td>
														<td className="max-w-[180px] truncate px-4 py-3 text-slate-300">
															{item.recipient}
														</td>
														<td className="px-4 py-3">
															<span
																className={`rounded-full px-2 py-0.5 font-medium text-xs ${
																	item.status === "sent"
																		? "bg-emerald-500/20 text-emerald-300"
																		: item.status === "failed"
																			? "bg-red-500/20 text-red-300"
																			: item.status === "processing"
																				? "bg-blue-500/20 text-blue-300"
																				: "bg-slate-600/40 text-slate-400"
																}`}
															>
																{item.status}
															</span>
														</td>
														<td className="px-4 py-3 text-slate-400">
															{item.retry_count ?? 0}
														</td>
														<td className="px-4 py-3 text-slate-500 text-xs">
															{timeAgo(item.created_at)}
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}
