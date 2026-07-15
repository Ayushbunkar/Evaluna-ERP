"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@evaluna/ui/components/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404 - Not Found</h1>
        <p className="max-w-[500px] text-muted-foreground">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
