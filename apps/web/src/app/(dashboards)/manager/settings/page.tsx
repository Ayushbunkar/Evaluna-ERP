"use client";

import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { SettingsIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [prefName, setPrefName] = useState("Main Warehouse Manager Panel");
  const [prefRefreshInterval, setPrefRefreshInterval] = useState("30");

  const handleSave = () => {
    toast.success("Preferences saved successfully!");
  };

  return (
    <PageTransition className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          Manager Preferences Settings
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Configure notification preferences, refresh frequencies, and local team display filters.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Preferences Control Folder</CardTitle>
          <CardDescription>Personal display settings authorized for your manager-level account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-700">Display Label</Label>
            <Input
              value={prefName}
              onChange={(e) => setPrefName(e.target.value)}
              className="mt-1 text-xs h-9 font-bold"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">SLA Dashboard Auto-Refresh Interval (Seconds)</Label>
            <Input
              type="number"
              value={prefRefreshInterval}
              onChange={(e) => setPrefRefreshInterval(e.target.value)}
              className="mt-1 text-xs h-9"
            />
          </div>

          <div className="pt-2">
            <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <SaveIcon className="mr-1.5 h-4 w-4" /> Save Local Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
