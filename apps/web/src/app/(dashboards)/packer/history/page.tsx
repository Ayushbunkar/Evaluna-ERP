"use client";

import { useState, useRef, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ArchiveIcon,
	PrinterIcon,
	Loader2Icon,
	SearchIcon,
	CheckCircle2Icon,
	TruckIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import JsBarcode from "jsbarcode";

export default function PackerHistoryPage() {
	const trpc = useTRPC();
	const { data: historyList, isLoading, error } = trpc.packer.getPackingHistory.useQuery({});

	const [searchQuery, setSearchQuery] = useState("");
	const [printPackage, setPrintPackage] = useState<{ number: string; orderRef: string } | null>(null);
	const printSvgRef = useRef<SVGSVGElement | null>(null);

	useEffect(() => {
		if (printSvgRef.current && printPackage?.number) {
			try {
				JsBarcode(printSvgRef.current, printPackage.number, {
					format: "CODE128",
					width: 2,
					height: 50,
					displayValue: true,
					fontSize: 12,
					margin: 5,
				});
			} catch (e) {
				console.error("Print error:", e);
			}
		}
	}, [printPackage]);

	const handlePrintLabel = (pkgNum: string, orderRef: string) => {
		setPrintPackage({ number: pkgNum, orderRef });
		setTimeout(() => {
			window.print();
		}, 300);
	};

	const filteredList = historyList?.filter(
		(p) =>
			p.packageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.packedBy.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Printable Thermal Label */}
			<div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999] print:p-4">
				{printPackage && (
					<div className="flex flex-col items-center justify-center border-2 border-black p-4 w-[280px] mx-auto text-center font-sans">
						<p className="font-bold text-sm">SHIPMENT PARCEL LABEL</p>
						<p className="text-xs font-semibold text-gray-700 mt-1">Ref: {printPackage.orderRef}</p>
						<svg ref={printSvgRef} className="my-2"></svg>
						<p className="text-[10px] text-gray-500">PACKED & VERIFIED BY EVALUNA LOGISTICS</p>
					</div>
				)}
			</div>

			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
					<ArchiveIcon className="h-7 w-7 text-blue-600" />
					Packing History & Label Repository
				</h1>
				<p className="text-muted-foreground text-sm">
					Archive of all packed packages, parcel barcodes, staff attribution, and shipping label re-printing.
				</p>
			</div>

			{/* Stats */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Packed</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{historyList?.length ?? 0}</p>
								</div>
								<ArchiveIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-green-700 dark:text-green-400">Ready for Dispatch</p>
									<p className="text-3xl font-bold text-green-800 dark:text-green-300">{historyList?.length ?? 0}</p>
								</div>
								<TruckIcon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Quality Accuracy</p>
									<p className="text-3xl font-bold text-blue-800 dark:text-blue-300">100%</p>
								</div>
								<CheckCircle2Icon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Table Card */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<ArchiveIcon className="h-5 w-5 text-blue-600" />
							Package Audit History
						</CardTitle>
						<CardDescription>Full history of completed parcels and shipping barcodes</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search package number, order..."
							className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-blue-600" /> Loading history...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading packing history"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<ArchiveIcon className="h-10 w-10 opacity-30 text-blue-500" />
							<p>No package history found.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Package Number</TableHead>
										<TableHead>Order Ref</TableHead>
										<TableHead>Packed By</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Packed Date</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((pkg, idx) => (
										<TableRow key={idx} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
												{pkg.packageNumber}
											</TableCell>
											<TableCell className="font-semibold text-sm">{pkg.orderId}</TableCell>
											<TableCell className="text-xs text-muted-foreground">{pkg.packedBy}</TableCell>
											<TableCell>
												<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400 capitalize">
													{pkg.status}
												</span>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">{pkg.packedAt}</TableCell>
											<TableCell className="text-right">
												<Button
													variant="outline"
													size="sm"
													className="h-8 gap-1"
													onClick={() => handlePrintLabel(pkg.packageNumber, pkg.orderId)}
												>
													<PrinterIcon className="h-3.5 w-3.5" /> Re-print Label
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
