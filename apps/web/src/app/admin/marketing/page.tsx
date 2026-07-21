"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Megaphone, Ticket, Activity, Plus } from "lucide-react";
import { PageTransition, StaggerList } from "@/lib/animations";

export default function MarketingDashboard() {
  const { data: campaigns, isLoading: campaignsLoading } = trpc.marketing.listCampaigns.useQuery();
  const { data: coupons, isLoading: couponsLoading } = trpc.marketing.listCoupons.useQuery();

  const activeCampaignsCount = campaigns?.filter(c => c.status === "active").length || 0;
  const totalCampaignsCount = campaigns?.length || 0;
  
  const activeCouponsCount = coupons?.filter(c => c.is_active).length || 0;
  const totalCouponsCount = coupons?.length || 0;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your campaigns, audiences, and promotional coupons.
          </p>
        </div>
      </div>

      <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignsLoading ? "-" : totalCampaignsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCampaignsCount} active right now
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {couponsLoading ? "-" : activeCouponsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {totalCouponsCount} total coupons
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 flex flex-col justify-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button asChild variant="default" className="flex-1 min-w-[120px]">
              <Link href="/admin/marketing/campaigns/new">
                <Plus className="h-4 w-4 mr-2" /> New Campaign
              </Link>
            </Button>
            <Button asChild variant="secondary" className="flex-1 min-w-[120px]">
              <Link href="/admin/marketing/coupons">
                <Ticket className="h-4 w-4 mr-2" /> Manage Coupons
              </Link>
            </Button>
          </CardContent>
        </Card>
      </StaggerList>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Recent Campaigns
            </CardTitle>
            <CardDescription>Latest marketing campaigns and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <p className="text-sm text-muted-foreground">Loading campaigns...</p>
            ) : campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.type} • {campaign.channel}</p>
                    </div>
                    <div className="text-sm px-2 py-1 bg-secondary rounded-md capitalize">
                      {campaign.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No campaigns found.</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/marketing/campaigns">View All Campaigns</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
