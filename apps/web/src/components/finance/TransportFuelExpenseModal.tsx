"use client";

import { Button } from "@evaluna/ui/components/button";
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
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	CheckCircle2Icon,
	FuelIcon,
	GaugeIcon,
	Loader2Icon,
	PlusCircleIcon,
	ReceiptIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

interface TransportFuelExpenseModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function TransportFuelExpenseModal({
	open,
	onOpenChange,
	onSuccess,
}: TransportFuelExpenseModalProps) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const locale = useLocale();

	// Fetch vehicles and drivers list from system
	const { data: metaData, isLoading: loadingMeta } =
		trpc.vanStock.getPlanningMetadata.useQuery(undefined, {
			enabled: open,
		});

	const { data: vehiclesList, isLoading: loadingVehicles } =
		trpc.vehicles.list.useQuery({}, { enabled: open });

	// Consolidate vehicles list from metadata & vehicles table
	const availableVehicles = useMemo(() => {
		const list: Array<{
			id: number | string;
			name?: string;
			registrationNumber: string;
			type?: string;
			status?: string;
			capacityKg?: number | string;
		}> = [];
		const seen = new Set<string>();

		if (metaData?.vehicles && Array.isArray(metaData.vehicles)) {
			for (const v of metaData.vehicles) {
				const reg = (
					v.registrationNumber ||
					(v as any).registration_number ||
					""
				)
					.trim()
					.toUpperCase();
				if (reg && !seen.has(reg)) {
					seen.add(reg);
					list.push({
						id: v.id,
						name: v.name,
						registrationNumber: reg,
						type: v.type,
						status: v.status,
						capacityKg: v.capacityKg,
					});
				}
			}
		}

		if (vehiclesList && Array.isArray(vehiclesList)) {
			for (const v of vehiclesList as any[]) {
				const reg = (v.registration_number || v.registrationNumber || "")
					.trim()
					.toUpperCase();
				if (reg && !seen.has(reg)) {
					seen.add(reg);
					list.push({
						id: v.id,
						name: v.name,
						registrationNumber: reg,
						type: v.type,
						status: v.status,
						capacityKg: v.capacity_kg || v.capacityKg,
					});
				}
			}
		}

		return list;
	}, [metaData?.vehicles, vehiclesList]);

	const availableDrivers = useMemo(() => {
		return (metaData?.drivers || []) as Array<{
			id: number | string;
			name: string;
			phone?: string | null;
		}>;
	}, [metaData?.drivers]);

	const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
	const [isCustomVehicle, setIsCustomVehicle] = useState<boolean>(false);
	const [vehicleRegistration, setVehicleRegistration] = useState("");
	const [isCustomDriver, setIsCustomDriver] = useState<boolean>(false);
	const [driverName, setDriverName] = useState("");
	const [fuelType, setFuelType] = useState<
		"Diesel" | "Petrol" | "CNG" | "Electric"
	>("Diesel");
	const [liters, setLiters] = useState<string>("20");
	const [ratePerLiter, setRatePerLiter] = useState<string>("92.50");
	const [totalAmount, setTotalAmount] = useState<string>("1850");
	const [odometerReading, setOdometerReading] = useState<string>("");
	const [fuelStation, setFuelStation] = useState<string>("");
	const [billNumber, setBillNumber] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [expenseDate, setExpenseDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);

	// Currently selected vehicle object
	const selectedVehicle = useMemo(() => {
		if (!selectedVehicleId || selectedVehicleId === "custom") return null;
		return (
			availableVehicles.find(
				(v) =>
					String(v.id) === String(selectedVehicleId) ||
					v.registrationNumber === vehicleRegistration,
			) || null
		);
	}, [availableVehicles, selectedVehicleId, vehicleRegistration]);

	// Auto-select first vehicle if available and none selected yet
	useEffect(() => {
		if (
			open &&
			availableVehicles.length > 0 &&
			!selectedVehicleId &&
			!vehicleRegistration &&
			!isCustomVehicle
		) {
			const first = availableVehicles[0];
			setSelectedVehicleId(String(first.id));
			setVehicleRegistration(first.registrationNumber);
		}
	}, [open, availableVehicles, selectedVehicleId, vehicleRegistration, isCustomVehicle]);

	// Auto-compute total amount when liters or rate changes
	useEffect(() => {
		const l = Number.parseFloat(liters);
		const r = Number.parseFloat(ratePerLiter);
		if (!Number.isNaN(l) && !Number.isNaN(r) && l > 0 && r > 0) {
			setTotalAmount((l * r).toFixed(2));
		}
	}, [liters, ratePerLiter]);

	const recordMutation = trpc.expenses.recordTransportFuelExpense.useMutation({
		onSuccess: () => {
			toast.success(
				locale === "hi"
					? `वाहन ईंधन खर्च ₹${totalAmount} सफलतापूर्वक दर्ज हुआ!`
					: `Transport & fuel expense ₹${totalAmount} logged successfully!`,
			);
			utils.finance.getDashboardStats.invalidate();
			utils.expenses.list.invalidate();
			onOpenChange(false);
			// Reset fields
			setSelectedVehicleId("");
			setVehicleRegistration("");
			setIsCustomVehicle(false);
			setDriverName("");
			setIsCustomDriver(false);
			setLiters("20");
			setRatePerLiter("92.50");
			setTotalAmount("1850");
			setOdometerReading("");
			setFuelStation("");
			setBillNumber("");
			setNotes("");
			onSuccess?.();
		},
		onError: (err) => {
			toast.error(
				locale === "hi"
					? `खर्च दर्ज करने में त्रुटि: ${err.message}`
					: `Failed to record fuel expense: ${err.message}`,
			);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const regToUse = vehicleRegistration.trim().toUpperCase();
		if (!regToUse) {
			toast.error(
				locale === "hi"
					? "कृपया गाड़ी / वाहन नंबर चुनें या दर्ज करें।"
					: "Please select or enter vehicle registration number.",
			);
			return;
		}
		const amt = Number.parseFloat(totalAmount);
		const lit = Number.parseFloat(liters);
		const rate = Number.parseFloat(ratePerLiter);
		if (Number.isNaN(amt) || amt <= 0) {
			toast.error(
				locale === "hi"
					? "कृपया वैध कुल राशि दर्ज करें।"
					: "Please enter a valid total expense amount.",
			);
			return;
		}

		recordMutation.mutate({
			vehicleId:
				selectedVehicleId && selectedVehicleId !== "custom"
					? Number(selectedVehicleId)
					: null,
			vehicleRegistration: regToUse,
			driverName: driverName.trim() || null,
			fuelType,
			liters: Number.isNaN(lit) || lit <= 0 ? 1 : lit,
			ratePerLiter: Number.isNaN(rate) || rate <= 0 ? amt : rate,
			totalAmount: amt,
			odometerReading: odometerReading ? Number(odometerReading) : null,
			fuelStation: fuelStation.trim() || null,
			billNumber: billNumber.trim() || null,
			notes: notes.trim() || null,
			date: expenseDate,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg border-border bg-white dark:bg-slate-900">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-bold text-lg text-foreground">
						<FuelIcon className="h-5 w-5 text-amber-500" />
						{locale === "hi"
							? "परिवहन व ईंधन खर्च दर्ज करें"
							: "Log Transport & Fuel Expense"}
					</DialogTitle>
					<DialogDescription className="text-xs">
						{locale === "hi"
							? "मैनेजर डैशबोर्ड के वाहनों में से चुनें और वाहन का ईंधन खर्च सीधे लेजर में जोड़ें।"
							: "Choose from existing fleet vehicles or enter custom vehicle and record fuel log directly into ledger."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					{/* Vehicle Registration & Driver */}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<div className="flex items-center justify-between">
								<Label className="flex items-center gap-1 font-semibold text-xs">
									<TruckIcon className="h-3.5 w-3.5 text-amber-500" />
									{locale === "hi"
										? "वाहन चुनें / नंबर *"
										: "Select Vehicle / Plate *"}
								</Label>
								<button
									type="button"
									onClick={() => {
										const next = !isCustomVehicle;
										setIsCustomVehicle(next);
										if (next) {
											setSelectedVehicleId("custom");
											setVehicleRegistration("");
										} else if (availableVehicles.length > 0) {
											setSelectedVehicleId(String(availableVehicles[0].id));
											setVehicleRegistration(
												availableVehicles[0].registrationNumber,
											);
										}
									}}
									className="text-[10px] font-medium text-blue-600 hover:underline dark:text-blue-400"
								>
									{isCustomVehicle
										? locale === "hi"
											? "गाड़ियों की सूची से चुनें"
											: "Pick from fleet list"
										: locale === "hi"
											? "+ अन्य वाहन नंबर लिखें"
											: "+ Type custom plate"}
								</button>
							</div>

							<div className="mt-1 space-y-1.5">
								{!isCustomVehicle ? (
									<>
										<select
											value={selectedVehicleId}
											onChange={(e) => {
												const val = e.target.value;
												if (val === "custom") {
													setIsCustomVehicle(true);
													setSelectedVehicleId("custom");
													setVehicleRegistration("");
												} else if (val) {
													const found = availableVehicles.find(
														(v) => String(v.id) === String(val),
													);
													if (found) {
														setSelectedVehicleId(String(found.id));
														setVehicleRegistration(found.registrationNumber);
													}
												} else {
													setSelectedVehicleId("");
													setVehicleRegistration("");
												}
											}}
											disabled={loadingMeta && loadingVehicles}
											className="h-9 w-full rounded-md border border-input bg-background px-2.5 font-medium text-xs shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
											required
										>
											<option value="">
												{loadingMeta || loadingVehicles
													? locale === "hi"
														? "लोड हो रहा है..."
														: "Loading vehicles..."
													: locale === "hi"
														? "-- वाहन चुनें (Select Vehicle) --"
														: "-- Select Registered Vehicle --"}
											</option>
											{availableVehicles.map((v) => (
												<option key={v.id} value={String(v.id)}>
													{v.registrationNumber} — {v.name || "Delivery Van"}{" "}
													{v.type ? `(${v.type})` : ""}
												</option>
											))}
											<option value="custom">
												{locale === "hi"
													? "+ अन्य / नया वाहन नंबर दर्ज करें"
													: "+ Enter Other / Custom Vehicle"}
											</option>
										</select>

										{selectedVehicle && (
											<div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-[11px] dark:border-amber-900/40 dark:bg-amber-950/20">
												<span className="font-semibold text-amber-950 dark:text-amber-200">
													✓ {selectedVehicle.name || "Vehicle"} (
													{selectedVehicle.registrationNumber})
												</span>
												<span className="rounded bg-amber-200/60 px-1.5 py-0.5 font-bold uppercase text-[10px] text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
													{selectedVehicle.type || "Van"}
												</span>
											</div>
										)}
									</>
								) : (
									<div className="space-y-1">
										<Input
											placeholder="e.g. MP09-AB-1234"
											value={vehicleRegistration}
											onChange={(e) =>
												setVehicleRegistration(e.target.value.toUpperCase())
											}
											className="h-9 font-mono font-bold text-xs uppercase"
											autoFocus
											required
										/>
										<p className="text-[10px] text-muted-foreground">
											{locale === "hi"
												? "कस्टम या अस्थायी वाहन नंबर दर्ज करें।"
												: "Enter custom or temporary vehicle registration plate."}
										</p>
									</div>
								)}

								{/* Quick clickable chips for fast 1-click select */}
								{availableVehicles.length > 0 && (
									<div className="flex flex-wrap items-center gap-1 pt-0.5">
										<span className="text-[10px] text-muted-foreground">
											{locale === "hi" ? "त्वरित:" : "Quick:"}
										</span>
										{availableVehicles.map((v) => {
											const isSelected =
												vehicleRegistration === v.registrationNumber;
											return (
												<button
													key={v.id}
													type="button"
													onClick={() => {
														setIsCustomVehicle(false);
														setSelectedVehicleId(String(v.id));
														setVehicleRegistration(v.registrationNumber);
													}}
													className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-all ${
														isSelected
															? "border-amber-500 bg-amber-500 text-white shadow-sm"
															: "border-border bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
													}`}
												>
													{v.registrationNumber}
												</button>
											);
										})}
									</div>
								)}
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between">
								<Label className="flex items-center gap-1 font-semibold text-xs">
									<UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
									{locale === "hi"
										? "चालक / ड्राइवर (Driver)"
										: "Driver / Operator"}
								</Label>
								{availableDrivers.length > 0 && (
									<button
										type="button"
										onClick={() => setIsCustomDriver(!isCustomDriver)}
										className="text-[10px] font-medium text-blue-600 hover:underline dark:text-blue-400"
									>
										{isCustomDriver
											? locale === "hi"
												? "सूची से चुनें"
												: "Select from list"
											: locale === "hi"
												? "+ अन्य नाम लिखें"
												: "+ Type custom"}
									</button>
								)}
							</div>

							<div className="mt-1 space-y-1">
								{!isCustomDriver && availableDrivers.length > 0 ? (
									<select
										value={driverName}
										onChange={(e) => {
											const val = e.target.value;
											if (val === "custom") {
												setIsCustomDriver(true);
												setDriverName("");
											} else {
												setDriverName(val);
											}
										}}
										className="h-9 w-full rounded-md border border-input bg-background px-2.5 font-medium text-xs shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
									>
										<option value="">
											{locale === "hi"
												? "-- ड्राइवर चुनें (Select Driver) --"
												: "-- Select Driver / Operator --"}
										</option>
										{availableDrivers.map((d) => (
											<option key={d.id} value={d.name}>
												{d.name} {d.phone ? `(${d.phone})` : ""}
											</option>
										))}
										<option value="custom">
											{locale === "hi"
												? "+ अन्य ड्राइवर का नाम लिखें"
												: "+ Type other driver name"}
										</option>
									</select>
								) : (
									<Input
										placeholder="e.g. Rajesh Kumar"
										value={driverName}
										onChange={(e) => setDriverName(e.target.value)}
										className="h-9 text-xs"
									/>
								)}

								{/* Driver suggestions chips */}
								{availableDrivers.length > 0 && !isCustomDriver && (
									<div className="flex flex-wrap items-center gap-1 pt-0.5">
										<span className="text-[10px] text-muted-foreground">
											{locale === "hi" ? "सुझाव:" : "Drivers:"}
										</span>
										{availableDrivers.slice(0, 3).map((d) => (
											<button
												key={d.id}
												type="button"
												onClick={() => setDriverName(d.name)}
												className={`rounded border px-1.5 py-0.5 text-[10px] transition-all ${
													driverName === d.name
														? "border-amber-500 bg-amber-50 text-amber-900 font-semibold dark:bg-amber-950/40 dark:text-amber-300"
														: "border-border bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
												}`}
											>
												{d.name}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Fuel Type, Liters & Rate */}
					<div className="grid grid-cols-3 gap-2">
						<div>
							<Label className="font-semibold text-xs">
								{locale === "hi" ? "ईंधन प्रकार" : "Fuel Type"}
							</Label>
							<select
								value={fuelType}
								onChange={(e) => setFuelType(e.target.value as any)}
								className="mt-1 h-8 w-full rounded border border-input bg-background px-2 text-xs"
							>
								<option value="Diesel">Diesel (डीजल)</option>
								<option value="Petrol">Petrol (पेट्रोल)</option>
								<option value="CNG">CNG (सीएनजी)</option>
								<option value="Electric">Electric (चार्जिंग)</option>
							</select>
						</div>

						<div>
							<Label className="font-semibold text-xs">
								{locale === "hi" ? "मात्रा (Liters) *" : "Quantity (Liters) *"}
							</Label>
							<Input
								type="number"
								step="0.01"
								placeholder="20"
								value={liters}
								onChange={(e) => setLiters(e.target.value)}
								className="mt-1 h-8 font-mono text-xs"
								required
							/>
						</div>

						<div>
							<Label className="font-semibold text-xs">
								{locale === "hi" ? "दर (₹/L) *" : "Rate (₹/L) *"}
							</Label>
							<Input
								type="number"
								step="0.01"
								placeholder="92.50"
								value={ratePerLiter}
								onChange={(e) => setRatePerLiter(e.target.value)}
								className="mt-1 h-8 font-mono text-xs"
								required
							/>
						</div>
					</div>

					{/* Total Amount & Odometer */}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
							<Label className="font-bold text-amber-900 text-xs dark:text-amber-200">
								{locale === "hi"
									? "कुल ईंधन खर्च राशि (Total ₹) *"
									: "Total Fuel Amount (₹) *"}
							</Label>
							<Input
								type="number"
								step="0.01"
								value={totalAmount}
								onChange={(e) => setTotalAmount(e.target.value)}
								className="mt-1 h-8 border-amber-300 bg-white font-bold font-mono text-amber-900 text-sm dark:bg-slate-900 dark:text-amber-300"
								required
							/>
						</div>

						<div>
							<Label className="flex items-center gap-1 font-semibold text-xs">
								<GaugeIcon className="h-3.5 w-3.5 text-muted-foreground" />
								{locale === "hi"
									? "ओडोमीटर रीडिंग (Odometer km)"
									: "Odometer Reading (km)"}
							</Label>
							<Input
								type="number"
								placeholder="e.g. 45280"
								value={odometerReading}
								onChange={(e) => setOdometerReading(e.target.value)}
								className="mt-1 h-8 font-mono text-xs"
							/>
						</div>
					</div>

					{/* Fuel Station, Bill No & Date */}
					<div className="grid grid-cols-3 gap-2">
						<div>
							<Label className="font-semibold text-xs">
								{locale === "hi" ? "पंप / स्टेशन" : "Fuel Station"}
							</Label>
							<Input
								placeholder="e.g. HPCL Bypass"
								value={fuelStation}
								onChange={(e) => setFuelStation(e.target.value)}
								className="mt-1 h-8 text-xs"
							/>
						</div>

						<div>
							<Label className="flex items-center gap-1 font-semibold text-xs">
								<ReceiptIcon className="h-3 w-3 text-muted-foreground" />
								{locale === "hi" ? "बिल नंबर" : "Bill / Slip #"}
							</Label>
							<Input
								placeholder="e.g. B-8849"
								value={billNumber}
								onChange={(e) => setBillNumber(e.target.value)}
								className="mt-1 h-8 text-xs"
							/>
						</div>

						<div>
							<Label className="font-semibold text-xs">
								{locale === "hi" ? "तारीख (Date)" : "Date"}
							</Label>
							<Input
								type="date"
								value={expenseDate}
								onChange={(e) => setExpenseDate(e.target.value)}
								className="mt-1 h-8 text-xs"
							/>
						</div>
					</div>

					{/* Remarks */}
					<div>
						<Label className="font-semibold text-xs">
							{locale === "hi" ? "अतिरिक्त विवरण / टिप्पणी" : "Notes / Remarks"}
						</Label>
						<Textarea
							placeholder="e.g. Full tank refill before Indore trip delivery"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="mt-1 h-14 text-xs"
						/>
					</div>

					<DialogFooter className="gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
						>
							{locale === "hi" ? "रद्द करें" : "Cancel"}
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={recordMutation.isPending}
							className="bg-amber-600 font-semibold text-white hover:bg-amber-700"
						>
							{recordMutation.isPending ? (
								<>
									<Loader2Icon className="mr-1.5 h-4 w-4 animate-spin" />
									{locale === "hi" ? "सहेज रहे हैं..." : "Recording..."}
								</>
							) : (
								<>
									<FuelIcon className="mr-1.5 h-4 w-4" />
									{locale === "hi"
										? "ईंधन खर्च दर्ज करें"
										: "Record Fuel Expense"}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
