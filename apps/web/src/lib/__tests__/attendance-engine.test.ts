import { describe, expect, it } from "bun:test";
import {
	DEFAULT_SHIFT_RULE,
	evaluateAttendance,
	formatTime12h,
	minutesToFormattedHours,
	timeStringToMinutes,
} from "../attendance-engine";

describe("Attendance Status Engine — Unit Tests", () => {
	it("converts time strings to minutes correctly", () => {
		expect(timeStringToMinutes("00:00:00")).toBe(0);
		expect(timeStringToMinutes("09:30:00")).toBe(570);
		expect(timeStringToMinutes("18:30:00")).toBe(1110);
		expect(timeStringToMinutes("23:59")).toBe(1439);
		expect(timeStringToMinutes(null)).toBeNull();
		expect(timeStringToMinutes("")).toBeNull();
	});

	it("formats minutes to hours and minutes string", () => {
		expect(minutesToFormattedHours(0)).toBe("0h 0m");
		expect(minutesToFormattedHours(45)).toBe("45m");
		expect(minutesToFormattedHours(60)).toBe("1h");
		expect(minutesToFormattedHours(510)).toBe("8h 30m");
	});

	it("formats 24h time to 12h time with AM/PM", () => {
		expect(formatTime12h("09:30:00")).toBe("09:30 AM");
		expect(formatTime12h("18:30:00")).toBe("06:30 PM");
		expect(formatTime12h("12:00:00")).toBe("12:00 PM");
		expect(formatTime12h("00:15:00")).toBe("12:15 AM");
		expect(formatTime12h(null)).toBe("--:--");
	});

	it("calculates normal FULL_DAY when arrival is on time and hours >= 8h", () => {
		const result = evaluateAttendance({
			date: "2026-09-30",
			checkIn: "09:25:00",
			checkOut: "18:30:00",
			breakMinutes: 45, // 9h 5m elapsed - 45m = 8h 20m (500m)
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.status).toBe("FULL_DAY");
		expect(result.statusLabel).toBe("Full Day");
		expect(result.isLate).toBe(false);
		expect(result.lateMinutes).toBe(0);
		expect(result.isEarlyDeparture).toBe(false);
		expect(result.workingMinutes).toBe(500);
		expect(result.workingHoursFormatted).toBe("8h 20m");
	});

	it("calculates LATE arrival when check-in is past shift start + grace period", () => {
		// Shift start: 09:30, grace: 15m => late threshold is 09:45
		const result = evaluateAttendance({
			date: "2026-09-30",
			checkIn: "10:00:00", // 30m past shift start
			checkOut: "19:00:00",
			breakMinutes: 45,
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.status).toBe("LATE");
		expect(result.isLate).toBe(true);
		expect(result.lateMinutes).toBe(30);
		expect(result.statusLabel).toContain("Late");
	});

	it("does NOT mark late if check-in is within grace period", () => {
		// Shift start: 09:30, grace: 15m => 09:40 is within grace
		const result = evaluateAttendance({
			date: "2026-09-30",
			checkIn: "09:40:00",
			checkOut: "18:40:00",
			breakMinutes: 45,
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.isLate).toBe(false);
		expect(result.lateMinutes).toBe(0);
		expect(result.status).toBe("FULL_DAY");
	});

	it("calculates EARLY_DEPARTURE when checkout is before shift end - grace period", () => {
		// Shift end: 18:30, grace: 15m => early threshold is 18:15
		const result = evaluateAttendance({
			date: "2026-09-30",
			checkIn: "08:30:00",
			checkOut: "17:30:00", // 1h before shift end (leaves at 17:30)
			breakMinutes: 30, // 9h elapsed - 30m = 8h 30m (> 8h)
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.status).toBe("EARLY_DEPARTURE");
		expect(result.isEarlyDeparture).toBe(true);
		expect(result.earlyDepartureMinutes).toBe(60);
		expect(result.statusLabel).toContain("Early Exit");
	});

	it("calculates HALF_DAY when working hours are between 4h and 8h", () => {
		const result = evaluateAttendance({
			date: "2026-09-30",
			checkIn: "09:30:00",
			checkOut: "14:30:00",
			breakMinutes: 30, // 5h - 30m = 4h 30m (270m)
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.status).toBe("HALF_DAY");
		expect(result.statusLabel).toBe("Half Day");
		expect(result.workingMinutes).toBe(270);
		expect(result.workingHoursFormatted).toBe("4h 30m");
	});

	it("calculates ABSENT when working hours are under 4h", () => {
		const result = evaluateAttendance({
			date: "2026-09-30",
			checkIn: "09:30:00",
			checkOut: "11:30:00",
			breakMinutes: 0, // 2h (< 4h)
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.status).toBe("ABSENT");
		expect(result.statusLabel).toContain("Under Min Hours");
	});

	it("calculates LEAVE when employee has approved leave", () => {
		const result = evaluateAttendance({
			date: "2026-09-30",
			isLeave: true,
			leaveType: "Sick Leave",
		});

		expect(result.status).toBe("LEAVE");
		expect(result.statusLabel).toContain("Sick Leave");
	});

	it("calculates HOLIDAY when company holiday and no punch", () => {
		const result = evaluateAttendance({
			date: "2026-10-02",
			isHoliday: true,
			holidayName: "Gandhi Jayanti",
		});

		expect(result.status).toBe("HOLIDAY");
		expect(result.statusLabel).toContain("Gandhi Jayanti");
	});

	it("calculates WEEKLY_OFF when configured weekly off", () => {
		const result = evaluateAttendance({
			date: "2026-10-04",
			isWeeklyOff: true,
		});

		expect(result.status).toBe("WEEKLY_OFF");
		expect(result.statusLabel).toBe("Weekly Off");
	});

	it("calculates INCOMPLETE when check-in exists but check-out is missing for past date", () => {
		const result = evaluateAttendance({
			date: "2026-09-28", // past date
			todayDateStr: "2026-09-30",
			checkIn: "09:30:00",
			checkOut: null,
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.status).toBe("INCOMPLETE");
		expect(result.statusLabel).toContain("Missing Check-out");
	});

	it("identifies manual adjustment flags correctly", () => {
		const result = evaluateAttendance({
			date: "2026-09-30",
			checkIn: "09:30:00",
			checkOut: "18:30:00",
			isAdjusted: true,
			shift: DEFAULT_SHIFT_RULE,
		});

		expect(result.status).toBe("FULL_DAY");
		expect(result.isAdjusted).toBe(true);
	});
});
