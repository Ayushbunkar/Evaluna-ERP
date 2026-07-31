"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { update, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export function RoleSwitcher() {
	const { data: session, status } = useSession();
	const [isUpdating, setIsUpdating] = useState(false);

	// Example mutation to update role in the backend
	const updateRoleMutation = trpc.auth.switchRole.useMutation({
		onSuccess: async () => {
			// update next-auth session
			await update();
			toast.success("Role switched successfully");
		},
		onError: (error) => {
			toast.error(`Failed to switch role: ${error.message}`);
		},
		onSettled: () => {
			setIsUpdating(false);
		},
	});

	if (status === "loading") {
		return <Skeleton className="h-10 w-[180px]" />;
	}

	if (status === "unauthenticated" || !session?.user) {
		return null;
	}

	// Allow switching if admin, or display current role
	const userRole = session.user.role as string;
	const isSuperAdmin = userRole === "SUPER_ADMIN";

	const handleRoleChange = (newRole: string) => {
		setIsUpdating(true);
		updateRoleMutation.mutate({ role: newRole });
	};

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
