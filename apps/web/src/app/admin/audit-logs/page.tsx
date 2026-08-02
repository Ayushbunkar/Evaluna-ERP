"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import {
	Activity,
	AlertTriangle,
	Eye,
	FileJson,
	Search,
	UserCheck,
	X,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

// Mock TRPC response data
const MOCK_AUDIT_LOGS = [
	{
		id: "AL-1001",
		user: "Rahul Sharma",
		role: "Superadmin",
		action: "UPDATE",
		module: "Settings",
		details: "Updated GSTIN configuration",
		ipAddress: "115.112.45.12",
		timestamp: "2026-07-31T10:23:45",
		status: "success",
		changes: {
			before: { gstin: "27AADCE1234F1Z0" },
			after: { gstin: "27AADCE1234F1Z5" },
		},
	},
	{
		id: "AL-1002",
		user: "Priya Patel",
		role: "Admin",
		action: "DELETE",
		module: "Inventory",
		details: "Deleted product sku-992",
		ipAddress: "103.45.67.89",
		timestamp: "2026-07-31T09:15:22",
		status: "success",
		changes: {
			before: { productId: "sku-992", status: "active" },
			after: null,
		},
	},
	{
		id: "AL-1003",
		user: "System",
		role: "System",
		action: "LOGIN_FAILED",
		module: "Auth",
		details: "Multiple failed login attempts",
		ipAddress: "45.22.11.190",
		timestamp: "2026-07-31T04:12:05",
		status: "failed",
		changes: null,
	},
	{
		id: "AL-1004",
		user: "Amit Kumar",
		role: "Manager",
		action: "CREATE",
		module: "Users",
		details: "Created new user 'Neha Singh'",
		ipAddress: "115.112.45.15",
		timestamp: "2026-07-30T16:45:10",
		status: "success",
		changes: {
			before: null,
			after: { name: "Neha Singh", role: "Employee" },
		},
	},
];

export default function AuditLogsPage() {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedLog, setSelectedLog] = useState<any>(null);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "success":
				return (
					<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-semibold text-green-800 text-xs">
						Success
					</span>
				);
			case "failed":
				return (
					<span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-800 text-xs">
						Failed
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 font-semibold text-gray-800 text-xs">
						{status}
					</span>
				);
		}
	};

	const getActionBadge = (action: string) => {
		switch (action) {
			case "CREATE":
				return (
					<Badge variant="outline" className="border-blue-200 text-blue-700">
						CREATE
					</Badge>
				);
			case "UPDATE":
				return (
					<Badge
						variant="outline"
						className="border-yellow-200 text-yellow-700"
					>
						UPDATE
					</Badge>
				);
			case "DELETE":
				return (
					<Badge variant="outline" className="border-red-200 text-red-700">
						DELETE
					</Badge>
				);
			default:
				return <Badge variant="outline">{action}</Badge>;
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Audit Logs</h1>
					<p className="mt-1 text-muted-foreground">
						Track all system activities, changes, and security events.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">Export CSV</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="bg-gradient-to-br from-blue-50 to-white">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Total Events (24h)
						</CardTitle>
						<Activity className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">1,284</div>
						<p className="text-muted-foreground text-xs">+12% from yesterday</p>
					</CardContent>
				</Card>
				<Card className="bg-gradient-to-br from-green-50 to-white">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Active Users</CardTitle>
						<UserCheck className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">42</div>
						<p className="text-muted-foreground text-xs">Currently logged in</p>
					</CardContent>
				</Card>
				<Card className="bg-gradient-to-br from-red-50 to-white">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Failed Actions
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">18</div>
						<p className="text-muted-foreground text-xs">Requires attention</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>System Activity Log</CardTitle>
						<div className="relative w-64">
							<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search user, IP, or module..."
								className="pl-8"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<table className="w-full text-left text-sm">
							<thead className="bg-muted/50 text-muted-foreground">
								<tr>
									<th className="px-4 py-3 font-medium">Timestamp</th>
									<th className="px-4 py-3 font-medium">User</th>
									<th className="px-4 py-3 font-medium">Module</th>
									<th className="px-4 py-3 font-medium">Action</th>
									<th className="px-4 py-3 font-medium">IP Address</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 text-right font-medium">Details</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{MOCK_AUDIT_LOGS.map((log) => (
									<tr
										key={log.id}
										className="transition-colors hover:bg-muted/50"
									>
										<td className="px-4 py-3 text-muted-foreground">
											{new Date(log.timestamp).toLocaleString("en-IN")}
										</td>
										<td className="px-4 py-3">
											<div className="font-medium">{log.user}</div>
											<div className="text-muted-foreground text-xs">
												{log.role}
											</div>
										</td>
										<td className="px-4 py-3 font-medium">{log.module}</td>
										<td className="px-4 py-3">{getActionBadge(log.action)}</td>
										<td className="px-4 py-3 text-muted-foreground">
											{log.ipAddress}
										</td>
										<td className="px-4 py-3">{getStatusBadge(log.status)}</td>
										<td className="px-4 py-3 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedLog(log)}
												disabled={!log.changes}
											>
												<Eye className="mr-1 h-4 w-4" />
												View
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Modal / Dialog placeholder for View Changes */}
			{selectedLog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<Card className="w-[600px] shadow-lg">
						<CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
							<div>
								<CardTitle className="flex items-center gap-2 text-lg">
									<FileJson className="h-5 w-5 text-primary" />
									Change Details ({selectedLog.id})
								</CardTitle>
								<p className="mt-1 text-muted-foreground text-sm">
									{selectedLog.details}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSelectedLog(null)}
							>
								<X className="h-4 w-4" />
							</Button>
						</CardHeader>
						<CardContent className="p-6">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<div className="font-semibold text-red-500 text-sm">
										Before:
									</div>
									<pre className="max-h-[300px] overflow-auto rounded-md border border-red-100 bg-red-50 p-4 text-red-900 text-xs">
										{JSON.stringify(selectedLog.changes?.before, null, 2) ||
											"null"}
									</pre>
								</div>
								<div className="space-y-2">
									<div className="font-semibold text-green-500 text-sm">
										After:
									</div>
									<pre className="max-h-[300px] overflow-auto rounded-md border border-green-100 bg-green-50 p-4 text-green-900 text-xs">
										{JSON.stringify(selectedLog.changes?.after, null, 2) ||
											"null"}
									</pre>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
