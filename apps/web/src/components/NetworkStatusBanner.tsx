"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function NetworkStatusBanner() {
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setIsOffline(!window.navigator.onLine);
		}

		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);

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
					className="fixed top-0 right-0 left-0 z-[100] flex items-center justify-center bg-amber-500 px-4 py-3 font-medium text-amber-950 text-sm shadow-md"
				>
					<AlertTriangle className="mr-2 h-5 w-5" />
					You are offline. Working in local mode.
				</motion.div>
			)}
		</AnimatePresence>
	);
}

