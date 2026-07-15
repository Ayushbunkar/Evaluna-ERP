
"use client";

import { authClient } from "@/lib/auth-client";

export function useAuth() {
  return authClient.useSession();
}
