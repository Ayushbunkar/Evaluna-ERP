"use client";

import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
  ActivityIcon,
  SettingsIcon,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminSettingsGeneralPage() {
  const trpc = useTRPC();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const settingsData = await trpc.settings.getAll.query();
      setSettings(settingsData);
    } catch (err) {
      setError("Failed to load settings");
      console.error("Settings error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trpc.settings.setMany.mutate({ settings });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save settings");
      console.error("Settings save error:", err);
    }
  };

  if (isLoading) {
    return (
      <PageTransition className="container mx-auto py-8">
        <div className="flex h-[200px] items-center justify-center">
          Loading...
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition className="container mx-auto py-8">
        <div className="flex h-[200px] items-center justify-center">
          {error}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            General Settings
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Configure company information and regional preferences
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Activity Log
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/admin/settings">
              <SettingsIcon className="mr-2 h-4 w-4" /> Back to Settings
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-semibold text-lg">
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                defaultValue={settings.company_name || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Input
                id="companyAddress"
                defaultValue={settings.address || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                defaultValue={settings.phone || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                defaultValue={settings.email || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }));
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-semibold text-lg">
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                defaultValue={settings.currency || "INR"}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    currency: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                defaultValue={settings.timezone || "Asia/Kolkata"}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    timezone: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Input
                id="dateFormat"
                defaultValue={settings.date_format || "DD/MM/YYYY"}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    date_format: e.target.value,
                  }));
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-semibold text-lg">
              Financial Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="financialYearStart">Financial Year Start</Label>
              <Input
                id="financialYearStart"
                type="month"
                defaultValue={settings.financial_year_start || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    financial_year_start: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financialYearEnd">Financial Year End</Label>
              <Input
                id="financialYearEnd"
                type="month"
                defaultValue={settings.financial_year_end || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    financial_year_end: e.target.value,
                  }));
                }}
              />
            </div>
          </CardContent>
        </Card>
      </form>

      {success && (
        <div className="flex items-center space-x-3 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}
    </PageTransition>
  );
}
