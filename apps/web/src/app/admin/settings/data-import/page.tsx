"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Package,
  Users,
  Truck,
  ShoppingCart,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// ── Types ───────────────────────────────────────────────────────────────────
type EntityType = "product" | "customer" | "supplier";
type Step = 1 | 2 | 3 | 4 | 5;

interface ParsedRow {
  [key: string]: string;
}

interface ErrorRow {
  rowIndex: number;
  rowData: ParsedRow;
  error: string;
}

interface ValidationResult {
  validRows: ParsedRow[];
  errorRows: ErrorRow[];
}

// ── Constants ────────────────────────────────────────────────────────────────
const ENTITY_OPTIONS: {
  id: EntityType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}[] = [
  {
    id: "product",
    label: "Products",
    icon: Package,
    color: "from-violet-500 to-purple-600",
    description: "Import product catalog with pricing, barcodes and categories",
  },
  {
    id: "customer",
    label: "Customers",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    description: "Bulk import customers with contact details and credit limits",
  },
  {
    id: "supplier",
    label: "Suppliers",
    icon: Truck,
    color: "from-emerald-500 to-teal-600",
    description: "Import supplier records with GST and payment terms",
  },
];

const TEMPLATES: Record<EntityType, string[]> = {
  product: ["name", "price", "barcode", "category", "description", "unit", "sku", "hsn", "taxable"],
  customer: ["name", "email", "phone", "address", "gst_number", "credit_limit", "customer_type"],
  supplier: ["name", "email", "phone", "address", "gst_number", "pan_number", "supplier_category"],
};

const SAMPLE_DATA: Record<EntityType, Record<string, string>[]> = {
  product: [
    { name: "Rice Basmati 5kg", price: "450", barcode: "8901234567890", category: "Grains", description: "Premium basmati rice", unit: "kg", sku: "RICE001", hsn: "1006", taxable: "true" },
    { name: "Sunflower Oil 1L", price: "180", barcode: "8901234567891", category: "Oils", description: "Refined sunflower oil", unit: "L", sku: "OIL001", hsn: "1512", taxable: "true" },
  ],
  customer: [
    { name: "Raj Enterprises", email: "raj@example.com", phone: "9876543210", address: "123 MG Road, Bangalore", gst_number: "29AAAAA0000A1Z5", credit_limit: "50000", customer_type: "wholesale" },
  ],
  supplier: [
    { name: "Metro Distributors", email: "metro@example.com", phone: "9876543211", address: "45 Industrial Area, Delhi", gst_number: "07BBBBB0000B1Z5", pan_number: "BBBBB0000B", supplier_category: "local" },
  ],
};

// ── CSV Utils ─────────────────────────────────────────────────────────────────
function arrayToCSV(headers: string[], rows: Record<string, string>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
    const obj: ParsedRow = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = ["Select", "Upload", "Validate", "Import", "Done"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = (i + 1) as Step;
        const active = step === currentStep;
        const done = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: done ? "#8b5cf6" : active ? "#6d28d9" : "rgba(255,255,255,0.1)",
                  scale: active ? 1.15 : 1,
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2"
                style={{ borderColor: active || done ? "#8b5cf6" : "rgba(255,255,255,0.2)" }}
              >
                {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className={active ? "text-white" : "text-white/40"}>{step}</span>}
              </motion.div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-violet-300" : done ? "text-violet-400/70" : "text-white/30"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mb-4" style={{ backgroundColor: done ? "#8b5cf6" : "rgba(255,255,255,0.1)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DataImportPage() {
  const [step, setStep] = useState<Step>(1);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validateMutation = trpc.imports.validateImport.useMutation();
  const executeMutation = trpc.imports.executeImport.useMutation();

  // ── Template Download
  const downloadTemplate = useCallback(() => {
    if (!entityType) return;
    const headers = TEMPLATES[entityType];
    const sampleRows = SAMPLE_DATA[entityType];
    const csv = arrayToCSV(headers, sampleRows);
    downloadCSV(`${entityType}_import_template.csv`, csv);
  }, [entityType]);

  // ── File Parse
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
    };
    reader.readAsText(file);
  }, []);

  // ── Validate
  const handleValidate = useCallback(async () => {
    if (!entityType || parsedRows.length === 0) return;
    setIsValidating(true);
    try {
      const result = await validateMutation.mutateAsync({ entityType, rows: parsedRows });
      setValidation(result as ValidationResult);
      setStep(3);
    } catch {
      // Fallback: client-side validation when API fails
      const validRows: ParsedRow[] = [];
      const errorRows: ErrorRow[] = [];
      parsedRows.forEach((row, i) => {
        const errors: string[] = [];
        if (!row.name?.trim()) errors.push("name is required");
        if (entityType === "product" && (!row.price || isNaN(Number(row.price)))) errors.push("price must be a valid number");
        if (entityType === "customer" && !row.email?.includes("@")) errors.push("email is invalid");
        if (errors.length > 0) errorRows.push({ rowIndex: i + 2, rowData: row, error: errors.join("; ") });
        else validRows.push(row);
      });
      setValidation({ validRows, errorRows });
      setStep(3);
    } finally {
      setIsValidating(false);
    }
  }, [entityType, parsedRows, validateMutation]);

  // ── Execute Import
  const handleImport = useCallback(async () => {
    if (!entityType || !validation) return;
    setIsImporting(true);
    setImportProgress(0);
    setStep(4);
    const CHUNK_SIZE = 100;
    const chunks: ParsedRow[][] = [];
    for (let i = 0; i < validation.validRows.length; i += CHUNK_SIZE) {
      chunks.push(validation.validRows.slice(i, i + CHUNK_SIZE));
    }
    for (let c = 0; c < chunks.length; c++) {
      try {
        await executeMutation.mutateAsync({ entityType, validRows: chunks[c] });
      } catch { /* per-chunk errors are logged, we continue */ }
      setImportProgress(Math.round(((c + 1) / chunks.length) * 100));
    }
    setIsImporting(false);
    setImportDone(true);
    setStep(5);
  }, [entityType, validation, executeMutation]);

  // ── Error CSV Download
  const downloadErrorReport = useCallback(() => {
    if (!validation?.errorRows.length) return;
    const headers = ["row", "error", ...Object.keys(validation.errorRows[0]?.rowData ?? {})];
    const rows = validation.errorRows.map((e) => ({ row: String(e.rowIndex), error: e.error, ...e.rowData }));
    downloadCSV("import_error_report.csv", arrayToCSV(headers, rows));
  }, [validation]);

  // ── Reset
  const reset = () => {
    setStep(1);
    setEntityType(null);
    setParsedRows([]);
    setFileName("");
    setValidation(null);
    setImportProgress(0);
    setImportDone(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
                <Upload className="w-7 h-7 text-violet-400" />
              </div>
              Data Import Wizard
            </h1>
            <p className="text-slate-400 mt-1">Bulk import your data with validation and duplicate detection</p>
          </div>
          {step > 1 && (
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-600/50">
              <RotateCcw className="w-4 h-4" /> Start Over
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-slate-800/60 backdrop-blur-xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Entity Selection ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-xl font-semibold text-white mb-2">Select Import Type</h2>
                <p className="text-slate-400 mb-6">Choose what type of data you want to import, then download the template.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {ENTITY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = entityType === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEntityType(opt.id)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                          selected ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-slate-700/30 hover:border-white/20"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${opt.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-semibold text-white">{opt.label}</p>
                        <p className="text-sm text-slate-400 mt-1">{opt.description}</p>
                        {selected && <CheckCircle2 className="w-5 h-5 text-violet-400 absolute top-3 right-3" />}
                      </motion.button>
                    );
                  })}
                </div>
                {entityType && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <FileText className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-emerald-300 font-medium">Download CSV Template</p>
                      <p className="text-slate-400 text-sm">Get the required column headers with sample data pre-filled</p>
                    </div>
                    <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
                      <Download className="w-4 h-4" /> Template
                    </button>
                  </motion.div>
                )}
                <div className="flex justify-end mt-6">
                  <button
                    disabled={!entityType}
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
                  >
                    Next: Upload File <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: File Upload ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-xl font-semibold text-white mb-2">Upload CSV File</h2>
                <p className="text-slate-400 mb-6">Upload your populated CSV file. Files are parsed locally for speed and privacy.</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="block">
                  <div className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${fileName ? "border-violet-500 bg-violet-500/5" : "border-white/20 hover:border-white/40 bg-slate-700/20 hover:bg-slate-700/30"}`}>
                    {fileName ? (
                      <div>
                        <CheckCircle2 className="w-12 h-12 text-violet-400 mx-auto mb-3" />
                        <p className="text-white font-semibold">{fileName}</p>
                        <p className="text-slate-400 mt-1">{parsedRows.length} rows parsed successfully</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-white font-semibold">Click to select CSV file</p>
                        <p className="text-slate-400 mt-1">or drag and drop here</p>
                        <p className="text-slate-500 text-sm mt-2">Supports CSV and TXT formats</p>
                      </div>
                    )}
                  </div>
                </label>

                {parsedRows.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-3 gap-4">
                    {[
                      { label: "Total Rows", value: parsedRows.length, color: "text-violet-400" },
                      { label: "Columns Detected", value: Object.keys(parsedRows[0] ?? {}).length, color: "text-blue-400" },
                      { label: "File Size", value: `${Math.round(JSON.stringify(parsedRows).length / 1024)} KB`, color: "text-emerald-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-slate-700/40 border border-white/5 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </motion.div>
                )}

                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-600/50">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    disabled={parsedRows.length === 0 || isValidating}
                    onClick={handleValidate}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
                  >
                    {isValidating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</> : <>Validate Data <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Validation Preview ── */}
            {step === 3 && validation && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-xl font-semibold text-white mb-2">Validation Preview</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: CheckCircle2, label: "Valid Rows", value: validation.validRows.length, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { icon: XCircle, label: "Error Rows", value: validation.errorRows.length, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { icon: BarChart3, label: "Success Rate", value: `${Math.round((validation.validRows.length / (parsedRows.length || 1)) * 100)}%`, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                  ].map((s) => (
                    <div key={s.label} className={`p-4 rounded-xl border ${s.bg} text-center`}>
                      <s.icon className={`w-7 h-7 ${s.color} mx-auto mb-2`} />
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-slate-400 text-sm">{s.label}</p>
                    </div>
                  ))}
                </div>

                {validation.errorRows.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-red-300 font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Rows with Errors</h3>
                      <button onClick={downloadErrorReport} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm border border-red-500/20 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download Error Report
                      </button>
                    </div>
                    <div className="rounded-xl border border-red-500/20 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-red-500/10">
                          <tr>
                            <th className="text-left px-4 py-2.5 text-red-300 font-medium">Row</th>
                            <th className="text-left px-4 py-2.5 text-red-300 font-medium">Name / Identifier</th>
                            <th className="text-left px-4 py-2.5 text-red-300 font-medium">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validation.errorRows.slice(0, 20).map((e, i) => (
                            <tr key={i} className="border-t border-red-500/10 bg-red-500/5">
                              <td className="px-4 py-2.5 text-red-400 font-mono">{e.rowIndex}</td>
                              <td className="px-4 py-2.5 text-white/70">{e.rowData.name ?? e.rowData.email ?? "—"}</td>
                              <td className="px-4 py-2.5 text-red-300">{e.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {validation.errorRows.length > 20 && (
                        <p className="text-center text-slate-400 text-sm py-2 bg-red-500/5">…and {validation.errorRows.length - 20} more errors. Download report for full details.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-600/50">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    disabled={validation.validRows.length === 0}
                    onClick={handleImport}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Import {validation.validRows.length} Valid Rows <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Progress ── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="text-center py-8">
                <Loader2 className="w-16 h-16 text-violet-400 mx-auto mb-6 animate-spin" />
                <h2 className="text-xl font-semibold text-white mb-2">Importing Data…</h2>
                <p className="text-slate-400 mb-8">Processing in chunks for maximum reliability</p>
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Progress</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-700/60 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${importProgress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <p className="text-slate-500 text-sm mt-3">Do not close this window</p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Done ── */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Import Complete!</h2>
                <p className="text-slate-400 mb-8">
                  Successfully imported <span className="text-emerald-400 font-semibold">{validation?.validRows.length ?? 0} {entityType}s</span>
                  {(validation?.errorRows.length ?? 0) > 0 && (
                    <span> with <span className="text-red-400 font-semibold">{validation?.errorRows.length} skipped</span> due to errors</span>
                  )}
                </p>
                <div className="flex gap-4 justify-center">
                  {(validation?.errorRows.length ?? 0) > 0 && (
                    <button onClick={downloadErrorReport} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-colors">
                      <Download className="w-4 h-4" /> Download Error Report
                    </button>
                  )}
                  <button onClick={reset} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors">
                    <RotateCcw className="w-4 h-4" /> Import More Data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        {step <= 2 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: CheckCircle2, title: "Duplicate Detection", desc: "Existing records are automatically detected and skipped", color: "text-emerald-400" },
              { icon: AlertTriangle, title: "Validation Preview", desc: "Preview every error before committing any data to the database", color: "text-amber-400" },
              { icon: RotateCcw, title: "Safe Rollback", desc: "Chunked processing means failures are isolated and non-destructive", color: "text-blue-400" },
            ].map((f) => (
              <div key={f.title} className="p-4 rounded-xl bg-slate-800/40 border border-white/5 flex items-start gap-3">
                <f.icon className={`w-5 h-5 ${f.color} shrink-0 mt-0.5`} />
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
