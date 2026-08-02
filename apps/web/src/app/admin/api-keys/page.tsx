"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Check,
	Copy,
	Key,
	Plus,
	Server,
	ShieldAlert,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/lib/trpc/client";

const MOCK_API_KEYS = [
	{
		id: "key-001",
		name: "Production App Server",
		prefix: "eval_prod_",
		key: "eval_prod_*********************8a9b",
		createdAt: "2026-01-15T10:00:00",
		lastUsed: "2026-07-31T21:45:12",
		status: "active",
	},
	{
		id: "key-002",
		name: "Mobile App Integration",
		prefix: "eval_mob_",
		key: "eval_mob_*********************3f2e",
		createdAt: "2026-05-20T14:30:00",
		lastUsed: "2026-07-30T09:12:45",
		status: "active",
	},
	{
		id: "key-003",
		name: "Legacy CRM Sync",
		prefix: "eval_sync_",
		key: "eval_sync_********************1c4d",
		createdAt: "2025-11-10T08:15:00",
		lastUsed: "2026-02-28T16:20:00",
		status: "revoked",
	},
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
		if (status === "active") {
			return (
				<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-semibold text-black text-xs">
					Active
				</span>
			);
		}
		return (
			<span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-black text-xs">
				Revoked
			</span>
		);
	};

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">API Keys</h1>
					<p className="mt-1 text-muted-foreground">
						Manage API keys for programmatic access to the Evaluna API
					</p>
				</div>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Generate New Key
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Card className="bg-card">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 font-medium text-sm">
							<Key className="h-4 w-4" /> Total Active Keys
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl">2</div>
						<p className="mt-1 text-muted-foreground text-xs">
							Across all environments
						</p>
					</CardContent>
				</Card>
				<Card className="border-dashed bg-card">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 font-medium text-sm">
							<Server className="h-4 w-4" /> API Requests (30d)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-3xl">1.2M</div>
						<p className="mt-1 text-muted-foreground text-xs">
							~40k requests per day
						</p>
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
								className={`flex flex-col items-start justify-between rounded-lg border p-4 md:flex-row md:items-center ${apiKey.status === "revoked" ? "bg-muted/50 opacity-75" : "bg-card"}`}
							>
								<div className="mb-4 space-y-2 md:mb-0">
									<div className="flex items-center gap-2">
										<span className="font-semibold">{apiKey.name}</span>
										{getStatusBadge(apiKey.status)}
									</div>
									<div className="flex w-fit items-center gap-2 rounded-md bg-muted px-3 py-1.5">
										<code className="font-mono text-sm">{apiKey.key}</code>
										<Button
											variant="ghost"
											size="icon"
											className="ml-2 h-6 w-6"
											onClick={() => handleCopy(apiKey.key)}
											disabled={apiKey.status === "revoked"}
										>
											{copiedKey === apiKey.key ? (
												<Check className="h-3 w-3 text-green-600" />
											) : (
												<Copy className="h-3 w-3" />
											)}
										</Button>
									</div>
									<div className="flex gap-4 text-muted-foreground text-xs">
										<span>
											Created: {new Date(apiKey.createdAt).toLocaleDateString()}
										</span>
										<span>
											Last used:{" "}
											{new Date(apiKey.lastUsed).toLocaleDateString()}
										</span>
									</div>
								</div>

								{apiKey.status === "active" && (
									<Button variant="destructive" size="sm" className="gap-2">
										<Trash2 className="h-4 w-4" />
										Revoke
									</Button>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="flex gap-3 rounded-lg border border-border bg-muted p-4">
				<ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
				<div className="text-sm">
					<p className="mb-1 font-semibold">Security Recommendation</p>
					<p>
						It is recommended to rotate your API keys every 90 days. If you
						suspect a key has been compromised, revoke it immediately and
						generate a new one.
					</p>
				</div>
			</div>
		</div>
	);
}
