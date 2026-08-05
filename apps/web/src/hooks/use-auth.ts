"use client";

import { useSession } from "@/hooks/use-session";

export function useAuth() {
	return useSession();
}
