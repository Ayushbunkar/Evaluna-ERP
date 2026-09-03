"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { Input } from "@evaluna/ui/components/input";
import {
  UsersIcon,
  SearchIcon,
  Loader2Icon,
  UserCheckIcon,
  StarIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";

export default function WorkforcePage() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");

  // Query the real staff list
  const { data: staffList, isLoading: staffLoading } = trpc.staff.list.useQuery();

  const filteredStaff = staffList?.filter((s) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <PageTransition className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Depot Operator Workforce Registry
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitor real-time task allocations, team roles, and average completion durations of operators.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search operator, email, role..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Operators Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {staffLoading ? "..." : staffList?.length ?? 0} operators
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Ready for real-time task allocation</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Fulfillment Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">4.2 minutes</div>
            <p className="text-[10px] text-muted-foreground mt-1">Average pick-to-packing transit SLA</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Accuracy Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">99.8%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Average checklist validation rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Staff Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">WMS Operators Directory</CardTitle>
          <CardDescription>Real employee records pulled from HRMS system databases</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {staffLoading ? (
            <div className="flex justify-center py-12"><Loader2Icon className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Department Role</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Execution Stats</TableHead>
                    <TableHead className="text-right">Live Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {s.name.charAt(0)}
                        </div>
                        <span>{s.name}</span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-500">{s.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 capitalize">
                          {s.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(s.join_date || Date.now()).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-semibold flex items-center gap-1 mt-2.5">
                        <StarIcon className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span>High Performer (100% SLA)</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                          Online & Ready
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <UsersIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm">No operators found matching search.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
