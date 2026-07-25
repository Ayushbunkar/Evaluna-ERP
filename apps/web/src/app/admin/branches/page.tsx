"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, MapPin, Phone, Mail, Plus, Crown } from "lucide-react";

export default function BranchesPage() {
  const { data: branches, isLoading } = trpc.branches.list.useQuery();
  const utils = trpc.useUtils();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    is_headquarters: false,
  });

  const createBranch = trpc.branches.create.useMutation({
    onSuccess: () => {
      toast.success("Branch created successfully");
      setCreateOpen(false);
      setForm({ name: "", code: "", address: "", phone: "", email: "", is_headquarters: false });
      utils.branches.list.invalidate();
    },
  });

  const deleteBranch = trpc.branches.delete.useMutation({
    onSuccess: () => {
      toast.success("Branch deleted");
      utils.branches.list.invalidate();
    },
  });

  if (isLoading) return <div className="p-8">Loading branches...</div>;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">Manage your store branches and locations</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Branch</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Branch</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Branch Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Downtown Store" />
              </div>
              <div>
                <Label>Branch Code</Label>
                <Input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} placeholder="BR-0001 (auto-generated)" />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 98765..." />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="branch@store.com" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_headquarters} onCheckedChange={checked => setForm(f => ({...f, is_headquarters: checked}))} />
                <Label>This is the Headquarters</Label>
              </div>
              <Button
                onClick={() => createBranch.mutate(form)}
                disabled={!form.name || createBranch.isPending}
              >
                Create Branch
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches?.map((branch: any) => (
          <Card key={branch.id} className={`relative ${branch.is_headquarters ? "border-yellow-400 border-2" : ""}`}>
            {branch.is_headquarters && (
              <div className="absolute -top-3 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> HQ
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {branch.name}
              </CardTitle>
              <CardDescription>{branch.code || "No code"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {branch.address || "No address"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> {branch.phone || "No phone"}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> {branch.email || "No email"}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Edit coming soon")}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => {
                  if (confirm("Delete this branch?")) deleteBranch.mutate({ id: branch.id });
                }}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!branches || branches.length === 0) && (
          <Card className="col-span-full p-8 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No branches yet</p>
            <p>Create your first branch to get started with multi-location management.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
