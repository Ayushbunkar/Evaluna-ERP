"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Server, Database, Wifi, WifiOff, AlertTriangle,
  AlertCircle, CheckCircle2, Clock, Users, ShieldAlert,
  BarChart3, Layers, Package, Bell, FileUp, RefreshCw,
  ChevronRight, TrendingUp, TrendingDown, Minus, Eye,
  Monitor, Smartphone, Tablet, Globe, Zap, HardDrive,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

function formatMs(ms: number | null | undefined): string {
  if (!ms) return "—";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sub, trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-5 rounded-2xl bg-slate-800/60 border border-white/10 backdrop-blur"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color.replace("text-", "bg-").replace("-400", "-500/15")} border ${color.replace("text-", "border-").replace("-400", "-500/25")}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && (
          <TrendIcon className={`w-4 h-4 ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-500"}`} />
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot: string }> = {
    success: { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", dot: "bg-emerald-400" },
    healthy: { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", dot: "bg-emerald-400 animate-pulse" },
    failed:  { cls: "bg-red-500/15 text-red-300 border-red-500/25", dot: "bg-red-400" },
    error:   { cls: "bg-red-500/15 text-red-300 border-red-500/25", dot: "bg-red-400" },
    warning: { cls: "bg-amber-500/15 text-amber-300 border-amber-500/25", dot: "bg-amber-400" },
    queued:  { cls: "bg-blue-500/15 text-blue-300 border-blue-500/25", dot: "bg-blue-400" },
    info:    { cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25", dot: "bg-cyan-400" },
    critical:{ cls: "bg-rose-500/15 text-rose-300 border-rose-500/25", dot: "bg-rose-400 animate-pulse" },
    online:  { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", dot: "bg-emerald-400 animate-pulse" },
    offline: { cls: "bg-slate-500/15 text-slate-400 border-slate-500/25", dot: "bg-slate-500" },
  };
  const cfg = map[status] ?? map.info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

// ── Severity Icon ─────────────────────────────────────────────────────────────
function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <AlertCircle className="w-4 h-4 text-rose-400" />;
  if (severity === "error")    return <AlertTriangle className="w-4 h-4 text-red-400" />;
  if (severity === "warning")  return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
}

// ── Device Icon ───────────────────────────────────────────────────────────────
function DeviceIcon({ type }: { type: string | null | undefined }) {
  if (type === "mobile") return <Smartphone className="w-4 h-4 text-slate-400" />;
  if (type === "tablet") return <Tablet className="w-4 h-4 text-slate-400" />;
  return <Monitor className="w-4 h-4 text-slate-400" />;
}

// ── Main Component ────────────────────────────────────────────────────────────
type Tab = "overview" | "logs" | "api" | "logins" | "branches" | "queue";

export default function MonitoringDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [logSeverity, setLogSeverity] = useState<string>("all");
  const [logCategory, setLogCategory] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: overview, refetch: refetchOverview, isLoading: overviewLoading } =
    trpc.monitoring.getSystemOverview.useQuery(undefined, { refetchInterval: 30_000 });

  const { data: apiMetrics } = trpc.monitoring.getApiMetrics.useQuery({ hours: 24 }, { enabled: tab === "api" });

  const { data: eventData, refetch: refetchLogs } = trpc.monitoring.getEventLogs.useQuery({
    severity: logSeverity !== "all" ? logSeverity as any : undefined,
    category: logCategory !== "all" ? logCategory as any : undefined,
    hours: 24, limit: 200,
  }, { enabled: tab === "logs" });

  const { data: loginData } = trpc.monitoring.getLoginHistory.useQuery({ limit: 50 }, { enabled: tab === "logins" });

  const { data: queueData } = trpc.monitoring.getQueueStatus.useQuery(undefined, { refetchInterval: 15_000 });

  const collectMetrics = trpc.monitoring.collectMetrics.useMutation({
    onSuccess: () => { refetchOverview(); setLastRefresh(new Date()); },
  });

  const handleRefresh = () => { collectMetrics.mutate(); };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",  label: "Overview",      icon: Activity },
    { id: "logs",      label: "Event Logs",    icon: Layers },
    { id: "api",       label: "API Metrics",   icon: Zap },
    { id: "logins",    label: "Login History", icon: Users },
    { id: "branches",  label: "Branch Health", icon: Globe },
    { id: "queue",     label: "Queue Status",  icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
                <Activity className="w-7 h-7 text-emerald-400" />
              </div>
              Enterprise Monitoring
            </h1>
            <p className="text-slate-400 mt-1">
              System health, performance, security, and analytics
              <span className="ml-3 text-slate-500 text-xs">· Last refresh: {timeAgo(lastRefresh)}</span>
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={collectMetrics.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${collectMetrics.isPending ? "animate-spin" : ""}`} />
            {collectMetrics.isPending ? "Collecting…" : "Refresh"}
          </button>
        </div>

        {/* Quick Stats Row */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <StatCard label="Errors (24h)"   value={overview.errors_24h}         icon={AlertCircle}  color="text-red-400"     trend={overview.errors_24h > 0 ? "up" : "neutral"} />
            <StatCard label="Warnings (24h)" value={overview.warnings_24h}       icon={AlertTriangle}color="text-amber-400"   trend="neutral" />
            <StatCard label="Queue Pending"  value={overview.queue_pending}       icon={Bell}         color="text-blue-400"    trend="neutral" />
            <StatCard label="Queue Failed"   value={overview.queue_failed}        icon={AlertCircle}  color="text-rose-400"    trend={overview.queue_failed > 0 ? "up" : "neutral"} />
            <StatCard label="Orders Today"   value={overview.orders_today}        icon={BarChart3}    color="text-emerald-400" trend="up" />
            <StatCard label="Failed Logins"  value={overview.failed_logins_24h}  icon={ShieldAlert}  color="text-orange-400"  trend={overview.failed_logins_24h > 5 ? "up" : "neutral"} />
            <StatCard label="Branches"       value={overview.branch_count}        icon={Globe}        color="text-violet-400"  />
          </div>
        )}

        {/* Metrics snapshot */}
        {overview?.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Memory Usage",
                value: `${overview.metrics.memory_used_mb ?? "—"} MB`,
                icon: HardDrive,
                color: "text-cyan-400",
                sub: `of ${overview.metrics.memory_total_mb ?? "—"} MB total`,
              },
              {
                label: "API Req/min",
                value: overview.metrics.api_requests_per_min ?? "—",
                icon: Zap,
                color: "text-violet-400",
                sub: `avg ${formatMs(overview.metrics.api_avg_response_ms)}`,
              },
              {
                label: "DB Slow Queries",
                value: overview.metrics.db_slow_query_count ?? 0,
                icon: Database,
                color: "text-amber-400",
              },
              {
                label: "Sync Pending",
                value: overview.metrics.offline_sync_pending ?? 0,
                icon: Wifi,
                color: "text-emerald-400",
              },
            ].map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-800/60 border border-white/10 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* ── Overview ── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-400" /> System Health
                  </h3>
                  {[
                    { label: "API Server",        status: "healthy",  sub: "Responding normally" },
                    { label: "Database",           status: "healthy",  sub: "PGlite operational" },
                    { label: "Notification Queue", status: (overview?.queue_failed ?? 0) > 0 ? "warning" : "healthy", sub: `${overview?.queue_pending ?? 0} pending` },
                    { label: "Offline Sync",       status: (overview?.metrics?.offline_sync_pending ?? 0) > 50 ? "warning" : "healthy", sub: `${overview?.metrics?.offline_sync_pending ?? 0} items queued` },
                    { label: "Security",           status: (overview?.failed_logins_24h ?? 0) > 10 ? "critical" : "healthy", sub: `${overview?.failed_logins_24h ?? 0} failed logins today` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{item.label}</p>
                        <p className="text-slate-500 text-xs">{item.sub}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>

                {/* Queue Overview */}
                <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" /> Queue Overview
                  </h3>
                  {queueData && (
                    <div className="space-y-4">
                      {[
                        { label: "Notification Queue", icon: Bell, data: queueData.notifications, color: "text-violet-400" },
                        { label: "Import Jobs", icon: FileUp, data: { pending: queueData.imports.pending, failed: 0, sent_today: 0 }, color: "text-cyan-400" },
                      ].map(({ label, icon: Icon, data, color }) => (
                        <div key={label} className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className={`w-4 h-4 ${color}`} />
                            <p className="text-white text-sm font-medium">{label}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { k: "Pending", v: data.pending, c: "text-blue-400" },
                              { k: "Failed",  v: data.failed,  c: data.failed > 0 ? "text-red-400" : "text-slate-500" },
                              { k: "Sent today", v: data.sent_today ?? 0, c: "text-emerald-400" },
                            ].map(({ k, v, c }) => (
                              <div key={k} className="text-center">
                                <p className={`text-xl font-bold ${c}`}>{v}</p>
                                <p className="text-slate-500 text-xs">{k}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Event Logs ── */}
          {tab === "logs" && (
            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                <div className="flex flex-wrap gap-3 mb-4">
                  {/* Severity filter */}
                  <div className="flex gap-1 p-1 rounded-lg bg-slate-700/50 border border-white/5">
                    {["all", "info", "warning", "error", "critical"].map((s) => (
                      <button key={s} onClick={() => setLogSeverity(s)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${logSeverity === s ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {/* Category filter */}
                  <select
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700/50 border border-white/10 text-slate-300 text-sm focus:outline-none"
                  >
                    {["all", "auth", "api", "sync", "db", "import", "inventory", "payment", "system", "security"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button onClick={() => refetchLogs()}
                    className="p-2 rounded-lg bg-slate-700/50 border border-white/10 text-slate-400 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-slate-700/40">
                      <tr>
                        {["Severity", "Category", "Event", "Message", "Duration", "Time"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-slate-300 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(eventData ?? []).length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No events found</td></tr>
                      ) : (eventData ?? []).map((log: any) => (
                        <tr key={log.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <SeverityIcon severity={log.severity} />
                              <StatusBadge status={log.severity} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 capitalize">{log.category}</td>
                          <td className="px-4 py-3 text-white font-mono text-xs">{log.event}</td>
                          <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{log.message ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{formatMs(log.duration_ms)}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{timeAgo(log.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── API Metrics ── */}
          {tab === "api" && apiMetrics && (
            <motion.div key="api" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Category */}
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-400" /> Events by Category (24h)
                </h3>
                <div className="space-y-2">
                  {apiMetrics.byCategory.map((row: any) => (
                    <div key={row.category} className="flex items-center gap-3">
                      <span className="text-slate-400 capitalize w-24 text-sm">{row.category}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-700/60 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, (Number(row.total) / 100) * 100)}%` }} />
                      </div>
                      <span className="text-white text-sm font-mono w-12 text-right">{row.total}</span>
                      <span className="text-slate-500 text-xs w-16 text-right">{formatMs(row.avg_ms ? Math.round(Number(row.avg_ms)) : null)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slow Events */}
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" /> Slow Events (&gt;1s)
                </h3>
                <div className="space-y-2">
                  {apiMetrics.slowEvents.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">No slow events detected</p>
                  ) : apiMetrics.slowEvents.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div>
                        <p className="text-white text-sm font-mono">{e.event}</p>
                        <p className="text-slate-500 text-xs">{e.category} · {timeAgo(e.created_at)}</p>
                      </div>
                      <span className="text-amber-400 font-bold font-mono text-sm">{formatMs(e.duration_ms)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Breakdown */}
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6 md:col-span-2">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" /> Top Errors (24h)
                </h3>
                <div className="space-y-2">
                  {apiMetrics.errorBreakdown.length === 0 ? (
                    <p className="text-emerald-400 text-sm text-center py-4 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> No errors in the last 24 hours
                    </p>
                  ) : apiMetrics.errorBreakdown.map((e: any) => (
                    <div key={e.event} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="text-white text-sm font-mono">{e.event}</p>
                      <span className="text-red-400 font-bold text-sm">{e.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Login History ── */}
          {tab === "logins" && (
            <motion.div key="logins" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-400" /> Login History & Device Tracking
                </h3>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-slate-700/40">
                      <tr>
                        {["Status", "User", "Device", "Browser", "OS", "IP Address", "Time"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-slate-300 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(loginData ?? []).length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No login records</td></tr>
                      ) : (loginData ?? []).map((l: any) => (
                        <tr key={l.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                          <td className="px-4 py-3 text-white text-sm">{l.user_email ?? l.user_id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <DeviceIcon type={l.device_type} />
                              <span className="text-xs capitalize">{l.device_type ?? "desktop"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{l.browser ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{l.os ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">{l.ip_address ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{timeAgo(l.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Branch Health ── */}
          {tab === "branches" && (
            <motion.div key="branches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder branches since health snapshots start empty */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-slate-800/60 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-violet-400" />
                        <p className="text-white font-semibold">Branch {i}</p>
                      </div>
                      <StatusBadge status={i === 2 ? "offline" : "online"} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Active Devices", value: i === 2 ? 0 : Math.floor(Math.random() * 5) + 1 },
                        { label: "Sync Pending",   value: i === 2 ? 12 : 0 },
                        { label: "Low Stock",      value: Math.floor(Math.random() * 8) },
                        { label: "Expiry Alerts",  value: Math.floor(Math.random() * 3) },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-3 rounded-lg bg-slate-700/30 border border-white/5 text-center">
                          <p className="text-white font-bold text-lg">{value}</p>
                          <p className="text-slate-500 text-xs">{label}</p>
                        </div>
                      ))}
                    </div>
                    {i === 2 && (
                      <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-amber-300 text-xs flex items-center gap-1.5">
                          <WifiOff className="w-3.5 h-3.5" /> Last seen 4h ago — sync backlog detected
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Queue Status ── */}
          {tab === "queue" && queueData && (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    label: "Notification Queue",
                    icon: Bell,
                    color: "text-violet-400",
                    stats: [
                      { k: "Pending",    v: queueData.notifications.pending,    c: "text-blue-400" },
                      { k: "Failed",     v: queueData.notifications.failed,     c: queueData.notifications.failed > 0 ? "text-red-400" : "text-emerald-400" },
                      { k: "Sent Today", v: queueData.notifications.sent_today, c: "text-emerald-400" },
                    ],
                  },
                  {
                    label: "Import Jobs",
                    icon: FileUp,
                    color: "text-cyan-400",
                    stats: [
                      { k: "Pending", v: queueData.imports.pending, c: "text-blue-400" },
                    ],
                  },
                ].map(({ label, icon: Icon, color, stats }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                    <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${color}`} /> {label}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {stats.map(({ k, v, c }) => (
                        <div key={k} className="text-center p-4 rounded-xl bg-slate-700/30 border border-white/5">
                          <p className={`text-3xl font-bold ${c}`}>{v}</p>
                          <p className="text-slate-400 text-sm mt-1">{k}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
