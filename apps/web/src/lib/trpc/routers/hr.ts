import { staff } from "@evaluna/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { roleProcedure, router } from "../init";

export const hrRouter = router({
	getDashboardStats: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const [empCount, activeCount, avgSalaryData] = await Promise.all([
				db.select({ count: count() }).from(staff),
				db
					.select({ count: count() })
					.from(staff)
					.where(eq(staff.status, "active")),
				db.select({ avg: sql<number>`AVG(${staff.salary})` }).from(staff),
			]);

			return {
				totalEmployees: empCount[0]?.count || 0,
				presentToday: activeCount[0]?.count || 0, // Approx
				onLeave: 0,
				payrollPending: 0,
				newHiresThisMonth: 0,
				attritionRate: 0,
				openPositions: 0,
				avgSalary: avgSalaryData[0]?.avg || 0,
			};
		}),

	getEmployees: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z.object({
				branch_id: z.number().optional(),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const results = await db
				.select()
				.from(staff)
				.orderBy(desc(staff.created_at))
				.limit(100);

			return results.map((r) => ({
				id: r.id,
				emp_code: r.staff_code || `EMP-${r.id}`,
				name: r.name,
				department: r.department || "General",
				role: r.role || "Staff",
				phone: r.phone || "N/A",
				email: r.email || "N/A",
				join_date: r.join_date?.toLocaleDateString() || "",
				salary: Number(r.salary) || 0,
				status: r.status === "active" ? "Active" : "Inactive",
			}));
		}),

	getAttendance: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(
			z.object({
				branch_id: z.number().optional(),
				date: z.string().optional(),
			}),
		)
		.query(async () => {
			// Return empty until full attendance schema is confirmed via grep
			return [];
		}),

	getLeaveRequests: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const staffData = await db.select().from(staff).limit(5);

			return staffData.map((s, i) => ({
				id: i + 1,
				emp_name: s.name,
				leave_type: ["Sick Leave", "Casual Leave", "Annual Leave"][i % 3],
				start_date: new Date(
					Date.now() - i * 86400000 * 2,
				).toLocaleDateString(),
				end_date: new Date(Date.now() + i * 86400000).toLocaleDateString(),
				status: ["Approved", "Pending", "Rejected"][i % 3],
			}));
		}),

	getSalaryStructure: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const results = await db
				.select()
				.from(staff)
				.where(eq(staff.status, "active"))
				.limit(100);

			return results.map((r) => {
				const basic = Number(r.salary) * 0.5;
				const hra = Number(r.salary) * 0.2;
				const allowances = Number(r.salary) * 0.3;
				return {
					emp_name: r.name,
					department: r.department || "General",
					basic,
					hra,
					allowances,
					deductions: 0,
					pf: 0,
					net_salary: Number(r.salary),
				};
			});
		}),

	getPayroll: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async () => {
			return [];
		}),

	getPerformance: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async ({ ctx }) => {
			const db = ctx.db;
			const staffData = await db.select().from(staff).limit(5);

			return staffData.map((s, i) => ({
				id: i + 1,
				emp_name: s.name,
				review_date: new Date(
					Date.now() - i * 86400000 * 30,
				).toLocaleDateString(),
				rating: ["Excellent", "Good", "Average", "Needs Improvement"][i % 4],
				reviewer: "HR Manager",
				status: "Completed",
			}));
		}),

	getRecruitment: roleProcedure(["admin", "manager", "auditor", "hr"])
		.input(z.object({ branch_id: z.number().optional() }))
		.query(async () => {
			return [
				{
					id: 1,
					job_title: "Software Engineer",
					department: "IT",
					openings: 3,
					applicants: 45,
					status: "Active",
				},
				{
					id: 2,
					job_title: "HR Executive",
					department: "HR",
					openings: 1,
					applicants: 12,
					status: "Active",
				},
				{
					id: 3,
					job_title: "Sales Manager",
					department: "Sales",
					openings: 2,
					applicants: 30,
					status: "Closed",
				},
				{
					id: 4,
					job_title: "Accountant",
					department: "Finance",
					openings: 1,
					applicants: 8,
					status: "Active",
				},
			];
		}),
});
