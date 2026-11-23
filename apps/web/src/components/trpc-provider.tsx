"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useEffect, useState } from "react";
import superjson from "superjson";
import { registerOfflineSync } from "@/lib/offline/sync";
import { offlineSyncLink } from "@/lib/offline/trpc-link";
import { trpc } from "@/lib/trpc/client";
import type { AppRouter } from "@/lib/trpc/router";

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		registerOfflineSync();
	}, []);

	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 minutes stale time (preserves offline data snapshots)
						gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection time (offline friendly)
						refetchOnWindowFocus: true, // Automatically sync data whenever user switches back online
						networkMode: "offlineFirst", // Offline-first network mode for Vercel PWA
						retry: (failureCount) => {
							if (typeof window !== "undefined" && !window.navigator.onLine) {
								return false;
							}
							return failureCount < 2;
						},
					},
					mutations: {
						networkMode: "offlineFirst",
					},
				},
			}),
	);
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				offlineSyncLink,
				httpBatchLink({
					url: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/trpc`,
					transformer: superjson,
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				{children}
			</trpc.Provider>
		</QueryClientProvider>
	);
}
