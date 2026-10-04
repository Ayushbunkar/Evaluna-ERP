"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPendingOfflineQueueCount } from "@/lib/offline-db";
import { flushSyncQueue } from "@/lib/offline/sync";

export function NetworkStatusBanner() {
	const [isOffline, setIsOffline] = useState(false);
	const [showBanner, setShowBanner] = useState(false);
	const [pendingQueueCount, setPendingQueueCount] = useState(0);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const offline = !window.navigator.onLine;
			setIsOffline(offline);
			setShowBanner(offline);
		}

		const checkQueue = async () => {
			const count = await getPendingOfflineQueueCount();
			setPendingQueueCount(count);
		};

		void checkQueue();

		const handleOnline = () => {
			setIsOffline(false);
			setShowBanner(false);
			toast.success("Network restored! Reconnected to server.");
			void flushSyncQueue();
			void checkQueue();
		};

		const handleOffline = () => {
			setIsOffline(true);
			setShowBanner(true);
			toast.warning("Network disconnected. Switched to Offline Mode.");
			void checkQueue();

			// Auto hide top banner after 4 seconds
			setTimeout(() => {
				setShowBanner(false);
			}, 4000);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return (
		<>
			{/* Top Sliding Notification Banner (Auto-dismisses in 4s or on X click) */}
			<AnimatePresence>
				{isOffline && showBanner && (
					<motion.div
						initial={{ y: -100, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -100, opacity: 0 }}
						className="fixed top-0 right-0 left-0 z-[100] flex flex-wrap items-center justify-between border-amber-600/30 bg-amber-500 px-4 py-2 font-medium text-amber-950 text-xs shadow-lg"
					>
						<div className="flex items-center gap-2">
							<WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
							<span>
								<strong>Offline Mode Active:</strong> Working without internet.
								Sales POS & Driver updates are saving locally in IndexedDB.
							</span>
						</div>

						<div className="flex items-center gap-3">
							{pendingQueueCount > 0 && (
								<span className="rounded-full bg-amber-900 px-2 py-0.5 font-bold text-[10px] text-amber-100">
									{pendingQueueCount} Pending Offline Items
								</span>
							)}
							<button
								type="button"
								onClick={() => setShowBanner(false)}
								className="rounded p-1 hover:bg-amber-600/30 transition-colors"
								title="Close banner"
							>
								<X className="h-3.5 w-3.5 text-amber-950" />
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Subtle Yellow Pulsing Dot Indicator in Corner when Offline */}
			<AnimatePresence>
				{isOffline && !showBanner && (
					<motion.button
						type="button"
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						onClick={() => {
							toast.warning(
								`Offline Mode Active${pendingQueueCount > 0 ? ` (${pendingQueueCount} items pending sync)` : ""}`,
							);
							setShowBanner(true);
						}}
						className="fixed top-2.5 right-14 z-[90] flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-amber-600 backdrop-blur-md shadow-md transition-all hover:bg-amber-500/30 dark:text-amber-300"
						title="Offline Mode Active - Click for details"
					>
						<span className="relative flex h-2.5 w-2.5">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
							<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
						</span>
						<span className="font-semibold text-[11px] tracking-tight">
							{pendingQueueCount > 0 ? `${pendingQueueCount} Pending` : "Offline"}
						</span>
					</motion.button>
				)}
			</AnimatePresence>
		</>
	);
}
