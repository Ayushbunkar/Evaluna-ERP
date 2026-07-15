"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  CheckCheck,
  Filter,
  AlertTriangle,
  Package,
  ShoppingCart,
  CreditCard,
  Gift,
  Star,
  Megaphone,
  Info,
  XCircle,
  Calendar,
  Truck,
  Clock,
  ExternalLink,
  Settings,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// ── Type Definitions ──────────────────────────────────────────────────────────
type NotifType =
  | "low_stock" | "expiry" | "damage" | "purchase" | "sale"
  | "payment_due" | "birthday" | "loyalty" | "campaign" | "info" | "warning" | "error";

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotifType, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  low_stock:   { icon: Package,     color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  label: "Low Stock" },
  expiry:      { icon: Calendar,    color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Expiry" },
  damage:      { icon: XCircle,     color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    label: "Damage" },
  purchase:    { icon: Truck,       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   label: "Purchase" },
  sale:        { icon: ShoppingCart,color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",label: "Sale" },
  payment_due: { icon: CreditCard,  color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20",   label: "Payment Due" },
  birthday:    { icon: Gift,        color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/20",   label: "Birthday" },
  loyalty:     { icon: Star,        color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Loyalty" },
  campaign:    { icon: Megaphone,   color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Campaign" },
  info:        { icon: Info,        color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   label: "Info" },
  warning:     { icon: AlertTriangle,color:"text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  label: "Warning" },
  error:       { icon: XCircle,     color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    label: "Error" },
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high:     "bg-orange-500 text-white",
  normal:   "bg-slate-600 text-slate-200",
  low:      "bg-slate-700 text-slate-400",
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
      className={`flex gap-4 p-4 rounded-xl border transition-all duration-200 ${
        notif.is_read
          ? "bg-slate-800/30 border-white/5 opacity-70"
          : `${cfg.bg} ${cfg.border} border`
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`font-semibold text-sm truncate ${notif.is_read ? "text-slate-400" : "text-white"}`}>
            {notif.title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {notif.priority && notif.priority !== "normal" && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PRIORITY_BADGE[notif.priority]}`}>
                {notif.priority}
              </span>
            )}
            {!notif.is_read && (
              <button
                onClick={() => onMarkRead(notif.id)}
                title="Mark as read"
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-slate-400 text-sm line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
            {cfg.label}
          </span>
          <span className="text-slate-500 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(notif.created_at)}
          </span>
          {notif.reference_type && (
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
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
  "low_stock", "expiry", "damage", "purchase", "sale",
  "payment_due", "birthday", "loyalty", "campaign",
];

const CHANNELS = [
  { key: "in_app_enabled",     label: "In-App",   icon: Bell },
  { key: "email_enabled",      label: "Email",    icon: Info },
  { key: "sms_enabled",        label: "SMS",      icon: BellRing },
  { key: "whatsapp_enabled",   label: "WhatsApp", icon: Megaphone },
  { key: "push_enabled",       label: "Push",     icon: BellRing },
];

function PreferencesPanel() {
  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    PREF_TYPES.forEach((t) => {
      init[t] = { in_app_enabled: true, email_enabled: true, sms_enabled: false, whatsapp_enabled: false, push_enabled: true };
    });
    return init;
  });
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Notification Preferences</h3>
        <button
          onClick={handleSave}
          disabled={savePref.isPending}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {savePref.isPending ? "Saving…" : "Save Preferences"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-700/40">
            <tr>
              <th className="text-left px-4 py-3 text-slate-300 font-medium">Alert Type</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="text-center px-4 py-3 text-slate-300 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PREF_TYPES.map((type, i) => {
              const cfg = TYPE_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <tr key={type} className={`border-t border-white/5 ${i % 2 === 0 ? "bg-slate-800/20" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className="text-white">{cfg.label}</span>
                    </div>
                  </td>
                  {CHANNELS.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(type, c.key)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          prefs[type]?.[c.key] ? "bg-violet-600" : "bg-slate-600"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            prefs[type]?.[c.key] ? "translate-x-5" : "translate-x-0.5"
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

      <div className="p-3 rounded-xl bg-slate-700/30 border border-white/5 text-sm text-slate-400">
        <p className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          SMS and WhatsApp require API configuration in your environment variables. Push notifications require FCM setup.
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

  const { data: notifData, refetch, isLoading } = trpc.notifications.list.useQuery({
    is_read: readFilter === "unread" ? false : readFilter === "read" ? true : undefined,
    limit: 100,
  }, { refetchInterval: 30_000 });

  const { data: countData } = trpc.notifications.unreadCount.useQuery({}, { refetchInterval: 15_000 });

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  const processQueue = trpc.notifications.processQueue.useMutation();

  const { data: queueData } = trpc.notifications.listQueue.useQuery({ limit: 50 });

  const notifications = (notifData ?? []).filter(
    (n: any) => typeFilter === "all" || n.type === typeFilter
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
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="relative">
                <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
                  <Bell className="w-7 h-7 text-violet-400" />
                </div>
                {(countData?.count ?? 0) > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                  >
                    {countData?.count}
                  </motion.span>
                )}
              </div>
              Notifications
            </h1>
            <p className="text-slate-400 mt-1">
              {countData?.count ? (
                <span className="text-amber-400 font-medium">{countData.count} unread</span>
              ) : (
                "All caught up"
              )}
              {" · "}Unified multi-channel alert center
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-600/50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {(countData?.count ?? 0) > 0 && (
              <button
                onClick={() => markAllRead.mutate({})}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-sm transition-colors"
              >
                <CheckCheck className="w-4 h-4" /> Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/60 border border-white/10 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* ── Notification Center ── */}
          {tab === "center" && (
            <motion.div key="center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-800/60 border border-white/10">
                  {["all", "unread", "read"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setReadFilter(f)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                        readFilter === f ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-slate-500" />
                  {["all", ...Object.keys(TYPE_CONFIG)].map((t) => {
                    const cfg = t !== "all" ? TYPE_CONFIG[t as NotifType] : null;
                    return (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize border ${
                          typeFilter === t
                            ? `${cfg?.bg ?? "bg-violet-600/20"} ${cfg?.color ?? "text-violet-300"} ${cfg?.border ?? "border-violet-500/30"}`
                            : "bg-slate-800/40 text-slate-500 border-white/5 hover:border-white/20"
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
                    <div key={i} className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-semibold text-lg">No notifications</p>
                  <p className="text-slate-400 mt-1">You're all caught up!</p>
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
              className="rounded-2xl border border-white/10 bg-slate-800/60 backdrop-blur-xl p-6"
            >
              <PreferencesPanel />
            </motion.div>
          )}

          {/* ── Queue ── */}
          {tab === "queue" && (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Delivery Queue</h3>
                  <button
                    onClick={() => processQueue.mutate()}
                    disabled={processQueue.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {processQueue.isPending ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> Process Queue</>
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/40">
                      <tr>
                        {["ID", "Channel", "Recipient", "Status", "Retries", "Created"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-slate-300 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(queueData ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Queue is empty</td>
                        </tr>
                      ) : (queueData ?? []).map((item: any) => (
                        <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 text-slate-400 font-mono">#{item.id}</td>
                          <td className="px-4 py-3 text-white capitalize">{item.channel}</td>
                          <td className="px-4 py-3 text-slate-300 truncate max-w-[180px]">{item.recipient}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === "sent" ? "bg-emerald-500/20 text-emerald-300" :
                              item.status === "failed" ? "bg-red-500/20 text-red-300" :
                              item.status === "processing" ? "bg-blue-500/20 text-blue-300" :
                              "bg-slate-600/40 text-slate-400"
                            }`}>{item.status}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{item.retry_count ?? 0}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{timeAgo(item.created_at)}</td>
                        </tr>
                      ))}
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
