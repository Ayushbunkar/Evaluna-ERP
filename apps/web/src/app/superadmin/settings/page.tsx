"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@evaluna/ui/components/tabs";
import { Switch } from "@evaluna/ui/components/switch";
import { 
  Building, 
  Palette, 
  Bell, 
  Settings2, 
  Save,
  Globe,
  Mail,
  Shield
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

export default function SettingsPage() {
  const trpc = useTRPC();
  
  // Mock data as if returned from useQuery
  const settingsData = {
    businessName: "Evaluna Technologies Pvt. Ltd.",
    gstin: "27AADCE1234F1Z5",
    address: "123, Tech Park, Andheri East, Mumbai",
    email: "admin@evaluna.in",
    currency: "INR (₹)",
    theme: "light",
    primaryColor: "#0f172a",
    emailNotifications: true,
    smsNotifications: false,
    mfaEnabled: true,
    sessionTimeout: "30"
  };

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's configuration and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your company details and tax information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Legal Business Name</Label>
                  <Input id="businessName" defaultValue={settingsData.businessName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" defaultValue={settingsData.gstin} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Registered Address</Label>
                  <Input id="address" defaultValue={settingsData.address} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Support Email</Label>
                  <Input id="email" type="email" defaultValue={settingsData.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Input id="currency" defaultValue={settingsData.currency} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Branding</CardTitle>
              <CardDescription>Customize how the application looks for your users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <Input type="color" defaultValue={settingsData.primaryColor} className="w-12 h-12 p-1" />
                    <Input defaultValue={settingsData.primaryColor} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Default Theme</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how the system communicates with admins and users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive daily summaries and critical alerts via email.</p>
                </div>
                <Switch defaultChecked={settingsData.emailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4" /> SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Get SMS alerts for high-priority security events.</p>
                </div>
                <Switch defaultChecked={settingsData.smsNotifications} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Advanced system settings and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Enforce Multi-Factor Authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">Require all superadmins to use 2FA.</p>
                </div>
                <Switch defaultChecked={settingsData.mfaEnabled} />
              </div>
              <div className="space-y-2 pt-2 w-1/2">
                <Label htmlFor="timeout" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Session Timeout (Minutes)
                </Label>
                <Input id="timeout" type="number" defaultValue={settingsData.sessionTimeout} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
