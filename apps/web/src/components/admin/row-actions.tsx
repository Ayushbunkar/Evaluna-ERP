"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";

export type RowAction = {
	label: string;
	icon?: ReactNode;
	onSelect: () => void;
	destructive?: boolean;
	/** When set the item renders disabled and explains why on hover. */
	disabledReason?: string;
};

/**
 * The per-row action menu.
 *
 * An action that the current record or role does not allow stays visible but
 * disabled with a reason, so the admin learns why rather than wondering where
 * the button went.
 */
export function RowActions({
	label = "Row actions",
	actions,
}: {
	label?: string;
	actions: RowAction[];
}) {
	const usable = actions.filter(Boolean);
	if (usable.length === 0) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					aria-label={label}
					title={label}
				>
					<MoreHorizontalIcon className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[200px]">
				<DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{usable.map((action, index) => {
					const disabled = Boolean(action.disabledReason);
					return (
						<DropdownMenuItem
							key={`${action.label}-${index}`}
							disabled={disabled}
							title={action.disabledReason}
							onSelect={(event) => {
								if (disabled) {
									event.preventDefault();
									return;
								}
								action.onSelect();
							}}
							className={
								action.destructive && !disabled
									? "text-destructive focus:bg-destructive focus:text-destructive-foreground"
									: undefined
							}
						>
							{action.icon && (
								<span className="mr-2 inline-flex">{action.icon}</span>
							)}
							<span>{action.label}</span>
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
