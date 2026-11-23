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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Mail, Plus, ShieldCheck, UserCheck, Users } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingTeamPage() {
	const [inviteOpen, setInviteOpen] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<
		"Admin" | "Marketing Manager" | "Content Creator" | "Viewer"
	>("Marketing Manager");

	const trpc = useTRPC();
	const teamQuery = trpc.instagram.getTeamMembers.useQuery();

	const inviteMutation = trpc.instagram.inviteTeamMember.useMutation({
		onSuccess: (res) => {
			toast.success(`Invite sent to ${res.member.email}!`);
			setInviteOpen(false);
			setName("");
			setEmail("");
			teamQuery.refetch();
		},
	});

	const members = teamQuery.data || [];

	const handleInvite = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !name.trim()) {
			toast.error("Please fill in name and email.");
			return;
		}

		inviteMutation.mutate({
			name: name.trim(),
			email: email.trim(),
			role,
		});
	};

	return (
		<div className="space-y-6 max-w-5xl mx-auto">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Marketing Team & Permissions
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Manage staff access to Instagram scheduling, media uploads, and comment replies
					</p>
				</div>

				<Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
					<DialogTrigger asChild>
						<Button className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs">
							<Plus className="h-3.5 w-3.5" />
							Invite Member
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-base">Invite Team Member</DialogTitle>
							<DialogDescription className="text-xs">
								Grant access to the Instagram Marketing workspace.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleInvite} className="space-y-4 pt-2">
							<div className="space-y-1.5">
								<Label htmlFor="m-name" className="text-xs font-semibold">
									Full Name
								</Label>
								<Input
									id="m-name"
									placeholder="e.g. Rahul Sharma"
									className="text-xs h-8"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="m-email" className="text-xs font-semibold">
									Email Address
								</Label>
								<Input
									id="m-email"
									type="email"
									placeholder="rahul@evaluna.in"
									className="text-xs h-8"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Workspace Role</Label>
								<select
									className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs"
									value={role}
									onChange={(e) => setRole(e.target.value as any)}
								>
									<option value="Admin">Admin (Full Access & Meta OAuth)</option>
									<option value="Marketing Manager">Marketing Manager (Create, Schedule, Reply)</option>
									<option value="Content Creator">Content Creator (Media & Drafts)</option>
									<option value="Viewer">Viewer (Analytics Only)</option>
								</select>
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setInviteOpen(false)}
									className="text-xs"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={inviteMutation.isPending}
									className="text-xs bg-primary text-primary-foreground"
								>
									Send Invitation
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{members.map((m) => (
					<Card key={m.id} className="rounded-xl border-border/70 shadow-xs">
						<CardContent className="p-4 space-y-3">
							<div className="flex items-center gap-3">
								<img
									src={m.avatar}
									alt=""
									className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
								/>
								<div className="min-w-0 flex-1">
									<p className="font-bold text-xs text-foreground truncate">{m.name}</p>
									<p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
									<Badge className="bg-primary/10 text-primary border-none text-[10px] mt-1">
										{m.role}
									</Badge>
								</div>
							</div>

							<div className="pt-2 border-t border-border/50 space-y-1">
								<p className="text-[10px] font-semibold text-muted-foreground">Permissions:</p>
								<div className="flex flex-wrap gap-1">
									{m.permissions.map((p) => (
										<span key={p} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-foreground">
											{p}
										</span>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
