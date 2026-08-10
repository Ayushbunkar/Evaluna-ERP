import { db } from "@evaluna/db";
import {
	attendanceBreaks,
	attendanceSettings,
	branches,
	branchGeofences,
	employees,
	enhancedAttendance,
	haversineDistance,
	registeredDevices,
} from "@evaluna/db/src/schema/attendance-enhanced";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { procedure, router } from "../../trpc";

// Enhanced Attendance Router
export const enhancedAttendanceRouter = router({
	// Check In with GPS and Selfie
	checkIn: procedure
		.input(
			z.object({
				gps: z.object({
					latitude: z.number(),
					longitude: z.number(),
					accuracy: z.number(),
					altitude: z.number().optional(),
					heading: z.number().optional(),
					speed: z.number().optional(),
					timestamp: z.string(),
					deviceTime: z.string(),
					serverTime: z.string(),
				}),
				selfie: z.object({
					data: z.string(), // base64 encoded
					mimeType: z.string(),
				}),
				deviceFingerprint: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not authenticated",
				});
			}

			// 1. Get employee and branch
			const employee = await db.query.employees.findFirst({
				where: eq(employees.id, Number(employeeId)),
			});

			if (!employee || !employee.branchId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Employee or branch not found",
				});
			}

			// 2. Get branch geofence
			const geofence = await db.query.branchGeofences.findFirst({
				where: eq(branchGeofences.branchId, employee.branchId),
			});

			if (!geofence || !geofence.isActive) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Geofence not configured for this branch",
				});
			}

			// 3. Validate GPS location
			const distance = haversineDistance(
				input.gps.latitude,
				input.gps.longitude,
				geofence.latitude,
				geofence.longitude,
			);

			if (distance > geofence.radius) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: `Outside geofence. Distance: ${distance.toFixed(2)}m, Allowed: ${geofence.radius}m`,
				});
			}

			// 4. Check for existing attendance today
			const today = new Date().toISOString().split("T")[0];
			const existingAttendance = await db.query.enhancedAttendance.findFirst({
				where: and(
					eq(enhancedAttendance.employeeId, Number(employeeId)),
					eq(enhancedAttendance.date, today),
					isNull(enhancedAttendance.checkOut),
				),
			});

			if (existingAttendance) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Already checked in today",
				});
			}

			// 5. Validate device
			const deviceValid = await db.query.registeredDevices.findFirst({
				where: and(
					eq(registeredDevices.employeeId, Number(employeeId)),
					eq(registeredDevices.fingerprint, input.deviceFingerprint),
					eq(registeredDevices.isApproved, true),
				),
			});

			if (!deviceValid) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Unregistered device. Please contact admin for approval.",
				});
			}

			// 6. Upload selfie
			const selfieUrl = await uploadSelfie({
				data: input.selfie.data,
				mimeType: input.selfie.mimeType,
				employeeId: Number(employeeId),
				timestamp: input.gps.timestamp,
			});

			// 7. Create attendance record
			const [attendance] = await db
				.insert(enhancedAttendance)
				.values({
					employeeId: Number(employeeId),
					branchId: employee.branchId,
					date: today,
					checkIn: new Date(),
					checkInGPS: input.gps,
					checkInSelfie: {
						url: selfieUrl,
						captureTime: input.gps.timestamp,
						gps: input.gps,
						deviceInfo: getDeviceInfo(),
						verified: false,
					},
					checkInDevice: getDeviceInfo(),
					checkInIP: ctx.request?.ip,
					checkInNetwork: getNetworkType(),
					distanceFromOffice: distance,
					status: "present",
					riskScore: 0,
					riskReasons: [],
				})
				.returning();

			return attendance;
		}),

	// Check Out with GPS and Selfie
	checkOut: procedure
		.input(
			z.object({
				gps: z.object({
					latitude: z.number(),
					longitude: z.number(),
					accuracy: z.number(),
					altitude: z.number().optional(),
					heading: z.number().optional(),
					speed: z.number().optional(),
					timestamp: z.string(),
					deviceTime: z.string(),
					serverTime: z.string(),
				}),
				selfie: z.object({
					data: z.string(), // base64 encoded
					mimeType: z.string(),
				}),
				deviceFingerprint: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not authenticated",
				});
			}

			// 1. Get active attendance
			const today = new Date().toISOString().split("T")[0];
			const attendance = await db.query.enhancedAttendance.findFirst({
				where: and(
					eq(enhancedAttendance.employeeId, Number(employeeId)),
					eq(enhancedAttendance.date, today),
					isNull(enhancedAttendance.checkOut),
				),
			});

			if (!attendance) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No active attendance found",
				});
			}

			// 2. Validate device
			const deviceValid = await db.query.registeredDevices.findFirst({
				where: and(
					eq(registeredDevices.employeeId, Number(employeeId)),
					eq(registeredDevices.fingerprint, input.deviceFingerprint),
					eq(registeredDevices.isApproved, true),
				),
			});

			if (!deviceValid) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Unregistered device",
				});
			}

			// 3. Upload selfie
			const selfieUrl = await uploadSelfie({
				data: input.selfie.data,
				mimeType: input.selfie.mimeType,
				employeeId: Number(employeeId),
				timestamp: input.gps.timestamp,
			});

			// 4. Calculate working hours
			const checkInTime = new Date(attendance.checkIn);
			const checkOutTime = new Date();
			const workingHours =
				(checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

			// 5. Calculate break hours
			const breaks = await db.query.attendanceBreaks.findMany({
				where: eq(attendanceBreaks.attendanceId, attendance.id),
			});
			const breakHours = breaks.reduce((total, br) => {
				if (br.endTime) {
					return (
						total +
						(new Date(br.endTime).getTime() -
							new Date(br.startTime).getTime()) /
							(1000 * 60 * 60)
					);
				}
				return total;
			}, 0);

			// 6. Update attendance record
			const [updatedAttendance] = await db
				.update(enhancedAttendance)
				.set({
					checkOut: new Date(),
					checkOutGPS: input.gps,
					checkOutSelfie: {
						url: selfieUrl,
						captureTime: input.gps.timestamp,
						gps: input.gps,
						deviceInfo: getDeviceInfo(),
						verified: false,
					},
					checkOutDevice: getDeviceInfo(),
					checkOutIP: ctx.request?.ip,
					checkOutNetwork: getNetworkType(),
					workingHours: Number.parseFloat(workingHours.toFixed(2)),
					breakHours: Number.parseFloat(breakHours.toFixed(2)),
				})
				.where(eq(enhancedAttendance.id, attendance.id))
				.returning();

			return updatedAttendance;
		}),

	// Start Break
	startBreak: procedure
		.input(
			z.object({
				type: z.enum([
					"lunch",
					"tea",
					"personal",
					"meeting",
					"official_visit",
					"custom",
				]),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not authenticated",
				});
			}

			// 1. Get active attendance
			const today = new Date().toISOString().split("T")[0];
			const attendance = await db.query.enhancedAttendance.findFirst({
				where: and(
					eq(enhancedAttendance.employeeId, Number(employeeId)),
					eq(enhancedAttendance.date, today),
					isNull(enhancedAttendance.checkOut),
				),
			});

			if (!attendance) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No active attendance found",
				});
			}

			// 2. Check settings
			const settings = await db.query.attendanceSettings.findFirst({
				where: eq(attendanceSettings.companyId, 1), // Would use actual company ID
			});

			if (!settings?.enableBreakTracking) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Break tracking is disabled",
				});
			}

			// 3. Create break record
			const [breakRecord] = await db
				.insert(attendanceBreaks)
				.values({
					attendanceId: attendance.id,
					type: input.type,
					reason: input.reason,
					startTime: new Date(),
					startGPS: getCurrentGPS(),
				})
				.returning();

			return breakRecord;
		}),

	// End Break
	endBreak: procedure.input(z.number()).mutation(async ({ ctx, input }) => {
		const employeeId = ctx.user?.id;
		if (!employeeId) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Employee not authenticated",
			});
		}

		// 1. Get break record
		const breakRecord = await db.query.attendanceBreaks.findFirst({
			where: eq(attendanceBreaks.id, input),
		});

		if (!breakRecord) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Break not found",
			});
		}

		// 2. Verify attendance is still active
		const attendance = await db.query.enhancedAttendance.findFirst({
			where: and(
				eq(enhancedAttendance.id, breakRecord.attendanceId),
				isNull(enhancedAttendance.checkOut),
			),
		});

		if (!attendance) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Attendance has been completed",
			});
		}

		// 3. Update break record
		const [updatedBreak] = await db
			.update(attendanceBreaks)
			.set({
				endTime: new Date(),
				endGPS: getCurrentGPS(),
				durationMinutes: Math.round(
					(new Date().getTime() - new Date(breakRecord.startTime).getTime()) /
						(1000 * 60),
				),
			})
			.where(eq(attendanceBreaks.id, input))
			.returning();

		return updatedBreak;
	}),

	// Get Today's Attendance
	getTodaysAttendance: procedure.query(async ({ ctx }) => {
		const employeeId = ctx.user?.id;
		if (!employeeId) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Employee not authenticated",
			});
		}

		const today = new Date().toISOString().split("T")[0];
		return await db.query.enhancedAttendance.findFirst({
			where: and(
				eq(enhancedAttendance.employeeId, Number(employeeId)),
				eq(enhancedAttendance.date, today),
			),
			with: {
				breaks: true,
			},
		});
	}),

	// Get Monthly Attendance
	getMonthlyAttendance: procedure
		.input(
			z.object({
				month: z.number(),
				year: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not authenticated",
				});
			}

			const startDate = `${input.year}-${input.month.toString().padStart(2, "0")}-01`;
			const endDate = `${input.year}-${input.month.toString().padStart(2, "0")}-31`;

			return await db.query.enhancedAttendance.findMany({
				where: and(
					eq(enhancedAttendance.employeeId, Number(employeeId)),
					sql`${enhancedAttendance.date} >= ${startDate}`,
					sql`${enhancedAttendance.date} <= ${endDate}`,
				),
				orderBy: desc(enhancedAttendance.date),
			});
		}),

	// Get Attendance Details
	getAttendanceDetails: procedure
		.input(z.number())
		.query(async ({ ctx, input }) => {
			const employeeId = ctx.user?.id;
			if (!employeeId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Employee not authenticated",
				});
			}

			const attendance = await db.query.enhancedAttendance.findFirst({
				where: eq(enhancedAttendance.id, input),
				with: {
					employee: true,
					branch: true,
					breaks: true,
					approvedByEmployee: true,
				},
			});

			if (!attendance) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attendance not found",
				});
			}

			// Calculate net working hours
			const netWorkingHours = attendance.workingHours - attendance.breakHours;

			return {
				...attendance,
				netWorkingHours,
			};
		}),
});

// Helper functions (would be implemented)
function getCurrentGPS() {
	// Implementation would use browser Geolocation API
	return {
		latitude: 0,
		longitude: 0,
		accuracy: 0,
		timestamp: new Date().toISOString(),
		deviceTime: new Date().toISOString(),
		serverTime: new Date().toISOString(),
	};
}

function getDeviceInfo() {
	// Implementation would collect device information
	return {
		fingerprint: "device-fingerprint",
		userAgent: navigator.userAgent,
		platform: navigator.platform,
		screenResolution: `${window.screen.width}x${window.screen.height}`,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		language: navigator.language,
		browser: "unknown",
		os: "unknown",
		deviceType: "desktop",
	};
}

async function uploadSelfie(data: {
	data: string;
	mimeType: string;
	employeeId: number;
	timestamp: string;
}) {
	// Implementation would upload to secure storage
	return "selfie-url";
}

function getNetworkType() {
	// Implementation would detect network type
	return "wifi";
}
