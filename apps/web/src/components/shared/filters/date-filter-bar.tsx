"use client";

import { Button } from "@evaluna/ui/components/button";
import { CalendarDaysIcon, CalendarIcon, XIcon } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useState } from "react";

export const getTodayStr = (): string => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getYesterdayStr = (): string => {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getDaysAgoStr = (days: number): string => {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getMonthStartStr = (): string => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export const formatDateDisplay = (dateStr: string): string => {
	if (!dateStr) return "";
	const parts = dateStr.split("-");
	if (parts.length === 3) {
		const [y, m, d] = parts;
		return `${d}/${m}/${y}`;
	}
	return dateStr;
};

export interface DateFilterBarProps {
	startDate: string;
	endDate: string;
	onDateChange: (startDate: string, endDate: string, preset: string) => void;
	datePreset?: string;
	totalCount?: number;
	countLabel?: string;
	className?: string;
	showPresetButtons?: boolean;
}

export function DateFilterBar({
	startDate,
	endDate,
	onDateChange,
	datePreset = "all",
	totalCount,
	countLabel,
	className = "",
	showPresetButtons = true,
}: DateFilterBarProps) {
	let currentLocale = "en";
	try {
		currentLocale = useLocale();
	} catch {
		currentLocale = "en";
	}
	const isHindi = currentLocale === "hi";

	const [internalPreset, setInternalPreset] = useState<string>(datePreset);
	const activePreset = datePreset || internalPreset;

	const handlePresetClick = (preset: string) => {
		setInternalPreset(preset);
		if (preset === "all") {
			onDateChange("", "", "all");
		} else if (preset === "today") {
			const today = getTodayStr();
			onDateChange(today, today, "today");
		} else if (preset === "yesterday") {
			const yest = getYesterdayStr();
			onDateChange(yest, yest, "yesterday");
		} else if (preset === "7days") {
			onDateChange(getDaysAgoStr(7), getTodayStr(), "7days");
		} else if (preset === "month") {
			onDateChange(getMonthStartStr(), getTodayStr(), "month");
		}
	};

	const handleCustomStartChange = (val: string) => {
		setInternalPreset("custom");
		onDateChange(val, endDate, "custom");
	};

	const handleCustomEndChange = (val: string) => {
		setInternalPreset("custom");
		onDateChange(startDate, val, "custom");
	};

	const handleClear = () => {
		setInternalPreset("all");
		onDateChange("", "", "all");
	};

	const isFiltered = Boolean(startDate || endDate || activePreset !== "all");

	const presets = [
		{ id: "all", label: isHindi ? "सभी" : "All" },
		{ id: "today", label: isHindi ? "आज (Today)" : "Today" },
		{ id: "yesterday", label: isHindi ? "कल (Yesterday)" : "Yesterday" },
		{ id: "7days", label: isHindi ? "7 दिन" : "Last 7 Days" },
		{ id: "month", label: isHindi ? "इस माह" : "This Month" },
	];

	return (
		<div className={`space-y-2 ${className}`}>
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 p-2.5 sm:px-3 sm:py-2 text-xs shadow-2xs">
				{/* Left: Quick Date Presets */}
				{showPresetButtons && (
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="flex items-center gap-1.5 font-semibold text-foreground/80 mr-1 text-xs">
							<CalendarDaysIcon className="h-4 w-4 text-primary shrink-0" />
							<span>{isHindi ? "तारीख फ़िल्टर:" : "Date:"}</span>
						</span>
						{presets.map((preset) => (
							<Button
								key={preset.id}
								type="button"
								variant={activePreset === preset.id ? "default" : "outline"}
								size="sm"
								className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
									activePreset === preset.id
										? "bg-primary text-primary-foreground shadow-xs font-semibold"
										: "bg-background hover:bg-accent text-muted-foreground hover:text-foreground border-border/70"
								}`}
								onClick={() => handlePresetClick(preset.id)}
							>
								{preset.label}
							</Button>
						))}
					</div>
				)}

				{/* Right: Date Picker Inputs (From Date & To Date) */}
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-2.5 py-1 shadow-2xs focus-within:ring-1 focus-within:ring-primary">
						<span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
							{isHindi ? "से (From):" : "From:"}
						</span>
						<input
							type="date"
							value={startDate}
							onChange={(e) => handleCustomStartChange(e.target.value)}
							className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
							title={isHindi ? "प्रारंभिक दिनांक चुनें" : "Select start date"}
						/>
					</div>

					<div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-2.5 py-1 shadow-2xs focus-within:ring-1 focus-within:ring-primary">
						<span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
							{isHindi ? "तक (To):" : "To:"}
						</span>
						<input
							type="date"
							value={endDate}
							onChange={(e) => handleCustomEndChange(e.target.value)}
							className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
							title={isHindi ? "अंतिम दिनांक चुनें" : "Select end date"}
						/>
					</div>

					{isFiltered && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
							onClick={handleClear}
							title={isHindi ? "दिनांक फ़िल्टर हटाएं" : "Clear date filter"}
						>
							<XIcon className="h-3.5 w-3.5 mr-1" />
							{isHindi ? "हटाएं" : "Clear"}
						</Button>
					)}
				</div>
			</div>

			{/* Active Filter Notification Badge */}
			{(startDate || endDate) && (
				<div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium animate-in fade-in-50 duration-200">
					<div className="flex items-center gap-1.5">
						<CalendarIcon className="h-3.5 w-3.5 shrink-0" />
						<span>
							{startDate && endDate && startDate === endDate ? (
								<>
									{isHindi ? "दिनांक " : "Showing records for "}
									<strong>{formatDateDisplay(startDate)}</strong>
									{isHindi ? " के रिकॉर्ड" : ""}
								</>
							) : startDate && endDate ? (
								<>
									{isHindi ? "दिनांक " : "Showing records from "}
									<strong>{formatDateDisplay(startDate)}</strong>
									{isHindi ? " से " : " to "}
									<strong>{formatDateDisplay(endDate)}</strong>
									{isHindi ? " तक के रिकॉर्ड" : ""}
								</>
							) : startDate ? (
								<>
									{isHindi ? "दिनांक " : "Showing records from "}
									<strong>{formatDateDisplay(startDate)}</strong>
									{isHindi ? " से आगे के रिकॉर्ड" : " onwards"}
								</>
							) : (
								<>
									{isHindi ? "दिनांक " : "Showing records up to "}
									<strong>{formatDateDisplay(endDate)}</strong>
									{isHindi ? " तक के रिकॉर्ड" : ""}
								</>
							)}
						</span>
					</div>

					<div className="flex items-center gap-2">
						{typeof totalCount === "number" && (
							<span className="bg-primary/20 px-2 py-0.5 rounded-full text-[11px] font-semibold">
								{totalCount} {countLabel ? countLabel : (isHindi ? "रिकॉर्ड" : "records")}
							</span>
						)}
						<button
							type="button"
							onClick={handleClear}
							className="hover:underline text-[11px] font-semibold text-primary/80 hover:text-primary cursor-pointer flex items-center gap-0.5 ml-1"
						>
							<XIcon className="h-3 w-3" />
							{isHindi ? "रीसेट" : "Reset"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
