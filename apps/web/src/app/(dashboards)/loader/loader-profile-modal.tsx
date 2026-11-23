"use client";

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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export function LoaderProfileModal({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const trpc = useTRPC();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const { data: me, refetch: refetchMe } = trpc.staff.me.useQuery(undefined, {
		enabled: open,
	});

	useEffect(() => {
		if (me) {
			setName(me.name || "");
			setEmail(me.email || "");
			setPhone(me.phone || "");
			setAddress(me.address || "");
		}
	}, [me]);

	const updateProfileMutation = trpc.staff.updateMyProfile.useMutation({
		onSuccess: () => {
			toast.success("Profile updated successfully! Refreshing session...");
			onOpenChange(false);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			refetchMe();
			setTimeout(() => {
				window.location.reload();
			}, 800);
		},
		onError: (err: any) => {
			toast.error(err.message || "Failed to update profile.");
		},
	});

	const handleSaveProfile = () => {
		if (newPassword) {
			if (!currentPassword) {
				toast.error("Please enter your current password to set a new password.");
				return;
			}
			if (newPassword.length < 6) {
				toast.error("New password must be at least 6 characters.");
				return;
			}
			if (newPassword !== confirmPassword) {
				toast.error("New passwords do not match.");
				return;
			}
		}

		updateProfileMutation.mutate({
			name: name.trim() || undefined,
			email: email.trim() || undefined,
			phone: phone.trim() || undefined,
			address: address.trim() || undefined,
			currentPassword: currentPassword || undefined,
			newPassword: newPassword || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle className="font-bold text-lg">
						Update Loader Profile
					</DialogTitle>
					<DialogDescription className="text-muted-foreground text-xs">
						Change your name, email, phone number, address, or password.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-3 max-h-[65vh] overflow-y-auto pr-1">
					<div className="space-y-1.5">
						<Label className="font-semibold text-xs text-foreground">
							Full Name
						</Label>
						<Input
							placeholder="Full Name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="h-9 text-xs"
						/>
					</div>

					<div className="space-y-1.5">
						<Label className="font-semibold text-xs text-foreground">
							Email Address
						</Label>
						<Input
							type="email"
							placeholder="loader@evaluna.dev"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="h-9 text-xs"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs text-foreground">
								Phone Number
							</Label>
							<Input
								placeholder="Phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								className="h-9 text-xs"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs text-foreground">
								Residential Address
							</Label>
							<Input
								placeholder="Address"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								className="h-9 text-xs"
							/>
						</div>
					</div>

					<div className="border-t border-border pt-3 space-y-3">
						<p className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
							Change Password (Optional)
						</p>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs text-foreground">
								Current Password
							</Label>
							<Input
								type="password"
								placeholder="Enter current password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className="h-9 text-xs"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="font-semibold text-xs text-foreground">
									New Password
								</Label>
								<Input
									type="password"
									placeholder="New password (min 6 chars)"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									className="h-9 text-xs"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="font-semibold text-xs text-foreground">
									Confirm New Password
								</Label>
								<Input
									type="password"
									placeholder="Confirm new password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="h-9 text-xs"
								/>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={updateProfileMutation.isPending}
						className="text-xs"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSaveProfile}
						disabled={updateProfileMutation.isPending}
						className="bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
					>
						{updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
