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
	Folder,
	FolderPlus,
	Grid,
	Image as ImageIcon,
	Plus,
	Search,
	Sparkles,
	Tag,
	Trash2,
	Upload,
	Video,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingMediaPage() {
	const [activeFolder, setActiveFolder] = useState<string>("ALL");
	const [mediaType, setMediaType] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [uploadOpen, setUploadOpen] = useState(false);

	// Form states
	const [name, setName] = useState("");
	const [fileUrl, setFileUrl] = useState("");
	const [folder, setFolder] = useState("FMCG Products");
	const [tagsInput, setTagsInput] = useState("");
	const [itemMediaType, setItemMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

	const trpc = useTRPC();
	const mediaQuery = trpc.instagram.getMedia.useQuery({
		folder: activeFolder,
		mediaType,
		search: searchQuery,
	});

	const uploadMutation = trpc.instagram.uploadMedia.useMutation({
		onSuccess: () => {
			toast.success("Media asset saved to library!");
			setUploadOpen(false);
			setName("");
			setFileUrl("");
			setTagsInput("");
			mediaQuery.refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to upload media.");
		},
	});

	const deleteMutation = trpc.instagram.deleteMedia.useMutation({
		onSuccess: () => {
			toast.success("Media asset deleted.");
			mediaQuery.refetch();
		},
	});

	const { items = [], folders = [] } = mediaQuery.data || {};

	const handleUploadSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!fileUrl.trim()) {
			toast.error("Please enter a valid file URL.");
			return;
		}

		uploadMutation.mutate({
			name: name.trim() || "Grocery Asset",
			fileUrl: fileUrl.trim(),
			mediaType: itemMediaType,
			format: itemMediaType === "IMAGE" ? "jpg" : "mp4",
			folder,
			tags: tagsInput
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
		});
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Top Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Media & Creative Assets Library
					</h1>
					<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
						Central repository of approved grocery product shots, reels, banners, and warehouse footage
					</p>
				</div>

				<Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
					<DialogTrigger asChild>
						<Button className="h-8 gap-1.5 text-xs rounded-lg bg-primary text-primary-foreground shadow-xs">
							<Upload className="h-3.5 w-3.5" />
							Upload Asset
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-base">Upload Media Asset</DialogTitle>
							<DialogDescription className="text-xs">
								Add high-resolution product photography or reels to your brand library.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
							<div className="space-y-1.5">
								<Label htmlFor="m-name" className="text-xs font-semibold">
									Asset Name
								</Label>
								<Input
									id="m-name"
									placeholder="e.g. Ghadi Detergent Slabs Banner"
									className="text-xs h-8"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="m-url" className="text-xs font-semibold">
									Image / Video URL
								</Label>
								<Input
									id="m-url"
									placeholder="https://images.unsplash.com/photo-..."
									className="text-xs h-8"
									value={fileUrl}
									onChange={(e) => setFileUrl(e.target.value)}
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold">Type</Label>
									<select
										className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs"
										value={itemMediaType}
										onChange={(e) => setItemMediaType(e.target.value as any)}
									>
										<option value="IMAGE">Image</option>
										<option value="VIDEO">Video / Reel</option>
									</select>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold">Folder Category</Label>
									<select
										className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-xs"
										value={folder}
										onChange={(e) => setFolder(e.target.value)}
									>
										<option value="FMCG Products">FMCG Products</option>
										<option value="Staples & Grains">Staples & Grains</option>
										<option value="Edible Oils">Edible Oils</option>
										<option value="Warehouse & Operations">Warehouse & Operations</option>
										<option value="Spices & Dryfruits">Spices & Dryfruits</option>
										<option value="General">General</option>
									</select>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="m-tags" className="text-xs font-semibold">
									Tags (Comma separated)
								</Label>
								<Input
									id="m-tags"
									placeholder="Bulk, FMCG, Ghadi, Slabs"
									className="text-xs h-8"
									value={tagsInput}
									onChange={(e) => setTagsInput(e.target.value)}
								/>
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setUploadOpen(false)}
									className="text-xs"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={uploadMutation.isPending}
									className="text-xs bg-primary text-primary-foreground"
								>
									{uploadMutation.isPending ? "Saving..." : "Save to Library"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Filter Tabs Bar */}
			<div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
				{/* Folders */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
					<button
						type="button"
						onClick={() => setActiveFolder("ALL")}
						className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
							activeFolder === "ALL"
								? "bg-primary text-primary-foreground shadow-xs"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						All Folders ({items.length})
					</button>
					{folders.map((f) => (
						<button
							key={f}
							type="button"
							onClick={() => setActiveFolder(f)}
							className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
								activeFolder === f
									? "bg-primary text-primary-foreground shadow-xs"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							{f}
						</button>
					))}
				</div>

				{/* Search & Type filter */}
				<div className="flex items-center gap-2">
					<div className="relative min-w-[200px]">
						<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
						<Input
							placeholder="Search assets by tag or name..."
							className="h-8 pl-8 text-xs rounded-lg"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<select
						className="h-8 rounded-lg border border-border/70 bg-card px-2.5 text-xs font-medium text-foreground"
						value={mediaType}
						onChange={(e) => setMediaType(e.target.value as any)}
					>
						<option value="ALL">All Media</option>
						<option value="IMAGE">Images Only</option>
						<option value="VIDEO">Videos Only</option>
					</select>
				</div>
			</div>

			{/* Assets Grid */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{items.map((item) => (
					<Card
						key={item.id}
						className="group overflow-hidden rounded-xl border-border/70 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
					>
						<div className="relative aspect-square w-full overflow-hidden bg-muted">
							<img
								src={item.fileUrl}
								alt={item.name}
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
							<div className="absolute top-2 left-2">
								<Badge className="bg-black/70 text-white backdrop-blur-md text-[9px] font-semibold border-none">
									{item.mediaType}
								</Badge>
							</div>

							<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									type="button"
									onClick={() => deleteMutation.mutate({ id: item.id })}
									className="h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-destructive transition-colors"
									title="Delete"
								>
									<Trash2 className="h-3 w-3" />
								</button>
							</div>
						</div>

						<CardContent className="p-2.5 space-y-1.5">
							<p className="line-clamp-1 font-semibold text-xs text-foreground" title={item.name}>
								{item.name}
							</p>
							<p className="text-[10px] text-muted-foreground flex items-center gap-1">
								<Folder className="h-2.5 w-2.5" />
								{item.folder}
							</p>

							{item.tags && item.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 pt-1">
									{item.tags.slice(0, 2).map((tag) => (
										<span
											key={tag}
											className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground"
										>
											#{tag}
										</span>
									))}
								</div>
							)}

							<div className="pt-2 border-t border-border/50">
								<Button
									variant="outline"
									size="sm"
									asChild
									className="w-full h-7 text-[10px] font-medium"
								>
									<Link href={`/marketing/create`}>Use in Post</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
