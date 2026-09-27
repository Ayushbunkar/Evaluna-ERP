"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@evaluna/ui/components/tooltip";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import React, { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { NotificationModal } from "./NotificationModal";

export interface NotificationBellProps {
	className?: string;
	size?: "sm" | "default" | "icon";
	role?: string;
	branchId?: number;
}

export function NotificationBell({
	className = "",
	size = "icon",
	role,
	branchId,
}: NotificationBellProps) {
	const [isOpen, setIsOpen] = useState(false);
	const trpc = useTRPC();

	// Query unread count with 10s auto-refresh
	const { data: unreadCountData } = trpc.notifications.unreadCount.useQuery(
		branchId ? { branch_id: branchId } : {},
		{
			refetchInterval: 10000,
			refetchOnWindowFocus: true,
		},
	);

	const unreadCount = unreadCountData?.count || 0;

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsOpen(true)}
							className={`relative h-9 w-9 shrink-0 rounded-full transition-colors hover:bg-accent/60 ${className}`}
							aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
							title="Notifications"
						>
							<motion.div
								animate={
									unreadCount > 0
										? {
												rotate: [0, -14, 14, -10, 10, 0],
												scale: [1, 1.1, 1],
											}
										: {}
								}
								transition={{
									repeat: Number.POSITIVE_INFINITY,
									repeatDelay: 4,
									duration: 0.6,
								}}
								className="flex items-center justify-center"
							>
								<Bell className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
							</motion.div>

							{unreadCount > 0 && (
								<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-background animate-in zoom-in duration-200">
									{unreadCount > 99 ? "99+" : unreadCount}
								</span>
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom" className="rounded-lg text-xs font-medium">
						{unreadCount > 0
							? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
							: "Notifications"}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Modal Dialog on same page */}
			<NotificationModal open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
