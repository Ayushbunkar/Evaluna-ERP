"use client";

import { useSession } from "@/hooks/use-session";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Building2, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BranchSelectPage() {
  const { session, isLoading: sessionLoading } = useSession();
  const { data: branches, isLoading: branchesLoading } = trpc.branches.list.useQuery();
  const router = useRouter();
  const [selecting, setSelecting] = useState<number | null>(null);

  // If user is not superadmin and has a branch, redirect to their role dashboard immediately
  if (!sessionLoading && session?.user && !session.user.isSuperadmin && session.user.branchId) {
    const role = (session.user as any).role || "sales_person";
    router.push(role === "sales_person" ? "/sales" : `/${role}`);
    return null;
  }

  const handleSelect = async (branchId: number) => {
    setSelecting(branchId);
    
    // In a full implementation, you would mutate the active session here 
    // to set the branch_id in the DB/cookie for this session context.
    // For this boilerplate, we'll set it in localStorage/cookie and redirect.
    document.cookie = `evaluna.branch_context=${branchId}; path=/`;
    setTimeout(() => {
      const role = (session?.user as any)?.role || "admin";
      router.push(role === "sales_person" ? "/sales" : `/${role}`);
    }, 500);
  };

  const handleSelectAll = async () => {
    setSelecting(-1);
    document.cookie = `evaluna.branch_context=all; path=/`;
    setTimeout(() => {
      router.push("/admin");
    }, 500);
  };

  if (sessionLoading || branchesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900/20 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Select Active Branch</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {session?.user?.name}. Please select which branch you want to manage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {session?.user?.isSuperadmin && (
            <Card 
              className={`cursor-pointer hover:border-primary transition-colors ${selecting === -1 ? 'border-primary ring-1 ring-primary' : ''}`}
              onClick={handleSelectAll}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">All Branches (Global View)</h3>
                  <p className="text-sm text-muted-foreground mt-1">Manage network-wide settings and consolidated reports.</p>
                </div>
                {selecting === -1 ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ArrowRight className="w-5 h-5 text-muted-foreground" />}
              </CardContent>
            </Card>
          )}

          {branches?.map((branch) => (
            <Card 
              key={branch.id} 
              className={`cursor-pointer hover:border-primary transition-colors ${selecting === branch.id ? 'border-primary ring-1 ring-primary' : ''}`}
              onClick={() => handleSelect(branch.id)}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{branch.code} • {branch.address}</p>
                </div>
                {selecting === branch.id ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ArrowRight className="w-5 h-5 text-muted-foreground" />}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
