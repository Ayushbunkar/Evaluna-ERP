import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Utility to lazy load components with SSR disabled by default for maximum client-side performance.
 */
export function lazyLoad<T extends ComponentType<any>>(
	factory: () => Promise<{ default: T }>,
	options: { ssr?: boolean; loading?: () => JSX.Element } = { ssr: false },
) {
	return dynamic(factory, options);
}
