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
	CheckCircle2Icon,
	ClockIcon,
	MapPinIcon,
	PackageIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { getServerClient } from "@/lib/trpc/serverClient";
import { formatCurrency } from "@/lib/utils";

const statusBadge = (status: string | null | undefined) => {
	if (status === "delivered")
		return <Badge className="bg-gray-100 text-gray-900 border-0">Delivered</Badge>;
	if (status === "in_transit")
		return <Badge className="bg-gray-100 text-gray-700 border-0">In Transit</Badge>;
	if (status === "pending")
		return <Badge className="bg-gray-100 text-gray-500 border-0">Pending</Badge>;
	return <Badge className="bg-gray-100 text-gray-500 border-0">Unknown</Badge>;
};

export default async function DeliveryPage() {
	const serverClient = await getServerClient();
	const deliveries = await serverClient.delivery.list().catch(() => []);

	const items = Array.isArray(deliveries) ? deliveries : [];
	const delivered = items.filter((d) => d.status === "delivered");
	const inTransit = items.filter((d) => d.status === "in_transit");
	const pending = items.filter((d) => d.status === "pending");

	const kpis = [
		{
			label: "Total Deliveries",
			value: items.length.toString(),
			icon: PackageIcon,
		},
		{
			label: "In Transit",
			value: inTransit.length.toString(),
			icon: TruckIcon,
		},
		{
			label: "Delivered",
			value: delivered.length.toString(),
			icon: CheckCircle2Icon,
		},
		{
			label: "Pending",
			value: pending.length.toString(),
			icon: ClockIcon,
		},
	];

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-gray-900">
						Delivery Management
					</h1>
					<p className="mt-1 text-gray-500 text-sm">
						Track and manage all outgoing deliveries
					</p>
				</div>
				<Link href="/admin/delivery/tracking">
					<Button className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
						<MapPinIcon className="h-4 w-4" />
						Live Tracking
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
						<TruckIcon className="h-5 w-5 text-gray-900" />
						Active Deliveries
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border border-gray-200">
						<Table>
							<TableHeader className="bg-gray-50">
								<TableRow>
									<TableHead className="text-gray-900">Delivery ID</TableHead>
									<TableHead className="text-gray-900">Order ID</TableHead>
									<TableHead className="text-gray-900">Driver</TableHead>
									<TableHead className="text-gray-900">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="h-24 text-center text-gray-500">
											No active deliveries found.
										</TableCell>
									</TableRow>
								) : (
									items.map((delivery) => (
										<TableRow key={delivery.id}>
											<TableCell className="font-medium text-gray-900">
												#{delivery.id.toString().padStart(4, "0")}
											</TableCell>
											<TableCell className="text-gray-900">
												<Link 
													href={`/admin/orders/${delivery.order_id}`}
													className="hover:underline"
												>
													#{delivery.order_id?.toString().padStart(4, "0")}
												</Link>
											</TableCell>
											<TableCell className="text-gray-900">
												{delivery.drivers?.name || "Unassigned"}
											</TableCell>
											<TableCell>{statusBadge(delivery.status)}</TableCell>
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
