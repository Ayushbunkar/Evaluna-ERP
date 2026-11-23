"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	ArrowLeft,
	BadgeCheck,
	CheckCircle2,
	Clock,
	FileText,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Save,
	Shield,
	Truck,
	User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverProfilePage() {
	const trpc = useTRPC();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");

	const {
		data: me,
		isLoading,
		refetch: refetchMe,
	} = trpc.staff.me.useQuery(undefined);

	const { data: vehicleData } = trpc.vanStock.getMyVehicle.useQuery(undefined);

	useEffect(() => {
		if (me) {
			setName(me.name || "");
			setPhone(me.phone || "");
			setAddress(me.address || "");
		}
	}, [me]);

	const updateProfileMutation = trpc.staff.update.useMutation({
		onSuccess: () => {
			toast.success("Profile information updated successfully!");
			refetchMe();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update profile.");
		},
	});

	const handleSaveProfile = (e: React.FormEvent) => {
		e.preventDefault();
		if (!me) return;
		updateProfileMutation.mutate({
			id: me.id,
			name: name.trim(),
			phone: phone.trim(),
			address: address.trim(),
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
				<p className="text-muted-foreground text-sm">Loading driver profile...</p>
			</div>
		);
	}

	return (
		<PageTransition className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
			{/* Breadcrumb / Top Bar */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" asChild className="h-8 gap-1">
						<Link href="/driver">
							<ArrowLeft className="h-4 w-4" />
							Back to Dashboard
						</Link>
					</Button>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
						Driver Profile & Shift Settings
					</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Left Column: ID Card & Status */}
				<div className="md:col-span-1 space-y-6">
					<Card className="border border-slate-200 dark:border-slate-800 shadow-sm text-center">
						<CardContent className="pt-6 pb-6 flex flex-col items-center">
							<div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center font-bold text-2xl shadow-inner mb-3">
								{(name || me?.name || "D").charAt(0).toUpperCase()}
							</div>
							<h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
								{name || me?.name || "Delivery Driver"}
							</h2>
							<p className="text-xs font-mono text-muted-foreground mt-0.5">
								{me?.staff_code || "STAFF-DRIVER"}
							</p>

							<div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400">
								<BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
								Active On Duty
							</div>

							<div className="w-full border-t border-slate-100 dark:border-slate-800 mt-5 pt-4 text-left space-y-2.5 text-xs">
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="flex items-center gap-1.5">
										<Shield className="h-3.5 w-3.5 text-slate-400" /> Role:
									</span>
									<span className="font-semibold text-gray-900 dark:text-gray-100 uppercase">
										{me?.role || "Driver"}
									</span>
								</div>
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="flex items-center gap-1.5">
										<Truck className="h-3.5 w-3.5 text-slate-400" /> Department:
									</span>
									<span className="font-semibold text-gray-900 dark:text-gray-100">
										{me?.department || "Logistics"}
									</span>
								</div>
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="flex items-center gap-1.5">
										<Mail className="h-3.5 w-3.5 text-slate-400" /> Email:
									</span>
									<span className="font-mono text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
										{me?.email || "driver@evaluna.com"}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Assigned Vehicle Summary */}
					<Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<Truck className="h-4 w-4 text-blue-600" />
								Assigned Delivery Van
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-xs">
							{vehicleData?.vehicle ? (
								<>
									<div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
										<span className="text-muted-foreground">Vehicle Number:</span>
										<span className="font-bold text-gray-900 dark:text-gray-100">
											{vehicleData.vehicle.registration_number || vehicleData.vehicle.plate_number || "Active Van"}
										</span>
									</div>
									<div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
										<span className="text-muted-foreground">Vehicle Model:</span>
										<span className="font-medium">
											{vehicleData.vehicle.model || vehicleData.vehicle.make || "Tata Ace / Delivery Van"}
										</span>
									</div>
									<div className="flex justify-between py-1">
										<span className="text-muted-foreground">Status:</span>
										<span className="text-emerald-600 font-semibold">Active & Assigned</span>
									</div>
								</>
							) : (
								<p className="text-muted-foreground py-2 text-center">
									No dedicated vehicle assigned for this shift yet.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Edit Profile Form */}
				<div className="md:col-span-2">
					<Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
						<CardHeader>
							<CardTitle className="text-base font-bold flex items-center gap-2">
								<User className="h-4 w-4 text-blue-600" />
								Personal & Contact Information
							</CardTitle>
							<CardDescription className="text-xs">
								Keep your phone number and address updated so dispatch and warehouse teams can reach you.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSaveProfile} className="space-y-4">
								<div className="space-y-1.5">
									<Label htmlFor="prof-name" className="text-xs font-semibold">
										Full Name
									</Label>
									<Input
										id="prof-name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="e.g. Narendra Vishwakarma / Naitik Sahu"
										required
										className="text-sm"
									/>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label htmlFor="prof-phone" className="text-xs font-semibold">
											Contact Phone Number
										</Label>
										<div className="relative">
											<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												id="prof-phone"
												value={phone}
												onChange={(e) => setPhone(e.target.value)}
												placeholder="+91 98765 43210"
												className="pl-9 text-sm"
											/>
										</div>
									</div>

									<div className="space-y-1.5">
										<Label htmlFor="prof-email" className="text-xs font-semibold">
											Account Email (Read-Only)
										</Label>
										<div className="relative">
											<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												id="prof-email"
												value={me?.email || ""}
												disabled
												className="pl-9 text-sm bg-muted/40 cursor-not-allowed"
											/>
										</div>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="prof-address" className="text-xs font-semibold">
										Residential / Depot Address
									</Label>
									<div className="relative">
										<MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<textarea
											id="prof-address"
											value={address}
											onChange={(e) => setAddress(e.target.value)}
											rows={3}
											placeholder="Enter your current address or delivery hub area"
											className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
										/>
									</div>
								</div>

								<div className="pt-2 flex justify-end">
									<Button
										type="submit"
										disabled={updateProfileMutation.isPending}
										className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
									>
										{updateProfileMutation.isPending ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
												Saving Changes...
											</>
										) : (
											<>
												<Save className="h-3.5 w-3.5" />
												Save Driver Profile
											</>
										)}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
