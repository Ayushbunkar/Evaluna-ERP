"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ShieldAlert,
  Server
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

const MOCK_API_KEYS = [
  {
    id: "key-001",
    name: "Production App Server",
    prefix: "eval_prod_",
    key: "eval_prod_*********************8a9b",
    createdAt: "2026-01-15T10:00:00",
    lastUsed: "2026-07-31T21:45:12",
    status: "active"
  },
  {
    id: "key-002",
    name: "Mobile App Integration",
    prefix: "eval_mob_",
    key: "eval_mob_*********************3f2e",
    createdAt: "2026-05-20T14:30:00",
    lastUsed: "2026-07-30T09:12:45",
    status: "active"
  },
  {
    id: "key-003",
    name: "Legacy CRM Sync",
    prefix: "eval_sync_",
    key: "eval_sync_********************1c4d",
    createdAt: "2025-11-10T08:15:00",
    lastUsed: "2026-02-28T16:20:00",
    status: "revoked"
  }
];

export default function ApiKeysPage() {
  const trpc = useTRPC();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (keyString: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKey(keyString);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-black">Active</span>;
    }
    return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-black">Revoked</span>;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for programmatic access to the Evaluna API
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Generate New Key
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" /> Total Active Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Across all environments</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4" /> API Requests (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground mt-1">~40k requests per day</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active & Revoked Keys</CardTitle>
          <CardDescription>
            Keep your keys secure. Never share them in public repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_API_KEYS.map((apiKey) => (
              <div 
                key={apiKey.id} 
                className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg ${apiKey.status === 'revoked' ? 'bg-muted/50 opacity-75' : 'bg-card'}`}
              >
                <div className="space-y-2 mb-4 md:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{apiKey.name}</span>
                    {getStatusBadge(apiKey.status)}
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md w-fit">
                    <code className="text-sm font-mono">{apiKey.key}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-2" 
                      onClick={() => handleCopy(apiKey.key)}
                      disabled={apiKey.status === 'revoked'}
                    >
                      {copiedKey === apiKey.key ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                    <span>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                  </div>
                </div>

                {apiKey.status === 'active' && (
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted border border-border rounded-lg p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Security Recommendation</p>
          <p>
            It is recommended to rotate your API keys every 90 days. If you suspect a key has been compromised, revoke it immediately and generate a new one.
          </p>
        </div>
      </div>
    </div>
  );
}
