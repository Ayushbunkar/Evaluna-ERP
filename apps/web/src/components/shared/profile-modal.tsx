"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	CameraIcon,
	CheckCircle2Icon,
	Loader2Icon,
	MailIcon,
	PhoneIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UploadIcon,
	UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { compressAvatar } from "@/lib/image-compression";
import { useTRPC } from "@/lib/trpc/client";

interface ProfileModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [image, setImage] = useState("");
	const [isCompressingImage, setIsCompressingImage] = useState(false);

	const { data: profile, isLoading } = trpc.users.getMyProfile.useQuery(
		undefined,
		{
			enabled: open,
		},
	);

	useEffect(() => {
		if (profile) {
			setName(profile.name || "");
			setEmail(profile.email || "");
			setPhone(profile.phone || "");
			setImage(profile.image || "");
		}
	}, [profile]);

	const updateMutation = trpc.users.updateMyProfile.useMutation({
		onSuccess: () => {
			toast.success("Profile updated successfully!");
			utils.users.getMyProfile.invalidate();
			onOpenChange(false);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update profile.");
		},
	});

	const handleImageFileSelect = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			setIsCompressingImage(true);
			const compressedDataUrl = await compressAvatar(file);
			setImage(compressedDataUrl);
			toast.success("Profile photo compressed & ready to save!");
		} catch (err: unknown) {
			const msg =
				err instanceof Error
					? err.message
					: "Failed to process selected image.";
			toast.error(msg);
		} finally {
			setIsCompressingImage(false);
			e.target.value = "";
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Full Name is required.");
			return;
		}
		if (!email.trim()) {
			toast.error("Email address is required.");
			return;
		}

		updateMutation.mutate({
			name: name.trim(),
			email: email.trim(),
			phone: phone.trim() || undefined,
			image: image.trim() || null,
		});
	};

	const initials = name
		? name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.substring(0, 2)
		: "U";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-2xl border-slate-200 bg-white p-6 text-slate-900 shadow-2xl sm:max-w-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-bold text-xl tracking-tight">
						<UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						My User Profile
					</DialogTitle>
					<DialogDescription className="text-slate-500 text-xs dark:text-slate-400">
						View and update your account information, profile photo, and contact
						details.
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex flex-col items-center justify-center gap-2 py-12">
						<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
						<p className="font-medium text-slate-500 text-xs">
							Loading profile details...
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-5 py-2">
						{/* Avatar & Role Header */}
						<div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
							<div className="relative">
								{image ? (
									<img
										src={image}
										alt={name}
										className="h-16 w-16 rounded-full border-2 border-blue-500 object-cover shadow-md"
									/>
								) : (
									<div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-600 font-bold text-lg text-white shadow-md">
										{initials}
									</div>
								)}
								{isCompressingImage && (
									<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
										<Loader2Icon className="h-6 w-6 animate-spin text-white" />
									</div>
								)}
								<button
									type="button"
									onClick={() =>
										document.getElementById("profile-photo-upload")?.click()
									}
									className="absolute -right-1 -bottom-1 rounded-full bg-blue-600 p-1.5 text-white shadow transition-colors hover:bg-blue-700"
									title="Click to upload profile photo"
								>
									<CameraIcon className="h-3.5 w-3.5" />
								</button>
							</div>

							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<h3 className="font-bold text-base text-slate-900 leading-tight dark:text-slate-100">
										{profile?.name || "User Account"}
									</h3>
									<Badge
										variant="outline"
										className="border-blue-200 bg-blue-50 font-semibold text-[10px] text-blue-700 capitalize dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
									>
										{profile?.role || "Staff"}
									</Badge>
								</div>
								<p className="flex items-center gap-1 text-slate-500 text-xs dark:text-slate-400">
									<MailIcon className="h-3 w-3 text-slate-400" />
									{profile?.email}
								</p>
								<div className="mt-1 flex items-center gap-1.5 font-medium text-[11px] text-emerald-600 dark:text-emerald-400">
									<CheckCircle2Icon className="h-3 w-3" /> Active Account
								</div>
							</div>
						</div>

						{/* Device Photo Upload Trigger */}
						<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
							<Label className="mb-2 flex items-center gap-1.5 font-semibold text-xs">
								<UploadIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />{" "}
								Profile Photo (Upload from Device)
							</Label>

							<input
								id="profile-photo-upload"
								type="file"
								accept="image/*"
								onChange={handleImageFileSelect}
								className="hidden"
							/>

							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isCompressingImage}
									onClick={() =>
										document.getElementById("profile-photo-upload")?.click()
									}
									className="gap-1.5 border-blue-200 bg-white font-semibold text-blue-700 text-xs shadow-xs hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
								>
									{isCompressingImage ? (
										<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
									) : (
										<UploadIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
									)}
									{image
										? "Choose New Photo from Device"
										: "Upload Photo from Mobile / Laptop"}
								</Button>

								{image && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setImage("")}
										className="h-8 gap-1 font-medium text-rose-600 text-xs hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
									>
										<Trash2Icon className="h-3.5 w-3.5" /> Remove
									</Button>
								)}
							</div>
							<p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
								Supports PNG, JPG, JPEG, WEBP. Automatically auto-cropped &
								compressed for high resolution.
							</p>
						</div>

						{/* Form Inputs */}
						<div className="space-y-4">
							<div className="space-y-1.5">
								<Label
									htmlFor="name"
									className="flex items-center gap-1.5 font-semibold text-xs"
								>
									<UserIcon className="h-3.5 w-3.5 text-slate-400" /> Full Name
								</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Enter your full name"
									className="h-9 bg-slate-50/50 text-xs dark:bg-slate-800/40"
									required
								/>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="email"
									className="flex items-center gap-1.5 font-semibold text-xs"
								>
									<MailIcon className="h-3.5 w-3.5 text-slate-400" /> Email
									Address
								</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="user@evaluna.com"
									className="h-9 bg-slate-50/50 text-xs dark:bg-slate-800/40"
									required
								/>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="phone"
									className="flex items-center gap-1.5 font-semibold text-xs"
								>
									<PhoneIcon className="h-3.5 w-3.5 text-slate-400" /> Phone
									Number
								</Label>
								<Input
									id="phone"
									type="tel"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder="+91 98765 43210"
									className="h-9 bg-slate-50/50 text-xs dark:bg-slate-800/40"
								/>
							</div>
						</div>

						<DialogFooter className="flex items-center justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => onOpenChange(false)}
								disabled={updateMutation.isPending || isCompressingImage}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={updateMutation.isPending || isCompressingImage}
								className="gap-1.5 bg-blue-600 font-medium text-white hover:bg-blue-700"
							>
								{updateMutation.isPending ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									<ShieldCheckIcon className="h-4 w-4" />
								)}
								Save Profile Changes
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
