"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, CalendarCheckIcon } from "lucide-react";
import Link from "next/link";

export default function HRLeavePage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: leaveRequests, isLoading, error } = trpc.hr.getLeaveRequests.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading leave requests</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Leave Requests</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            View and manage leave requests
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> HR Activities
          </Button>
        </div>
      </div>

      {!leaveRequests || leaveRequests.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No leave requests found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHeader className="text-left">ID</TableHeader>
                <TableHeader className="text-left">Employee</TableHeader>
                <TableHeader className="text-left">Leave Type</TableHeader>
                <TableHeader className="text-left">Start Date</TableHeader>
                <TableHeader className="text-left">End Date</TableHeader>
                <TableHeader className="text-left">Status</TableHeader>
                <TableHeader className="text-left">Actions</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.id}</TableCell>
                  <TableCell>{req.emp_name}</TableCell>
                  <TableCell>{req.leave_type}</TableCell>
                  <TableCell>{req.start_date}</TableCell>
                  <TableCell>{req.end_date}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${req.status === "approved" ? "bg-green-100 text-green-800" : req.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    {req.status === "pending" && (
                      <>
                        <Button variant="outline" size="xs" onClick={() => alert(`Approve leave ${req.id}`)}>
                          <ActivityIcon className="mr-1 h-3 w-3" /> Approve
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => alert(`Reject leave ${req.id}`)}>
                          <ActivityIcon className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </>
                    )}
                    {req.status !== "pending" && (
                      <Button variant="outline" size="xs" onClick={() => alert(`View leave ${req.id}`)}>
                        <ActivityIcon className="mr-1 h-3 w-3" /> View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageTransition>
  );
}