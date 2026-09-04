"use client";

import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import {
  UsersIcon,
  SearchIcon,
  Loader2Icon,
  UserIcon,
  CalendarIcon,
  CheckSquareIcon,
  CreditCardIcon,
  XIcon,
} from "lucide-react";

export default function TeamPage() {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Queries
  const { data: employees = [], isLoading } = trpc.manager.getEmployees.useQuery({ search });
  const { data: detail, isLoading: detailLoading } = trpc.manager.getEmployeeDetail.useQuery(
    { staffId: selectedStaffId ?? 0 },
    { enabled: selectedStaffId !== null }
  );

  return (
    <PageTransition className="space-y-6 relative min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-blue-600" />
            My Team Workspace
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Overview, search, and deep-dive audits of your team members' metrics.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Employee List */}
        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Workforce Register</CardTitle>
              <CardDescription>Click any team member to load their operational timeline and balance history</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedStaffId(emp.id)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30 ${
                        selectedStaffId === emp.id ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">
                          {emp.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{emp.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{emp.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        Active
                      </Badge>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-xs">No team members found.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Slide-Over Side Audits Panel */}
        <div>
          {selectedStaffId ? (
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <UserIcon className="h-4.5 w-4.5 text-blue-600" />
                    Member Profile Audit
                  </CardTitle>
                  <CardDescription className="text-xs">Sourced directly from active HRMS/Staff tables</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setSelectedStaffId(null)} className="h-7 w-7 text-slate-400">
                  <XIcon className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-5">
                {detailLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2Icon className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : detail ? (
                  <>
                    {/* Basic Info */}
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg">
                        {detail.employee?.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{detail.employee?.name}</h4>
                        <p className="text-xs text-slate-500 capitalize">{detail.employee?.role}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{detail.employee?.email}</p>
                      </div>
                    </div>

                    {/* Assigned Tasks count */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <CheckSquareIcon className="h-3.5 w-3.5" /> Tasks Queue ({detail.tasks?.length ?? 0})
                      </h5>
                      <div className="space-y-1.5">
                        {detail.tasks?.slice(0, 3).map((t: any) => (
                          <div key={t.id} className="p-2 border rounded text-xs bg-white dark:bg-transparent">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Type: {t.task_type}</span>
                            <div className="flex justify-between items-center mt-1">
                              <Badge variant="outline" className="text-[9px] uppercase">{t.status}</Badge>
                              <span className="text-[9px] text-slate-400">Due: {new Date(t.due_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        {detail.tasks?.length === 0 && <p className="text-xs text-slate-400 py-1">No tasks currently assigned.</p>}
                      </div>
                    </div>

                    {/* Active Leaves */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" /> Approved Leaves ({detail.leaves?.length ?? 0})
                      </h5>
                      <div className="space-y-1.5">
                        {detail.leaves?.slice(0, 3).map((l: any) => (
                          <div key={l.id} className="p-2 border border-slate-100 rounded text-xs bg-slate-50/50">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">Status: {l.status}</p>
                            <span className="text-[9px] text-slate-400 block mt-1">Resolved: {l.resolved_at ? new Date(l.resolved_at).toLocaleDateString() : "Pending"}</span>
                          </div>
                        ))}
                        {detail.leaves?.length === 0 && <p className="text-xs text-slate-400 py-1">No leave requests logged.</p>}
                      </div>
                    </div>

                    {/* Claimed Expenses */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <CreditCardIcon className="h-3.5 w-3.5" /> Reimbursement Claims ({detail.expenses?.length ?? 0})
                      </h5>
                      <div className="space-y-1.5">
                        {detail.expenses?.slice(0, 3).map((e: any) => (
                          <div key={e.id} className="p-2 border border-slate-100 rounded text-xs bg-slate-50/50 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">₹{parseFloat(e.amount).toLocaleString()}</p>
                              <span className="text-[9px] text-slate-400">{e.custom_category_name || "General"}</span>
                            </div>
                            <Badge className="uppercase text-[9px]">{e.status}</Badge>
                          </div>
                        ))}
                        {detail.expenses?.length === 0 && <p className="text-xs text-slate-400 py-1">No expense claims logged.</p>}
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="h-48 border border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <UsersIcon className="h-8 w-8 mb-2 text-slate-300" />
              <p className="text-xs font-bold">No member selected</p>
              <p className="text-[10px] mt-1">Click any team member on the register to inspect their detailed analytics folder.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
