"use client";

import Link from "next/link";
import { PageTransition, AnimatedCard, StaggerList, StaggerItem, motion } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { BookOpen, ScrollText } from "lucide-react";

export default function AccountingDashboard() {
  return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Module</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Chart of Accounts and Journal Vouchers.
          </p>
        </div>

        <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaggerItem>
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Chart of Accounts
                  </CardTitle>
                  <CardDescription>
                    View and manage your account hierarchy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/accounting/coa">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full">Go to Chart of Accounts</Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
          
          <StaggerItem>
            <AnimatedCard>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5" />
                    Journal Vouchers
                  </CardTitle>
                  <CardDescription>
                    Create manual double-entry journals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/accounting/journal">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full" variant="secondary">Go to Journal Vouchers</Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedCard>
          </StaggerItem>
        </StaggerList>
      </div>
    </PageTransition>
  );
}
