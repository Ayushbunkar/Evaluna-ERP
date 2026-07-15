"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@evaluna/ui/components/tabs";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Users, UserPlus, Clock, CalendarDays, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function StaffPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const utils = trpc.useUtils();

  // Mocks/queries (In real scenario use actual trpc endpoints)
  const { data: staffList, isLoading: isLoadingStaff } = trpc.staff.list.useQuery();
  const { data: attendance, isLoading: isLoadingAttendance } = trpc.attendance.list.useQuery();

  const createStaffMutation = trpc.staff.create.useMutation({
    onSuccess: () => {
      toast.success("Staff added successfully");
      setIsAddOpen(false);
      utils.staff.list.invalidate();
    }
  });

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createStaffMutation.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      branchId: "branch-1", // Mock branch
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <h3 className="text-2xl font-bold mt-1">24</h3>
              </div>
              <Users className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600">18</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                <h3 className="text-2xl font-bold mt-1 text-yellow-600">2</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">4</h3>
              </div>
              <XCircle className="h-8 w-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="staff">Staff List</TabsTrigger>
          <TabsTrigger value="shifts">Weekly Shifts</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mock attendance cards since trpc data might be empty/different */}
                  {[
                    { id: 1, name: "Alice Smith", role: "Manager", status: "Present", clockIn: "08:45 AM", clockOut: null },
                    { id: 2, name: "Bob Jones", role: "Cashier", status: "Present", clockIn: "08:50 AM", clockOut: null },
                    { id: 3, name: "Charlie Brown", role: "Barista", status: "Leave", clockIn: null, clockOut: null },
                  ].map((record: any) => (
                    <motion.div key={record.id} variants={item}>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold">{record.name}</h4>
                              <Badge variant="outline" className="mt-1">{record.role}</Badge>
                            </div>
                            <Badge className={
                              record.status === 'Present' ? 'bg-green-100 text-green-800' :
                              record.status === 'Leave' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1 mb-4">
                            <div>In: {record.clockIn || '--'}</div>
                            <div>Out: {record.clockOut || '--'}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">Mark In</Button>
                            <Button size="sm" variant="outline" className="flex-1">Mark Out</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Staff Directory</CardTitle>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="h-4 w-4 mr-2" /> Add Staff</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select name="role">
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="cashier">Cashier</SelectItem>
                          <SelectItem value="barista">Barista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createStaffMutation.isPending}>Save</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Mock data mapped here for visual completeness if staffList empty */}
                  {(staffList?.length ? staffList : [
                    { id: 1, name: "Alice Smith", email: "alice@evaluna.com", role: "Manager", status: "Active" },
                    { id: 2, name: "Bob Jones", email: "bob@evaluna.com", role: "Cashier", status: "Active" }
                  ]).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell><Badge variant="secondary">{s.role}</Badge></TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Staff</TableHead>
                      <TableHead>Mon</TableHead>
                      <TableHead>Tue</TableHead>
                      <TableHead>Wed</TableHead>
                      <TableHead>Thu</TableHead>
                      <TableHead>Fri</TableHead>
                      <TableHead>Sat</TableHead>
                      <TableHead>Sun</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Alice Smith</TableCell>
                      <TableCell><Badge variant="outline">09:00 - 17:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">09:00 - 17:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">09:00 - 17:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">09:00 - 17:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">09:00 - 17:00</Badge></TableCell>
                      <TableCell><span className="text-muted-foreground text-sm">Off</span></TableCell>
                      <TableCell><span className="text-muted-foreground text-sm">Off</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bob Jones</TableCell>
                      <TableCell><span className="text-muted-foreground text-sm">Off</span></TableCell>
                      <TableCell><Badge variant="outline">11:00 - 19:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">11:00 - 19:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">11:00 - 19:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">11:00 - 19:00</Badge></TableCell>
                      <TableCell><Badge variant="outline">09:00 - 17:00</Badge></TableCell>
                      <TableCell><span className="text-muted-foreground text-sm">Off</span></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}