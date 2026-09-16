"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "@/lib/trpc/client";
import type { AppRouter } from "@/lib/trpc/router";

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 3 * 1000, // 3 seconds stale time for real-time reactivity
						gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection time (offline friendly)
						refetchOnWindowFocus: true, // Automatically sync data whenever user switches back to the tab
						refetchInterval: 5000, // Global real-time poll every 5s across all role dashboards (Sales, Customer, Picker, Packer, Manager, Driver)
						retry: 2, // Retry failed requests twice
					},
				},
			}),
	);
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
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
