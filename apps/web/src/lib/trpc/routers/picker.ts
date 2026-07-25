import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { pickLists, pickListItems, orders, staff, products } from "@evaluna/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export const pickerRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      
      const assignedCount = await db.select({ count: count() }).from(pickLists).where(eq(pickLists.status, "assigned"));
      const completedCount = await db.select({ count: count() }).from(pickLists).where(eq(pickLists.status, "completed"));
      const pendingCount = await db.select({ count: count() }).from(pickLists).where(eq(pickLists.status, "pending"));
      
      const itemsPicked = await db.select({ total: sql<number>`SUM(${pickListItems.quantity_picked})` })
                                .from(pickListItems)
                                .where(eq(pickListItems.status, "picked"));

      const recent = await db.select({
        id: pickLists.id,
        order_id: orders.id,
        status: pickLists.status,
        created_at: pickLists.created_at,
      })
      .from(pickLists)
      .leftJoin(orders, eq(pickLists.order_id, orders.id))
      .orderBy(desc(pickLists.created_at))
      .limit(5);

      return {
        assignedToday: assignedCount[0]?.count || 0,
        completed: completedCount[0]?.count || 0,
        pending: pendingCount[0]?.count || 0,
        exceptions: 0,
        totalItemsPicked: itemsPicked[0]?.total || 0,
        pickAccuracy: 100, // Placeholder as accuracy needs complex calculation
        recentTasks: recent.map(r => ({
          id: `PL-${r.id}`,
          order: `ORD-${r.order_id}`,
          items: 0, 
          area: "Warehouse",
          status: r.status,
          time: r.created_at?.toLocaleTimeString() || "",
        }))
      };
    }),

  getPickLists: protectedProcedure
    .input(z.object({ branch_id: z.number().optional(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;
      let query = db.select({
        id: pickLists.id,
        order_id: orders.id,
        status: pickLists.status,
        created_at: pickLists.created_at,
        assigned_to: staff.name,
      })
      .from(pickLists)
      .leftJoin(orders, eq(pickLists.order_id, orders.id))
      .leftJoin(staff, eq(pickLists.assigned_to, staff.id));

      if (input.status) {
        query = query.where(eq(pickLists.status, input.status)) as any;
      }

      const results = await query.orderBy(desc(pickLists.created_at)).limit(50);
      
      return results.map(r => ({
        id: `PL-${r.id}`,
        order_id: `ORD-${r.order_id}`,
        priority: "Normal",
        items_count: 0,
        assigned_to: r.assigned_to || "Unassigned",
        area: "Warehouse",
        status: r.status,
        estimated_time: "N/A",
        created_at: r.created_at?.toLocaleString() || ""
      }));
    }),

  getCurrentTask: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      // Get first assigned or picking task for current user
      const user = ctx.user;
      if (!user) return { task: null, items: [] };

      const activeLists = await db.select()
        .from(pickLists)
        // Note: Assuming ctx.user.id maps to staff.id or we just fetch the first picking one
        .where(eq(pickLists.status, "picking"))
        .limit(1);

      if (activeLists.length === 0) {
        return { task: null, items: [] };
      }

      const task = activeLists[0];
      const items = await db.select({
        id: pickListItems.id,
        qty_required: pickListItems.quantity_picked, // Approximation for now
        qty_picked: pickListItems.quantity_picked,
        status: pickListItems.status,
        product: products.name,
        sku: products.sku,
      })
      .from(pickListItems)
      .leftJoin(products, eq(pickListItems.product_id, products.id))
      .where(eq(pickListItems.pick_list_id, task.id));

      return {
        task: {
          id: `PL-${task.id}`,
          order_id: `ORD-${task.order_id}`,
          area: "Warehouse",
          progress: 0,
          total_items: items.length,
          picked_items: items.filter(i => i.status === "picked").length
        },
        items: items.map(i => ({
          ...i,
          location: "Warehouse",
        }))
      };
    }),

  getCompleted: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: pickLists.id,
        order_id: orders.id,
        completed_by: staff.name,
        created_at: pickLists.created_at,
      })
      .from(pickLists)
      .leftJoin(orders, eq(pickLists.order_id, orders.id))
      .leftJoin(staff, eq(pickLists.assigned_to, staff.id))
      .where(eq(pickLists.status, "completed"))
      .orderBy(desc(pickLists.created_at))
      .limit(50);

      return results.map(r => ({
        id: `PL-${r.id}`,
        order_id: `ORD-${r.order_id}`,
        items: 0,
        time_taken: "N/A",
        completed_by: r.completed_by || "Unknown",
        date: r.created_at?.toLocaleDateString() || "",
        accuracy: 100
      }));
    }),

  getPending: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const results = await db.select({
        id: pickLists.id,
        order_id: orders.id,
        assigned_to: staff.name,
        created_at: pickLists.created_at,
      })
      .from(pickLists)
      .leftJoin(orders, eq(pickLists.order_id, orders.id))
      .leftJoin(staff, eq(pickLists.assigned_to, staff.id))
      .where(eq(pickLists.status, "pending"))
      .orderBy(desc(pickLists.created_at))
      .limit(50);

      return results.map((r, i) => ({
        queue_no: i + 1,
        order_id: `ORD-${r.order_id}`,
        priority: "Normal",
        items: 0,
        assigned_to: r.assigned_to || "Unassigned",
        waiting_since: r.created_at?.toLocaleTimeString() || "",
        expected_by: "N/A"
      }));
    }),

  getReturns: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  getReports: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async () => {
      return [];
    }),
});
