"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@evaluna/ui/components/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
          <ShieldAlert className="h-10 w-10 text-amber-600 dark:text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">403 - Unauthorized</h1>
        <p className="max-w-[500px] text-muted-foreground">
          You don't have the necessary permissions to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
