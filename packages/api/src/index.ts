import { initTRPC, TRPCError } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import superjson from "superjson";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@evaluna/db/schema";

export type Role = string;
export type Permission = string;

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: number | null;
  isSuperadmin: boolean;
  isActive: boolean;
  permissions: Permission[];
}

export interface TRPCContext {
  user: BaseUser | null;
  db: NodePgDatabase<typeof schema>;
}

const t = initTRPC.context<TRPCContext>().meta<OpenApiMeta>().create({
  transformer: superjson,
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

// Base protected procedure ensures user is logged in
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
  }
  if (!ctx.user.isActive) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Account suspended" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const middleware = t.middleware;
export type { OpenApiMeta };
