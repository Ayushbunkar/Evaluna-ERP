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
	FuelIcon,
	GaugeIcon,
	Loader2Icon,
	ReceiptIcon,
	TruckIcon,
	UserIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
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

	// Fetch vehicles list for convenient selection
	const { data: metaData } = trpc.vanStock.getPlanningMetadata.useQuery(
		undefined,
		{ enabled: open },
	);

	const [vehicleRegistration, setVehicleRegistration] = useState("");
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
			setVehicleRegistration("");
			setDriverName("");
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
		if (!vehicleRegistration.trim()) {
			toast.error(
				locale === "hi"
					? "कृपया गाड़ी / वाहन नंबर दर्ज करें।"
					: "Please enter vehicle registration number.",
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
			vehicleRegistration: vehicleRegistration.trim().toUpperCase(),
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
							? "वाहन का पेट्रोल/डीजल/सीएनजी खर्च और मीटर रीडिंग सीधे फाइनेंस लेजर में जोड़ें।"
							: "Record vehicle fuel refill, driver details, and odometer log directly into the ledger."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					{/* Vehicle Registration & Driver */}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<Label className="flex items-center gap-1 font-semibold text-xs">
								<TruckIcon className="h-3.5 w-3.5 text-muted-foreground" />
								{locale === "hi" ? "वाहन नंबर (Vehicle No.) *" : "Vehicle Registration *"}
							</Label>
							<div className="mt-1 space-y-1">
								<Input
									placeholder="e.g. MP09-AB-1234"
									value={vehicleRegistration}
									onChange={(e) => setVehicleRegistration(e.target.value)}
									className="h-8 font-mono font-bold text-xs uppercase"
									required
								/>
								{metaData?.vehicles && metaData.vehicles.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{metaData.vehicles.slice(0, 4).map((v: any) => (
											<button
												key={v.id}
												type="button"
												onClick={() => setVehicleRegistration(v.registrationNumber)}
												className="rounded border bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
											>
												{v.registrationNumber}
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						<div>
							<Label className="flex items-center gap-1 font-semibold text-xs">
								<UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
								{locale === "hi" ? "चालक / ड्राइवर (Driver)" : "Driver / Operator"}
							</Label>
							<Input
								placeholder="e.g. Rajesh Kumar"
								value={driverName}
								onChange={(e) => setDriverName(e.target.value)}
								className="mt-1 h-8 text-xs"
							/>
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
								{locale === "hi" ? "कुल ईंधन खर्च राशि (Total ₹) *" : "Total Fuel Amount (₹) *"}
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
								{locale === "hi" ? "ओडोमीटर रीडिंग (Odometer km)" : "Odometer Reading (km)"}
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
									{locale === "hi" ? "ईंधन खर्च दर्ज करें" : "Record Fuel Expense"}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
