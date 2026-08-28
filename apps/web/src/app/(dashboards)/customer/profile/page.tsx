"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ActivityIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CustomerProfilePage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: profile,
		isLoading,
		error,
	} = trpc.customer.getProfile.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading profile
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						My Profile
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View and edit your profile information
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Customer Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/customer">
							<UserIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
				</div>
			</div>

			{!profile ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No profile data found
				</div>
			) : (
				<div className="space-y-6">
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Personal Information
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Your basic details
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="pt-1">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<p className="font-medium text-muted-foreground text-xs">
										Full Name
									</p>
									<p className="font-semibold text-lg">{profile.name}</p>
								</div>
								<div className="space-y-2">
									<p className="font-medium text-muted-foreground text-xs">
										Email
									</p>
									<p className="font-semibold text-lg">{profile.email}</p>
								</div>
								<div className="space-y-2">
									<p className="font-medium text-muted-foreground text-xs">
										Phone
									</p>
									<p className="font-semibold text-lg">{profile.phone}</p>
								</div>
								<div className="space-y-2">
									<p className="font-medium text-muted-foreground text-xs">
										Date of Birth
									</p>
									<p className="font-semibold text-lg">{profile.dob}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">Address</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Your default shipping address
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="pt-1">
							<p className="text-sm">{profile.address_line1}</p>
							{profile.address_line2 && (
								<p className="text-sm">{profile.address_line2}</p>
							)}
							<p className="text-sm">
								{profile.city}, {profile.state} {profile.postal_code}
							</p>
							<p className="text-sm">{profile.country}</p>
							<Button
								variant="outline"
								size="xs"
								className="mt-2"
								onClick={() => alert("Edit address")}
							>
								<MapPinIcon className="mr-1 h-3 w-3" /> Edit
							</Button>
						</CardContent>
					</Card>

					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Account Settings
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Notifications, privacy, and security
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="pt-1">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<MailIcon className="h-4 w-4" />
										<div>
											<p className="font-medium text-muted-foreground text-xs">
												Email Notifications
											</p>
											<p className="text-sm">
												{profile.email_notifications ? "Enabled" : "Disabled"}
											</p>
										</div>
									</div>
									<Button
										variant="outline"
										size="xs"
										onClick={() => alert("Toggle email notifications")}
									>
										{profile.email_notifications ? "Disable" : "Enable"}
									</Button>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<ActivityIcon className="h-4 w-4" />
										<div>
											<p className="font-medium text-muted-foreground text-xs">
												SMS Alerts
											</p>
											<p className="text-sm">
												{profile.sms_alerts ? "Enabled" : "Disabled"}
											</p>
										</div>
									</div>
									<Button
										variant="outline"
										size="xs"
										onClick={() => alert("Toggle SMS alerts")}
									>
										{profile.sms_alerts ? "Disable" : "Enable"}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</PageTransition>
	);
}
