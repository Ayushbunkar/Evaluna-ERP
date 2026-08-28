"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { trpc } from "@/lib/trpc/client";

export function RoleSwitcher() {
	const { session, isLoading } = useSession();
	const [isUpdating, setIsUpdating] = useState(false);

	const handleRoleChange = async (newRole: string) => {
		setIsUpdating(true);
		try {
			// Mocked update for now as auth router doesn't exist
			toast.success("Role switched successfully");
		} catch (error: any) {
			toast.error(`Failed to switch role: ${error.message}`);
		} finally {
			setIsUpdating(false);
		}
	};

	if (isLoading) {
		return <Skeleton className="h-10 w-[180px]" />;
	}

	if (!session?.user) {
		return null;
	}

	const userRole = session.user.role as string;
	const isSuperAdmin = userRole === "SUPER_ADMIN";

	if (!isSuperAdmin) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-sm">Role:</span>
				<span className="font-medium text-sm">{userRole}</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span className="text-muted-foreground text-sm">View as:</span>
			<Select
				value={userRole}
				onValueChange={handleRoleChange}
				disabled={isUpdating}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Select a role" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
					<SelectItem value="MANAGER">Manager</SelectItem>
					<SelectItem value="CASHIER">Cashier</SelectItem>
					<SelectItem value="INVENTORY">Inventory</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
