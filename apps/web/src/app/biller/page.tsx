"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@evaluna/ui/components/card";
import {
  ReceiptIcon,
  CreditCardIcon,
  HeartIcon,
} from "lucide-react";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
  AnimatedCard,
} from "@/lib/animations";

export default function BillerDashboard() {
  return (
    <PageTransition className="grid flex-1 items-start gap-6 min-w-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Biller Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage invoices, payments, and customer loyalty.</p>
      </div>

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Invoices Generated</p>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ReceiptIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">45</h3>
                <p className="text-xs text-muted-foreground mt-2">Today's total invoices</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <div className="p-2 bg-orange-500/10 rounded-full">
                    <CreditCardIcon className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-orange-600">8</h3>
                <p className="text-xs text-muted-foreground mt-2">Awaiting customer payment</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Loyalty Points Issued</p>
                  <div className="p-2 bg-pink-500/10 rounded-full">
                    <HeartIcon className="h-4 w-4 text-pink-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-pink-600">1,250</h3>
                <p className="text-xs text-muted-foreground mt-2">Points distributed today</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      <div className="grid gap-6 md:grid-cols-2 mt-4">
        <Card className="border-border/50 shadow-sm bg-card/50">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Connect to billing engine to see invoices.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
