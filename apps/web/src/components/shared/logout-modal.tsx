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
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface LogoutModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleConfirmLogout = async () => {
		setIsLoading(true);
		try {
			await fetch("/api/logout", { method: "POST" });
			toast.success("Logged out successfully");
			window.location.replace("/login");
		} catch (_err) {
			toast.error("Logout failed, redirecting...");
			window.location.replace("/login");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-2xl border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
				<DialogHeader className="flex flex-col items-center text-center">
					<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
						<LogOut className="h-7 w-7 text-red-600 dark:text-red-400" />
					</div>
					<DialogTitle className="font-bold text-slate-900 text-xl dark:text-slate-100">
						Log Out of Evaluna ERP?
					</DialogTitle>
					<DialogDescription className="mt-1.5 text-slate-500 text-sm dark:text-slate-400">
						Are you sure you want to end your active session? You will need to
						log in again to access your operational workspace.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
						className="mt-2 w-full border-slate-200 sm:mt-0 sm:w-auto dark:border-slate-800"
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleConfirmLogout}
						disabled={isLoading}
						className="w-full bg-red-600 font-semibold text-white hover:bg-red-700 sm:w-auto dark:bg-red-600 dark:hover:bg-red-700"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Logging out...
							</>
						) : (
							<>
								<LogOut className="mr-2 h-4 w-4" />
								Confirm Logout
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
