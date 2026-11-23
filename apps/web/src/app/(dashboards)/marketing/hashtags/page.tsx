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
import {
	Bookmark,
	Check,
	Copy,
	Hash,
	Plus,
	Sparkles,
	Tag,
	Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingHashtagManagerPage() {
	const [createOpen, setCreateOpen] = useState(false);
	const [name, setName] = useState("");
	const [category, setCategory] = useState("Retailers");
	const [tagsString, setTagsString] = useState("");
	const [copiedId, setCopiedId] = useState<number | null>(null);

	const trpc = useTRPC();
	const hashtagsQuery = trpc.instagram.getHashtags.useQuery();

	const createMutation = trpc.instagram.createHashtagCollection.useMutation({
		onSuccess: () => {
			toast.success("Hashtag collection created!");
			setCreateOpen(false);
			setName("");
			setTagsString("");
			hashtagsQuery.refetch();
		},
	});

	const deleteMutation = trpc.instagram.deleteHashtagCollection.useMutation({
		onSuccess: () => {
			toast.success("Hashtag collection removed.");
			hashtagsQuery.refetch();
		},
	});

	const collections = hashtagsQuery.data || [];

	const handleCopy = (id: number, tags: string[]) => {
		navigator.clipboard.writeText(tags.join(" "));
		setCopiedId(id);
		toast.success(`Copied ${tags.length} hashtags to clipboard!`);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		const rawTags = tagsString
			.split(/[\s,]+/)
			.map((t) => t.trim())
			.filter(Boolean);

		if (rawTags.length === 0) {
			toast.error("Please enter at least one hashtag.");
			return;
		}

		createMutation.mutate({
			name: name.trim() || "Grocery Collection",
			category,
			hashtags: rawTags,
		});
	};

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Hashtag Collections Manager
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Curate and organize high-reach hashtag sets for fast insertion into your posts
					</p>
				</div>

				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs">
							<Plus className="h-3.5 w-3.5" />
							New Collection
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-base">Create Hashtag Collection</DialogTitle>
							<DialogDescription className="text-xs">
								Save a group of related hashtags for 1-click insertion in post composer.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleCreate} className="space-y-4 pt-2">
							<div className="space-y-1.5">
								<Label htmlFor="c-name" className="text-xs font-semibold">
									Collection Name
								</Label>
								<Input
									id="c-name"
									placeholder="e.g. FMCG Monsoon Deals"
									className="text-xs h-8"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Category</Label>
								<select
									className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs"
									value={category}
									onChange={(e) => setCategory(e.target.value)}
								>
									<option value="Retailers">Retailers & Kirana</option>
									<option value="Offers">Offers & Wholesale Deals</option>
									<option value="Location">Location & MP Regional</option>
									<option value="Operations">Logistics & Supply Chain</option>
									<option value="Festive">Festive & Seasonal</option>
								</select>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="c-tags" className="text-xs font-semibold">
									Hashtags (Space or comma separated)
								</Label>
								<Input
									id="c-tags"
									placeholder="#kirana #wholesale #fmcg #bhopalgrocery"
									className="text-xs h-8"
									value={tagsString}
									onChange={(e) => setTagsString(e.target.value)}
									required
								/>
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setCreateOpen(false)}
									className="text-xs"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={createMutation.isPending}
									className="text-xs bg-primary text-primary-foreground"
								>
									Save Collection
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{collections.map((col) => (
					<Card key={col.id} className="rounded-xl border-border/70 shadow-xs">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<div>
								<CardTitle className="text-sm font-bold flex items-center gap-1.5">
									<Bookmark className="h-4 w-4 text-primary" />
									{col.name}
								</CardTitle>
								<CardDescription className="text-xs">
									Category: {col.category} • {col.hashtags?.length || 0} Tags
								</CardDescription>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleCopy(col.id, col.hashtags || [])}
									className="h-7 text-xs gap-1"
								>
									{copiedId === col.id ? (
										<Check className="h-3 w-3 text-emerald-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									{copiedId === col.id ? "Copied" : "Copy All"}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => deleteMutation.mutate({ id: col.id })}
									className="h-7 w-7 text-destructive hover:bg-destructive/10"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						</CardHeader>

						<CardContent className="pt-2">
							<div className="flex flex-wrap gap-1.5">
								{col.hashtags?.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="text-[11px] font-medium py-0.5 px-2 bg-muted/60"
									>
										{tag}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
