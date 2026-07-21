"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useBranch } from "@/lib/branch-context";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@evaluna/ui/components/button";
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
import { ClockIcon, LogOutIcon, LogInIcon, CalendarIcon, ScanIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@evaluna/ui/components/select";

export default function AttendancePage() {
  const { activeBranchId } = useBranch();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [scanCode, setScanCode] = useState<string>("");

  const { data: attendanceList, isLoading, refetch: refetchAttendance } = trpc.attendance.list.useQuery(
    { branch_id: activeBranchId, date: selectedDate },
    { refetchInterval: 60000 } // refresh every minute
  );

  const { data: staffList } = trpc.staff.list.useQuery(
    activeBranchId ? { branch_id: activeBranchId } : {}
  );

  const clockInMutation = trpc.attendance.clockIn.useMutation({
    onSuccess: () => {
      toast.success("Successfully clocked in");
      setSelectedStaffId("");
      setScanCode("");
      refetchAttendance();
    },
    onError: (e) => toast.error(`Failed to clock in: ${e.message}`),
  });

  const lookupMutation = trpc.staff.lookupByCode.useMutation({
    onSuccess: (staffMember) => {
      // Auto clock-in when scanned successfully
      clockInMutation.mutate({
        staff_id: staffMember.id,
        work_type: "regular",
      });
    },
    onError: (e) => toast.error(`Scanner error: ${e.message}`),
  });

  const clockOutMutation = trpc.attendance.clockOut.useMutation({
    onSuccess: () => {
      toast.success("Successfully clocked out");
      refetchAttendance();
    },
    onError: (e) => toast.error(`Failed to clock out: ${e.message}`),
  });

  const handleClockIn = () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member first");
      return;
    }
    clockInMutation.mutate({
      staff_id: parseInt(selectedStaffId),
      work_type: "regular",
    });
  };

  const handleScan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (scanCode.trim()) {
      lookupMutation.mutate({ code: scanCode.trim() });
    }
  };

  const handleClockOut = (id: number) => {
    clockOutMutation.mutate({ id });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start: string, end: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const diffHours = (endTime - startTime) / (1000 * 60 * 60);
    return diffHours.toFixed(2) + " hrs";
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 space-y-4 p-4 md:p-8 pt-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Attendance</h2>
          <p className="text-muted-foreground mt-1">Track daily shifts and operational work logs.</p>
        </div>

        {isToday && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Scanner Input */}
            <form onSubmit={handleScan} className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
              <ScanIcon className="h-4 w-4 text-blue-600 ml-2" />
              <Input
                placeholder="Scan Staff Card..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                className="w-[200px] border-none bg-transparent focus-visible:ring-0 shadow-none"
                autoFocus
              />
              <Button type="submit" variant="secondary" disabled={lookupMutation.isPending || clockInMutation.isPending}>
                Enter
              </Button>
            </form>

            <div className="text-muted-foreground text-sm font-medium">OR</div>

            {/* Manual Selection */}
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border">
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Select Staff Member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList?.filter(s => s.status === 'active').map((staff: any) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleClockIn} 
                disabled={clockInMutation.isPending || !selectedStaffId}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <LogInIcon className="h-4 w-4" />
                Clock In
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          Date:
        </div>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isToday && <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Today</Badge>}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading attendance...</TableCell>
              </TableRow>
            )}
            {!isLoading && (!attendanceList || attendanceList.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No attendance records for this date.
                </TableCell>
              </TableRow>
            )}
            {attendanceList?.map((record: any, i: number) => (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="border-b transition-colors hover:bg-muted/40"
              >
                <TableCell className="font-medium">{record.staff.name}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{record.staff.role}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {formatTime(record.clock_in_time)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {record.clock_out_time ? (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {formatTime(record.clock_out_time)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {calculateDuration(record.clock_in_time, record.clock_out_time)}
                </TableCell>
                <TableCell>
                  <Badge variant={record.shift_status === "active" ? "default" : "secondary"}>
                    {record.shift_status === "active" ? "On Duty" : "Completed"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {record.shift_status === "active" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleClockOut(record.id)}
                      disabled={clockOutMutation.isPending}
                      className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                    >
                      <LogOutIcon className="h-3.5 w-3.5" />
                      Clock Out
                    </Button>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
