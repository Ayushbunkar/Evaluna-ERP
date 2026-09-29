/**
 * Centralized Backend Attendance Status Engine
 *
 * Provides backend-authoritative calculation for employee attendance status,
 * working duration, late arrival, early departure, and shift compliance.
 * Can also be safely imported by frontend for consistent status representations.
 */

export type CanonicalAttendanceStatus =
	| "FULL_DAY"
	| "HALF_DAY"
	| "LATE"
	| "EARLY_DEPARTURE"
	| "ABSENT"
	| "LEAVE"
	| "HOLIDAY"
	| "WEEKLY_OFF"
	| "INCOMPLETE"
	| "PENDING_APPROVAL";

export interface ShiftRuleConfig {
	name?: string;
	startTime: string; // "HH:mm:ss" or "HH:mm" e.g. "09:30:00"
	endTime: string; // "HH:mm:ss" or "HH:mm" e.g. "18:30:00"
	graceTimeMinutes: number; // e.g. 15
	minFullDayMinutes: number; // e.g. 480 (8 hours)
	minHalfDayMinutes: number; // e.g. 240 (4 hours)
	lunchDurationMinutes?: number;
	teaBreakDurationMinutes?: number;
}

export const DEFAULT_SHIFT_RULE: ShiftRuleConfig = {
	name: "General Shift",
	startTime: "09:30:00",
	endTime: "18:30:00",
	graceTimeMinutes: 15,
	minFullDayMinutes: 480, // 8 hours
	minHalfDayMinutes: 240, // 4 hours
	lunchDurationMinutes: 45,
	teaBreakDurationMinutes: 15,
};

export const ADJUSTMENT_CATEGORIES = [
	{ value: "biometric_malfunction", label: "Biometric / Device Failure" },
	{ value: "network_outage", label: "Network / Server Outage" },
	{ value: "official_duty", label: "On Official Duty / Field Visit" },
	{ value: "manager_approval", label: "Manager Pre-Approved" },
	{ value: "forgot_punch", label: "Forgot Check-in / Check-out" },
	{ value: "system_recovery", label: "System Recovery / Data Fix" },
	{ value: "other", label: "Other (Requires explanation)" },
] as const;

export type AdjustmentCategory = (typeof ADJUSTMENT_CATEGORIES)[number]["value"];

export interface EvaluateAttendanceInput {
	date: string; // "YYYY-MM-DD"
	checkIn?: string | null; // "HH:mm:ss"
	checkOut?: string | null; // "HH:mm:ss"
	breakMinutes?: number;
	shift?: Partial<ShiftRuleConfig> | null;
	isLeave?: boolean;
	leaveType?: string | null;
	isHoliday?: boolean;
	holidayName?: string | null;
	isWeeklyOff?: boolean;
	isAdjusted?: boolean;
	isApproved?: boolean;
	todayDateStr?: string; // current date in YYYY-MM-DD
	currentTimeStr?: string; // current time in HH:mm:ss
}

export interface AttendanceEvaluationResult {
	status: CanonicalAttendanceStatus;
	statusLabel: string;
	dbStatus: string;
	isLate: boolean;
	lateMinutes: number;
	isEarlyDeparture: boolean;
	earlyDepartureMinutes: number;
	workingMinutes: number;
	workingHoursFormatted: string;
	isApproved: boolean;
	isAdjusted: boolean;
	notes: string[];
}

/** Convert "HH:mm:ss" or "HH:mm" to total minutes from midnight */
export function timeStringToMinutes(timeStr: string | null | undefined): number | null {
	if (!timeStr) return null;
	const parts = timeStr.trim().split(":");
	if (parts.length < 2) return null;
	const hours = Number.parseInt(parts[0], 10);
	const mins = Number.parseInt(parts[1], 10);
	if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
	return hours * 60 + mins;
}

/** Format minutes into human-readable e.g. "8h 30m" */
export function minutesToFormattedHours(minutes: number): string {
	if (minutes <= 0) return "0h 0m";
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h === 0) return `${m}m`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}m`;
}

/** Convert 24h time to 12h time with AM/PM */
export function formatTime12h(timeStr: string | null | undefined): string {
	if (!timeStr) return "--:--";
	const cleanTime = timeStr.trim();
	const parts = cleanTime.split(":");
	if (parts.length < 2) return cleanTime;
	let hours = Number.parseInt(parts[0], 10);
	const minutes = parts[1].padStart(2, "0");
	if (Number.isNaN(hours)) return cleanTime;
	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12;
	hours = hours ? hours : 12;
	return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

/**
 * Core status evaluator: pure, deterministic function for evaluating
 * attendance metrics on server & client.
 */
export function evaluateAttendance(
	input: EvaluateAttendanceInput,
): AttendanceEvaluationResult {
	const shift: ShiftRuleConfig = {
		...DEFAULT_SHIFT_RULE,
		...(input.shift || {}),
	};

	const today = input.todayDateStr || new Date().toISOString().split("T")[0];
	const isToday = input.date === today;
	const isPastDate = input.date < today;

	const notes: string[] = [];
	const breakMin = input.breakMinutes ?? 0;

	// 1. Leave check
	if (input.isLeave) {
		return {
			status: "LEAVE",
			statusLabel: input.leaveType ? `Leave (${input.leaveType})` : "On Leave",
			dbStatus: "leave",
			isLate: false,
			lateMinutes: 0,
			isEarlyDeparture: false,
			earlyDepartureMinutes: 0,
			workingMinutes: 0,
			workingHoursFormatted: "0h",
			isApproved: true,
			isAdjusted: Boolean(input.isAdjusted),
			notes: ["Approved leave applied"],
		};
	}

	// 2. Holiday check
	if (input.isHoliday && !input.checkIn) {
		return {
			status: "HOLIDAY",
			statusLabel: input.holidayName ? `Holiday (${input.holidayName})` : "Holiday",
			dbStatus: "holiday",
			isLate: false,
			lateMinutes: 0,
			isEarlyDeparture: false,
			earlyDepartureMinutes: 0,
			workingMinutes: 0,
			workingHoursFormatted: "0h",
			isApproved: true,
			isAdjusted: false,
			notes: ["Company holiday"],
		};
	}

	// 3. Weekly off check
	if (input.isWeeklyOff && !input.checkIn) {
		return {
			status: "WEEKLY_OFF",
			statusLabel: "Weekly Off",
			dbStatus: "week_off",
			isLate: false,
			lateMinutes: 0,
			isEarlyDeparture: false,
			earlyDepartureMinutes: 0,
			workingMinutes: 0,
			workingHoursFormatted: "0h",
			isApproved: true,
			isAdjusted: false,
			notes: ["Scheduled weekly off"],
		};
	}

	const shiftStartMin = timeStringToMinutes(shift.startTime) ?? 570; // 09:30
	const shiftEndMin = timeStringToMinutes(shift.endTime) ?? 1110; // 18:30
	const graceTime = shift.graceTimeMinutes ?? 15;
	const checkInMin = timeStringToMinutes(input.checkIn);
	const checkOutMin = timeStringToMinutes(input.checkOut);

	// 4. Missing Check-in
	if (checkInMin === null) {
		if (isPastDate) {
			return {
				status: "ABSENT",
				statusLabel: "Absent",
				dbStatus: "absent",
				isLate: false,
				lateMinutes: 0,
				isEarlyDeparture: false,
				earlyDepartureMinutes: 0,
				workingMinutes: 0,
				workingHoursFormatted: "0h",
				isApproved: true,
				isAdjusted: Boolean(input.isAdjusted),
				notes: ["No check-in recorded for past work date"],
			};
		}
		// If today and not checked in yet
		return {
			status: "ABSENT",
			statusLabel: "Not Checked In",
			dbStatus: "absent",
			isLate: false,
			lateMinutes: 0,
			isEarlyDeparture: false,
			earlyDepartureMinutes: 0,
			workingMinutes: 0,
			workingHoursFormatted: "0h",
			isApproved: true,
			isAdjusted: false,
			notes: ["Employee has not clocked in today"],
		};
	}

	// 5. Late Arrival computation
	// Late if checked in after (shift start + grace)
	const lateThreshold = shiftStartMin + graceTime;
	const isLate = checkInMin > lateThreshold;
	const lateMinutes = isLate ? checkInMin - shiftStartMin : 0;
	if (isLate) {
		notes.push(`Late arrival by ${lateMinutes}m (Grace: ${graceTime}m)`);
	}

	// 6. Check-in exists, but Check-out is missing
	if (checkOutMin === null) {
		// If date was in the past, or shift ended > 2 hours ago today -> INCOMPLETE
		const currentMin = input.currentTimeStr
			? (timeStringToMinutes(input.currentTimeStr) ?? 0)
			: new Date().getHours() * 60 + new Date().getMinutes();

		const hasShiftEnded = isPastDate || (isToday && currentMin > shiftEndMin + 120);

		if (hasShiftEnded) {
			return {
				status: "INCOMPLETE",
				statusLabel: "Incomplete (Missing Check-out)",
				dbStatus: isLate ? "late" : "present",
				isLate,
				lateMinutes,
				isEarlyDeparture: false,
				earlyDepartureMinutes: 0,
				workingMinutes: 0,
				workingHoursFormatted: "Missing Out",
				isApproved: input.isApproved !== false,
				isAdjusted: Boolean(input.isAdjusted),
				notes: [...notes, "Employee did not check out before shift ended"],
			};
		}

		// Currently active shift today
		const workingSoFar = Math.max(0, currentMin - checkInMin - breakMin);
		return {
			status: isLate ? "LATE" : "FULL_DAY",
			statusLabel: isLate ? "Late (Active)" : "Checked In (Active)",
			dbStatus: isLate ? "late" : "present",
			isLate,
			lateMinutes,
			isEarlyDeparture: false,
			earlyDepartureMinutes: 0,
			workingMinutes: workingSoFar,
			workingHoursFormatted: minutesToFormattedHours(workingSoFar),
			isApproved: input.isApproved !== false,
			isAdjusted: Boolean(input.isAdjusted),
			notes: [...notes, "Shift currently in progress"],
		};
	}

	// 7. Both Check-in and Check-out exist
	const rawDurationMin = Math.max(0, checkOutMin - checkInMin);
	const netWorkingMinutes = Math.max(0, rawDurationMin - breakMin);
	const workingHoursFormatted = minutesToFormattedHours(netWorkingMinutes);

	// Early departure check (left before shiftEnd - grace)
	const earlyThreshold = shiftEndMin - graceTime;
	const isEarlyDeparture = checkOutMin < earlyThreshold;
	const earlyDepartureMinutes = isEarlyDeparture ? shiftEndMin - checkOutMin : 0;
	if (isEarlyDeparture) {
		notes.push(`Early departure by ${earlyDepartureMinutes}m`);
	}

	// Determine Full Day vs Half Day vs Insufficient Hours
	let status: CanonicalAttendanceStatus = "FULL_DAY";
	let statusLabel = "Full Day";
	let dbStatus = "present";

	if (netWorkingMinutes >= shift.minFullDayMinutes) {
		if (isLate && isEarlyDeparture) {
			status = "LATE";
			statusLabel = "Full Day (Late & Early Exit)";
			dbStatus = "late";
		} else if (isLate) {
			status = "LATE";
			statusLabel = "Full Day (Late)";
			dbStatus = "late";
		} else if (isEarlyDeparture) {
			status = "EARLY_DEPARTURE";
			statusLabel = "Full Day (Early Exit)";
			dbStatus = "present";
		} else {
			status = "FULL_DAY";
			statusLabel = "Full Day";
			dbStatus = "present";
		}
	} else if (netWorkingMinutes >= shift.minHalfDayMinutes) {
		status = "HALF_DAY";
		statusLabel = "Half Day";
		dbStatus = "half_day";
		notes.push(
			`Half day: worked ${workingHoursFormatted} (Min Full Day: ${minutesToFormattedHours(shift.minFullDayMinutes)})`,
		);
	} else {
		// Under minimum half day hours
		status = "ABSENT";
		statusLabel = "Absent (Under Min Hours)";
		dbStatus = "absent";
		notes.push(
			`Insufficient working hours: ${workingHoursFormatted} (Min Half Day: ${minutesToFormattedHours(shift.minHalfDayMinutes)})`,
		);
	}

	if (input.isApproved === false) {
		status = "PENDING_APPROVAL";
		statusLabel = "Pending Review";
		dbStatus = "pending_approval";
	}

	return {
		status,
		statusLabel,
		dbStatus,
		isLate,
		lateMinutes,
		isEarlyDeparture,
		earlyDepartureMinutes,
		workingMinutes: netWorkingMinutes,
		workingHoursFormatted,
		isApproved: input.isApproved !== false,
		isAdjusted: Boolean(input.isAdjusted),
		notes,
	};
}
