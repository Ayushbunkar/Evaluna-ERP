import { z } from "zod";
import { router, procedure } from "../../index";
import { db } from "@evaluna/db";
import { permissions, rolePermissions } from "@evaluna/db/src/schema/rbac";
import { eq, and, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
export const permissionsRouter = router({
  // Get all permissions
  list: procedure
    .input(
      z.object({
        domain: z.string().optional(),
        action: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const whereClause = [];

      if (input.domain) {
        whereClause.push(eq(permissions.domain, input.domain));
      }

      if (input.action) {
        whereClause.push(eq(permissions.action, input.action));
      }

      if (input.search) {
        whereClause.push(
          or(
            sql`${permissions.name} ILIKE ${`%${input.search}%`}`,
            sql`${permissions.description} ILIKE ${`%${input.search}%`}`,
          ),
        );
      }

      return await db.query.permissions.findMany({
        where: whereClause.length > 0 ? and(...whereClause) : undefined,
        orderBy: (permissions, { asc }) => [asc(permissions.domain), asc(permissions.action)],
      });
    }),

  // Get permission by ID
  getById: procedure.input(z.number()).query(async ({ input }) => {
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, input),
      with: {
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Permission not found",
      });
    }

    return permission;
  }),

  // Create new permission
  create: procedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        domain: z.string().min(1),
        action: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if permission name already exists
      const existingPermission = await db.query.permissions.findFirst({
        where: eq(permissions.name, input.name),
      });

      if (existingPermission) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Permission name already exists",
        });
      }

      const [newPermission] = await db
        .insert(permissions)
        .values(input)
        .returning();

      return newPermission;
    }),

  // Update permission
  update: procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        domain: z.string().min(1).optional(),
        action: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedPermission] = await db
        .update(permissions)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(permissions.id, input.id))
        .returning();

      if (!updatedPermission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found",
        });
      }

      return updatedPermission;
    }),

  // Delete permission
  delete: procedure
    .input(z.number())
    .mutation(async ({ input }) => {
      // Check if permission is used by any role
      const roleUsage = await db.query.rolePermissions.findFirst({
        where: eq(rolePermissions.permissionId, input),
      });

      if (roleUsage) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Permission is currently in use by one or more roles",
        });
      }

      const [deletedPermission] = await db
        .delete(permissions)
        .where(eq(permissions.id, input))
        .returning();

      if (!deletedPermission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission not found",
        });
      }

      return deletedPermission;
    }),

  // Get permissions by domain
  getByDomain: procedure
    .input(z.string())
    .query(async ({ input }) => {
      return await db.query.permissions.findMany({
        where: eq(permissions.domain, input),
        orderBy: (permissions, { asc }) => [asc(permissions.action)],
      });
    }),

  // Check if user has permission
  checkPermission: procedure
    .input(
      z.object({
        userId: z.string(),
        domain: z.string(),
        action: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userRoles)
        .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(userRoles.userId, input.userId),
            eq(permissions.domain, input.domain),
            eq(permissions.action, input.action),
            eq(permissions.isActive, true),
          ),
        );

      return result[0]?.count > 0;
    }),
});