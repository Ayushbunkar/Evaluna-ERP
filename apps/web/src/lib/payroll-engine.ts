/**
 * Evaluna ERP — Centralized Payroll Calculation Engine
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Drives authoritative payroll calculations from real Attendance,
 * Leave Applications, Overtime, and Pay Structures.
 */

export interface AttendanceSummary {
	workingDays: number;
	presentDays: number;
	halfDays: number;
	paidLeaveDays: number;
	unpaidLeaveDays: number;
	absentDays: number;
	overtimeHours: number;
}

export interface PayrollCalculationResult {
	payType: "monthly" | "daily" | "hourly";
	baseSalary: number;
	workingDays: number;
	presentDays: number;
	halfDays: number;
	paidLeaveDays: number;
	unpaidLeaveDays: number;
	absentDays: number;
	overtimeHours: number;
	dailyRate: number;
	hourlyRate: number;
	earnedBaseWage: number;
	overtimePay: number;
	bonus: number;
	deductions: number;
	advanceDeduction: number;
	systemCalculatedAmount: number;
	adjustmentAmount: number;
	finalAmount: number;
}

/**
 * Calculates days in a given YYYY-MM string
 */
export function getDaysInMonth(monthStr: string): number {
	const [year, month] = monthStr.split("-").map(Number);
	if (!year || !month) return 30;
	return new Date(year, month, 0).getDate();
}

/**
 * Summarizes attendance, leave, and overtime records for an employee in a given month.
 */
export function summarizeWorkRecords(params: {
	month: string;
	attendanceRecords: Array<{
		date: string;
		status: string | null;
		workingHours?: string | number | null;
		overtimeMinutes?: number | null;
	}>;
	leaveRecords: Array<{
		startDate: string;
		endDate: string;
		isPaid: boolean;
		status?: string | null;
	}>;
	overtimeRecords: Array<{
		date: string;
		hours: string | number;
		status?: string | null;
	}>;
	totalDaysInMonth?: number;
}): AttendanceSummary {
	const { month, attendanceRecords, leaveRecords, overtimeRecords } = params;
	const workingDays = params.totalDaysInMonth || getDaysInMonth(month);

	let presentDays = 0;
	let halfDays = 0;
	let absentDays = 0;
	let overtimeMinutesTotal = 0;

	for (const att of attendanceRecords) {
		const st = (att.status || "").toLowerCase();
		if (st === "present" || st === "late") {
			presentDays += 1;
		} else if (st === "half_day") {
			halfDays += 1;
		} else if (st === "absent" || st === "rejected") {
			absentDays += 1;
		}
		if (att.overtimeMinutes) {
			overtimeMinutesTotal += Number(att.overtimeMinutes) || 0;
		}
	}

	// Calculate leave days from approved leave records
	let paidLeaveDays = 0;
	let unpaidLeaveDays = 0;

	for (const leave of leaveRecords) {
		const start = new Date(leave.startDate);
		const end = new Date(leave.endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

		if (leave.isPaid) {
			paidLeaveDays += diffDays;
		} else {
			unpaidLeaveDays += diffDays;
		}
	}

	// Additional approved overtime from overtime table
	let approvedOtHoursFromTable = 0;
	for (const ot of overtimeRecords) {
		if (ot.status === "approved" || ot.status === "paid") {
			approvedOtHoursFromTable += Number(ot.hours) || 0;
		}
	}

	const totalOvertimeHours =
		Math.round((overtimeMinutesTotal / 60 + approvedOtHoursFromTable) * 100) /
		100;

	return {
		workingDays,
		presentDays,
		halfDays,
		paidLeaveDays,
		unpaidLeaveDays,
		absentDays,
		overtimeHours: totalOvertimeHours,
	};
}

/**
 * Calculates payroll values given wage structure, attendance summary, and any adjustments.
 */
export function calculatePayroll(params: {
	baseSalary: number;
	payType?: "monthly" | "daily" | "hourly";
	summary: AttendanceSummary;
	bonus?: number;
	deductions?: number;
	advanceDeduction?: number;
	adjustmentAmount?: number;
}): PayrollCalculationResult {
	const {
		baseSalary,
		payType = "monthly",
		summary,
		bonus = 0,
		deductions = 0,
		advanceDeduction = 0,
		adjustmentAmount = 0,
	} = params;

	const workingDays = summary.workingDays || 30;
	let dailyRate = 0;
	let hourlyRate = 0;

	if (payType === "daily") {
		dailyRate = baseSalary;
		hourlyRate = Math.round((dailyRate / 8) * 100) / 100;
	} else if (payType === "hourly") {
		hourlyRate = baseSalary;
		dailyRate = hourlyRate * 8;
	} else {
		// monthly
		dailyRate = Math.round((baseSalary / workingDays) * 100) / 100;
		hourlyRate = Math.round((dailyRate / 8) * 100) / 100;
	}

	const effectiveDaysWorked =
		summary.presentDays + summary.halfDays * 0.5 + summary.paidLeaveDays;

	let earnedBaseWage = 0;
	if (payType === "daily") {
		earnedBaseWage = Math.round(baseSalary * effectiveDaysWorked);
	} else if (payType === "hourly") {
		earnedBaseWage = Math.round(hourlyRate * effectiveDaysWorked * 8);
	} else {
		// monthly
		if (effectiveDaysWorked >= workingDays) {
			earnedBaseWage = baseSalary;
		} else {
			earnedBaseWage = Math.round(dailyRate * effectiveDaysWorked);
		}
	}

	// Overtime pay (1.5x hourly rate)
	const overtimePay = Math.round(summary.overtimeHours * hourlyRate * 1.5);

	// Gross Earned Pay
	const grossEarned = earnedBaseWage + overtimePay + bonus;

	// Total statutory / advance deductions
	const totalDeductions = deductions + advanceDeduction;

	// System calculated amount
	const systemCalculatedAmount = Math.max(0, grossEarned - totalDeductions);

	// Final amount with HR adjustment
	const finalAmount = Math.max(0, systemCalculatedAmount + adjustmentAmount);

	return {
		payType,
		baseSalary,
		workingDays,
		presentDays: summary.presentDays,
		halfDays: summary.halfDays,
		paidLeaveDays: summary.paidLeaveDays,
		unpaidLeaveDays: summary.unpaidLeaveDays,
		absentDays: summary.absentDays,
		overtimeHours: summary.overtimeHours,
		dailyRate,
		hourlyRate,
		earnedBaseWage,
		overtimePay,
		bonus,
		deductions,
		advanceDeduction,
		systemCalculatedAmount,
		adjustmentAmount,
		finalAmount,
	};
}
