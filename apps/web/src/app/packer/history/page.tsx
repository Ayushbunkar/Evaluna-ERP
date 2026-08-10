"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { DataTable } from "@evaluna/ui/components/data-table";
import { DatePickerWithRange } from "@evaluna/ui/components/date-range-picker";
import { Input } from "@evaluna/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import { Download, Filter, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

export default function PackingHistoryPage() {
	const t = useTranslations("nav");
	const [timeRange, setTimeRange] = useState<{ from: Date; to: Date }>({
		from: new Date(new Date().setDate(new Date().getDate() - 7)),
		to: new Date(),
	});
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");

	// Fetch packing history data
	const { data: packingHistory, isLoading } =
		useTRPC().packer.getPackingHistory.useQuery({
			startDate: timeRange.from,
			endDate: timeRange.to,
			status: statusFilter === "all" ? undefined : statusFilter,
			search: searchTerm,
		});

	// Transform backend data to match our component structure
	const transformedHistory =
		packingHistory?.map((item) => ({
			orderId: item.orderId,
			customerName: item.customerName,
			itemsCount: item.itemsCount,
			packedBy: item.packedBy,
			status: item.status,
			packedAt: item.packedAt,
		})) || [];

	// Define columns for data table
	const columns = [
		{
			accessorKey: "orderId",
			header: "Order ID",
			cell: ({ row }: any) => (
				<div className="font-medium">{row.getValue("orderId")}</div>
			),
		},
		{
			accessorKey: "customerName",
			header: "Customer",
		},
		{
			accessorKey: "itemsCount",
			header: "Items",
			cell: ({ row }: any) => (
				<div className="text-center">{row.getValue("itemsCount")}</div>
			),
		},
		{
			accessorKey: "packedBy",
			header: "Packed By",
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }: any) => (
				<div className="flex items-center">
					<span
						className={`mr-2 h-2 w-2 rounded-full ${
							row.getValue("status") === "completed"
								? "bg-green-500"
								: row.getValue("status") === "pending"
									? "bg-yellow-500"
									: "bg-red-500"
						}`}
					/>
					{row.getValue("status")}
				</div>
			),
		},
		{
			accessorKey: "packedAt",
			header: "Date",
			cell: ({ row }: any) => (
				<div>{new Date(row.getValue("packedAt")).toLocaleString()}</div>
			),
		},
		{
			accessorKey: "actions",
			header: "Actions",
			cell: ({ row }: any) => (
				<Button variant="outline" size="sm">
					View Details
				</Button>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<h1 className="font-bold text-2xl">{t("Packing History")}</h1>
				<Button variant="outline" size="sm">
					<Download className="mr-2 h-4 w-4" />
					Export Data
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="flex items-center gap-2">
							<Search className="h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search orders..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="max-w-sm"
							/>
						</div>

						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2">
							<DatePickerWithRange
								date={timeRange}
								onDateChange={setTimeRange}
								className="w-full"
							/>
						</div>
					</div>

					<Tabs defaultValue="all" className="space-y-4">
						<TabsList>
							<TabsTrigger value="all">All Orders</TabsTrigger>
							<TabsTrigger value="recent">Recent</TabsTrigger>
							<TabsTrigger value="completed">Completed</TabsTrigger>
							<TabsTrigger value="pending">Pending</TabsTrigger>
						</TabsList>

						<TabsContent value="all">
							<DataTable
								columns={columns}
								data={transformedHistory}
								isLoading={isLoading}
								searchTerm={searchTerm}
								searchKey="orderId"
							/>
						</TabsContent>

						<TabsContent value="recent">
							<DataTable
								columns={columns}
								data={transformedHistory.filter(
									(item: any) =>
										new Date(item.packedAt) >
										new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
								)}
								isLoading={isLoading}
							/>
						</TabsContent>

						<TabsContent value="pending">
							<DataTable
								columns={columns}
								data={
									packingHistory?.filter(
										(item: any) => item.status === "pending",
									) || []
								}
								isLoading={isLoading}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
