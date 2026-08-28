"use client";

import { AlertTriangleIcon } from "lucide-react";
import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children?: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error in widget:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}
			return (
				<div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-rose-500/30 border-dashed bg-rose-500/5 p-6 text-center text-rose-500">
					<AlertTriangleIcon className="mb-2 h-8 w-8 opacity-80" />
					<h3 className="font-semibold">Widget Unavailable</h3>
					<p className="mt-1 text-sm opacity-80">
						{this.state.error?.message ||
							"An error occurred while loading this component."}
					</p>
					<button
						onClick={() => this.setState({ hasError: false })}
						className="mt-4 rounded-md bg-rose-500/10 px-4 py-2 font-medium text-sm hover:bg-rose-500/20"
					>
						Try Again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
