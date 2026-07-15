import React from "react";
import { Skeleton } from "@evaluna/ui/components/skeleton";

export default function RootLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-6">
        <Skeleton className="h-12 w-3/4 rounded-md" />
        <Skeleton className="h-6 w-1/2 rounded-md" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    </div>
  );
}
