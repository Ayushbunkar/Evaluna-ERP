import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";

export default function SuperAdminDashboard() {
	return (
		<div className="space-y-6">
			<h1 className="font-bold text-3xl tracking-tight">
				Super Admin Overview
			</h1>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Branches
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">Manage Branches</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Configure all network locations
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">System Health</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-500">
							All Systems Operational
						</div>
						<p className="mt-1 text-muted-foreground text-xs">
							View metrics in health tab
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Global Users</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">Role Assignment</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Assign admins to branches
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Master Data</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">Synchronized</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Centralized taxonomy & records
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
