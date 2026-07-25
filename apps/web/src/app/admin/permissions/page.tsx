"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { ShieldIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";

const ROLES = ["manager", "cashier", "inventory", "auditor"] as const;
type Role = (typeof ROLES)[number];

const ROLE_COLORS: Record<Role, string> = {
  manager: "bg-blue-100 text-blue-800 border-blue-200",
  cashier: "bg-green-100 text-green-800 border-green-200",
  inventory: "bg-yellow-100 text-yellow-800 border-yellow-200",
  auditor: "bg-purple-100 text-purple-800 border-purple-200",
};

const ACTION_COLORS: Record<string, string> = {
  view: "text-blue-600",
  create: "text-green-600",
  update: "text-amber-600",
  delete: "text-red-600",
};

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("manager");

  const { data, isLoading, refetch } = trpc.permissions.getMatrix.useQuery({ role: selectedRole });

  const updateMutation = trpc.permissions.updateMatrix.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const seedMutation = trpc.permissions.seedDefaults.useMutation({
    onSuccess: () => {
      toast.success("Default permissions seeded");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleToggle = (module: string, action: string, current: boolean) => {
    updateMutation.mutate({
      role: selectedRole,
      module,
      action,
      is_allowed: !current,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 space-y-6 p-4 md:p-8 pt-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Access Control</h2>
          <p className="text-muted-foreground mt-1">Configure module-level permissions for each role.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => seedMutation.mutate({ role: selectedRole })}
          disabled={seedMutation.isPending}
        >
          Restore Defaults for {selectedRole}
        </Button>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-4">
          <ShieldIcon className="h-4 w-4" /> Role:
        </div>
        {ROLES.map((role) => (
          <motion.button
            key={role}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedRole(role)}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all ${
              selectedRole === role
                ? ROLE_COLORS[role] + " shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {role}
          </motion.button>
        ))}
        <div className="ml-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize bg-red-100 text-red-800 border-red-200">
          superadmin — all access (non-editable)
        </div>
      </div>

      {/* Permission Matrix */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading permissions...
        </div>
      ) : data ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Module</th>
                {data.actions.map((action) => (
                  <th key={action} className={`py-3 px-4 text-center font-semibold capitalize ${ACTION_COLORS[action]}`}>
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.modules.map((module, idx) => (
                <motion.tr
                  key={module}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className={`border-t transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                >
                  <td className="py-3 px-4 font-medium capitalize">{module}</td>
                  {data.actions.map((action) => {
                    const allowed = data.matrix[module]?.[action] ?? false;
                    return (
                      <td key={action} className="py-3 px-4 text-center">
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: allowed ? 0 : 5 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          onClick={() => handleToggle(module, action, allowed)}
                          disabled={updateMutation.isPending}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                            allowed
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-red-50 text-red-400 hover:bg-red-100"
                          }`}
                        >
                          {allowed ? (
                            <CheckCircle2Icon className="h-5 w-5" />
                          ) : (
                            <XCircleIcon className="h-5 w-5" />
                          )}
                        </motion.button>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Click any icon to toggle a permission. Changes are saved instantly. Superadmin always has full access and cannot be modified.
      </p>
    </motion.div>
  );
}
