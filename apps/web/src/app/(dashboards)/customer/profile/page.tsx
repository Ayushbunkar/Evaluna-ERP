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
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AwardIcon,
	CreditCardIcon,
	EditIcon,
	Loader2,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

const transliteDict: Record<string, string> = {
	customer: "कस्टमर",
	ayush: "आयुष",
	bunkar: "बुनकर",
	mig: "एमआईजी",
	sanjeev: "संजीव",
	nagar: "नगर",
	road: "मार्ग",
	colony: "कॉलोनी",
	house: "मकान",
	ward: "वार्ड",
	gali: "गली",
	sector: "सेक्टर",
	apartment: "अपार्टमेंट",
	phase: "फेज",
	block: "ब्लॉक",
	bhopal: "भोपाल",
	indore: "इंदौर",
	delhi: "दिल्ली",
	mumbai: "मुंबई",
	india: "भारत",
};

function translateText(
	text: string | null | undefined,
	locale: string,
): string {
	if (!text) return "";
	if (locale !== "hi") return text;

	// Split into words, preserving spaces and punctuation
	const parts = text.split(/(\s+|,|\/|-)/);
	const translatedParts = parts.map((part) => {
		const lowerPart = part.toLowerCase();
		if (transliteDict[lowerPart] !== undefined) {
			return transliteDict[lowerPart];
		}
		return part;
	});

	return translatedParts.join("");
}

export default function CustomerProfilePage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const utils = trpc.useUtils();

	const {
		data: profile,
		isLoading,
		error,
	} = trpc.customer.getMyProfile.useQuery();

	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");

	useEffect(() => {
		if (profile) {
			setName(profile.name || "");
			setPhone(profile.phone || "");
			setAddress(profile.address || "");
		}
	}, [profile]);

	const t = {
		title: locale === "hi" ? "ग्राहक प्रोफ़ाइल" : "Customer Profile",
		subtitle:
			locale === "hi"
				? "आपकी पंजीकृत ग्राहक खाता जानकारी और स्टोर क्रेडिट स्थिति।"
				: "Your registered customer account information and store credit status.",
		backToDashboard:
			locale === "hi" ? "डैशबोर्ड पर वापस जाएं" : "Back to Dashboard",
		accountInfoTitle: locale === "hi" ? "खाता जानकारी" : "Account Information",
		accountInfoDesc:
			locale === "hi"
				? "आपके खाते से जुड़े व्यक्तिगत और संपर्क विवरण।"
				: "Personal and contact details linked to your account.",
		editProfileBtn: locale === "hi" ? "प्रोफ़ाइल संपादित करें" : "Edit Profile",
		fullName: locale === "hi" ? "पूरा नाम" : "Full Name",
		customerCode: locale === "hi" ? "ग्राहक कोड" : "Customer Code",
		email: locale === "hi" ? "ईमेल" : "Email",
		phone: locale === "hi" ? "फ़ोन" : "Phone",
		address: locale === "hi" ? "पता" : "Address",
		saveChanges: locale === "hi" ? "परिवर्तनों को सहेजें" : "Save Changes",
		cancel: locale === "hi" ? "रद्द करें" : "Cancel",
		rewardsTitle:
			locale === "hi" ? "पुरस्कार और स्टोर क्रेडिट" : "Rewards & Store Credit",
		rewardsDesc:
			locale === "hi"
				? "सक्रिय स्तर की स्थिति और स्टोर क्रेडिट शेष।"
				: "Active tier status and store credit balance.",
		loyaltyTier: locale === "hi" ? "लॉयल्टी टियर" : "Loyalty Tier",
		points:
			locale === "hi"
				? (pCount: number) => `अंक: ${pCount}`
				: (pCount: number) => `Points: ${pCount}`,
		storeCredit: locale === "hi" ? "स्टोर क्रेडिट" : "Store Credit",
		activeWalletCredit:
			locale === "hi" ? "सक्रिय वॉलेट क्रेडिट" : "Active wallet credit",
		accountScopingTitle:
			locale === "hi" ? "खाता दायरा और भूमिकाएं" : "Account Scoping & Roles",
		accountScopingDesc:
			locale === "hi"
				? "खाता स्थिति: सक्रिय ग्राहक। स्व-सेवा प्रोफ़ाइल अपडेट तुरंत संसाधित किए जाते हैं। संवेदनशील प्रशासनिक स्थिति अनुरोधों के लिए, कृपया सहायता से संपर्क करें।"
				: "Account status: Active Customer. Self-service profile updates are processed instantly. For sensitive administrative status requests, please contact support.",
		notProvided: locale === "hi" ? "प्रदान नहीं किया गया" : "Not provided",
		noAddress:
			locale === "hi" ? "फाइल पर कोई पता नहीं है।" : "No address on file.",
		loadingProfile:
			locale === "hi"
				? "ग्राहक प्रोफ़ाइल लोड हो रही है..."
				: "Loading customer profile...",
	};

	const updateProfileMutation = trpc.customer.updateMyProfile.useMutation({
		onSuccess: () => {
			setIsEditing(false);
			toast.success(
				locale === "hi"
					? "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!"
					: "Profile updated successfully!",
			);
			utils.customer.getMyProfile.invalidate();
		},
		onError: (err) => {
			toast.error(
				err.message ||
					(locale === "hi"
						? "प्रोफ़ाइल अपडेट करने में विफल।"
						: "Failed to update profile."),
			);
		},
	});

	const handleSave = () => {
		if (!name.trim()) {
			toast.error(locale === "hi" ? "नाम आवश्यक है" : "Name is required");
			return;
		}
		if (name.trim().length < 2) {
			toast.error(
				locale === "hi"
					? "नाम कम से कम 2 वर्णों का होना चाहिए"
					: "Name must be at least 2 characters",
			);
			return;
		}
		if (phone && phone.trim().length < 10) {
			toast.error(
				locale === "hi"
					? "फ़ोन नंबर कम से कम 10 वर्णों का होना चाहिए"
					: "Phone number must be at least 10 characters",
			);
			return;
		}
		if (address && address.trim().length < 5) {
			toast.error(
				locale === "hi"
					? "पता कम से कम 5 वर्णों का होना चाहिए"
					: "Address must be at least 5 characters",
			);
			return;
		}

		updateProfileMutation.mutate({
			name: name.trim(),
			phone: phone ? phone.trim() : null,
			address: address ? address.trim() : null,
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
				{t.loadingProfile}
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="flex h-[300px] items-center justify-center text-destructive text-sm">
				{error?.message ?? "Profile not found."}
			</div>
		);
	}

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div>
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						{t.title}
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t.subtitle}
					</p>
				</div>
				<Button asChild variant="outline" className="text-xs">
					<Link href="/customer">
						<UserIcon className="mr-1.5 h-4 w-4" /> {t.backToDashboard}
					</Link>
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Account Information */}
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<div>
							<CardTitle className="text-base">{t.accountInfoTitle}</CardTitle>
							<CardDescription className="text-xs">
								{t.accountInfoDesc}
							</CardDescription>
						</div>
						{!isEditing && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditing(true)}
								className="h-8 gap-1.5 text-xs"
							>
								<EditIcon className="h-3.5 w-3.5" /> {t.editProfileBtn}
							</Button>
						)}
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{isEditing ? (
							<div className="space-y-4 pt-2">
								<div className="space-y-2">
									<label
										htmlFor="name"
										className="font-semibold text-muted-foreground text-xs"
									>
										{t.fullName}
									</label>
									<Input
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder={t.fullName}
										className="h-9 text-xs"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<label className="font-semibold text-muted-foreground text-xs">
											{t.customerCode}
										</label>
										<Input
											value={profile.customer_code}
											disabled
											className="h-9 bg-muted/30 font-mono text-xs"
										/>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="phone"
											className="font-semibold text-muted-foreground text-xs"
										>
											{t.phone}
										</label>
										<Input
											id="phone"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											placeholder={t.phone}
											className="h-9 text-xs"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<label className="font-semibold text-muted-foreground text-xs">
										{t.email}
									</label>
									<Input
										value={profile.email}
										disabled
										className="h-9 bg-muted/30 text-xs"
									/>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="address"
										className="font-semibold text-muted-foreground text-xs"
									>
										{t.address}
									</label>
									<Textarea
										id="address"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										placeholder={t.address}
										rows={3}
										className="resize-none text-xs"
									/>
								</div>

								<div className="flex items-center gap-2 border-border/40 border-t pt-4">
									<Button
										size="sm"
										onClick={handleSave}
										disabled={updateProfileMutation.isPending}
										className="h-8 gap-1.5 text-xs"
									>
										{updateProfileMutation.isPending ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : null}
										{t.saveChanges}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setIsEditing(false);
											setName(profile.name || "");
											setPhone(profile.phone || "");
											setAddress(profile.address || "");
										}}
										disabled={updateProfileMutation.isPending}
										className="h-8 text-xs"
									>
										{t.cancel}
									</Button>
								</div>
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="font-semibold text-muted-foreground text-xs">
											{t.fullName}
										</p>
										<p className="mt-0.5 font-semibold text-foreground">
											{translateText(profile.name, locale)}
										</p>
									</div>
									<div>
										<p className="font-semibold text-muted-foreground text-xs">
											{t.customerCode}
										</p>
										<p className="mt-0.5 font-mono font-semibold text-foreground text-xs">
											{profile.customer_code}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 border-border/40 border-t pt-3">
									<div className="flex items-center gap-2">
										<MailIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
										<div>
											<p className="font-semibold text-[11px] text-muted-foreground">
												{t.email}
											</p>
											<p className="mt-0.5 font-medium text-foreground text-xs">
												{profile.email}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<PhoneIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
										<div>
											<p className="font-semibold text-[11px] text-muted-foreground">
												{t.phone}
											</p>
											<p className="mt-0.5 font-medium text-foreground text-xs">
												{profile.phone || t.notProvided}
											</p>
										</div>
									</div>
								</div>

								<div className="border-border/40 border-t pt-3">
									<div className="flex items-start gap-2">
										<MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
										<div>
											<p className="font-semibold text-[11px] text-muted-foreground">
												{t.address}
											</p>
											<p className="mt-0.5 font-medium text-foreground text-xs leading-relaxed">
												{profile.address
													? translateText(profile.address, locale)
													: t.noAddress}
											</p>
										</div>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Loyalty & Store Credit */}
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="text-base">{t.rewardsTitle}</CardTitle>
						<CardDescription className="text-xs">
							{t.rewardsDesc}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div className="grid grid-cols-2 gap-4">
							<div className="rounded-lg border border-border/40 bg-muted/20 p-3">
								<div className="flex items-center gap-2">
									<AwardIcon className="h-4 w-4 text-amber-500" />
									<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										{t.loyaltyTier}
									</span>
								</div>
								<p className="mt-1 font-bold text-amber-600 text-lg capitalize">
									{profile.loyalty_tier || "Bronze"}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{t.points(profile.loyalty_points || 0)}
								</p>
							</div>

							<div className="rounded-lg border border-border/40 bg-muted/20 p-3">
								<div className="flex items-center gap-2">
									<CreditCardIcon className="h-4 w-4 text-emerald-500" />
									<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										{t.storeCredit}
									</span>
								</div>
								<p className="mt-1 font-bold text-emerald-600 text-lg">
									{formatCurrency(profile.store_credit || 0, locale)}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{t.activeWalletCredit}
								</p>
							</div>
						</div>

						<div className="rounded-lg bg-muted/30 p-3 text-muted-foreground text-xs">
							<p className="font-medium text-foreground">
								{t.accountScopingTitle}
							</p>
							<p className="mt-1 text-[11px] leading-relaxed">
								{t.accountScopingDesc}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
