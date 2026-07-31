"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { DatabaseBackup, Download, Plus, Clock } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

export default function BackupsPage() {
  const trpc = useTRPC();
  const { data: backups, isLoading } = trpc.backups.list.useQuery();
  const utils = trpc.useUtils();
  const triggerMutation = trpc.backups.trigger.useMutation({
    onSuccess: () => {
      utils.backups.list.invalidate();
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Database Backups</h2>
          <p className="text-muted-foreground">Manage automated and manual backups.</p>
        </div>
        <Button onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isLoading}>
          <Plus className="mr-2 h-4 w-4" /> Trigger Backup
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Backups</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
               {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : (
             <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Size</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {backups?.map((backup: any) => (
                    <tr key={backup.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium flex items-center gap-2">
                        <DatabaseBackup className="h-4 w-4 text-muted-foreground" />
                        {backup.name}
                      </td>
                      <td className="p-4 align-middle">{backup.size}</td>
                      <td className="p-4 align-middle">{new Date(backup.date).toLocaleString()}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={backup.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {backup.status}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!backups?.length && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No backups found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
