"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@evaluna/ui/components/card";

export default function SalespersonSettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salesperson Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your preferences and POS settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>POS Configuration</CardTitle>
          <CardDescription>Configure your point-of-sale defaults.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Settings configuration panel will be loaded here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
