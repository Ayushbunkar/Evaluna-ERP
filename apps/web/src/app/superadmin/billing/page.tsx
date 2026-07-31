"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Check, CreditCard } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

export default function BillingPage() {
  const trpc = useTRPC();
  const { data: plans, isLoading } = trpc.superadmin.getPlans.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
        <p className="text-muted-foreground">Manage billing plans available to tenants.</p>
      </div>

      {isLoading ? (
         <div className="grid gap-4 md:grid-cols-3">
         {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-md"></div>
         ))}
       </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans?.map((plan: any) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-3xl font-bold mb-4">₹{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <ul className="space-y-2">
                  {plan.features?.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center text-sm">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Edit Plan</Button>
              </CardFooter>
            </Card>
          ))}
          {!plans?.length && (
            <div className="col-span-3 text-center text-muted-foreground">No plans found.</div>
          )}
        </div>
      )}
    </div>
  );
}
