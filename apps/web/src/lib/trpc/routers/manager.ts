import {
  staff,
  branches,
  departments,
  attendance,
  approvals,
  employeeExpenses,
  upcTasks,
  correctiveActions,
  stockAudits,
  auditFindings,
  auditLogs,
  orders,
  purchases,
  pickLists,
  packages,
  deliveryTrips,
  employees,
} from "@evaluna/db/schema";
import { and, count, desc, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";
import { resolveStaffId, logAudit } from "../util/audit";
import { TRPCError } from "@trpc/server";

export const managerRouter = router({
  // ── 1. Centralized Dashboard Stats ──────────────────────────────────────────
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Query core numbers
      const staffList = await db.select().from(staff);
      const todayAttendance = await db
        .select()
        .from(attendance)
        .where(and(gte(attendance.createdAt, todayStart), lte(attendance.createdAt, todayEnd)));
      
      const pendingApprovalsList = await db
        .select()
        .from(approvals)
        .where(eq(approvals.status, "pending"));

      const activeLeaves = await db
        .select()
        .from(approvals)
        .where(and(eq(approvals.reference_type, "leave"), eq(approvals.status, "approved")));

      const totalEmployees = staffList.length;
      const presentToday = todayAttendance.filter((a) => a.status === "present").length;
      const onLeaveToday = activeLeaves.length;
      const absentToday = Math.max(totalEmployees - presentToday - onLeaveToday, 0);
      const pendingApprovals = pendingApprovalsList.length;

      // Overdue UPC Tasks count
      const openUpc = await db
        .select()
        .from(upcTasks)
        .where(and(ne(upcTasks.status, "VERIFIED"), lte(upcTasks.due_at, new Date())));
      const overdueTasks = openUpc.length;

      // Exceptions count from open audit findings
      const openFindings = await db
        .select()
        .from(auditFindings)
        .where(ne(auditFindings.status, "CLOSED"));
      const openExceptions = openFindings.length;

      return {
        totalEmployees,
        presentToday,
        absentToday,
        onLeaveToday,
        pendingApprovals,
        overdueTasks,
        openExceptions,
        teamWorkload: overdueTasks + pendingApprovals,
      };
    }),

  // ── 2. My Team Section ──────────────────────────────────────────────────────
  getEmployees: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = db.select().from(staff);
      
      const allStaff = await query;
      return allStaff.filter((s) => {
        if (input?.search && !s.name?.toLowerCase().includes(input.search.toLowerCase())) {
          return false;
        }
        if (input?.role && s.role !== input.role) {
          return false;
        }
        return true;
      }).slice(0, input?.limit ?? 50);
    }),

  getEmployeeDetail: protectedProcedure
    .input(z.object({ staffId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [employee] = await db
        .select()
        .from(staff)
        .where(eq(staff.id, input.staffId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee not found.",
        });
      }

      // Query leave requests
      const leaves = await db
        .select()
        .from(approvals)
        .where(and(eq(approvals.reference_type, "leave"), eq(approvals.requested_by, input.staffId)));

      // Query assigned tasks
      const assignedTasks = await db
        .select()
        .from(upcTasks)
        .where(eq(upcTasks.assigned_to, input.staffId));

      // Query expense claims
      const expenses = await db
        .select()
        .from(employeeExpenses)
        .where(eq(employeeExpenses.staff_id, input.staffId));

      return {
        employee,
        leaves,
        tasks: assignedTasks,
        expenses,
      };
    }),

  // ── 3. Centralized Tasks ────────────────────────────────────────────────────
  getTasks: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const upcList = await db.select().from(upcTasks);
      return upcList.filter((t) => {
        if (input?.status && t.status !== input.status) return false;
        return true;
      });
    }),

  createTask: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        taskType: z.enum(["generate", "verify"]),
        dueAt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const staffId = await resolveStaffId(db, ctx.user.email);
      const [task] = await db
        .insert(upcTasks)
        .values({
          product_id: input.productId,
          task_type: input.taskType,
          status: "PENDING",
          due_at: new Date(input.dueAt),
          created_by: staffId ?? 1,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      return task;
    }),

  assignTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        assignedTo: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [task] = await db
        .update(upcTasks)
        .set({
          assigned_to: input.assignedTo,
          status: "ASSIGNED",
          updated_at: new Date(),
        })
        .where(eq(upcTasks.id, input.taskId))
        .returning();

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found.",
        });
      }

      return task;
    }),

  // ── 4. centralized Approvals Inbox ──────────────────────────────────────────
  getApprovals: protectedProcedure
    .input(z.object({ status: z.string().default("pending") }))
    .query(async ({ ctx, input }) => {
      return await db
        .select()
        .from(approvals)
        .where(eq(approvals.status, input.status));
    }),

  reviewApproval: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        decision: z.enum(["approved", "rejected"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const staffId = await resolveStaffId(db, ctx.user.email);

      // Verify separation of duties: manager cannot approve their own requests
      const [approval] = await db
        .select()
        .from(approvals)
        .where(eq(approvals.id, input.approvalId))
        .limit(1);

      if (!approval) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Approval request not found.",
        });
      }

      if (staffId && approval.requested_by === staffId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Conflict of Interest: You are not authorized to approve your own requests.",
        });
      }

      return await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(approvals)
          .set({
            status: input.decision,
            approved_by: staffId,
            comments: input.comments,
            resolved_at: new Date(),
          })
          .where(eq(approvals.id, input.approvalId))
          .returning();

        // 1. Cascade update to leave or purchases or sales return statuses if required
        if (approval.reference_type === "purchase") {
          await tx
            .update(purchases)
            .set({ status: input.decision === "approved" ? "approved" : "cancelled" })
            .where(eq(purchases.id, approval.reference_id));
        }

        // 2. Write compliance audit logs
        await logAudit(tx, {
          userId: staffId,
          action: `APPROVAL_DECISION_${input.decision.toUpperCase()}`,
          entityType: "approvals",
          entityId: input.approvalId,
        });

        return updated;
      });
    }),

  // ── 5. Attendance Feed ──────────────────────────────────────────────────────
  getAttendance: protectedProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetDate = input?.date ? new Date(input.date) : new Date();
      const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      return await db
        .select()
        .from(attendance)
        .where(and(gte(attendance.createdAt, start), lte(attendance.createdAt, end)));
    }),

  // ── 6. Leave Balance & Management ───────────────────────────────────────────
  getLeaveRequests: protectedProcedure
    .query(async ({ ctx }) => {
      return await db
        .select()
        .from(approvals)
        .where(eq(approvals.reference_type, "leave"));
    }),

  // ── 7. Expenses ─────────────────────────────────────────────────────────────
  getExpenses: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.select().from(employeeExpenses);
    }),

  // ── 8. Team Performance ─────────────────────────────────────────────────────
  getPerformance: protectedProcedure
    .query(async ({ ctx }) => {
      const [allStaff, allTasks, allAttendance] = await Promise.all([
        db.select().from(staff),
        db.select().from(upcTasks),
        db.select().from(attendance),
      ]);

      return allStaff.map((s) => {
        const staffTasks = allTasks.filter((t) => t.assigned_to === s.id);
        const completed = staffTasks.filter((t) => t.status === "VERIFIED").length;
        const total = staffTasks.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

        return {
          id: s.id,
          name: s.name,
          role: s.role,
          totalTasks: total,
          completedTasks: completed,
          completionRate,
          attendanceStreak: allAttendance.filter((a) => a.employeeId === s.id && a.status === "present").length,
        };
      });
    }),

  // ── 9. Team Workload ────────────────────────────────────────────────────────
  getWorkload: protectedProcedure
    .query(async ({ ctx }) => {
      const [allStaff, allTasks] = await Promise.all([
        db.select().from(staff),
        db.select().from(upcTasks),
      ]);

      return allStaff.map((s) => {
        const staffTasks = allTasks.filter((t) => t.assigned_to === s.id);
        return {
          id: s.id,
          name: s.name,
          role: s.role,
          assigned: staffTasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length,
          inProgress: staffTasks.filter((t) => t.status === "IN_PROGRESS").length,
          completed: staffTasks.filter((t) => t.status === "VERIFIED").length,
          overdue: staffTasks.filter((t) => t.status !== "VERIFIED" && t.due_at && new Date(t.due_at) < new Date()).length,
        };
      });
    }),

  // ── 10. Operational Exceptions Center ───────────────────────────────────────
  getExceptions: protectedProcedure
    .query(async ({ ctx }) => {
      const findings = await db.select().from(auditFindings);
      return findings.map((f) => ({
        id: f.id,
        severity: f.severity,
        title: f.title,
        description: f.description,
        status: f.status,
        created_at: f.created_at,
      }));
    }),

  // ── 11. Activity Log Timeline ───────────────────────────────────────────────
  getActivity: protectedProcedure
    .query(async ({ ctx }) => {
      return await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.created_at))
        .limit(100);
    }),
});
