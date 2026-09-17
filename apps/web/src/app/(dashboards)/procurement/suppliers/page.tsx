"use client";

import { Badge } from "@evaluna/ui/components/badge";
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
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	CheckCircle2Icon,
	CreditCardIcon,
	HistoryIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	UserCheckIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function SuppliersPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const { data: suppliersList, isLoading: suppliersLoading } =
		trpc.suppliers.list.useQuery();

	// Mutations
	const createSupplierMutation = trpc.suppliers.create.useMutation({
		onSuccess: () => {
			toast.success("New supplier partner successfully registered!");
			utils.suppliers.list.invalidate();
			setIsCreateModalOpen(false);
			setNewSupplierName("");
			setNewSupplierEmail("");
			setNewSupplierPhone("");
			setNewSupplierAddress("");
		},
		onError: (err) => {
			toast.error(`Supplier creation failed: ${err.message}`);
		},
	});

	const paySupplierMutation = trpc.suppliers.paySupplier.useMutation({
		onSuccess: () => {
			toast.success("Supplier ledger payment successfully registered!");
			utils.suppliers.list.invalidate();
			if (selectedSupplierId) {
				utils.suppliers.getById.invalidate({ id: selectedSupplierId });
			}
			setIsPayModalOpen(false);
			setPayAmount("");
			setPayDesc("");
		},
		onError: (err) => {
			toast.error(`Payment failed: ${err.message}`);
		},
	});

	// Modal State
	const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
		null,
	);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isPayModalOpen, setIsPayModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	// Pay Form State
	const [payAmount, setPayAmount] = useState("");
	const [payDesc, setPayDesc] = useState("");

	// Create Form State
	const [newSupplierName, setNewSupplierName] = useState("");
	const [newSupplierEmail, setNewSupplierEmail] = useState("");
	const [newSupplierPhone, setNewSupplierPhone] = useState("");
	const [newSupplierAddress, setNewSupplierAddress] = useState("");

	// Supplier Detail Query (enables direct loading on select)
	const { data: details, isLoading: detailsLoading } =
		trpc.suppliers.getById.useQuery(
			{ id: selectedSupplierId || 1 },
			{ enabled: !!selectedSupplierId },
		);

	const openDetails = (id: number) => {
		setSelectedSupplierId(id);
		setIsDetailModalOpen(true);
	};

	const handlePaySupplier = async () => {
		if (!selectedSupplierId || !payAmount) return;
		await paySupplierMutation.mutateAsync({
			supplier_id: selectedSupplierId,
			amount: Number.parseFloat(payAmount),
			description: payDesc || "Supplier Payment",
		});
	};

	const handleCreateSupplier = async () => {
		if (!newSupplierName) return;
		await createSupplierMutation.mutateAsync({
			name: newSupplierName,
			email: newSupplierEmail || undefined,
			phone: newSupplierPhone || undefined,
			address: newSupplierAddress || undefined,
		});
	};

	const filteredSuppliers =
		suppliersList?.filter(
			(s) =>
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.supplier_code?.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						Supplier Partner Directory
					</h2>
					<p className="text-muted-foreground text-sm">
						Overview profiles, outstanding accounts balances, and register pay
						receipts.
					</p>
				</div>
				<div className="flex w-full gap-2 sm:w-auto">
					<Button
						onClick={() => setIsCreateModalOpen(true)}
						className="h-9 font-bold text-xs shadow-sm"
					>
						<PlusIcon className="mr-1.5 h-4 w-4" /> Add Supplier Partner
					</Button>
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search supplier, code..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Supplier Partners Ledger
					</CardTitle>
					<CardDescription>
						Click a partner row to examine detailed invoice schedules and
						outstanding balances
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{suppliersLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Supplier Code</TableHead>
										<TableHead>Partner Company Name</TableHead>
										<TableHead>Primary Phone</TableHead>
										<TableHead>Email Contact</TableHead>
										<TableHead>Outstanding Balance</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredSuppliers.map((s) => (
										<TableRow
											key={s.id}
											className="cursor-pointer hover:bg-slate-50/50"
											onClick={() => openDetails(s.id)}
										>
											<TableCell className="font-semibold text-blue-600 text-xs">
												{s.supplier_code}
											</TableCell>
											<TableCell className="font-bold text-slate-900 dark:text-slate-100">
												{s.name}
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												{s.phone || "N/A"}
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												{s.email || "N/A"}
											</TableCell>
											<TableCell className="font-bold text-slate-800 text-xs">
												₹{Number(s.outstanding_balance || 0).toFixed(2)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="ghost"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedSupplierId(s.id);
														setIsPayModalOpen(true);
													}}
													className="h-8 text-xs"
												>
													<CreditCardIcon className="mr-1.5 h-3.5 w-3.5" /> Pay
													Supplier
												</Button>
											</TableCell>
										</TableRow>
									))}
									{filteredSuppliers.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-muted-foreground"
											>
												<UsersIcon className="mx-auto mb-2 h-10 w-10 text-slate-300" />
												<p className="font-bold text-sm">
													No supplier partners registered.
												</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* SUPPLIER DETAILS MODAL DRAWER */}
			<Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
				<DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto bg-white">
					{detailsLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin" />
						</div>
					) : (
						<div className="space-y-6">
							<DialogHeader>
								<div className="flex items-center gap-3">
									<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
										<UserCheckIcon className="h-6 w-6 text-blue-600" />
									</span>
									<div>
										<DialogTitle className="font-bold text-lg">
											{details?.supplier?.name}
										</DialogTitle>
										<DialogDescription className="text-xs">
											Partner Code: {details?.supplier?.supplier_code}
										</DialogDescription>
									</div>
								</div>
							</DialogHeader>

							{/* Profile columns */}
							<div className="grid gap-4 border-y py-4 sm:grid-cols-3">
								<div>
									<span className="font-bold text-[10px] text-slate-400 uppercase">
										Email Contact
									</span>
									<p className="mt-0.5 font-semibold text-xs">
										{details?.supplier?.email || "N/A"}
									</p>
								</div>
								<div>
									<span className="font-bold text-[10px] text-slate-400 uppercase">
										Phone Primary
									</span>
									<p className="mt-0.5 font-semibold text-xs">
										{details?.supplier?.phone || "N/A"}
									</p>
								</div>
								<div>
									<span className="font-bold text-[10px] text-slate-400 uppercase">
										Ledger Outstanding Balance
									</span>
									<p className="mt-0.5 font-bold text-slate-900 text-sm">
										₹
										{Number(
											details?.supplier?.outstanding_balance || 0,
										).toFixed(2)}
									</p>
								</div>
							</div>

							{/* Purchase history list */}
							<div>
								<h4 className="mb-2 flex items-center gap-1.5 font-bold text-slate-400 text-xs uppercase tracking-wider">
									<HistoryIcon className="h-4 w-4" /> Bulk Purchase Order
									History
								</h4>
								<div className="max-h-40 overflow-y-auto rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>GRN ID</TableHead>
												<TableHead>Total Amount</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Date Created</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{details?.purchaseHistory?.map((p: any) => (
												<TableRow key={p.id}>
													<TableCell className="font-semibold text-xs">
														#{p.id} — {p.grn_number}
													</TableCell>
													<TableCell className="font-bold text-xs">
														₹{Number(p.total_amount).toFixed(2)}
													</TableCell>
													<TableCell>
														<Badge
															variant={
																p.status === "completed" ? "default" : "outline"
															}
														>
															{p.status}
														</Badge>
													</TableCell>
													<TableCell className="text-[11px] text-slate-500">
														{new Date(p.created_at).toLocaleDateString()}
													</TableCell>
												</TableRow>
											))}
											{details?.purchaseHistory?.length === 0 && (
												<TableRow>
													<TableCell
														colSpan={4}
														className="py-6 text-center text-slate-400 text-xs"
													>
														No purchase history found.
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</div>

							{/* Payment ledger history */}
							<div>
								<h4 className="mb-2 flex items-center gap-1.5 font-bold text-slate-400 text-xs uppercase tracking-wider">
									<CreditCardIcon className="h-4 w-4" /> Ledger Transaction Logs
								</h4>
								<div className="max-h-40 overflow-y-auto rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Reference</TableHead>
												<TableHead>Description</TableHead>
												<TableHead>Paid Amount</TableHead>
												<TableHead>Payment Mode</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{details?.ledger?.map((t: any) => (
												<TableRow key={t.id}>
													<TableCell className="font-semibold text-xs">
														TXN-#{t.id}
													</TableCell>
													<TableCell className="font-medium text-xs">
														{t.description}
													</TableCell>
													<TableCell className="font-bold text-red-600 text-xs">
														₹{Number(t.amount).toFixed(2)}
													</TableCell>
													<TableCell className="text-[11px] text-slate-500">
														Bank Transfer
													</TableCell>
												</TableRow>
											))}
											{details?.ledger?.length === 0 && (
												<TableRow>
													<TableCell
														colSpan={4}
														className="py-6 text-center text-slate-400 text-xs"
													>
														No ledger transactions registered.
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button size="sm" onClick={() => setIsDetailModalOpen(false)}>
							Close Directory Profile
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* PAY SUPPLIER DIALOG */}
			<Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Register Supplier Payment
						</DialogTitle>
						<DialogDescription>
							Submit ledger payment details, decrementing partner outstanding
							balances.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Amount Paid (₹)
							</Label>
							<Input
								type="number"
								value={payAmount}
								onChange={(e) => setPayAmount(e.target.value)}
								placeholder="E.g. 500"
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Transaction Description
							</Label>
							<Textarea
								placeholder="E.g. Paid via bank transfer for steel widgets PO."
								value={payDesc}
								onChange={(e) => setPayDesc(e.target.value)}
								className="mt-1 h-20 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPayModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handlePaySupplier}
							disabled={paySupplierMutation.isPending}
						>
							{paySupplierMutation.isPending
								? "Processing..."
								: "Deduct Balance & Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* CREATE SUPPLIER DIALOG */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Register New Supplier Partner
						</DialogTitle>
						<DialogDescription>
							Save supplier contact details to enable direct procurement
							ordering.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Partner Company Name
							</Label>
							<Input
								value={newSupplierName}
								onChange={(e) => setNewSupplierName(e.target.value)}
								placeholder="E.g. Acme Industries Ltd."
								className="mt-1 h-9 font-bold text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Primary Email Address
							</Label>
							<Input
								type="email"
								value={newSupplierEmail}
								onChange={(e) => setNewSupplierEmail(e.target.value)}
								placeholder="E.g. sales@acme.com"
								className="mt-1 h-9 text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Primary Phone Number
							</Label>
							<Input
								value={newSupplierPhone}
								onChange={(e) => setNewSupplierPhone(e.target.value)}
								placeholder="E.g. 9876543210"
								className="mt-1 h-9 text-xs"
							/>
						</div>
						<div>
							<Label className="font-bold text-slate-700 text-xs">
								Physical Office Address
							</Label>
							<Textarea
								value={newSupplierAddress}
								onChange={(e) => setNewSupplierAddress(e.target.value)}
								placeholder="E.g. Bhopal Tech Park, Aisle 2"
								className="mt-1 h-16 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsCreateModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleCreateSupplier}
							disabled={createSupplierMutation.isPending}
						>
							{createSupplierMutation.isPending
								? "Saving..."
								: "Save Partner Profile"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
