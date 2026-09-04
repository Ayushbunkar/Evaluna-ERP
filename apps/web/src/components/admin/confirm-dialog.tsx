"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";

/**
 * Confirmation for anything that cannot be undone with a click.
 *
 * The dialog always names the actual record and spells out the consequence, and
 * the confirm button disables itself while the mutation is in flight so a double
 * click cannot fire the action twice.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	consequence,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = true,
	pending = false,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	consequence?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	pending?: boolean;
	onConfirm: () => void;
}) {
	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				// Never let a backdrop click abandon an in-flight mutation.
				if (pending) return;
				onOpenChange(next);
			}}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-start gap-3 text-left">
						{destructive && (
							<span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
								<AlertTriangleIcon className="h-5 w-5" />
							</span>
						)}
						<div className="space-y-1">
							<DialogTitle>{title}</DialogTitle>
							{description && (
								<DialogDescription>{description}</DialogDescription>
							)}
						</div>
					</div>
				</DialogHeader>

				{consequence && (
					<p className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
						{consequence}
					</p>
				)}

				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						{cancelLabel}
					</Button>
					<Button
						variant={destructive ? "destructive" : "default"}
						onClick={onConfirm}
						disabled={pending}
						autoFocus
					>
						{pending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
						{pending ? "Working…" : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
