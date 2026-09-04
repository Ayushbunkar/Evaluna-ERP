"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import JsBarcode from "jsbarcode";
import {
	BarcodeIcon,
	CalendarCheckIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	PlusIcon,
	PrinterIcon,
	RefreshCwIcon,
	SearchIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

const statusConfig: Record<string, { label: string; color: string }> = {
	PENDING: {
		label: "Pending",
		color:
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	},
	ASSIGNED: {
		label: "Assigned",
		color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
	},
	IN_PROGRESS: {
		label: "In Progress",
		color:
			"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
	},
	VERIFICATION_REQUIRED: {
		label: "Needs Verification",
		color:
			"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
	},
	COMPLETED: {
		label: "Completed",
		color:
			"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
	},
};

function generateEan13() {
	// Generate 12 digits
	let result = "890"; // India EAN prefix or custom ERP prefix
	for (let i = 0; i < 9; i++) {
		result += Math.floor(Math.random() * 10).toString();
	}
	// Calculate EAN-13 checksum digit
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		const digit = Number.parseInt(result[i], 10);
		sum += i % 2 === 0 ? digit : digit * 3;
	}
	const checksum = (10 - (sum % 10)) % 10;
	return result + checksum.toString();
}

export default function AuditorUpcPage() {
	const trpc = useTRPC();
	const {
		data: tasks,
		isLoading,
		error,
		refetch: refetchTasks,
	} = trpc.auditor.getUpcTasks.useQuery({});
	const { data: productsList } = trpc.auditor.getProductsList.useQuery();

	const createUpcMutation = trpc.auditor.createUpcTask.useMutation({
		onSuccess: () => {
			refetchTasks();
			setIsModalOpen(false);
			setSelectedProductId(null);
			setGeneratedBarcode("");
			setNotes("");
		},
	});

	// Barcode Modal & Generator State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<number | null>(
		null,
	);
	const [generatedBarcode, setGeneratedBarcode] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [searchFilter, setSearchFilter] = useState<string>("");

	// Barcode printing state
	const [printItem, setPrintItem] = useState<{
		name: string;
		barcode: string;
		price?: string;
	} | null>(null);

	const svgRef = useRef<SVGSVGElement | null>(null);
	const printSvgRef = useRef<SVGSVGElement | null>(null);

	// Generate barcode when product is selected or modal opens
	const handleGenerateNew = () => {
		const code = generateEan13();
		setGeneratedBarcode(code);
	};

	useEffect(() => {
		if (selectedProductId && !generatedBarcode) {
			handleGenerateNew();
		}
	}, [selectedProductId]);

	// Render SVG barcode in modal
	useEffect(() => {
		if (svgRef.current && generatedBarcode) {
			try {
				JsBarcode(svgRef.current, generatedBarcode, {
					format: "CODE128",
					width: 2,
					height: 60,
					displayValue: true,
					fontSize: 14,
					margin: 10,
				});
			} catch (e) {
				console.error("Barcode generation error:", e);
			}
		}
	}, [generatedBarcode, isModalOpen]);

	// Render printable barcode
	useEffect(() => {
		if (printSvgRef.current && printItem?.barcode) {
			try {
				JsBarcode(printSvgRef.current, printItem.barcode, {
					format: "CODE128",
					width: 2,
					height: 50,
					displayValue: true,
					fontSize: 12,
					margin: 5,
				});
			} catch (e) {
				console.error("Print barcode generation error:", e);
			}
		}
	}, [printItem]);

	const handleSaveBarcode = () => {
		if (!selectedProductId || !generatedBarcode) return;
		createUpcMutation.mutate({
			productId: selectedProductId,
			upcValue: generatedBarcode,
			notes: notes || "Auditor generated & verified UPC",
		});
	};

	const handlePrint = (name: string, barcode: string, price?: string) => {
		setPrintItem({ name, barcode, price });
		setTimeout(() => {
			window.print();
		}, 300);
	};

	const selectedProductObj = productsList?.find(
		(p) => p.id === selectedProductId,
	);

	const filteredTasks = tasks?.filter(
		(t) =>
			t.product_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
			t.barcode?.toLowerCase().includes(searchFilter.toLowerCase()),
	);

	const totalTasks = tasks?.length ?? 0;
	const completed = tasks?.filter((t) => t.status === "COMPLETED").length ?? 0;
	const pending = tasks?.filter((t) => t.status === "PENDING").length ?? 0;

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Printable Area for Thermal Stickers */}
			<div className="hidden print:fixed print:inset-0 print:z-[9999] print:block print:bg-white print:p-4">
				{printItem && (
					<div className="mx-auto flex w-[250px] flex-col items-center justify-center border-2 border-black border-dashed p-4 text-center font-sans">
						<p className="max-w-[220px] truncate font-bold text-sm">
							{printItem.name}
						</p>
						<svg ref={printSvgRef} className="my-1" />
						{printItem.price && (
							<p className="mt-1 font-semibold text-xs">
								MRP: ₹{printItem.price}
							</p>
						)}
						<p className="mt-1 text-[10px] text-gray-500">
							EVALUNA ERP VERIFIED
						</p>
					</div>
				)}
			</div>

			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
						<BarcodeIcon className="h-7 w-7 text-blue-600" />
						Production UPC & Barcode Management
					</h1>
					<p className="text-muted-foreground text-sm">
						Generate EAN/UPC barcodes, print sticker labels for inventory
						material, and store in DB for POS billing.
					</p>
				</div>

				<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
					<DialogTrigger asChild>
						<Button className="bg-blue-600 shadow-md hover:bg-blue-700">
							<PlusIcon className="mr-2 h-4 w-4" /> Generate New Barcode Label
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<BarcodeIcon className="h-5 w-5 text-blue-600" />
								Generate & Print UPC Barcode
							</DialogTitle>
							<DialogDescription>
								Select a product from inventory to generate a unique barcode.
								Save to database for instant billing scan.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							{/* Product Selector */}
							<div className="space-y-1">
								<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
									Select Target Product:
								</label>
								<select
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={selectedProductId ?? ""}
									onChange={(e) => {
										const val = Number(e.target.value);
										setSelectedProductId(val || null);
										const p = productsList?.find((prod) => prod.id === val);
										if (p?.barcode) {
											setGeneratedBarcode(p.barcode);
										} else {
											handleGenerateNew();
										}
									}}
								>
									<option value="">-- Choose Product --</option>
									{productsList?.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}{" "}
											{p.barcode
												? `(Current Barcode: ${p.barcode})`
												: "(No Barcode)"}
										</option>
									))}
								</select>
							</div>

							{selectedProductId && (
								<>
									{/* Barcode Input & Regenerate */}
									<div className="space-y-1">
										<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
											Generated Barcode / EAN-13:
										</label>
										<div className="flex gap-2">
											<input
												type="text"
												className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
												value={generatedBarcode}
												onChange={(e) => setGeneratedBarcode(e.target.value)}
											/>
											<Button
												variant="outline"
												size="icon"
												onClick={handleGenerateNew}
												title="Regenerate Random Barcode"
											>
												<RefreshCwIcon className="h-4 w-4 text-gray-600" />
											</Button>
										</div>
									</div>

									{/* SVG Barcode Preview */}
									<div className="flex flex-col items-center justify-center rounded-lg border border-gray-300 border-dashed bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
										<p className="mb-1 font-semibold text-gray-500 text-xs">
											Live Sticker Preview
										</p>
										<p className="max-w-[300px] truncate font-bold text-gray-900 text-sm dark:text-white">
											{selectedProductObj?.name}
										</p>
										<svg ref={svgRef} className="my-2" />
										{selectedProductObj?.price && (
											<p className="font-medium text-gray-600 text-xs dark:text-gray-300">
												Price: ₹{selectedProductObj.price}
											</p>
										)}
									</div>

									{/* Notes */}
									<div className="space-y-1">
										<label className="font-semibold text-gray-700 text-xs dark:text-gray-300">
											Notes (Optional):
										</label>
										<input
											type="text"
											placeholder="e.g. Printed & pasted on pallet batch #12"
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
										/>
									</div>
								</>
							)}
						</div>

						<DialogFooter className="flex gap-2 sm:justify-between">
							{selectedProductId && generatedBarcode && (
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										handlePrint(
											selectedProductObj?.name || "Product",
											generatedBarcode,
											selectedProductObj?.price || undefined,
										)
									}
								>
									<PrinterIcon className="mr-2 h-4 w-4" /> Print Sticker
								</Button>
							)}
							<div className="flex gap-2">
								<Button variant="ghost" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button
									disabled={
										!selectedProductId ||
										!generatedBarcode ||
										createUpcMutation.isPending
									}
									onClick={handleSaveBarcode}
									className="bg-green-600 text-white hover:bg-green-700"
								>
									{createUpcMutation.isPending && (
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save to DB & Inventory
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										Total Barcodes
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{totalTasks}
									</p>
								</div>
								<BarcodeIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										Completed & Printed
									</p>
									<p className="font-bold text-3xl text-green-800 dark:text-green-300">
										{completed}
									</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm text-yellow-700 dark:text-yellow-400">
										Pending Tasks
									</p>
									<p className="font-bold text-3xl text-yellow-800 dark:text-yellow-300">
										{pending}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-yellow-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Task Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<BarcodeIcon className="h-5 w-5 text-blue-600" />
							Inventory Barcode Records
						</CardTitle>
						<CardDescription>
							Full list of products with assigned UPC/EAN barcodes
						</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Filter product or barcode..."
							className="w-full rounded-md border border-input bg-background py-1.5 pr-3 pl-9 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
							value={searchFilter}
							onChange={(e) => setSearchFilter(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin" /> Loading
							barcodes...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading barcode tasks"}
						</div>
					) : !filteredTasks || filteredTasks.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<CalendarCheckIcon className="h-10 w-10 opacity-30" />
							<p>
								No barcode tasks found. Click "Generate New Barcode Label" above
								to add one.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Task ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>Barcode / UPC</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Notes</TableHead>
										<TableHead>Created</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredTasks.map((task) => (
										<TableRow key={task.id} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs">
												#{task.id}
											</TableCell>
											<TableCell className="font-semibold text-sm">
												{task.product_name}
											</TableCell>
											<TableCell className="font-bold font-mono text-blue-600 text-sm dark:text-blue-400">
												{task.barcode}
											</TableCell>
											<TableCell className="text-xs capitalize">
												{task.task_type?.replace(/_/g, " ") ?? "generate"}
											</TableCell>
											<TableCell>
												<span
													className={`rounded-full px-2 py-0.5 font-medium text-xs ${(statusConfig[task.status ?? "PENDING"] ?? statusConfig.COMPLETED).color}`}
												>
													{
														(
															statusConfig[task.status ?? "PENDING"] ??
															statusConfig.COMPLETED
														).label
													}
												</span>
											</TableCell>
											<TableCell className="max-w-[180px] truncate text-muted-foreground text-xs">
												{task.notes ?? "—"}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{task.created_at ?? "—"}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="outline"
													size="sm"
													className="h-8 gap-1"
													onClick={() =>
														handlePrint(
															task.product_name || "Product",
															task.barcode,
														)
													}
												>
													<PrinterIcon className="h-3.5 w-3.5" /> Print
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
