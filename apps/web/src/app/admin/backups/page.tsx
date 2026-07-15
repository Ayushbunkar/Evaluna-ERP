"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Download, Upload, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Clock, HardDrive, Cloud, Lock, Unlock,
  RotateCcw, Play, Eye, Trash2, ChevronRight, Server,
  Archive, Zap, Calendar, FileCheck, ArrowLeft, ArrowRight,
  Info, Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BackupEntry {
  filename: string;
  metadata: {
    id: string;
    version: string;
    created_at: string;
    trigger: string;
    encrypted: boolean;
    checksum: string;
    table_counts: Record<string, number>;
    size_bytes: number;
    label?: string;
  };
  size_bytes: number;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

function formatBytes(b: number): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function totalRows(counts: Record<string, number>): number {
  return Object.values(counts ?? {}).reduce((a, b) => a + b, 0);
}

const TRIGGER_BADGE: Record<string, { cls: string; label: string }> = {
  manual:         { cls: "bg-blue-500/15 text-blue-300 border-blue-500/25",     label: "Manual" },
  scheduled:      { cls: "bg-violet-500/15 text-violet-300 border-violet-500/25", label: "Scheduled" },
  auto:           { cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",      label: "Auto" },
  "pre-restore":  { cls: "bg-amber-500/15 text-amber-300 border-amber-500/25",   label: "Pre-Restore" },
};

// ── Restore Wizard ────────────────────────────────────────────────────────────
type WizardStep = 1 | 2 | 3 | 4;

function RestoreWizard({
  backup,
  onClose,
  onSuccess,
}: {
  backup: BackupEntry;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);

  const simulate = trpc.backups.simulateRestore.useMutation({
    onSuccess: (data) => { setSimulationResult(data); setStep(2); },
  });

  const restore = trpc.backups.restoreBackup.useMutation({
    onSuccess: (data) => { setRestoreResult(data); setStep(4); onSuccess(); },
  });

  const STEPS = ["Verify", "Preview", "Confirm", "Done"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-800 border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-rose-900/30 to-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <RotateCcw className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Restore Wizard</h2>
                <p className="text-slate-400 text-sm">{backup.filename}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((label, i) => {
              const s = i + 1;
              const done = s < step;
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done ? "bg-rose-500 border-rose-500" : active ? "border-rose-400 bg-rose-500/20" : "border-white/20 bg-transparent"
                    }`}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className={active ? "text-rose-300" : "text-white/30"}>{s}</span>}
                    </div>
                    <span className={`text-xs ${active ? "text-rose-300" : done ? "text-rose-400/60" : "text-white/20"}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${done ? "bg-rose-500" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Verify */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5">
                  <p className="text-amber-300 font-medium flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4" /> Warning — Destructive Operation
                  </p>
                  <p className="text-slate-400 text-sm">
                    Restoring this backup will <strong className="text-white">overwrite all current data</strong>. 
                    A pre-restore snapshot will be automatically created before proceeding.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Backup Date", value: new Date(backup.metadata.created_at).toLocaleString() },
                    { label: "Total Rows",   value: totalRows(backup.metadata.table_counts).toLocaleString() },
                    { label: "File Size",    value: formatBytes(backup.size_bytes) },
                    { label: "Encrypted",    value: backup.metadata.encrypted ? "Yes (AES-256-GCM)" : "No" },
                    { label: "Trigger",      value: backup.metadata.trigger },
                    { label: "Checksum",     value: `${backup.metadata.checksum.slice(0, 12)}…` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-lg bg-slate-700/40 border border-white/5">
                      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                      <p className="text-white text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => simulate.mutate({ filename: backup.filename })}
                    disabled={simulate.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
                  >
                    {simulate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Run Recovery Simulation
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Preview */}
            {step === 2 && simulationResult && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className={`p-4 rounded-xl mb-4 ${
                  simulationResult.can_restore
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <p className={`font-medium flex items-center gap-2 ${simulationResult.can_restore ? "text-emerald-300" : "text-red-300"}`}>
                    {simulationResult.can_restore
                      ? <><CheckCircle2 className="w-4 h-4" /> Simulation passed — safe to restore</>
                      : <><XCircle className="w-4 h-4" /> Simulation failed — restore blocked</>
                    }
                  </p>
                </div>

                {simulationResult.warnings?.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    {simulationResult.warnings.map((w: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/15 text-amber-300 text-sm">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {w}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-5 max-h-40 overflow-y-auto">
                  {Object.entries(simulationResult.table_counts ?? {}).map(([table, count]) => (
                    <div key={table} className="p-2 rounded-lg bg-slate-700/30 border border-white/5">
                      <p className="text-white text-sm font-mono">{table}</p>
                      <p className="text-slate-400 text-xs">{Number(count).toLocaleString()} rows</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-3">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/60 text-slate-300 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!simulationResult.can_restore}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                  >
                    Proceed to Confirm <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-5 rounded-xl bg-red-900/20 border-2 border-red-500/30 mb-5">
                  <p className="text-red-300 font-bold text-lg mb-2">⚠️ Final Confirmation Required</p>
                  <p className="text-slate-300 text-sm mb-4">
                    You are about to <strong>permanently replace all live data</strong> with the contents of:
                    <br /><span className="font-mono text-amber-300">{backup.filename}</span>
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-rose-500"
                    />
                    <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                      I understand this will overwrite all current data and cannot be undone (except via the auto-snapshot)
                    </span>
                  </label>
                </div>

                <div className="flex justify-between gap-3">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/60 text-slate-300 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => restore.mutate({ filename: backup.filename, confirmed: true })}
                    disabled={!confirmed || restore.isPending}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-sm transition-colors"
                  >
                    {restore.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Execute Restore
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h3 className="text-white text-xl font-bold mb-2">Restore Complete</h3>
                <p className="text-slate-400 text-sm mb-1">
                  {restoreResult?.tables_restored ?? 0} tables restored successfully.
                </p>
                <p className="text-slate-500 text-xs">A pre-restore snapshot was saved automatically before execution.</p>
                <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── Backup Card ───────────────────────────────────────────────────────────────
function BackupCard({
  backup,
  onRestore,
  onDelete,
  onVerify,
  onCloud,
  isVerifying,
  verifyResult,
}: {
  backup: BackupEntry;
  onRestore: () => void;
  onDelete: () => void;
  onVerify: () => void;
  onCloud: () => void;
  isVerifying: boolean;
  verifyResult: { valid: boolean; reason?: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const badgeCfg = TRIGGER_BADGE[backup.metadata?.trigger] ?? TRIGGER_BADGE.manual;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-slate-700/60 border border-white/5 shrink-0">
              {backup.metadata?.encrypted
                ? <Lock className="w-5 h-5 text-amber-400" />
                : <Unlock className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-white font-medium text-sm font-mono truncate">{backup.filename}</p>
                {backup.metadata?.label && (
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{backup.metadata.label}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(backup.created_at)}</span>
                <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatBytes(backup.size_bytes)}</span>
                <span className="flex items-center gap-1"><Archive className="w-3 h-3" />{totalRows(backup.metadata?.table_counts ?? {}).toLocaleString()} rows</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badgeCfg.cls}`}>{badgeCfg.label}</span>
            {verifyResult && (
              verifyResult.valid
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" title="Checksum valid" />
                : <XCircle className="w-4 h-4 text-red-400" title={verifyResult.reason} />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={onRestore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 text-xs font-medium transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Restore
          </button>
          <button onClick={onVerify} disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 text-xs font-medium transition-colors">
            {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
            Verify
          </button>
          <button onClick={onCloud}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/20 text-xs font-medium transition-colors">
            <Cloud className="w-3.5 h-3.5" /> Upload Cloud
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-colors">
            <Eye className="w-3.5 h-3.5" /> {expanded ? "Hide" : "Details"}
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/30 hover:bg-red-500/15 text-slate-500 hover:text-red-300 text-xs transition-colors ml-auto">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-slate-900/30 overflow-hidden"
          >
            <div className="p-4">
              <p className="text-slate-400 text-xs mb-2">Table record counts at backup time:</p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(backup.metadata?.table_counts ?? {}).map(([table, count]) => (
                  <div key={table} className="p-2 rounded-lg bg-slate-700/30 border border-white/5">
                    <p className="text-white text-xs font-mono">{table}</p>
                    <p className="text-slate-400 text-xs">{Number(count).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-3 font-mono">SHA-256: {backup.metadata?.checksum}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BackupDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createEncrypt, setCreateEncrypt] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, any>>({});
  const [verifyingFile, setVerifyingFile] = useState<string | null>(null);
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);

  const { data: backups, refetch, isLoading } = trpc.backups.listBackups.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const createBackup = trpc.backups.createBackup.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); setCreateLabel(""); } });
  const deleteBackup = trpc.backups.deleteBackup.useMutation({ onSuccess: () => refetch() });
  const verifyBackup = trpc.backups.verifyBackup.useMutation({
    onSuccess: (result, vars) => {
      setVerifyResults((r) => ({ ...r, [vars.filename]: result }));
      setVerifyingFile(null);
    },
  });
  const uploadCloud = trpc.backups.uploadToCloud.useMutation({
    onSuccess: (data) => { setCloudMsg(`Uploaded: ${data.url}`); setTimeout(() => setCloudMsg(null), 5000); },
  });

  const stats = {
    total: backups?.length ?? 0,
    encrypted: backups?.filter((b: BackupEntry) => b.metadata?.encrypted).length ?? 0,
    manual: backups?.filter((b: BackupEntry) => b.metadata?.trigger === "manual").length ?? 0,
    totalSize: backups?.reduce((s: number, b: BackupEntry) => s + (b.size_bytes ?? 0), 0) ?? 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-600/20 border border-amber-500/30">
                <Shield className="w-7 h-7 text-amber-400" />
              </div>
              Disaster Recovery
            </h1>
            <p className="text-slate-400 mt-1">Encrypted backups, verification, restore wizard, and cloud sync</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors">
              <Download className="w-4 h-4" /> Create Backup
            </button>
          </div>
        </div>

        {/* Cloud notification */}
        <AnimatePresence>
          {cloudMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 text-blue-300 text-sm"
            >
              <Cloud className="w-4 h-4" /> {cloudMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Backups",    value: stats.total,                  icon: Archive,    color: "text-amber-400" },
            { label: "Encrypted",        value: stats.encrypted,              icon: Lock,       color: "text-emerald-400" },
            { label: "Manual",           value: stats.manual,                 icon: Zap,        color: "text-blue-400" },
            { label: "Total Size",       value: formatBytes(stats.totalSize), icon: HardDrive,  color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-slate-800/60 border border-white/10">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Create Dialog */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <h3 className="text-white font-semibold mb-4">Create New Backup</h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={createLabel}
                    onChange={(e) => setCreateLabel(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
                    <input type="checkbox" checked={createEncrypt} onChange={(e) => setCreateEncrypt(e.target.checked)} className="accent-amber-500" />
                    <Lock className="w-4 h-4 text-amber-400" /> Encrypt (AES-256-GCM)
                  </label>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-lg bg-slate-700/60 text-slate-300 text-sm transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => createBackup.mutate({ label: createLabel || undefined, encrypt: createEncrypt })}
                    disabled={createBackup.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
                  >
                    {createBackup.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {createBackup.isPending ? "Creating…" : "Create Backup"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backup List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-slate-800/40 animate-pulse" />)}
          </div>
        ) : (backups ?? []).length === 0 ? (
          <div className="text-center py-20">
            <Archive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">No backups yet</p>
            <p className="text-slate-400 mt-1 mb-5">Create your first backup to protect your data</p>
            <button onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors">
              Create First Backup
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {(backups as BackupEntry[]).map((backup: BackupEntry) => (
                <BackupCard
                  key={backup.filename}
                  backup={backup}
                  onRestore={() => setRestoreTarget(backup)}
                  onDelete={() => { if (confirm(`Delete ${backup.filename}?`)) deleteBackup.mutate({ filename: backup.filename }); }}
                  onVerify={() => { setVerifyingFile(backup.filename); verifyBackup.mutate({ filename: backup.filename }); }}
                  onCloud={() => uploadCloud.mutate({ filename: backup.filename })}
                  isVerifying={verifyingFile === backup.filename}
                  verifyResult={verifyResults[backup.filename] ?? null}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* DR Info Tiles */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Lock, color: "text-amber-400", title: "AES-256-GCM Encryption", desc: "All backups are encrypted at rest. Set BACKUP_ENCRYPTION_KEY in .env.local for custom keys." },
            { icon: FileCheck, color: "text-emerald-400", title: "SHA-256 Verification", desc: "Every backup has a cryptographic checksum. Click Verify to confirm file integrity before restore." },
            { icon: Cloud, color: "text-blue-400", title: "Cloud Ready", desc: "Configure BACKUP_CLOUD_BUCKET to auto-upload to S3, R2, or GCS. Stubs ready for SDK integration." },
          ].map((t) => (
            <div key={t.title} className="p-4 rounded-xl bg-slate-800/40 border border-white/5 flex items-start gap-3">
              <t.icon className={`w-5 h-5 ${t.color} shrink-0 mt-0.5`} />
              <div>
                <p className="text-white text-sm font-medium">{t.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Restore Wizard Modal */}
      <AnimatePresence>
        {restoreTarget && (
          <RestoreWizard
            backup={restoreTarget}
            onClose={() => setRestoreTarget(null)}
            onSuccess={() => { refetch(); setTimeout(() => setRestoreTarget(null), 2000); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
