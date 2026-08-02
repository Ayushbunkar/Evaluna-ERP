import { pgTable, serial, text, varchar, integer, date, time, boolean, timestamp, decimal, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { employees, branches } from "./hrms";
// Attendance Status Enum
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "half_day",
  "late",
  "leave",
  "week_off",
  "holiday",
  "pending_approval",
  "rejected",
  "outside_geofence",
  "gps_error",
  "device_error",
  "selfie_missing",
]);

// Break Type Enum
export const breakTypeEnum = pgEnum("break_type", [
  "lunch",
  "tea",
  "personal",
  "meeting",
  "official_visit",
  "custom",
]);

// GPS Data Interface
export type GPSData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  deviceTime: string;
  serverTime: string;
};

// Device Information Interface
export type DeviceInfo = {
  fingerprint: string;
  userAgent: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  language: string;
  browser: string;
  os: string;
  deviceType: string;
};

// Selfie Data Interface
export type SelfieData = {
  url: string;
  captureTime: string;
  gps: GPSData;
  deviceInfo: DeviceInfo;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
};

// Enhanced Attendance Table
export const enhancedAttendance = pgTable("enhanced_attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  branchId: integer("branch_id").references(() => branches.id),
  date: date("date").notNull(),
  checkIn: time("check_in"),
  checkOut: time("check_out"),
  checkInGPS: jsonb("check_in_gps").$type<GPSData>(),
  checkOutGPS: jsonb("check_out_gps").$type<GPSData>(),
  checkInSelfie: jsonb("check_in_selfie").$type<SelfieData>(),
  checkOutSelfie: jsonb("check_out_selfie").$type<SelfieData>(),
  checkInDevice: jsonb("check_in_device").$type<DeviceInfo>(),
  checkOutDevice: jsonb("check_out_device").$type<DeviceInfo>(),
  checkInIP: varchar("check_in_ip", { length: 50 }),
  checkOutIP: varchar("check_out_ip", { length: 50 }),
  checkInNetwork: varchar("check_in_network", { length: 50 }),
  checkOutNetwork: varchar("check_out_network", { length: 50 }),
  workingHours: decimal("working_hours", { precision: 5, scale: 2 }),
  breakHours: decimal("break_hours", { precision: 5, scale: 2 }).default("0"),
  lateMinutes: integer("late_minutes").default(0),
  earlyExitMinutes: integer("early_exit_minutes").default(0),
  overtimeMinutes: integer("overtime_minutes").default(0),
  status: attendanceStatusEnum("status").default("absent"),
  riskScore: integer("risk_score").default(0),
  riskReasons: jsonb("risk_reasons").$type<string[]>(),
  distanceFromOffice: decimal("distance_from_office", { precision: 10, scale: 2 }),
  isApproved: boolean("is_approved").default(true),
  approvedBy: integer("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance Breaks Table
export const attendanceBreaks = pgTable("attendance_breaks", {
  id: serial("id").primaryKey(),
  attendanceId: integer("attendance_id").references(() => enhancedAttendance.id),
  type: breakTypeEnum("type").notNull(),
  reason: text("reason"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  startGPS: jsonb("start_gps").$type<GPSData>(),
  endGPS: jsonb("end_gps").$type<GPSData>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Device Registration Table
export const registeredDevices = pgTable("registered_devices", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  fingerprint: varchar("fingerprint", { length: 255 }).notNull().unique(),
  userAgent: text("user_agent"),
  platform: varchar("platform", { length: 50 }),
  screenResolution: varchar("screen_resolution", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }),
  language: varchar("language", { length: 50 }),
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  deviceType: varchar("device_type", { length: 50 }),
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Branch Geofence Table
export const branchGeofences = pgTable("branch_geofences", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id).unique(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  radius: integer("radius").default(100), // in meters
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance Settings Table
export const attendanceSettings = pgTable("attendance_settings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"), // Would reference companies table if it existed
  enableGPS: boolean("enable_gps").default(true),
  enableGeofence: boolean("enable_geofence").default(true),
  enableSelfie: boolean("enable_selfie").default(true),
  enableDeviceLock: boolean("enable_device_lock").default(true),
  enableBreakTracking: boolean("enable_break_tracking").default(true),
  enableOvertime: boolean("enable_overtime").default(true),
  enableAutoCheckout: boolean("enable_auto_checkout").default(true),
  enableLiveLocation: boolean("enable_live_location").default(false),
  gpsRadius: integer("gps_radius").default(100), // meters
  minGPSAccuracy: integer("min_gps_accuracy").default(50), // meters
  maxBreakTime: integer("max_break_time").default(60), // minutes
  graceTime: integer("grace_time").default(10), // minutes
  workingHours: integer("working_hours").default(8), // hours
  autoCheckoutTime: varchar("auto_checkout_time", { length: 5 }).default("18:00"),
  photoCompression: decimal("photo_compression", { precision: 3, scale: 2 }).default(0.8),
  photoSizeLimit: integer("photo_size_limit").default(500), // KB
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const enhancedAttendanceRelations = relations(enhancedAttendance, ({ one, many }) => ({
  employee: one(employees, {
    fields: [enhancedAttendance.employeeId],
    references: [employees.id],
  }),
  branch: one(branches, {
    fields: [enhancedAttendance.branchId],
    references: [branches.id],
  }),
  approvedByEmployee: one(employees, {
    fields: [enhancedAttendance.approvedBy],
    references: [employees.id],
    relationName: "approved_by_employee",
  }),
  breaks: many(attendanceBreaks),
}));

export const attendanceBreaksRelations = relations(attendanceBreaks, ({ one }) => ({
  attendance: one(enhancedAttendance, {
    fields: [attendanceBreaks.attendanceId],
    references: [enhancedAttendance.id],
  }),
}));

export const registeredDevicesRelations = relations(registeredDevices, ({ one }) => ({
  employee: one(employees, {
    fields: [registeredDevices.employeeId],
    references: [employees.id],
  }),
  approvedByEmployee: one(employees, {
    fields: [registeredDevices.approvedBy],
    references: [employees.id],
    relationName: "approved_by_employee_devices",
  }),
}));

export const branchGeofencesRelations = relations(branchGeofences, ({ one }) => ({
  branch: one(branches, {
    fields: [branchGeofences.branchId],
    references: [branches.id],
  }),
}));

// Utility Functions
export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};