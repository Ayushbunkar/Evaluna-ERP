"use client";

import { Badge } from "@evaluna/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { AdminPageHeader } from "@/components/admin/list-shell";
import { PageTransition } from "@/lib/animations";
import { getPermissionsForRole, ROLE_LEVEL, ROLES } from "@/lib/permissions";

const ROLE_DESCRIPTIONS: Record<string, string> = {
	super_admin: "Unrestricted access to all modules and data.",
	admin: "Full access to all admin modules and settings.",
	manager: "Branch oversight, staff and financial management.",
	hr: "Human resources, payroll and attendance.",
	auditor: "Inventory auditing and compliance.",
	marketing: "Marketing campaigns and promotions.",
	finance: "Financial records and reporting.",
	sales_person: "Sales operations and customer management.",
	biller: "Point-of-sale and billing.",
	picker: "Warehouse picking and fulfillment.",
	putter: "Warehouse put-away and receiving.",
	delivery_boy: "Last-mile delivery operations.",
	route_manager: "Delivery route planning and management.",
	driver: "Vehicle and delivery tracking.",
	supplier: "Supplier self-service portal.",
	customer: "Customer self-service portal.",
	checker: "Quality control and inspection.",
	packer: "Packaging and dispatch.",
};

export default function AdminSettingsRolesPage() {
	// Roles ordered from most powerful to least
	const sortedRoles = [...ROLES].sort((a, b) => ROLE_LEVEL[a] - ROLE_LEVEL[b]);

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Roles & Permissions"
				description="System roles are pre-defined. Each role inherits all permissions of lower-privilege roles."
			/>

			<div className="overflow-x-auto rounded-lg border border-border/50">
				<Table className="w-full">
					<TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
						<TableRow>
							<TableHead>Role</TableHead>
							<TableHead>Level</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Permission count</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedRoles.map((role) => {
							const perms = getPermissionsForRole(role);
							return (
								<TableRow key={role} className="hover:bg-muted/30">
									<TableCell>
										<span className="font-medium font-mono text-sm capitalize">
											{role.replace(/_/g, " ")}
										</span>
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="tabular-nums">
											{ROLE_LEVEL[role]}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{ROLE_DESCRIPTIONS[role] ?? "—"}
									</TableCell>
									<TableCell className="text-sm tabular-nums">
										{perms.length}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			<p className="text-muted-foreground text-xs">
				Roles are defined in{" "}
				<code className="font-mono">@/lib/permissions.ts</code>. To change
				permissions, update the{" "}
				<code className="font-mono">PERMISSION_MATRIX</code> there.
			</p>
		</PageTransition>
	);
}
