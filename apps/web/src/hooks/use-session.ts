import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import type { Session, User } from "@/lib/auth-client";

interface ExtendedUser extends User {
  role?: string;
  isSuperadmin?: boolean;
}

export function useSession() {
  const [session, setSession] = useState<{ session: Session; user: ExtendedUser } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await authClient.getSession();
        if (res.data) {
          setSession(res.data as any);
        }
      } catch (err) {
        console.error("Session fetch failed", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSession();
  }, []);

  return { session, isLoading };
}
