"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import { PlayCircleIcon, RefreshCcwIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { RoleGate } from "@/components/auth/RoleGate";
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
				? "होल्ड बिल सफलतापूर्वक हटा दिया गया।"
				: "Hold bill deleted successfully.",
	};

	const { data: orders, isLoading } = trpc.orders.list.useQuery();
	const deleteMutation = trpc.orders.delete.useMutation({
		onSuccess: () => {
			toast.success(t.deleteSuccess);
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

	const handleDelete = (id: number) => {
		if (window.confirm(t.deleteConfirm)) {
			deleteMutation.mutate({ id });
		}
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
					<RoleGate minRole="manager">
						<TableActionButton
							icon={<TrashIcon className="h-4 w-4 text-red-500" />}
							label={t.deleteBill}
							onClick={() => handleDelete(row.id)}
						/>
					</RoleGate>
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
		</PageTransition>
	);
}
