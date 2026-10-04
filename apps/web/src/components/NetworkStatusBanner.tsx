"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPendingOfflineQueueCount } from "@/lib/offline-db";

export function NetworkStatusBanner() {
	const [isOffline, setIsOffline] = useState(false);
	const [pendingQueueCount, setPendingQueueCount] = useState(0);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setIsOffline(!window.navigator.onLine);
		}

		const checkQueue = async () => {
			const count = await getPendingOfflineQueueCount();
			setPendingQueueCount(count);
		};

		void checkQueue();

		const handleOnline = () => {
			setIsOffline(false);
			toast.success("Network restored! Reconnected to Vercel.");
			void checkQueue();
		};

		const handleOffline = () => {
			setIsOffline(true);
			toast.warning(
				"Network disconnected. Switched to Vercel PWA Offline Mode.",
			);
			void checkQueue();
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return (
		<AnimatePresence>
			{isOffline && (
				<motion.div
					initial={{ y: -100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -100, opacity: 0 }}
					className="fixed top-0 right-0 left-0 z-[100] flex flex-wrap items-center justify-between border-amber-600/30 bg-amber-500 px-4 py-2 font-medium text-amber-950 text-xs shadow-md"
				>
					<div className="flex items-center gap-2">
						<WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
						<span>
							<strong>Vercel Offline PWA Mode:</strong> You are currently
							offline. Sales POS & Driver updates are being saved locally in
							IndexedDB.
						</span>
					</div>

					{pendingQueueCount > 0 && (
						<span className="rounded-full bg-amber-900 px-2 py-0.5 font-bold text-[10px] text-amber-100">
							{pendingQueueCount} Pending Offline Outbox Queue
						</span>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
