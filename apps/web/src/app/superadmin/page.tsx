import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";

export default function SuperAdminDashboard() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">Super Admin Overview</h1>
			
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Branches</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">Manage Branches</div>
						<p className="text-xs text-muted-foreground mt-1">Configure all network locations</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">System Health</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-500">All Systems Operational</div>
						<p className="text-xs text-muted-foreground mt-1">View metrics in health tab</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Global Users</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">Role Assignment</div>
						<p className="text-xs text-muted-foreground mt-1">Assign admins to branches</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Master Data</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">Synchronized</div>
						<p className="text-xs text-muted-foreground mt-1">Centralized taxonomy & records</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
