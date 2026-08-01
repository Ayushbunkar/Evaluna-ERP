"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { TRPCProvider } from "@/lib/trpc/client";
import type { AppRouter } from "@/lib/trpc/router";

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes default stale time
				gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection time (offline friendly)
				refetchOnWindowFocus: false, // Prevent aggressive refetches
				retry: 2, // Retry failed requests twice
			},
		},
	}));
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
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}
