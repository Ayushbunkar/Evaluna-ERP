"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		// Register the dedicated public/sw.js
		const registerSW = async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});
				console.log(
					"[PWA] Service Worker registered successfully with scope:",
					registration.scope,
				);

				// Check for updates when coming online
				window.addEventListener("online", () => {
					void registration.update();
				});

				// Periodic update check every 60 minutes
				setInterval(() => {
					void registration.update();
				}, 60 * 60 * 1000);
			} catch (error) {
				console.warn("[PWA] Service Worker registration failed:", error);
			}
		};

		void registerSW();
	}, []);

	return null;
}
