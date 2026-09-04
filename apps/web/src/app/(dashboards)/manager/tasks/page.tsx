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
import { Label } from "@evaluna/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@evaluna/ui/components/dialog";
import {
  CheckSquareIcon,
  SearchIcon,
  Loader2Icon,
  UserPlusIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function TasksPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  // Queries Sourced Entirely From Real DB
  const { data: tasks = [], isLoading: tasksLoading } = trpc.manager.getTasks.useQuery();
  const { data: employees = [] } = trpc.manager.getEmployees.useQuery();
  const { data: productsList = [] } = trpc.products.list.useQuery();

  // Mutations Sourced Entirely From Real DB
  const createTaskMutation = trpc.manager.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully in the operational ledger!");
      setIsCreateOpen(false);
      utils.manager.getTasks.invalidate();
      utils.manager.getDashboardStats.invalidate();
    },
    onError: (err) => {
      toast.error(`Failed to create task: ${err.message}`);
    }
  });

  const assignTaskMutation = trpc.manager.assignTask.useMutation({
    onSuccess: () => {
      toast.success("Task assigned successfully!");
      setIsAssignOpen(false);
      utils.manager.getTasks.invalidate();
      utils.manager.getDashboardStats.invalidate();
    },
    onError: (err) => {
      toast.error(`Assignment failed: ${err.message}`);
    }
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Form States (Create)
  const [productId, setProductId] = useState("");
  const [taskType, setTaskType] = useState<"generate" | "verify">("generate");
  const [dueAt, setDueAt] = useState("");

  // Form States (Assign)
  const [assignedTo, setAssignedTo] = useState("");

  const handleCreate = async () => {
    if (!productId || !dueAt) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }
    await createTaskMutation.mutateAsync({
      productId: parseInt(productId, 10),
      taskType,
      dueAt,
    });
  };

  const handleAssign = async () => {
    if (!selectedTaskId || !assignedTo) return;
    await assignTaskMutation.mutateAsync({
      taskId: selectedTaskId,
      assignedTo: parseInt(assignedTo, 10),
    });
  };

  const openAssignModal = (id: number) => {
    setSelectedTaskId(id);
    setIsAssignOpen(true);
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
            <CheckSquareIcon className="h-6 w-6 text-blue-600" />
            Task Operational Control Center
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Monitor, assign, reassign, and create SLA-bearing verification & generation work.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="mr-1.5 h-4 w-4" /> New Operational Task
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Workspace Team Tasks Queue</CardTitle>
          <CardDescription>Interactive overview of unassigned and in-flight tasks</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {tasksLoading ? (
            <div className="flex justify-center py-12">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="p-3 font-semibold">Task ID</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Assigned To</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((task) => {
                    const assignee = employees.find((e) => e.id === task.assigned_to);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-bold text-slate-900">TASK-#{task.id}</td>
                        <td className="p-3 capitalize font-semibold">{task.task_type}</td>
                        <td className="p-3">
                          <Badge className="capitalize text-[10px] tracking-wide font-bold">{task.status}</Badge>
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          {assignee ? assignee.name : "Unassigned"}
                        </td>
                        <td className="p-3 text-right">
                          {!task.assigned_to && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssignModal(task.id)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-[10px] h-7"
                            >
                              <UserPlusIcon className="mr-1 h-3.5 w-3.5" /> Assign Team
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                        No team tasks logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE TASK DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">New Verification or Generation Task</DialogTitle>
            <DialogDescription>Create a tracking SLA task mapped directly to a master product record.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Select Product</Label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm h-9"
              >
                <option value="">-- Choose Product --</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Task Type</Label>
              <select
                value={taskType}
                onChange={(e: any) => setTaskType(e.target.value)}
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs h-9"
              >
                <option value="generate">Generate UPC</option>
                <option value="verify">Verify UPC</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Due Date (SLA)</Label>
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN TASK DIALOG */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Assign Task to Team Member</DialogTitle>
            <DialogDescription>Delegate work ownership directly to a qualified workforce staff.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Select Assignee</Label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm h-9"
              >
                <option value="">-- Choose Operator --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={assignTaskMutation.isPending}
            >
              {assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
