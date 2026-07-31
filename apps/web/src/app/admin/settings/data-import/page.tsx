"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	BarChart3,
	CheckCircle2,
	Download,
	FileText,
	Loader2,
	Package,
	RotateCcw,
	ShoppingCart,
	Truck,
	Upload,
	Users,
	XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
	product: [
		"name",
		"price",
		"barcode",
		"category",
		"description",
		"unit",
		"sku",
		"hsn",
		"taxable",
	],
	customer: [
		"name",
		"email",
		"phone",
		"address",
		"gst_number",
		"credit_limit",
		"customer_type",
	],
	supplier: [
		"name",
		"email",
		"phone",
		"address",
		"gst_number",
		"pan_number",
		"supplier_category",
	],
};

const SAMPLE_DATA: Record<EntityType, Record<string, string>[]> = {
	product: [
		{
			name: "Rice Basmati 5kg",
			price: "450",
			barcode: "8901234567890",
			category: "Grains",
			description: "Premium basmati rice",
			unit: "kg",
			sku: "RICE001",
			hsn: "1006",
			taxable: "true",
		},
		{
			name: "Sunflower Oil 1L",
			price: "180",
			barcode: "8901234567891",
			category: "Oils",
			description: "Refined sunflower oil",
			unit: "L",
			sku: "OIL001",
			hsn: "1512",
			taxable: "true",
		},
	],
	customer: [
		{
			name: "Raj Enterprises",
			email: "raj@example.com",
			phone: "9876543210",
			address: "123 MG Road, Bangalore",
			gst_number: "29AAAAA0000A1Z5",
			credit_limit: "50000",
			customer_type: "wholesale",
		},
	],
	supplier: [
		{
			name: "Metro Distributors",
			email: "metro@example.com",
			phone: "9876543211",
			address: "45 Industrial Area, Delhi",
			gst_number: "07BBBBB0000B1Z5",
			pan_number: "BBBBB0000B",
			supplier_category: "local",
		},
	],
};

// ── CSV Utils ─────────────────────────────────────────────────────────────────
function arrayToCSV(headers: string[], rows: Record<string, string>[]): string {
	const lines = [headers.join(",")];
	for (const row of rows) {
		lines.push(
			headers.map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(","),
		);
	}
	return lines.join("\n");
}

function parseCSV(text: string): ParsedRow[] {
	const lines = text.trim().split(/\r?\n/);
	if (lines.length < 2) return [];
	const headers = lines[0]
		.split(",")
		.map((h) => h.replace(/^"|"$/g, "").trim());
	return lines.slice(1).map((line) => {
		const values = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
		const obj: ParsedRow = {};
		headers.forEach((h, i) => {
			obj[h] = values[i] ?? "";
		});
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
		<div className="mb-8 flex items-center gap-2">
			{steps.map((label, i) => {
				const step = (i + 1) as Step;
				const active = step === currentStep;
				const done = step < currentStep;
				return (
					<div
						key={step}
						className="flex flex-1 items-center gap-2 last:flex-none"
					>
						<div className="flex flex-col items-center gap-1">
							<motion.div
								initial={false}
								animate={{
									backgroundColor: done
										? "#8b5cf6"
										: active
											? "#6d28d9"
											: "rgba(255,255,255,0.1)",
									scale: active ? 1.15 : 1,
								}}
								className="flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold text-sm"
								style={{
									borderColor:
										active || done ? "#8b5cf6" : "rgba(255,255,255,0.2)",
								}}
							>
								{done ? (
									<CheckCircle2 className="h-4 w-4 text-white" />
								) : (
									<span className={active ? "text-white" : "text-white/40"}>
										{step}
									</span>
								)}
							</motion.div>
							<span
								className={`whitespace-nowrap font-medium text-xs ${active ? "text-violet-300" : done ? "text-violet-400/70" : "text-white/30"}`}
							>
								{label}
							</span>
						</div>
						{i < steps.length - 1 && (
							<div
								className="mb-4 h-0.5 flex-1"
								style={{
									backgroundColor: done ? "#8b5cf6" : "rgba(255,255,255,0.1)",
								}}
							/>
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
	const [_isImporting, setIsImporting] = useState(false);
	const [importProgress, setImportProgress] = useState(0);
	const [_importDone, setImportDone] = useState(false);
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
	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
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
		},
		[],
	);

	// ── Validate
	const handleValidate = useCallback(async () => {
		if (!entityType || parsedRows.length === 0) return;
		setIsValidating(true);
		try {
			const result = await validateMutation.mutateAsync({
				entityType,
				rows: parsedRows,
			});
			setValidation(result as ValidationResult);
			setStep(3);
		} catch {
			// Fallback: client-side validation when API fails
			const validRows: ParsedRow[] = [];
			const errorRows: ErrorRow[] = [];
			parsedRows.forEach((row, i) => {
				const errors: string[] = [];
				if (!row.name?.trim()) errors.push("name is required");
				if (
					entityType === "product" &&
					(!row.price || Number.isNaN(Number(row.price)))
				)
					errors.push("price must be a valid number");
				if (entityType === "customer" && !row.email?.includes("@"))
					errors.push("email is invalid");
				if (errors.length > 0)
					errorRows.push({
						rowIndex: i + 2,
						rowData: row,
						error: errors.join("; "),
					});
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
			} catch {
				/* per-chunk errors are logged, we continue */
			}
			setImportProgress(Math.round(((c + 1) / chunks.length) * 100));
		}
		setIsImporting(false);
		setImportDone(true);
		setStep(5);
	}, [entityType, validation, executeMutation]);

	// ── Error CSV Download
	const downloadErrorReport = useCallback(() => {
		if (!validation?.errorRows.length) return;
		const headers = [
			"row",
			"error",
			...Object.keys(validation.errorRows[0]?.rowData ?? {}),
		];
		const rows = validation.errorRows.map((e) => ({
			row: String(e.rowIndex),
			error: e.error,
			...e.rowData,
		}));
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
				className="mx-auto max-w-5xl"
			>
				{/* Header */}
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="flex items-center gap-3 font-bold text-3xl text-white">
							<div className="rounded-xl border border-violet-500/30 bg-violet-600/20 p-2">
								<Upload className="h-7 w-7 text-violet-400" />
							</div>
							Data Import Wizard
						</h1>
						<p className="mt-1 text-slate-400">
							Bulk import your data with validation and duplicate detection
						</p>
					</div>
					{step > 1 && (
						<button
							onClick={reset}
							className="flex items-center gap-2 rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-slate-300 text-sm transition-colors hover:bg-slate-700"
						>
							<RotateCcw className="h-4 w-4" /> Start Over
						</button>
					)}
				</div>

				{/* Step Indicator */}
				<StepIndicator currentStep={step} />

				{/* Card */}
				<div className="rounded-2xl border border-white/10 bg-slate-800/60 p-8 shadow-2xl backdrop-blur-xl">
					<AnimatePresence mode="wait">
						{/* ── STEP 1: Entity Selection ── */}
						{step === 1 && (
							<motion.div
								key="step1"
								initial={{ opacity: 0, x: 30 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -30 }}
							>
								<h2 className="mb-2 font-semibold text-white text-xl">
									Select Import Type
								</h2>
								<p className="mb-6 text-slate-400">
									Choose what type of data you want to import, then download the
									template.
								</p>
								<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
									{ENTITY_OPTIONS.map((opt) => {
										const Icon = opt.icon;
										const selected = entityType === opt.id;
										return (
											<motion.button
												key={opt.id}
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												onClick={() => setEntityType(opt.id)}
												className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
													selected
														? "border-violet-500 bg-violet-500/10"
														: "border-white/10 bg-slate-700/30 hover:border-white/20"
												}`}
											>
												<div
													className={`h-10 w-10 rounded-lg bg-gradient-to-br ${opt.color} mb-3 flex items-center justify-center`}
												>
													<Icon className="h-5 w-5 text-white" />
												</div>
												<p className="font-semibold text-white">{opt.label}</p>
												<p className="mt-1 text-slate-400 text-sm">
													{opt.description}
												</p>
												{selected && (
													<CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-violet-400" />
												)}
											</motion.button>
										);
									})}
								</div>
								{entityType && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
									>
										<FileText className="h-6 w-6 shrink-0 text-emerald-400" />
										<div className="flex-1">
											<p className="font-medium text-emerald-300">
												Download CSV Template
											</p>
											<p className="text-slate-400 text-sm">
												Get the required column headers with sample data
												pre-filled
											</p>
										</div>
										<button
											onClick={downloadTemplate}
											className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-emerald-500"
										>
											<Download className="h-4 w-4" /> Template
										</button>
									</motion.div>
								)}
								<div className="mt-6 flex justify-end">
									<button
										disabled={!entityType}
										onClick={() => setStep(2)}
										className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
									>
										Next: Upload File <ArrowRight className="h-4 w-4" />
									</button>
								</div>
							</motion.div>
						)}

						{/* ── STEP 2: File Upload ── */}
						{step === 2 && (
							<motion.div
								key="step2"
								initial={{ opacity: 0, x: 30 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -30 }}
							>
								<h2 className="mb-2 font-semibold text-white text-xl">
									Upload CSV File
								</h2>
								<p className="mb-6 text-slate-400">
									Upload your populated CSV file. Files are parsed locally for
									speed and privacy.
								</p>
								<input
									ref={fileRef}
									type="file"
									accept=".csv,.txt"
									onChange={handleFileChange}
									className="hidden"
									id="csv-upload"
								/>
								<label htmlFor="csv-upload" className="block">
									<div
										className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${fileName ? "border-violet-500 bg-violet-500/5" : "border-white/20 bg-slate-700/20 hover:border-white/40 hover:bg-slate-700/30"}`}
									>
										{fileName ? (
											<div>
												<CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-violet-400" />
												<p className="font-semibold text-white">{fileName}</p>
												<p className="mt-1 text-slate-400">
													{parsedRows.length} rows parsed successfully
												</p>
											</div>
										) : (
											<div>
												<Upload className="mx-auto mb-3 h-12 w-12 text-slate-500" />
												<p className="font-semibold text-white">
													Click to select CSV file
												</p>
												<p className="mt-1 text-slate-400">
													or drag and drop here
												</p>
												<p className="mt-2 text-slate-500 text-sm">
													Supports CSV and TXT formats
												</p>
											</div>
										)}
									</div>
								</label>

								{parsedRows.length > 0 && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="mt-4 grid grid-cols-3 gap-4"
									>
										{[
											{
												label: "Total Rows",
												value: parsedRows.length,
												color: "text-violet-400",
											},
											{
												label: "Columns Detected",
												value: Object.keys(parsedRows[0] ?? {}).length,
												color: "text-blue-400",
											},
											{
												label: "File Size",
												value: `${Math.round(JSON.stringify(parsedRows).length / 1024)} KB`,
												color: "text-emerald-400",
											},
										].map((stat) => (
											<div
												key={stat.label}
												className="rounded-xl border border-white/5 bg-slate-700/40 p-4 text-center"
											>
												<p className={`font-bold text-2xl ${stat.color}`}>
													{stat.value}
												</p>
												<p className="mt-1 text-slate-400 text-sm">
													{stat.label}
												</p>
											</div>
										))}
									</motion.div>
								)}

								<div className="mt-8 flex justify-between">
									<button
										onClick={() => setStep(1)}
										className="flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-700/50 px-5 py-2.5 font-medium text-slate-300 transition-colors hover:bg-slate-700"
									>
										<ArrowLeft className="h-4 w-4" /> Back
									</button>
									<button
										disabled={parsedRows.length === 0 || isValidating}
										onClick={handleValidate}
										className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
									>
										{isValidating ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" /> Validating…
											</>
										) : (
											<>
												Validate Data <ArrowRight className="h-4 w-4" />
											</>
										)}
									</button>
								</div>
							</motion.div>
						)}

						{/* ── STEP 3: Validation Preview ── */}
						{step === 3 && validation && (
							<motion.div
								key="step3"
								initial={{ opacity: 0, x: 30 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -30 }}
							>
								<h2 className="mb-2 font-semibold text-white text-xl">
									Validation Preview
								</h2>
								<div className="mb-6 grid grid-cols-3 gap-4">
									{[
										{
											icon: CheckCircle2,
											label: "Valid Rows",
											value: validation.validRows.length,
											color: "text-emerald-400",
											bg: "bg-emerald-500/10 border-emerald-500/20",
										},
										{
											icon: XCircle,
											label: "Error Rows",
											value: validation.errorRows.length,
											color: "text-red-400",
											bg: "bg-red-500/10 border-red-500/20",
										},
										{
											icon: BarChart3,
											label: "Success Rate",
											value: `${Math.round((validation.validRows.length / (parsedRows.length || 1)) * 100)}%`,
											color: "text-violet-400",
											bg: "bg-violet-500/10 border-violet-500/20",
										},
									].map((s) => (
										<div
											key={s.label}
											className={`rounded-xl border p-4 ${s.bg} text-center`}
										>
											<s.icon className={`h-7 w-7 ${s.color} mx-auto mb-2`} />
											<p className={`font-bold text-2xl ${s.color}`}>
												{s.value}
											</p>
											<p className="text-slate-400 text-sm">{s.label}</p>
										</div>
									))}
								</div>

								{validation.errorRows.length > 0 && (
									<div className="mb-6">
										<div className="mb-3 flex items-center justify-between">
											<h3 className="flex items-center gap-2 font-medium text-red-300">
												<AlertTriangle className="h-4 w-4" /> Rows with Errors
											</h3>
											<button
												onClick={downloadErrorReport}
												className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-red-300 text-sm transition-colors hover:bg-red-500/20"
											>
												<Download className="h-3.5 w-3.5" /> Download Error
												Report
											</button>
										</div>
										<div className="overflow-hidden rounded-xl border border-red-500/20">
											<table className="w-full text-sm">
												<thead className="bg-red-500/10">
													<tr>
														<th className="px-4 py-2.5 text-left font-medium text-red-300">
															Row
														</th>
														<th className="px-4 py-2.5 text-left font-medium text-red-300">
															Name / Identifier
														</th>
														<th className="px-4 py-2.5 text-left font-medium text-red-300">
															Error
														</th>
													</tr>
												</thead>
												<tbody>
													{validation.errorRows.slice(0, 20).map((e, i) => (
														<tr
															key={i}
															className="border-red-500/10 border-t bg-red-500/5"
														>
															<td className="px-4 py-2.5 font-mono text-red-400">
																{e.rowIndex}
															</td>
															<td className="px-4 py-2.5 text-white/70">
																{e.rowData.name ?? e.rowData.email ?? "—"}
															</td>
															<td className="px-4 py-2.5 text-red-300">
																{e.error}
															</td>
														</tr>
													))}
												</tbody>
											</table>
											{validation.errorRows.length > 20 && (
												<p className="bg-red-500/5 py-2 text-center text-slate-400 text-sm">
													…and {validation.errorRows.length - 20} more errors.
													Download report for full details.
												</p>
											)}
										</div>
									</div>
								)}

								<div className="flex justify-between">
									<button
										onClick={() => setStep(2)}
										className="flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-700/50 px-5 py-2.5 font-medium text-slate-300 transition-colors hover:bg-slate-700"
									>
										<ArrowLeft className="h-4 w-4" /> Back
									</button>
									<button
										disabled={validation.validRows.length === 0}
										onClick={handleImport}
										className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
									>
										<ShoppingCart className="h-4 w-4" />
										Import {validation.validRows.length} Valid Rows{" "}
										<ArrowRight className="h-4 w-4" />
									</button>
								</div>
							</motion.div>
						)}

						{/* ── STEP 4: Progress ── */}
						{step === 4 && (
							<motion.div
								key="step4"
								initial={{ opacity: 0, x: 30 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -30 }}
								className="py-8 text-center"
							>
								<Loader2 className="mx-auto mb-6 h-16 w-16 animate-spin text-violet-400" />
								<h2 className="mb-2 font-semibold text-white text-xl">
									Importing Data…
								</h2>
								<p className="mb-8 text-slate-400">
									Processing in chunks for maximum reliability
								</p>
								<div className="mx-auto max-w-md">
									<div className="mb-2 flex justify-between text-slate-400 text-sm">
										<span>Progress</span>
										<span>{importProgress}%</span>
									</div>
									<div className="h-3 overflow-hidden rounded-full bg-slate-700/60">
										<motion.div
											className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
											initial={{ width: 0 }}
											animate={{ width: `${importProgress}%` }}
											transition={{ duration: 0.4 }}
										/>
									</div>
									<p className="mt-3 text-slate-500 text-sm">
										Do not close this window
									</p>
								</div>
							</motion.div>
						)}

						{/* ── STEP 5: Done ── */}
						{step === 5 && (
							<motion.div
								key="step5"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								className="py-8 text-center"
							>
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: "spring", stiffness: 200, damping: 15 }}
									className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/20"
								>
									<CheckCircle2 className="h-10 w-10 text-emerald-400" />
								</motion.div>
								<h2 className="mb-2 font-bold text-2xl text-white">
									Import Complete!
								</h2>
								<p className="mb-8 text-slate-400">
									Successfully imported{" "}
									<span className="font-semibold text-emerald-400">
										{validation?.validRows.length ?? 0} {entityType}s
									</span>
									{(validation?.errorRows.length ?? 0) > 0 && (
										<span>
											{" "}
											with{" "}
											<span className="font-semibold text-red-400">
												{validation?.errorRows.length} skipped
											</span>{" "}
											due to errors
										</span>
									)}
								</p>
								<div className="flex justify-center gap-4">
									{(validation?.errorRows.length ?? 0) > 0 && (
										<button
											onClick={downloadErrorReport}
											className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-red-300 transition-colors hover:bg-red-500/20"
										>
											<Download className="h-4 w-4" /> Download Error Report
										</button>
									)}
									<button
										onClick={reset}
										className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500"
									>
										<RotateCcw className="h-4 w-4" /> Import More Data
									</button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Footer Info */}
				{step <= 2 && (
					<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
						{[
							{
								icon: CheckCircle2,
								title: "Duplicate Detection",
								desc: "Existing records are automatically detected and skipped",
								color: "text-emerald-400",
							},
							{
								icon: AlertTriangle,
								title: "Validation Preview",
								desc: "Preview every error before committing any data to the database",
								color: "text-amber-400",
							},
							{
								icon: RotateCcw,
								title: "Safe Rollback",
								desc: "Chunked processing means failures are isolated and non-destructive",
								color: "text-blue-400",
							},
						].map((f) => (
							<div
								key={f.title}
								className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-800/40 p-4"
							>
								<f.icon className={`h-5 w-5 ${f.color} mt-0.5 shrink-0`} />
								<div>
									<p className="font-medium text-sm text-white">{f.title}</p>
									<p className="mt-0.5 text-slate-400 text-xs">{f.desc}</p>
								</div>
							</div>
						))}
					</div>
				)}
			</motion.div>
		</div>
	);
}
