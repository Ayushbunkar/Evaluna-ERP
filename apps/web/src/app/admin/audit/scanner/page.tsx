"use client";

import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	Loader2Icon,
	PackageOpenIcon,
	ScanBarcodeIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

export default function AuditorScanner() {
	const [step, setStep] = useState<"scan" | "count" | "exception">("scan");
	const [productBarcode, setProductBarcode] = useState("");
	const [locationBarcode, setLocationBarcode] = useState("");
	const [count, setCount] = useState<number | "">("");
	const [notes, setNotes] = useState("");
	const [exceptionType, setExceptionType] = useState<
		"damage" | "expiry" | "missing" | null
	>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Mock endpoints
	const submitCount = (trpc.audit as any).submitAuditCount.useMutation({
		onSuccess: (data: any) => {
			if (data.status === "mismatch") {
				toast.warning("Count mismatch. Please recount or escalate.");
			} else {
				toast.success("Count matched perfectly!");
				resetScanner();
			}
			setIsSubmitting(false);
		},
		onError: (err: any) => {
			toast.error(err.message);
			setIsSubmitting(false);
		},
	});

	const reportDiscrepancy = (trpc.audit as any).reportDiscrepancy.useMutation({
		onSuccess: () => {
			toast.error(`Stock marked as ${exceptionType}. Escalation created.`);
			resetScanner();
			setIsSubmitting(false);
		},
		onError: (err: any) => {
			toast.error(err.message);
			setIsSubmitting(false);
		},
	});

	const resetScanner = () => {
		setProductBarcode("");
		setCount("");
		setNotes("");
		setExceptionType(null);
		setStep("scan");
	};

	const handleNext = () => {
		if (!productBarcode || !locationBarcode) {
			toast.error("Scan both location and product to begin counting.");
			return;
		}
		setStep("count");
	};

	const handleSubmitCount = () => {
		if (count === "") return toast.error("Enter a valid count");
		setIsSubmitting(true);
		// Mock simulation
		setTimeout(() => {
			submitCount.mutate({
				audit_id: 1,
				product_id: 1, // mocked from barcode
				counted_qty: Number(count),
			});
		}, 800);
	};

	const handleReportException = () => {
		if (!exceptionType) return toast.error("Select an exception type");
		setIsSubmitting(true);
		// Mock simulation
		setTimeout(() => {
			reportDiscrepancy.mutate({
				audit_item_id: 1,
				type: exceptionType,
				qty: Number(count) || 1, // Amount that is damaged/missing
				notes,
			});
		}, 800);
	};

	return (
		<div className="zoom-in-95 container mx-auto flex min-h-screen max-w-md animate-in flex-col items-center justify-center bg-white p-4 duration-500">
			<Card className="w-full overflow-hidden border-0 bg-white shadow-2xl ring-1 ring-black/10">
				<div className="h-2 w-full bg-black" />

				{step === "scan" && (
					<>
						<CardHeader className="pb-2 text-center">
							<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-black/10 p-4">
								<ScanBarcodeIcon className="h-10 w-10 text-black" />
							</div>
							<CardTitle className="font-bold text-2xl text-black">
								Blind Audit
							</CardTitle>
							<CardDescription className="text-gray-600">
								Scan items to verify inventory
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6 pt-6">
							<div className="space-y-2">
								<Label className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
									Location Barcode
								</Label>
								<Input
									placeholder="Scan Bin..."
									className="h-14 border-gray-300 bg-white text-lg text-black uppercase placeholder:text-gray-500 focus-visible:ring-black"
									value={locationBarcode}
									onChange={(e) => setLocationBarcode(e.target.value)}
									autoFocus
								/>
							</div>
							<div className="space-y-2">
								<Label className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
									Product Barcode
								</Label>
								<Input
									placeholder="Scan Item..."
									className="h-14 border-gray-300 bg-white text-lg text-black placeholder:text-gray-500 focus-visible:ring-black"
									value={productBarcode}
									onChange={(e) => setProductBarcode(e.target.value)}
								/>
							</div>
						</CardContent>
						<CardFooter className="pt-4 pb-8">
							<Button
								className="h-14 w-full bg-black font-bold text-lg text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all hover:bg-gray-800 active:scale-95"
								onClick={handleNext}
								disabled={!locationBarcode || !productBarcode}
							>
								START COUNT
							</Button>
						</CardFooter>
					</>
				)}

				{step === "count" && (
					<div className="slide-in-from-right animate-in duration-300">
						<CardHeader className="border-white/10 border-b pb-2 text-center">
							<CardTitle className="font-bold text-white text-xl">
								Physical Count
							</CardTitle>
							<CardDescription className="text-slate-400">
								Loc: {locationBarcode} | Item: {productBarcode}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-8 pt-8 pb-4">
							<div className="flex flex-col items-center justify-center space-y-4">
								<Label className="font-medium text-lg text-slate-300">
									How many do you see?
								</Label>
								<Input
									type="number"
									placeholder="0"
									className="h-32 rounded-2xl border-slate-700 bg-slate-900 text-center font-black text-6xl text-white focus-visible:ring-emerald-500"
									value={count}
									onChange={(e) =>
										setCount(e.target.value ? Number(e.target.value) : "")
									}
									autoFocus
								/>
							</div>

							<div className="grid grid-cols-2 gap-4 pt-4">
								<Button
									variant="outline"
									className="h-14 border-red-500/30 font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300"
									onClick={() => setStep("exception")}
								>
									<AlertTriangleIcon className="mr-2 h-5 w-5" />
									Exception
								</Button>
								<Button
									className="h-14 bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400"
									onClick={handleSubmitCount}
									disabled={isSubmitting || count === ""}
								>
									{isSubmitting ? (
										<Loader2Icon className="h-6 w-6 animate-spin" />
									) : (
										<>
											<CheckCircle2Icon className="mr-2 h-5 w-5" /> Submit
										</>
									)}
								</Button>
							</div>
						</CardContent>
						<CardFooter className="justify-center border-white/10 border-t pt-4">
							<Button
								variant="ghost"
								className="text-slate-400 hover:text-white"
								onClick={resetScanner}
							>
								Cancel
							</Button>
						</CardFooter>
					</div>
				)}

				{step === "exception" && (
					<div className="slide-in-from-bottom animate-in bg-red-950/20 duration-300">
						<CardHeader className="border-red-900/30 border-b">
							<CardTitle className="flex items-center font-bold text-red-400 text-xl">
								<AlertTriangleIcon className="mr-2 h-6 w-6" />
								Report Exception
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6 pt-6">
							<div className="grid grid-cols-3 gap-2">
								{(["damage", "expiry", "missing"] as const).map((type) => (
									<Button
										key={type}
										variant="outline"
										className={`flex h-16 flex-col items-center justify-center gap-1 border-slate-700 ${exceptionType === type ? "border-red-500 bg-red-500/20 text-red-400" : "bg-slate-900 text-slate-400"}`}
										onClick={() => setExceptionType(type)}
									>
										{type === "damage" ? (
											<XCircleIcon className="h-5 w-5" />
										) : type === "expiry" ? (
											<PackageOpenIcon className="h-5 w-5" />
										) : (
											<AlertTriangleIcon className="h-5 w-5" />
										)}
										<span className="font-bold text-xs uppercase">{type}</span>
									</Button>
								))}
							</div>

							<div className="space-y-2">
								<Label className="font-semibold text-slate-300 text-sm">
									Affected Quantity
								</Label>
								<Input
									type="number"
									placeholder="How many items?"
									className="border-slate-700 bg-slate-900 text-white"
									value={count}
									onChange={(e) =>
										setCount(e.target.value ? Number(e.target.value) : "")
									}
								/>
							</div>

							<div className="space-y-2">
								<Label className="font-semibold text-slate-300 text-sm">
									Notes (Optional)
								</Label>
								<Textarea
									placeholder="Describe the issue..."
									className="resize-none border-slate-700 bg-slate-900 text-white"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>
						</CardContent>
						<CardFooter className="grid grid-cols-2 gap-4 bg-black/20 pt-4">
							<Button
								variant="ghost"
								className="text-slate-400 hover:text-white"
								onClick={() => setStep("count")}
							>
								Back
							</Button>
							<Button
								className="bg-red-600 font-bold text-white hover:bg-red-500"
								onClick={handleReportException}
								disabled={isSubmitting || !exceptionType}
							>
								{isSubmitting ? (
									<Loader2Icon className="h-5 w-5 animate-spin" />
								) : (
									"Escalate"
								)}
							</Button>
						</CardFooter>
					</div>
				)}
			</Card>
		</div>
	);
}
