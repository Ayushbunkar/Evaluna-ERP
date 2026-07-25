"use client";

import React, { useEffect } from "react";
import { Button } from "@evaluna/ui/components/button";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Something went wrong!</h1>
        <p className="max-w-[500px] text-muted-foreground">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
