"use client";

import { ReactLenis } from "@studio-freight/react-lenis";
import type { ReactNode } from "react";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
	// Lenis smooth scroll hijacks the window scroll, but this dashboard uses overflow-y-auto on a main container.
	// Returning children directly restores native scrolling and fixes the scrollbar issue.
	return <>{children}</>;
}
