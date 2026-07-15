import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
const t = initTRPC.context().meta().create({
    transformer: superjson,
});
export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});
