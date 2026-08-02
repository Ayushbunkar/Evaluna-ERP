"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Shield, Plus, Edit, Trash2, Users, CheckCircle2 } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

const MOCK_ROLES = [
  { id: "ROL-01", name: "Superadmin", description: "Full system access across all modules", usersCount: 2, status: "Active" },
  { id: "ROL-02", name: "Manager", description: "Can manage staff, view reports, and handle inventory", usersCount: 5, status: "Active" },
  { id: "ROL-03", name: "Accountant", description: "Access to billing, invoices, and financial reports", usersCount: 3, status: "Active" },
  { id: "ROL-04", name: "Staff", description: "Limited access to daily operational tasks", usersCount: 15, status: "Active" },
  { id: "ROL-05", name: "Guest", description: "View-only access for temporary users", usersCount: 0, status: "Inactive" },
];

export default function RolesPage() {
  const trpc = useTRPC();
  // using any query as placeholder, fallback to mock data
  const { data: rolesData, isLoading } = trpc.clientSettings.getAllRoles?.useQuery() ?? { data: null, isLoading: false };

  const roles = rolesData && rolesData.length > 0 ? rolesData : MOCK_ROLES;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 space-y-8 bg-gray-50/30 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Role Management</h1>
          <p className="text-muted-foreground mt-1">Define and manage organizational roles and their scopes.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md">
          <Plus className="w-4 h-4" /> Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-indigo-800">Total Roles</CardTitle>
            <Shield className="w-5 h-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">{roles.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800">Active Roles</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {roles.filter(r => r.status === 'Active').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-amber-800">Total Assigned Users</CardTitle>
            <Users className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {roles.reduce((acc, curr) => acc + curr.usersCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-white pb-4">
          <CardTitle className="text-xl">Roles List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Role ID</th>
                    <th className="px-6 py-4">Role Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Assigned Users</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {roles.map((role: any) => (
                    <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{role.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-400" />
                          {role.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-md truncate">{role.description}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <Users className="w-3 h-3" /> {role.usersCount} users
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border-0 ${role.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-100'}`}>
                          {role.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={role.name === 'Superadmin'}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Mock Modal for Adding Role */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Create New Role</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Sales Executive" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" placeholder="Brief description of the role's responsibilities..."></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="status" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                <label htmlFor="status" className="text-sm text-gray-700">Set as Active immediately</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Role</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
