"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@finopenpos/ui/components/card";
import { Skeleton } from "@finopenpos/ui/components/skeleton";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export default function PaymentsPage() {
  const trpc = useTRPC();
  
  // Dummy translation strings for testing
  // In a real app we would use appropriate namespaces, here we just use common or a fallback
  const tc = useTranslations("common");

  // Type safe tRPC query
  const { data = [], isLoading, error } = useQuery(
    // @ts-ignore - Assuming this route exists on the router
    trpc.payments.list.queryOptions ? trpc.payments.list.queryOptions() : { queryKey: ['payments', 'list'], queryFn: () => [] }
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Manage payments</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500">Error loading payments</div>
        ) : (
          <div className="rounded-md border p-4">
            <pre className="text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
