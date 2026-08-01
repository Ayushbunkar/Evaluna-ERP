"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";
import superjson from "superjson";
import { registerOfflineSync } from "@/lib/offline/sync";
import { offlineSyncLink } from "@/lib/offline/trpc-link";
import { trpc } from "@/lib/trpc/client";

export default function TRPCProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	React.useEffect(() => {
		registerOfflineSync();
	}, []);

	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 minutes cache
						gcTime: 10 * 60 * 1000,
						refetchOnWindowFocus: false,
						refetchOnMount: false,
						retry: 1,
						networkMode: "always", // Always try to fetch from localhost even if navigator.onLine is false
					},
					mutations: {
						networkMode: "always",
					},
				},
			}),
	);
	const [trpcClient] = useState(() =>
		trpc.createClient({
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
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
