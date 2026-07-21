"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useBranch } from "@/lib/branch-context";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@evaluna/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@evaluna/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { PlusIcon, UserIcon, ShieldIcon, PrinterIcon } from "lucide-react";
import Barcode from 'react-barcode';

const ROLES = ["superadmin", "manager", "cashier", "inventory", "auditor"] as const;
type Role = (typeof ROLES)[number];

const ROLE_COLORS: Record<Role, string> = {
  superadmin: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  cashier: "bg-green-100 text-green-800",
  inventory: "bg-yellow-100 text-yellow-800",
  auditor: "bg-purple-100 text-purple-800",
};

export default function StaffPage() {
  const { activeBranchId } = useBranch();
  const [open, setOpen] = useState(false);
  const [printMember, setPrintMember] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const { data: staffList, isLoading, refetch } = trpc.staff.list.useQuery(
    activeBranchId ? { branch_id: activeBranchId } : {}
  );

  const { data: branches } = trpc.branches.list.useQuery();

  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => { toast.success("Staff member added"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deactivateMutation = trpc.staff.deactivate.useMutation({
    onSuccess: () => { toast.success("Staff member deactivated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "cashier" as Role,
    department: "",
    join_date: new Date().toISOString().split("T")[0],
    salary: 0,
    branch_id: activeBranchId ?? undefined as number | undefined,
  });

  const handleCreate = () => {
    if (!form.name || !form.email) return toast.error("Name and email are required");
    createMutation.mutate({
      ...form,
      join_date: new Date(form.join_date).toISOString(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 space-y-4 p-4 md:p-8 pt-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
          <p className="text-muted-foreground mt-1">Manage employees, roles, and branch assignments.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>Fill in the employee details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staff-name">Full Name</Label>
                <Input id="staff-name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input id="staff-email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="staff-phone">Phone</Label>
                  <Input id="staff-phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-salary">Salary</Label>
                  <Input id="staff-salary" type="number" value={form.salary} onChange={(e) => setForm({...form, salary: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="staff-role">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({...form, role: v as Role})}>
                    <SelectTrigger id="staff-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff-join">Join Date</Label>
                  <Input id="staff-join" type="date" value={form.join_date} onChange={(e) => setForm({...form, join_date: e.target.value})} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-branch">Assigned Branch</Label>
                <Select 
                  value={form.branch_id?.toString() ?? "global"} 
                  onValueChange={(v) => setForm({...form, branch_id: v !== "global" ? parseInt(v) : undefined})}
                >
                  <SelectTrigger id="staff-branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global / No Branch</SelectItem>
                    {branches?.map((b: any) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Add Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading staff...</TableCell>
              </TableRow>
            )}
            {!isLoading && (!staffList || staffList.length === 0) && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No staff members yet. Add your first team member.
                </TableCell>
              </TableRow>
            )}
            {staffList?.map((staff: any, i: number) => (
              <motion.tr
                key={staff.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="border-b transition-colors hover:bg-muted/30"
              >
                <TableCell className="font-mono text-xs">{staff.staff_code}</TableCell>
                <TableCell className="font-medium">{staff.name}</TableCell>
                <TableCell className="text-muted-foreground">{staff.email}</TableCell>
                <TableCell>{staff.phone ?? "—"}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ROLE_COLORS[staff.role as Role] ?? "bg-gray-100 text-gray-800"}`}>
                    {staff.role}
                  </span>
                </TableCell>
                <TableCell>
                  {branches?.find((b: any) => b.id === staff.branch_id)?.name ?? <span className="text-muted-foreground">Global</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={staff.status === "active" ? "default" : "secondary"} className="capitalize">
                    {staff.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => setPrintMember(staff)}
                  >
                    <PrinterIcon className="h-4 w-4" />
                  </Button>
                  {staff.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deactivateMutation.mutate({ id: staff.id })}
                    >
                      Deactivate
                    </Button>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <AnimatePresence>
        {printMember && (
          <Dialog open={!!printMember} onOpenChange={(o) => !o && setPrintMember(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Staff ID Card</DialogTitle>
                <DialogDescription>
                  Print this card for {printMember.name}. They can use it to login or approve actions via barcode scanner.
                </DialogDescription>
              </DialogHeader>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="mt-6 mx-auto w-80 bg-white border rounded-xl overflow-hidden shadow-sm"
              >
                <div className="bg-primary p-4 text-primary-foreground text-center">
                  <h3 className="font-bold text-lg">{printMember.name}</h3>
                  <p className="text-sm opacity-90 capitalize">{printMember.role}</p>
                </div>
                <div className="p-6 bg-white flex flex-col items-center justify-center space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg w-full flex justify-center">
                    {printMember.staff_code ? (
                      <Barcode value={printMember.staff_code} width={1.5} height={60} displayValue={false} />
                    ) : (
                      <div className="text-sm text-muted-foreground h-[60px] flex items-center">No scanner code</div>
                    )}
                  </div>
                  <p className="font-mono text-sm tracking-widest text-slate-600">{printMember.staff_code}</p>
                </div>
                <div className="bg-slate-50 p-2 text-center text-[10px] text-muted-foreground uppercase tracking-wider border-t">
                  Evaluna ERP Official ID
                </div>
              </motion.div>

              <DialogFooter className="mt-6 sm:justify-center">
                <Button onClick={() => window.print()} className="gap-2 w-full sm:w-auto">
                  <PrinterIcon className="h-4 w-4" />
                  Print ID Card
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
