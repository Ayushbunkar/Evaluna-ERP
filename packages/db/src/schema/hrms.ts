import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	time,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// Employee Status Enum
export const employeeStatusEnum = pgEnum("employee_status", [
	"active",
	"inactive",
	"on_leave",
	"terminated",
]);

// Leave Status Enum
export const leaveStatusEnum = pgEnum("leave_status", [
	"pending",
	"approved",
	"rejected",
	"cancelled",
]);

// Attendance Status Enum
export const attendanceStatusEnum = pgEnum("attendance_status", [
	"present",
	"absent",
	"half_day",
	"late",
	"leave",
	"week_off",
	"holiday",
]);

// Overtime Status Enum
export const overtimeStatusEnum = pgEnum("overtime_status", [
	"pending",
	"approved",
	"rejected",
	"paid",
]);

// Department Table
export const departments = pgTable("departments", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	description: text("description"),
	headId: integer("head_id").references((): any => employees.id),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Designation Table
export const designations = pgTable("designations", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	level: integer("level").default(1),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee Table
export const employees = pgTable("employees", {
	id: serial("id").primaryKey(),
	employeeCode: varchar("employee_code", { length: 50 }).notNull().unique(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar("email", { length: 100 }).notNull().unique(),
	phone: varchar("phone", { length: 20 }),
	address: text("address"),
	hireDate: date("hire_date").notNull(),
	status: employeeStatusEnum("status").default("active"),
	departmentId: integer("department_id").references((): any => departments.id),
	designationId: integer("designation_id").references(() => designations.id),
	managerId: integer("manager_id").references((): any => employees.id),
	userUid: varchar("user_uid", { length: 100 }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift Table
export const shifts = pgTable("shifts", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	graceTime: integer("grace_time").default(10),
	lunchDuration: integer("lunch_duration").default(45),
	teaBreakDuration: integer("tea_break_duration").default(15),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee Shifts Table
export const employeeShifts = pgTable("employee_shifts", {
	id: serial("id").primaryKey(),
	employeeId: integer("employee_id").references(() => employees.id),
	shiftId: integer("shift_id").references(() => shifts.id),
	effectiveFrom: date("effective_from").notNull(),
	effectiveTo: date("effective_to"),
	createdAt: timestamp("created_at").defaultNow(),
});

// Holiday Table
export const holidays = pgTable("holidays", {
	id: serial("id").primaryKey(),
	date: date("date").notNull().unique(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	isRecurring: boolean("is_recurring").default(false),
	recurringType: varchar("recurring_type", { length: 20 }),
	createdAt: timestamp("created_at").defaultNow(),
});

// Week Off Table
export const weekOffs = pgTable("week_offs", {
	id: serial("id").primaryKey(),
	employeeId: integer("employee_id").references(() => employees.id),
	weekday: integer("weekday").notNull(), // 0=Sunday, 1=Monday, etc.
	effectiveFrom: date("effective_from").notNull(),
	effectiveTo: date("effective_to"),
	createdAt: timestamp("created_at").defaultNow(),
});

// Leave Type Table
export const leaveTypes = pgTable("leave_types", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	description: text("description"),
	isPaid: boolean("is_paid").default(true),
	maxDays: integer("max_days").default(24),
	carryForward: boolean("carry_forward").default(false),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave Application Table
export const leaveApplications = pgTable("leave_applications", {
	id: serial("id").primaryKey(),
	employeeId: integer("employee_id").references(() => employees.id),
	leaveTypeId: integer("leave_type_id").references(() => leaveTypes.id),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	reason: text("reason"),
	status: leaveStatusEnum("status").default("pending"),
	approvedBy: integer("approved_by").references(() => employees.id),
	approvedAt: timestamp("approved_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance Table
export const attendance = pgTable("attendance", {
	id: serial("id").primaryKey(),
	employeeId: integer("employee_id").references(() => employees.id),
	date: date("date").notNull(),
	checkIn: time("check_in"),
	checkOut: time("check_out"),
	lunchStart: time("lunch_start"),
	lunchEnd: time("lunch_end"),
	teaBreakStart: time("tea_break_start"),
	teaBreakEnd: time("tea_break_end"),
	status: attendanceStatusEnum("status").default("absent"),
	location: varchar("location", { length: 100 }),
	ipAddress: varchar("ip_address", { length: 50 }),
	deviceInfo: text("device_info"),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow(),
});

// Overtime Table
export const overtime = pgTable("overtime", {
	id: serial("id").primaryKey(),
	employeeId: integer("employee_id").references(() => employees.id),
	date: date("date").notNull(),
	hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
	rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
	status: overtimeStatusEnum("status").default("pending"),
	approvedBy: integer("approved_by").references(() => employees.id),
	approvedAt: timestamp("approved_at"),
	reason: text("reason"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Settings Table
export const companySettings = pgTable("company_settings", {
	id: serial("id").primaryKey(),
	workingHours: integer("working_hours").default(8),
	graceTime: integer("grace_time").default(10),
	lunchDuration: integer("lunch_duration").default(45),
	teaBreakDuration: integer("tea_break_duration").default(15),
	weeklyOff: varchar("weekly_off", { length: 50 }).default("Sunday"),
	defaultShiftId: integer("default_shift_id").references(() => shifts.id),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
	employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
	department: one(departments, {
		fields: [employees.departmentId],
		references: [departments.id],
	}),
	designation: one(designations, {
		fields: [employees.designationId],
		references: [designations.id],
	}),
	manager: one(employees, {
		fields: [employees.managerId],
		references: [employees.id],
	}),
	employeeShifts: many(employeeShifts),
	attendance: many(attendance),
	leaveApplications: many(leaveApplications),
	overtime: many(overtime),
	payroll: many(payroll),
}));

export const shiftsRelations = relations(shifts, ({ many }) => ({
	employeeShifts: many(employeeShifts),
}));

export const leaveTypesRelations = relations(leaveTypes, ({ many }) => ({
	leaveApplications: many(leaveApplications),
}));

export const leaveApplicationsRelations = relations(
	leaveApplications,
	({ one }) => ({
		employee: one(employees, {
			fields: [leaveApplications.employeeId],
			references: [employees.id],
		}),
		leaveType: one(leaveTypes, {
			fields: [leaveApplications.leaveTypeId],
			references: [leaveTypes.id],
		}),
		approvedByEmployee: one(employees, {
			fields: [leaveApplications.approvedBy],
			references: [employees.id],
			relationName: "approved_by_employee",
		}),
	}),
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
	employee: one(employees, {
		fields: [attendance.employeeId],
		references: [employees.id],
	}),
}));

export const overtimeRelations = relations(overtime, ({ one }) => ({
	employee: one(employees, {
		fields: [overtime.employeeId],
		references: [employees.id],
	}),
	approvedByEmployee: one(employees, {
		fields: [overtime.approvedBy],
		references: [employees.id],
		relationName: "approved_by_employee_overtime",
	}),
}));

export const payrollRelations = relations(payroll, ({ one }) => ({
	employee: one(employees, {
		fields: [payroll.employeeId],
		references: [employees.id],
	}),
}));
