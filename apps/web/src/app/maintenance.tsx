"use client";

import React from "react";
import { Wrench } from "lucide-react";
import { Button } from "@evaluna/ui/components/button";

export default function MaintenancePage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
          <Wrench className="h-10 w-10 text-blue-600 dark:text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Under Maintenance</h1>
        <p className="max-w-[500px] text-muted-foreground">
          We are currently performing scheduled maintenance. We should be back online shortly. Thank you for your patience!
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
