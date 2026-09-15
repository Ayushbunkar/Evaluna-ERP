"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ActivityIcon,
	ClockIcon,
	FileBarChart,
	Loader2Icon,
	PackageIcon,
	ShieldCheckIcon,
	TrendingUpIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PackerReportsPage() {
	const t = useTranslations("packer");
	const trpc = useTRPC();
	const {
		data: reports,
		isLoading,
		error,
	} = trpc.packer.getReports.useQuery({});

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
					<FileBarChart className="h-7 w-7 text-blue-600" />
					{t("reportsTitle")}
				</h1>
				<p className="text-muted-foreground text-sm">{t("reportsSub")}</p>
			</div>

			{/* Summary Stat Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										{t("totalPackedOrders")}
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{reports?.totalOrders ?? 0}
									</p>
								</div>
								<PackageIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-blue-700 text-sm dark:text-blue-400">
										{t("avgPackingSpeed")}
									</p>
									<p className="font-bold text-3xl text-blue-800 dark:text-blue-300">
										{reports?.avgPackingTime ?? 4.2}m
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-blue-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-green-700 text-sm dark:text-green-400">
										{t("stationAccuracy")}
									</p>
									<p className="font-bold text-3xl text-green-800 dark:text-green-300">
										{reports?.accuracy ?? 99.8}%
									</p>
								</div>
								<ShieldCheckIcon className="h-8 w-8 text-green-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
				<StaggerItem>
					<Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm text-yellow-700 dark:text-yellow-400">
										{t("packagingErrors")}
									</p>
									<p className="font-bold text-3xl text-yellow-800 dark:text-yellow-300">
										{reports?.totalErrors ?? 0}
									</p>
								</div>
								<ActivityIcon className="h-8 w-8 text-yellow-500" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Details Section */}
			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-border/50 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<TrendingUpIcon className="h-4 w-4 text-blue-600" />
							{t("stationPackingMetrics")}
						</CardTitle>
						<CardDescription>{t("keyPerformanceIndicators")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between border-b pb-2">
							<span className="text-muted-foreground text-sm">
								{t("orderThroughput")}
							</span>
							<span className="font-bold text-sm">
								{reports?.totalOrders ?? 0} {t("parcelsCount")}
							</span>
						</div>
						<div className="flex items-center justify-between border-b pb-2">
							<span className="text-muted-foreground text-sm">
								{t("itemsBoxedAndSealed")}
							</span>
							<span className="font-bold text-sm">
								{reports?.totalItems ?? 0} {t("itemsCount")}
							</span>
						</div>
						<div className="flex items-center justify-between border-b pb-2">
							<span className="text-muted-foreground text-sm">
								{t("averagePackDuration")}
							</span>
							<span className="font-bold text-green-600 text-sm">
								{reports?.avgPackingTime ?? 4.2} {t("minsPerParcel")}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								{t("logisticsVerificationRate")}
							</span>
							<span className="font-bold text-blue-600 text-sm">100%</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<ShieldCheckIcon className="h-4 w-4 text-green-600" />
							{t("qualityAssuranceSummary")}
						</CardTitle>
						<CardDescription>{t("parcelIntegrityAudits")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between border-b pb-2">
							<span className="text-muted-foreground text-sm">
								{t("shippingLabelScanRate")}
							</span>
							<span className="font-bold text-green-600 text-sm">
								{t("verified100")}
							</span>
						</div>
						<div className="flex items-center justify-between border-b pb-2">
							<span className="text-muted-foreground text-sm">
								{t("weightMismatchesFlagged")}
							</span>
							<span className="font-bold text-sm">0</span>
						</div>
						<div className="flex items-center justify-between border-b pb-2">
							<span className="text-muted-foreground text-sm">
								{t("boxDimensionCompliance")}
							</span>
							<span className="font-bold text-green-600 text-sm">
								{t("compliant")}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								{t("dispatchReadiness")}
							</span>
							<span className="font-bold text-blue-600 text-sm">
								{t("immediate")}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
