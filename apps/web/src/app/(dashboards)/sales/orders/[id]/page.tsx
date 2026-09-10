// @ts-nocheck
"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";

import { ArrowLeftIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { A4Invoice } from "@/components/printing/A4Invoice";
import { PrintPreviewDialog } from "@/components/printing/PrintPreviewDialog";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { generateOrderWhatsAppLink } from "@/lib/whatsapp";

export default function OrderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const orderId = Number.parseInt(id, 10);
	const router = useRouter();
	const { data: order, isLoading } = trpc.orders.get.useQuery({
		id: orderId,
	}) as { data: any; isLoading: boolean };
	const t = useTranslations("orders");
	const tc = useTranslations("common");
	const locale = useLocale();

	if (isLoading) {
		return (
			<div className="max-w-3xl space-y-6">
				<Skeleton className="h-8 w-48" />
				<Card>
					<CardContent className="space-y-4 p-6">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-6 w-full" />
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!order) {
		return <div className="text-muted-foreground">{t("orderNotFound")}</div>;
	}

	const statusColor =
		order.status === "completed"
			? "text-green-600"
			: order.status === "cancelled"
				? "text-red-600"
				: "text-yellow-600";
	const statusLabel =
		order.status === "completed"
			? tc("completed")
			: order.status === "cancelled"
				? tc("cancelled")
				: tc("pending");

	return (
		<div className="max-w-3xl space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/sales/orders">
					<Button variant="ghost" size="icon">
						<ArrowLeftIcon className="h-4 w-4" />
					</Button>
				</Link>
				<h1 className="font-bold text-2xl">
					{t("orderDetails")} #{order.id}
				</h1>
				<div className="ml-auto flex gap-2">
					{order.customer?.phone && (
						<a
							href={generateOrderWhatsAppLink(
								{
									id: order.id,
									totalAmount: order.total_amount,
									items: order.orderItems?.map((item: any) => ({
										name: item.product?.name,
										quantity: item.quantity,
										price: item.price,
									})),
								},
								{ name: "Store Branch" },
								order.customer.phone,
							)}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="outline" className="gap-2">
								<MessageCircle className="h-4 w-4 text-green-600" />
								Share on WhatsApp
							</Button>
						</a>
					)}

					<Button
						onClick={() =>
							router.push(`/sales/pos?completedOrderId=${order.id}`)
						}
						className="gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
					>
						Print Bill
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>{t("orderDetails")}</CardTitle>
						<span className={`font-semibold ${statusColor}`}>
							{statusLabel}
						</span>
					</div>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<dt className="text-muted-foreground">{t("customer")}</dt>
							<dd className="font-bold text-foreground text-sm">
								{order.customer?.name || "Walk-in Customer"}
							</dd>
							{order.customer?.phone && (
								<p className="pt-0.5 font-mono text-muted-foreground text-xs">
									📞 {order.customer.phone}
								</p>
							)}
							{order.customer?.address && (
								<p className="pt-1 text-muted-foreground text-xs leading-relaxed">
									📍 {order.customer.address}
								</p>
							)}
						</div>
						<div>
							<dt className="text-muted-foreground">{tc("total")}</dt>
							<dd className="font-bold text-lg">
								{formatCurrency(order.total_amount, locale)}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">{t("createdAt")}</dt>
							<dd>
								{order.created_at
									? new Date(order.created_at).toLocaleString()
									: "—"}
							</dd>
						</div>
					</dl>
				</CardContent>
			</Card>

			{order.orderItems && order.orderItems.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t("items")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("product")}</TableHead>
										<TableHead className="hidden sm:table-cell">
											{tc("category")}
										</TableHead>
										<TableHead>{t("quantity")}</TableHead>
										<TableHead>{t("unitPrice")}</TableHead>
										<TableHead>{t("subtotal")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{order.orderItems.map((item: any) => (
										<TableRow key={item.id}>
											<TableCell className="font-medium">
												{item.product?.name ?? `#${item.product_id}`}
											</TableCell>
											<TableCell className="hidden sm:table-cell">
												{item.product?.category ? (
													<Badge variant="outline">
														{item.product.category}
													</Badge>
												) : (
													"—"
												)}
											</TableCell>
											<TableCell>{item.quantity}</TableCell>
											<TableCell>
												{formatCurrency(item.price, locale)}
											</TableCell>
											<TableCell className="font-medium">
												{formatCurrency(item.price * item.quantity, locale)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
