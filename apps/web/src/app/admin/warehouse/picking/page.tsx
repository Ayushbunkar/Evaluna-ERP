"use client";

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
import { format } from "date-fns";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Eye,
	PackageSearch,
} from "lucide-react";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc/client";

export default function PickingPage() {
	const trpc = useTRPC();
	const { data: pickLists = [], isLoading } =
		trpc.picking.getPickLists.useQuery({});

	const stats = [
		{
			title: "Total Pick Lists",
			value: pickLists.length,
			icon: PackageSearch,
			color: "text-blue-600",
		},
		{
			title: "Pending",
			value: pickLists.filter((p) => p.status === "pending").length,
			icon: Clock,
			color: "text-yellow-600",
		},
		{
			title: "In Progress",
			value: pickLists.filter((p) => p.status === "in_progress").length,
			icon: AlertCircle,
			color: "text-orange-600",
		},
		{
			title: "Completed",
			value: pickLists.filter((p) => p.status === "completed").length,
			icon: CheckCircle2,
			color: "text-green-600",
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "in_progress":
				return "bg-orange-100 text-orange-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "Urgent":
				return "bg-red-100 text-red-800 font-bold";
			case "High":
				return "bg-orange-100 text-orange-800";
			case "Medium":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Warehouse Picking
					</h1>
					<p className="mt-1 text-muted-foreground">
						Manage and track order picking operations.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								{stat.title}
							</CardTitle>
							<stat.icon className={`h-4 w-4 ${stat.color}`} />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stat.value}</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Pick Lists</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex h-64 items-center justify-center">
							Loading...
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Pick List ID</TableHead>
									<TableHead>Order ID</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Assigned To</TableHead>
									<TableHead>Items</TableHead>
									<TableHead>Priority</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pickLists.map((pickList) => (
									<TableRow key={pickList.id}>
										<TableCell className="font-medium">{pickList.id}</TableCell>
										<TableCell>{pickList.orderId}</TableCell>
										<TableCell>{pickList.customerName}</TableCell>
										<TableCell>{pickList.assignedTo}</TableCell>
										<TableCell>{pickList.totalItems}</TableCell>
										<TableCell>
											<Badge
												className={getPriorityColor(pickList.priority)}
												variant="outline"
											>
												{pickList.priority}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												className={getStatusColor(pickList.status)}
												variant="outline"
											>
												{pickList.status.replace("_", " ").toUpperCase()}
											</Badge>
										</TableCell>
										<TableCell>
											{format(
												new Date(pickList.createdAt),
												"dd MMM yyyy, HH:mm",
											)}
										</TableCell>
										<TableCell className="text-right">
											<Link href={`/admin/warehouse/picking/${pickList.id}`}>
												<Button variant="outline" size="sm">
													<Eye className="mr-2 h-4 w-4" />
													View Details
												</Button>
											</Link>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
