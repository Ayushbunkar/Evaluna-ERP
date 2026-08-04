import { z } from "zod";
import { router, procedure } from "../../trpc";
import { db } from "@evaluna/db";
import { roles, rolePermissions, permissions, userRoles } from "@evaluna/db/src/schema/rbac";
import { eq, and, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { ROLE_DEFINITIONS } from "@evaluna/db/src/schema/rbac";

export const rolesRouter = router({
  // Get all roles
  list: procedure.query(async () => {
    return await db.query.roles.findMany({
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
      },
      orderBy: (roles, { asc }) => [asc(roles.name)],
    });
  }),

  // Get role by ID
  getById: procedure.input(z.number()).query(async ({ input }) => {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, input),
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
        users: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!role) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Role not found",
      });
    }

    return role;
  }),

  // Create new role
  create: procedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        isSystemRole: z.boolean().default(false),
        permissionIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if role name already exists
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.name, input.name),
      });

      if (existingRole) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Role name already exists",
        });
      }

      // Create the role
      const [newRole] = await db
        .insert(roles)
        .values({
          name: input.name,
          description: input.description,
          isSystemRole: input.isSystemRole,
        })
        .returning();

      // Assign permissions if provided
      if (input.permissionIds && input.permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          input.permissionIds.map((permissionId) => ({
            roleId: newRole.id,
            permissionId: permissionId,
          })),
        );
      }

      return newRole;
    }),

  // Update role
  update: procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isSystemRole: z.boolean().optional(),
        permissionIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if role exists
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.id, input.id),
      });

      if (!existingRole) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role not found",
        });
      }

      // Prevent modifying system roles
      if (existingRole.isSystemRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot modify system roles",
        });
      }

      // Update role
      const [updatedRole] = await db
        .update(roles)
        .set({
          name: input.name,
          description: input.description,
          isSystemRole: input.isSystemRole,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, input.id))
        .returning();

      // Update permissions if provided
      if (input.permissionIds !== undefined) {
        // Remove existing permissions
        await db
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, input.id));

        // Add new permissions
        if (input.permissionIds.length > 0) {
          await db.insert(rolePermissions).values(
            input.permissionIds.map((permissionId) => ({
              roleId: input.id,
              permissionId: permissionId,
            })),
          );
        }
      }

      return updatedRole;
    }),

  // Delete role
  delete: procedure
    .input(z.number())
    .mutation(async ({ input }) => {
      // Check if role exists
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.id, input),
      });

      if (!existingRole) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role not found",
        });
      }

      // Prevent deleting system roles
      if (existingRole.isSystemRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete system roles",
        });
      }

      // Delete role permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, input));

      // Delete user role assignments
      await db.delete(userRoles).where(eq(userRoles.roleId, input));

      // Delete role
      const [deletedRole] = await db
        .delete(roles)
        .where(eq(roles.id, input))
        .returning();

      return deletedRole;
    }),

  // Initialize default roles
  initialize: procedure.mutation(async () => {
    // Check if roles already exist
    const existingRoles = await db.query.roles.findMany();
    if (existingRoles.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Roles already initialized",
      });
    }

    // Create permissions first
    const permissionDomains = Object.values(permissionDomainEnum.enumValues);
    const permissionActions = Object.values(permissionActionEnum.enumValues);

    const permissionsToCreate = permissionDomains.flatMap((domain) =>
      permissionActions.map((action) => ({
        name: `${domain}:${action}`,
        description: `Allow ${action} operations on ${domain}`,
        domain: domain,
        action: action,
      })),
    );

    const createdPermissions = await db
      .insert(permissions)
      .values(permissionsToCreate)
      .returning();

    // Create roles with permissions
    for (const roleDef of Object.values(ROLE_DEFINITIONS)) {
      const [newRole] = await db
        .insert(roles)
        .values({
          name: roleDef.name,
          description: roleDef.description,
          isSystemRole: roleDef.isSystemRole,
        })
        .returning();

      // Find and assign permissions
      const rolePermissionsToCreate = roleDef.permissions
        .map((permissionName) => {
          const permission = createdPermissions.find((p) => p.name === permissionName);
          return permission ? { roleId: newRole.id, permissionId: permission.id } : null;
        })
        .filter(Boolean);

      if (rolePermissionsToCreate.length > 0) {
        await db.insert(rolePermissions).values(rolePermissionsToCreate);
      }
    }

    return { success: true, message: "Default roles initialized successfully" };
  }),
});