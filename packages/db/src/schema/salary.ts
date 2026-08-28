import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { branches, paymentMethods, payroll } from "../schema";
import { employees } from "./hrms";

// Salary Component Types
export const salaryComponentTypeEnum = pgEnum("salary_component_type", [
	"earning",
	"deduction",
	"reimbursement",
]);

// Salary Component Categories
export const salaryComponentCategoryEnum = pgEnum("salary_component_category", [
	"basic",
	"hra",
	"conveyance",
	"special_allowance",
	"bonus",
	"incentive",
	"overtime",
	"pf",
	"esi",
	"tds",
	"professional_tax",
	"loan_recovery",
	"salary_advance",
	"medical",
	"travel",
	"food",
	"other",
]);

// Salary Structure (Employee's salary components)
export const salaryStructure = pgTable("salary_structure", {
	id: serial("id").primaryKey(),
	employeeId: integer("employee_id")
		.references(() => employees.id)
		.notNull(),
	effectiveFrom: date("effective_from").notNull(),
	effectiveTo: date("effective_to"),
	componentType: salaryComponentTypeEnum("component_type").notNull(),
	category: salaryComponentCategoryEnum("category").notNull(),
	componentName: varchar("component_name", { length: 100 }).notNull(),
	amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Salary Structure Relations
export const salaryStructureRelations = relations(
	salaryStructure,
	({ one }) => ({
		employee: one(employees, {
			fields: [salaryStructure.employeeId],
			references: [employees.id],
		}),
	}),
);

// Salary Change Request (for approval workflow)
export const salaryChangeRequest = pgTable("salary_change_request", {
	id: serial("id").primaryKey(),
	employeeId: integer("employee_id")
		.references(() => employees.id)
		.notNull(),
	requestedBy: integer("requested_by")
		.references(() => employees.id)
		.notNull(),
	effectiveFrom: date("effective_from").notNull(),
	// Changes to be applied (JSON format for flexibility)
	changes: jsonb("changes")
		.$type<
			{
				componentId: number;
				newAmount: string;
				reason: string;
			}[]
		>()
		.notNull(),
	status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
	approvedBy: integer("approved_by").references(() => employees.id),
	approvedAt: timestamp("approved_at"),
	comments: text("comments"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Salary Change Request Relations
export const salaryChangeRequestRelations = relations(
	salaryChangeRequest,
	({ one }) => ({
		employee: one(employees, {
			fields: [salaryChangeRequest.employeeId],
			references: [employees.id],
		}),
		requestedByEmployee: one(employees, {
			fields: [salaryChangeRequest.requestedBy],
			references: [employees.id],
			relationName: "requested_by_employee",
		}),
		approvedByEmployee: one(employees, {
			fields: [salaryChangeRequest.approvedBy],
			references: [employees.id],
			relationName: "approved_by_employee",
		}),
	}),
);

// Statutory Deduction Configuration (Company/Branch level)
export const statutoryDeductionConfig = pgTable("statutory_deduction_config", {
	id: serial("id").primaryKey(),
	branchId: integer("branch_id")
		.references(() => branches.id)
		.notNull(),
	effectiveFrom: date("effective_from").notNull(),
	effectiveTo: date("effective_to"),
	pfRate: decimal("pf_rate", { precision: 5, scale: 4 }).default("0.12"), // 12%
	esiRate: decimal("esi_rate", { precision: 5, scale: 4 }).default("0.0075"), // 0.75%
	professionalTaxSlabs: jsonb("professional_tax_slabs")
		.$type<
			Array<{
				from: number;
				to: number | null;
				amount: number;
			}>
		>()
		.notNull(),
	tdsConfig: jsonb("tds_config").$type<{
		applicable: boolean;
		threshold: number;
		slabs: Array<{
			from: number;
			to: number | null;
			rate: number;
		}>;
	}>(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll Enhancements (extended payroll table with more details)
export const payrollEnhanced = pgTable("payroll_enhanced", {
	id: serial("id").primaryKey(),
	payrollId: integer("payroll_id")
		.references(() => payroll.id)
		.notNull()
		.unique(),
	// Detailed earnings breakdown
	earnings: jsonb("earnings")
		.$type<
			Record<
				string,
				{
					amount: string;
					isTaxable: boolean;
				}
			>
		>()
		.notNull(),
	// Detailed deductions breakdown
	deductionsDetail: jsonb("deductions_detail")
		.$type<
			Record<
				string,
				{
					amount: string;
					isPreTax: boolean;
					statutoryType: string | null;
				}
			>
		>()
		.notNull(),
	// Reimbursements (non-taxable)
	reimbursements: jsonb("reimbursements")
		.$type<Record<string, string>>()
		.notNull(),
	// Loan/salary advances
	loansAndAdvances: jsonb("loans_and_advances")
		.$type<
			Record<
				string,
				{
					amount: string;
					loanId: number | null;
				}
			>
		>()
		.notNull(),
	// Net payable (should match payroll.net_payable for consistency)
	netPayable: decimal("net_payable", { precision: 10, scale: 2 }).notNull(),
	// Calculation metadata
	calculationNotes: text("calculation_notes"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll Enhanced Relations
export const payrollEnhancedRelations = relations(
	payrollEnhanced,
	({ one }) => ({
		payroll: one(payroll, {
			fields: [payrollEnhanced.payrollId],
			references: [payroll.id],
		}),
	}),
);

// Payroll Locking (for concurrency control)
export const payrollLock = pgTable("payroll_lock", {
	id: serial("id").primaryKey(),
	payrollId: integer("payroll_id")
		.references(() => payroll.id)
		.notNull()
		.unique(),
	lockedBy: integer("locked_by")
		.references(() => employees.id)
		.notNull(),
	lockedAt: timestamp("locked_at").defaultNow(),
	expiresAt: timestamp("expires_at").notNull(),
	// Purpose of lock (calculation, approval, payment, etc.)
	lockReason: varchar("lock_reason", { length: 50 }).notNull(),
});

// Payroll Lock Relations
export const payrollLockRelations = relations(payrollLock, ({ one }) => ({
	payroll: one(payroll, {
		fields: [payrollLock.payrollId],
		references: [payroll.id],
	}),
	lockedByEmployee: one(employees, {
		fields: [payrollLock.lockedBy],
		references: [employees.id],
	}),
}));

// Payment Batch (for batch processing)
export const paymentBatch = pgTable("payment_batch", {
	id: serial("id").primaryKey(),
	batchNumber: varchar("batch_number", { length: 50 }).notNull().unique(),
	branchId: integer("branch_id")
		.references(() => branches.id)
		.notNull(),
	paymentDate: date("payment_date").notNull(),
	status: varchar("status", { length: 20 }).notNull().default("created"), // created, processing, completed, failed, reconciled
	totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
	totalCount: integer("total_count").notNull(),
	createdBy: integer("created_by")
		.references(() => employees.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Batch Relations
export const paymentBatchRelations = relations(
	paymentBatch,
	({ one, many }) => ({
		branch: one(branches, {
			fields: [paymentBatch.branchId],
			references: [branches.id],
		}),
		createdByEmployee: one(employees, {
			fields: [paymentBatch.createdBy],
			references: [employees.id],
		}),
		payments: many(paymentBatchItem),
	}),
);

// Payment Batch Items
export const paymentBatchItem = pgTable("payment_batch_item", {
	id: serial("id").primaryKey(),
	batchId: integer("batch_id")
		.references(() => paymentBatch.id)
		.notNull(),
	payrollId: integer("payroll_id")
		.references(() => payroll.id)
		.notNull(),
	employeeId: integer("employee_id")
		.references(() => employees.id)
		.notNull(),
	amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
	status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processed, failed, reconciled
	paymentMethodId: integer("payment_method_id").references(
		() => paymentMethods.id,
	),
	processedAt: timestamp("processed_at"),
	failureReason: text("failure_reason"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Batch Item Relations
export const paymentBatchItemRelations = relations(
	paymentBatchItem,
	({ one }) => ({
		batch: one(paymentBatch, {
			fields: [paymentBatchItem.batchId],
			references: [paymentBatch.id],
		}),
		payroll: one(payroll, {
			fields: [paymentBatchItem.payrollId],
			references: [payroll.id],
		}),
		employee: one(employees, {
			fields: [paymentBatchItem.employeeId],
			references: [employees.id],
		}),
		paymentMethod: one(paymentMethods, {
			fields: [paymentBatchItem.paymentMethodId],
			references: [paymentMethods.id],
		}),
	}),
);

// Payslip Template
export const payslipTemplate = pgTable("payslip_template", {
	id: serial("id").primaryKey(),
	branchId: integer("branch_id")
		.references(() => branches.id)
		.notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	isDefault: boolean("is_default").default(false),
	templateConfig: jsonb("template_config").$type<{
		showEarningsBreakdown: boolean;
		showDeductionsBreakdown: boolean;
		showReimbursements: boolean;
		showYTD: boolean;
		logoUrl: string | null;
		footerText: string | null;
		// Custom fields configuration
		customFields: Array<{
			label: string;
			valuePath: string; // JSON path to value in payroll data
			isCurrency: boolean;
		}>;
	}>(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Payslip Template Relations
export const payslipTemplateRelations = relations(
	payslipTemplate,
	({ one }) => ({
		branch: one(branches, {
			fields: [payslipTemplate.branchId],
			references: [branches.id],
		}),
	}),
);

// Generated Payslip (for storage and access)
export const generatedPayslip = pgTable("generated_payslip", {
	id: serial("id").primaryKey(),
	payrollId: integer("payroll_id")
		.references(() => payroll.id)
		.notNull()
		.unique(),
	employeeId: integer("employee_id")
		.references(() => employees.id)
		.notNull(),
	templateId: integer("template_id").references(() => payslipTemplate.id),
	// Generated content (PDF as base64 or URL)
	contentUrl: varchar("content_url", { length: 500 }),
	isPublished: boolean("is_published").default(false),
	publishedAt: timestamp("published_at"),
	generatedAt: timestamp("generated_at").defaultNow(),
});

// Generated Payslip Relations
export const generatedPayslipRelations = relations(
	generatedPayslip,
	({ one }) => ({
		payroll: one(payroll, {
			fields: [generatedPayslip.payrollId],
			references: [payroll.id],
		}),
		employee: one(employees, {
			fields: [generatedPayslip.employeeId],
			references: [employees.id],
		}),
		template: one(payslipTemplate, {
			fields: [generatedPayslip.templateId],
			references: [payslipTemplate.id],
		}),
	}),
);

// Payroll Variance Detection
export const payrollVariance = pgTable("payroll_variance", {
	id: serial("id").primaryKey(),
	payrollId: integer("payroll_id")
		.references(() => payroll.id)
		.notNull(),
	varianceType: varchar("variance_type", { length: 50 }).notNull(), // amount, percentage, new_missing_employee, etc.
	severity: varchar("severity", { length: 20 }).notNull().default("medium"), // low, medium, high, critical
	description: text("description").notNull(),
	expectedValue: decimal("expected_value", { precision: 15, scale: 2 }),
	actualValue: decimal("actual_value", { precision: 15, scale: 2 }),
	varianceAmount: decimal("variance_amount", { precision: 15, scale: 2 }),
	variancePercentage: decimal("variance_percentage", {
		precision: 5,
		scale: 2,
	}),
	isResolved: boolean("is_resolved").default(false),
	resolvedBy: integer("resolved_by").references(() => employees.id),
	resolvedAt: timestamp("resolved_at"),
	resolutionNotes: text("resolution_notes"),
	detectedAt: timestamp("detected_at").defaultNow(),
	createdAt: timestamp("created_at").defaultNow(),
});

// Payroll Variance Relations
export const payrollVarianceRelations = relations(
	payrollVariance,
	({ one }) => ({
		payroll: one(payroll, {
			fields: [payrollVariance.payrollId],
			references: [payroll.id],
		}),
		resolvedByEmployee: one(employees, {
			fields: [payrollVariance.resolvedBy],
			references: [employees.id],
		}),
	}),
);

// Payroll Audit Events (enhanced audit for payroll-specific events)
export const payrollAudit = pgTable("payroll_audit", {
	id: serial("id").primaryKey(),
	payrollId: integer("payroll_id").references(() => payroll.id),
	action: varchar("action", { length: 50 }).notNull(), // salary_calculation, approval, payment, etc.
	entityType: varchar("entity_type", { length: 30 }).notNull(), // payroll, salary_structure, loan, etc.
	entityId: integer("entity_id"),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	changedBy: integer("changed_by")
		.references(() => employees.id)
		.notNull(),
	changedAt: timestamp("changed_at").defaultNow(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
});

// Payroll Audit Relations
export const payrollAuditRelations = relations(payrollAudit, ({ one }) => ({
	payroll: one(payroll, {
		fields: [payrollAudit.payrollId],
		references: [payroll.id],
	}),
	changedByEmployee: one(employees, {
		fields: [payrollAudit.changedBy],
		references: [employees.id],
	}),
}));

// Notification Templates for Payroll
export const notificationTemplate = pgTable("notification_template", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	module: varchar("module", { length: 50 }).notNull().default("payroll"), // payroll, hr, finance, etc.
	eventType: varchar("event_type", { length: 50 }).notNull(), // payroll_generated, payroll_approved, payslip_available, etc.
	subject: varchar("subject", { length: 200 }),
	body: text("body"), // Template with placeholders
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll Notifications Sent
export const payrollNotification = pgTable("payroll_notification", {
	id: serial("id").primaryKey(),
	payrollId: integer("payroll_id").references(() => payroll.id),
	employeeId: integer("employee_id").references(() => employees.id),
	templateId: integer("template_id").references(() => notificationTemplate.id),
	channel: varchar("channel", { length: 20 }).notNull(), // email, sms, in_app, push
	status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, sent, failed, read
	sentAt: timestamp("sent_at"),
	readAt: timestamp("read_at"),
	externalId: varchar("external_id", { length: 100 }), // ID from external service (SendGrid, Twilio, etc.)
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at").defaultNow(),
});

// Payroll Notification Relations
export const payrollNotificationRelations = relations(
	payrollNotification,
	({ one }) => ({
		payroll: one(payroll, {
			fields: [payrollNotification.payrollId],
			references: [payroll.id],
		}),
		employee: one(employees, {
			fields: [payrollNotification.employeeId],
			references: [employees.id],
		}),
		template: one(notificationTemplate, {
			fields: [payrollNotification.templateId],
			references: [notificationTemplate.id],
		}),
	}),
);
