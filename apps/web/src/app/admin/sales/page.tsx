import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	IndianRupeeIcon,
	PackageIcon,
	PlusIcon,
	ShoppingCartIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { getServerClient } from "@/lib/trpc/serverClient";
import { formatCurrency } from "@/lib/utils";

const statusBadge = (status: string | null | undefined) => {
	if (status === "completed" || status === "delivered")
		return <Badge className="bg-gray-100 text-gray-900 border-0">Completed</Badge>;
	if (status === "cancelled")
		return <Badge className="bg-gray-100 text-gray-500 border-0">Cancelled</Badge>;
	if (status === "processing")
		return <Badge className="bg-gray-100 text-gray-700 border-0">Processing</Badge>;
	return <Badge className="bg-gray-100 text-gray-500 border-0">Pending</Badge>;
};

export default async function SalesPage() {
	const serverClient = await getServerClient();
	const orders = await serverClient.orders.list().catch(() => []);

	const items = Array.isArray(orders) ? orders : [];
	const total = items.reduce(
		(acc, o) => acc + Number.parseFloat(o.total_amount ?? "0"),
		0,
	);
	const avg = items.length > 0 ? total / items.length : 0;
	const completed = items.filter(
		(o) => o.status === "completed" || o.status === "delivered",
	);

	const kpis = [
		{
			label: "Total Orders",
			value: items.length.toString(),
			icon: ShoppingCartIcon,
		},
		{
			label: "Total Revenue",
			value: formatCurrency(total, "en-IN"),
			icon: IndianRupeeIcon,
		},
		{
			label: "Avg. Order Value",
			value: formatCurrency(avg, "en-IN"),
			icon: TrendingUpIcon,
		},
		{
			label: "Completed",
			value: completed.length.toString(),
			icon: PackageIcon,
		},
	];

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-gray-900">
						Sales
					</h1>
					<p className="mt-1 text-gray-500 text-sm">
						Track all sales orders and revenue
					</p>
				</div>
				<Link href="/admin/pos">
					<Button className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
						<PlusIcon className="h-4 w-4" />
						New Sale (POS)
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{kpis.map((kpi) => (
					<Card key={kpi.label} className="border border-gray-200 shadow-sm">
						<CardContent className="pt-6">
							<div className="flex items-center gap-3">
								<div className="bg-gray-100 rounded-lg p-2">
									<kpi.icon className="h-5 w-5 text-gray-900" />
								</div>
								<div>
									<p className="text-gray-500 text-sm">{kpi.label}</p>
									<p className="font-bold text-xl text-gray-900">{kpi.value}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="border border-gray-200 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-gray-900">
						<ShoppingCartIcon className="h-5 w-5 text-gray-900" />
						Sales Orders
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border border-gray-200">
						<Table>
							<TableHeader className="bg-gray-50">
								<TableRow>
									<TableHead className="text-gray-900">Order ID</TableHead>
									<TableHead className="text-gray-900">Customer</TableHead>
									<TableHead className="text-gray-900">Status</TableHead>
									<TableHead className="text-right text-gray-900">Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="h-24 text-center text-gray-500">
											No orders found.
										</TableCell>
									</TableRow>
								) : (
									items.map((order) => (
										<TableRow key={order.id}>
											<TableCell className="font-medium text-gray-900">
												<Link 
													href={`/admin/orders/${order.id}`}
													className="hover:underline"
												>
													#{order.id.toString().padStart(4, "0")}
												</Link>
											</TableCell>
											<TableCell className="text-gray-900">
												{(order as any).customers?.name || "Walk-in Customer"}
											</TableCell>
											<TableCell>{statusBadge(order.status)}</TableCell>
											<TableCell className="text-right font-medium text-gray-900">
												{formatCurrency(Number(order.total_amount || 0), "en-IN")}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

