"use client";

import { useState } from "react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@evaluna/ui/components/dialog";
import {
	XCircleIcon,
	PlusIcon,
	Loader2Icon,
	SearchIcon,
	CameraIcon,
	AlertOctagonIcon,
} from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { CameraBarcodeScannerModal } from "@/components/ui/CameraBarcodeScannerModal";
import { toast } from "sonner";

export default function DamageRaisePage() {
	const trpc = useTRPC();
	const {
		data: damageReports,
		isLoading,
		error,
		refetch,
	} = trpc.putter.getDamageReports.useQuery({});

	const createMutation = trpc.putter.createDamageReport.useMutation({
		onSuccess: () => {
			toast.success("Damage report logged successfully!");
			refetch();
			setShowCreateModal(false);
			setProductId("");
			setQtyDamaged("1");
			setDamageType("Box Crush / Transit Damage");
			setNotes("");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to log damage report");
		},
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showCameraScanner, setShowCameraScanner] = useState(false);

	const [productId, setProductId] = useState("");
	const [qtyDamaged, setQtyDamaged] = useState("1");
	const [damageType, setDamageType] = useState("Box Crush / Transit Damage");
	const [severity, setSeverity] = useState("Medium");
	const [notes, setNotes] = useState("");

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!productId) {
			toast.error("Please enter product ID");
			return;
		}
		createMutation.mutate({
			product_id: Number(productId) || 1,
			qty_damaged: Number(qtyDamaged) || 1,
			damage_type: damageType,
			severity,
			notes,
		});
	};

	const filteredList = damageReports?.filter(
		(r) =>
			r.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.raised_by.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-1">
					<h1 className="flex items-center gap-2 font-bold text-foreground text-2xl tracking-tight">
						<XCircleIcon className="h-7 w-7 text-red-600" />
						Damaged Goods & Quarantine Raise
					</h1>
					<p className="text-muted-foreground text-sm">
						Log damaged, crushed, expired, or compromised goods received into warehouse.
					</p>
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						className="gap-2 border-red-600 text-red-700 hover:bg-red-50"
						onClick={() => setShowCameraScanner(true)}
					>
						<CameraIcon className="h-4 w-4" /> Camera Scan
					</Button>
					<Button
						className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm"
						onClick={() => setShowCreateModal(true)}
					>
						<PlusIcon className="h-4 w-4" /> + Raise Damage Report
					</Button>
				</div>
			</div>

			{/* KPI Summary */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-red-700 dark:text-red-400">Total Damage Logs</p>
									<p className="text-3xl font-bold text-red-800 dark:text-red-300">{damageReports?.length ?? 0}</p>
								</div>
								<XCircleIcon className="h-8 w-8 text-red-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-orange-700 dark:text-orange-400">Quarantined Goods</p>
									<p className="text-3xl font-bold text-orange-800 dark:text-orange-300">{damageReports?.length ?? 0}</p>
								</div>
								<AlertOctagonIcon className="h-8 w-8 text-orange-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-blue-700 dark:text-blue-400">Audit Status</p>
									<p className="text-xl font-bold text-blue-800 dark:text-blue-300">Quarantine Active</p>
								</div>
								<XCircleIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Data Table */}
			<Card className="border-border/50 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<XCircleIcon className="h-5 w-5 text-red-600" />
							Damaged Goods Registry
						</CardTitle>
						<CardDescription>Records of damaged inventory reported by putter staff</CardDescription>
					</div>

					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search product, report ID..."
							className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm shadow-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
							<Loader2Icon className="h-5 w-5 animate-spin text-red-600" /> Loading damage reports...
						</div>
					) : error ? (
						<div className="flex h-40 items-center justify-center text-destructive">
							{error.message || "Error loading damage reports"}
						</div>
					) : !filteredList || filteredList.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
							<XCircleIcon className="h-10 w-10 opacity-30 text-red-500" />
							<p>No damage reports found.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Report ID</TableHead>
										<TableHead>Product Name</TableHead>
										<TableHead>Qty Damaged</TableHead>
										<TableHead>Damage Type / Reason</TableHead>
										<TableHead>Severity</TableHead>
										<TableHead>Location</TableHead>
										<TableHead>Raised By</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((item) => (
										<TableRow key={item.id} className="hover:bg-muted/50">
											<TableCell className="font-mono text-xs font-semibold">{item.id}</TableCell>
											<TableCell className="font-bold text-sm">{item.product}</TableCell>
											<TableCell className="font-bold text-sm text-red-600 dark:text-red-400">
												{item.qty_damaged} units
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">{item.damage_type}</TableCell>
											<TableCell>
												<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
													{item.severity || "Medium"}
												</span>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">{item.location}</TableCell>
											<TableCell className="text-xs font-medium">{item.raised_by}</TableCell>
											<TableCell className="text-xs text-muted-foreground">{item.date || "Today"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Damage Report Modal */}
			{showCreateModal && (
				<Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
					<DialogContent className="sm:max-w-[480px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<XCircleIcon className="h-5 w-5 text-red-600" />
								Raise Damaged Goods Report
							</DialogTitle>
							<DialogDescription>
								Quarantine damaged goods and record reason for stock write-off.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-sm">
							<div className="space-y-1">
								<label className="text-xs font-semibold">Product ID</label>
								<input
									type="number"
									required
									placeholder="e.g. 1"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={productId}
									onChange={(e) => setProductId(e.target.value)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-semibold">Quantity Damaged</label>
									<input
										type="number"
										required
										min="1"
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={qtyDamaged}
										onChange={(e) => setQtyDamaged(e.target.value)}
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-semibold">Severity</label>
									<select
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
										value={severity}
										onChange={(e) => setSeverity(e.target.value)}
									>
										<option value="Low">Low (Minor Box Scratch)</option>
										<option value="Medium">Medium (Crushed Box)</option>
										<option value="High">High (Total Product Ruin)</option>
									</select>
								</div>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold">Damage Type</label>
								<input
									type="text"
									required
									placeholder="e.g. Box Crush / Transit Leakage"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={damageType}
									onChange={(e) => setDamageType(e.target.value)}
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold">Notes / Inspection Details</label>
								<textarea
									rows={2}
									placeholder="Provide additional details..."
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>

							<DialogFooter className="pt-2">
								<Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={createMutation.isPending}
									className="bg-red-600 hover:bg-red-700 text-white"
								>
									{createMutation.isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
									Submit Damage Report
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}

			{/* Camera Barcode Scanner Modal */}
			<CameraBarcodeScannerModal
				open={showCameraScanner}
				onOpenChange={setShowCameraScanner}
				onScan={(code) => setSearchQuery(code)}
				title="Damage Raise Camera Scanner"
				description="Scan damaged product barcode tag."
			/>
		</PageTransition>
	);
}
