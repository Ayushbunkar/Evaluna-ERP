"use client";

import { useEffect } from "react";

export default function AdminErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[Admin Error]", error?.message, error?.stack);

		// If it's an auth error, auto-redirect to login after 1.5s
		const msg = error?.message?.toLowerCase() ?? "";
		if (
			msg.includes("unauthorized") ||
			msg.includes("forbidden") ||
			msg.includes("unauthenticated") ||
			msg.includes("session") ||
			msg.includes("jwt") ||
			msg.includes("token")
		) {
			const timer = setTimeout(() => {
				window.location.href = "/login";
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [error]);

	const handleGoToLogin = () => {
		window.location.href = "/login";
	};

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
			<div className="flex max-w-md flex-col items-center space-y-6 text-center">
				<div className="rounded-full bg-red-100 p-4">
					<svg
						className="h-10 w-10 text-red-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<h1 className="font-bold text-3xl tracking-tight">
					Something went wrong
				</h1>
				<p className="text-muted-foreground text-sm">
					An unexpected error occurred. Click below to go to the login page.
				</p>
				{(error?.digest || error?.message) && (
					<p className="max-w-xs break-all rounded bg-muted px-3 py-1 font-mono text-muted-foreground text-xs">
						{error?.digest ?? error?.message?.slice(0, 100)}
					</p>
				)}
				<div className="flex gap-3">
					{/* Primary action: always go to login to escape the broken state */}
					<button
						onClick={handleGoToLogin}
						className="rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90"
					>
						Go to Login
					</button>
					<button
						onClick={reset}
						className="rounded-md border border-border px-4 py-2 font-medium text-sm hover:bg-muted"
					>
						Try again
					</button>
				</div>
			</div>
		</div>
	);
}
