"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
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

export function DriverProfileModal({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const trpc = useTRPC();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");

	const { data: me, refetch: refetchMe } = trpc.staff.me.useQuery(undefined, {
		enabled: open,
	});

	useEffect(() => {
		if (me) {
			setName(me.name || "");
			setPhone(me.phone || "");
			setAddress(me.address || "");
		}
	}, [me]);

	const updateProfileMutation = trpc.staff.update.useMutation({
		onSuccess: () => {
			toast.success("Profile information updated successfully! Refreshing session...");
			onOpenChange(false);
			refetchMe();
			setTimeout(() => {
				window.location.reload();
			}, 800);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update profile.");
		},
	});

	const handleSaveProfile = () => {
		if (!me) return;
		updateProfileMutation.mutate({
			id: me.id,
			name,
			phone,
			address,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="font-bold text-lg">Update Profile Info</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground">
						Edit your personal logistics records here. Click save to commit changes.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-1.5">
						<Label htmlFor="driver-name" className="font-semibold text-xs text-gray-700 dark:text-gray-300">
							Full Name
						</Label>
						<Input
							id="driver-name"
							placeholder="Enter full name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="driver-phone" className="font-semibold text-xs text-gray-700 dark:text-gray-300">
							Contact Phone Number
						</Label>
						<Input
							id="driver-phone"
							placeholder="Enter contact phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="driver-address" className="font-semibold text-xs text-gray-700 dark:text-gray-300">
							Residential Address
						</Label>
						<Input
							id="driver-address"
							placeholder="Enter residence address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={updateProfileMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSaveProfile}
						disabled={updateProfileMutation.isPending}
						className="bg-blue-600 text-white hover:bg-blue-700"
					>
						{updateProfileMutation.isPending ? "Saving…" : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
