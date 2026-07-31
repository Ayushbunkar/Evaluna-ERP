"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { ShieldCheck, Save, Check, X } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

const MODULES = [
  { id: "mod_dashboard", name: "Dashboard & Analytics" },
  { id: "mod_users", name: "User Management" },
  { id: "mod_roles", name: "Role Configuration" },
  { id: "mod_inventory", name: "Inventory Management" },
  { id: "mod_billing", name: "Billing & Invoicing" },
  { id: "mod_crm", name: "Customer Relations" },
  { id: "mod_reports", name: "Financial Reports" }
];

const ROLES = [
  { id: "r1", name: "Superadmin" },
  { id: "r2", name: "Manager" },
  { id: "r3", name: "Accountant" },
  { id: "r4", name: "Staff" }
];

// Initial mock state for matrix
const INITIAL_PERMISSIONS = {
  "r1": { mod_dashboard: true, mod_users: true, mod_roles: true, mod_inventory: true, mod_billing: true, mod_crm: true, mod_reports: true },
  "r2": { mod_dashboard: true, mod_users: false, mod_roles: false, mod_inventory: true, mod_billing: false, mod_crm: true, mod_reports: true },
  "r3": { mod_dashboard: true, mod_users: false, mod_roles: false, mod_inventory: false, mod_billing: true, mod_crm: false, mod_reports: true },
  "r4": { mod_dashboard: true, mod_users: false, mod_roles: false, mod_inventory: true, mod_billing: false, mod_crm: true, mod_reports: false },
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(INITIAL_PERMISSIONS);
  const [isSaving, setIsSaving] = useState(false);

  const togglePermission = (roleId: string, moduleId: string) => {
    if (roleId === 'r1') return; // Superadmin always has all permissions
    setPermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [moduleId]: !prev[roleId]?.[moduleId]
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50/30 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Permissions Matrix</h1>
          <p className="text-muted-foreground mt-1">Configure module access across different organizational roles.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md min-w-[140px]">
          {isSaving ? <span className="animate-pulse">Saving...</span> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center gap-3 py-5">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Access Control Matrix</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Check the boxes to grant module access to a specific role.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-64 border-r border-gray-200">Module / Feature</th>
                  {ROLES.map(role => (
                    <th key={role.id} className="px-6 py-4 text-center">
                      {role.name}
                      {role.id === 'r1' && <span className="block text-xs text-emerald-600 font-normal mt-1">All Access</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {MODULES.map((module) => (
                  <tr key={module.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                      {module.name}
                    </td>
                    {ROLES.map(role => {
                      const isGranted = permissions[role.id]?.[module.id];
                      const isSuperadmin = role.id === 'r1';
                      return (
                        <td key={role.id} className="px-6 py-4 text-center">
                          <button
                            type="button"
                            disabled={isSuperadmin}
                            onClick={() => togglePermission(role.id, module.id)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-all ${
                              isGranted
                                ? isSuperadmin 
                                  ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed'
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            {isGranted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-50" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg flex gap-3 text-sm">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600" />
        <p><strong>Note:</strong> Superadmin role permissions cannot be modified. They have unrestricted access to all system modules by default.</p>
      </div>
    </div>
  );
}
