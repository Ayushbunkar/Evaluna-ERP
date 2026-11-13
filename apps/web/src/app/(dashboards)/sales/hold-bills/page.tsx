"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { AlertCircleIcon, PlayCircleIcon, RefreshCcwIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

type Order = {
	id: number;
	customer: { name: string | null } | null;
	total_amount: string;
	created_at: Date | null;
	status: string | null;
};

export default function HoldBillsPage() {
	const locale = useLocale();
	const router = useRouter();
	const utils = trpc.useUtils();

	// Translations Dictionary
	const t = {
		title: locale === "hi" ? "होल्ड बिल (Hold Bills)" : "Hold Bills",
		subtitle:
			locale === "hi"
				? "उन बिलों को देखें और प्रबंधित करें जिन्हें होल्ड पर रखा गया था।"
				: "View and manage bills that were put on hold.",
		suspendedTitle:
			locale === "hi" ? "निलंबित बिल (Suspended)" : "Suspended Bills",
		activeHoldTitle: locale === "hi" ? "सक्रिय होल्ड बिल" : "Active Hold Bills",
		emptyMsg:
			locale === "hi" ? "कोई होल्ड बिल नहीं मिला।" : "No hold bills found.",
		resumeBill: locale === "hi" ? "बिल पुनर्प्रारंभ करें" : "Resume Bill",
		deleteBill: locale === "hi" ? "बिल हटाएं" : "Delete Bill",

		thBillId: locale === "hi" ? "बिल आईडी" : "Bill ID",
		thCustomer: locale === "hi" ? "ग्राहक" : "Customer",
		thAmount: locale === "hi" ? "कुल राशि" : "Total Amount",
		thDateHeld: locale === "hi" ? "होल्ड करने की तिथि" : "Date Held",
		thActions: locale === "hi" ? "कार्रवाइयाँ" : "Actions",
		walkIn: locale === "hi" ? "वॉक-इन" : "Walk-in",
		resumeToast:
			locale === "hi"
				? "बिल को पुनर्प्रारंभ किया जा रहा है..."
				: "Resuming hold bill...",
		deleteConfirm:
			locale === "hi"
				? "क्या आप वाकई इस होल्ड बिल को हटाना चाहते हैं?"
				: "Are you sure you want to delete this hold bill?",
		deleteSuccess:
			locale === "hi"
				? "होल्ड बिल हटा दिया गया और स्टॉक वेयरहाउस में वापस जुड़ गया।"
				: "Hold bill deleted and stock successfully restored to warehouse.",
		deleteDialogTitle:
			locale === "hi" ? "होल्ड बिल हटाएं और स्टॉक वापस जोड़ें" : "Delete Hold Bill & Restore Stock",
		deleteDialogDesc:
			locale === "hi"
				? "इस होल्ड बिल को हटाने पर होल्ड किए गए सभी उत्पाद वेयरहाउस स्टॉक में तुरंत वापस जुड़ जाएंगे।"
				: "Deleting this held bill will automatically restore all reserved products back into the warehouse inventory.",
		reasonLabel:
			locale === "hi" ? "हटाने का कारण (Reason):" : "Cancellation / Deletion Reason:",
		reasonPlaceholder:
			locale === "hi"
				? "कारण दर्ज करें (जैसे ग्राहक ने मना किया, गलत ऑर्डर)..."
				: "Enter reason (e.g., Customer cancelled, duplicate, expired)...",
		cancelBtn: locale === "hi" ? "रद्द करें" : "Cancel",
		confirmDeleteBtn:
			locale === "hi"
				? "बिल हटाएं और स्टॉक वापस जोड़ें"
				: "Delete & Restore Stock",
		deletingBtn:
			locale === "hi" ? "स्टॉक वापस जोड़ रहे हैं..." : "Restoring Stock...",
	};

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
	const [deleteReason, setDeleteReason] = useState("");

	const REASON_PRESETS = [
		{
			label: locale === "hi" ? "ग्राहक ने मना किया" : "Customer Cancelled",
			value: "Customer Cancelled",
		},
		{
			label: locale === "hi" ? "सामान उपलब्ध नहीं" : "Out of Stock / Unavailable",
			value: "Out of Stock / Unavailable",
		},
		{
			label: locale === "hi" ? "डुप्लीकेट होल्ड बिल" : "Duplicate Hold Bill",
			value: "Duplicate Hold Bill",
		},
		{
			label: locale === "hi" ? "होल्ड समाप्त / नया बिल" : "Hold Expired / New Bill",
			value: "Hold Expired / New Bill",
		},
	];

	const { data: orders, isLoading } = trpc.orders.list.useQuery();
	const deleteMutation = trpc.orders.delete.useMutation({
		onSuccess: () => {
			toast.success(t.deleteSuccess);
			setDeleteDialogOpen(false);
			setOrderToDelete(null);
			setDeleteReason("");
			utils.orders.list.invalidate();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const suspendedOrders = (orders ?? []).filter(
		(o) => o.status?.toLowerCase() === "suspended",
	);

	const handleResume = (id: number) => {
		toast.info(t.resumeToast);
		router.push(`/sales/pos?resume=${id}`);
	};

	const openDeleteDialog = (order: Order) => {
		setOrderToDelete(order);
		setDeleteReason("");
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (!orderToDelete) return;
		deleteMutation.mutate({
			id: orderToDelete.id,
			reason: deleteReason.trim() || (locale === "hi" ? "होल्ड बिल रद्द किया गया" : "Hold bill cancelled / deleted"),
		});
	};

	const columns: Column<Order>[] = [
		{
			key: "id",
			header: t.thBillId,
			sortable: true,
			className: "font-medium",
		},
		{
			key: "customer",
			header: t.thCustomer,
			sortable: true,
			render: (row) => row.customer?.name || t.walkIn,
		},
		{
			key: "amount",
			header: t.thAmount,
			sortable: true,
			render: (row) => formatCurrency(Number(row.total_amount), locale),
		},
		{
			key: "created_at",
			header: t.thDateHeld,
			sortable: true,
			render: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleString() : "-",
		},
		{
			key: "actions",
			header: t.thActions,
			render: (row) => (
				<TableActions>
					<TableActionButton
						icon={<PlayCircleIcon className="h-4 w-4" />}
						label={t.resumeBill}
						onClick={() => handleResume(row.id)}
					/>
					<TableActionButton
						icon={<TrashIcon className="h-4 w-4 text-red-500 hover:text-red-600" />}
						label={t.deleteBill}
						onClick={() => openDeleteDialog(row)}
					/>
				</TableActions>
			),
		},
	];

	return (
		<PageTransition className="flex flex-col gap-6 p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">{t.title}</h1>
					<p className="text-muted-foreground text-sm">{t.subtitle}</p>
				</div>
			</div>

			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
									<RefreshCcwIcon className="h-6 w-6 text-amber-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										{t.suspendedTitle}
									</p>
									<h3 className="font-bold text-2xl">
										{suspendedOrders.length}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<Card className="flex flex-col gap-4 border-border/50 bg-card/50 p-3 shadow-sm sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<h2 className="font-semibold text-lg">{t.activeHoldTitle}</h2>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={suspendedOrders as any}
						columns={columns as any}
						isLoading={isLoading}
						emptyMessage={t.emptyMsg}
						emptyIcon={<RefreshCcwIcon className="h-8 w-8" />}
					/>
				</CardContent>
			</Card>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="max-w-md border-border/80 bg-background/95 backdrop-blur-xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive">
							<AlertCircleIcon className="h-5 w-5" />
							{t.deleteDialogTitle}
						</DialogTitle>
						<DialogDescription className="text-sm">
							{t.deleteDialogDesc}
						</DialogDescription>
					</DialogHeader>

					{orderToDelete && (
						<div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm space-y-1">
							<div className="flex justify-between font-medium">
								<span>Bill ID: #{orderToDelete.id}</span>
								<span>{formatCurrency(Number(orderToDelete.total_amount), locale)}</span>
							</div>
							<div className="text-muted-foreground text-xs">
								Customer: <span className="font-medium text-foreground">{orderToDelete.customer?.name || t.walkIn}</span>
							</div>
						</div>
					)}

					<div className="space-y-3">
						<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							{t.reasonLabel}
						</label>
						<div className="flex flex-wrap gap-1.5">
							{REASON_PRESETS.map((preset) => (
								<button
									key={preset.value}
									type="button"
									onClick={() => setDeleteReason(preset.value)}
									className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
										deleteReason === preset.value
											? "border-primary bg-primary/10 text-primary font-medium"
											: "border-border/60 bg-muted/20 hover:bg-muted/60 text-muted-foreground"
									}`}
								>
									{preset.label}
								</button>
							))}
						</div>
						<Input
							value={deleteReason}
							onChange={(e) => setDeleteReason(e.target.value)}
							placeholder={t.reasonPlaceholder}
							className="mt-1.5"
						/>
					</div>

					<DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={deleteMutation.isPending}
						>
							{t.cancelBtn}
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleConfirmDelete}
							disabled={deleteMutation.isPending}
							className="gap-1.5"
						>
							<TrashIcon className="h-4 w-4" />
							{deleteMutation.isPending ? t.deletingBtn : t.confirmDeleteBtn}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
