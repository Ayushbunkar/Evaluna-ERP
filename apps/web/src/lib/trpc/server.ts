import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCallerFactory, createTRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/lib/trpc/router";

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

/**
 * Create a context for the tRPC API
 */
export const createContext = createTRPCContext;

/**
 * Get a server client for the tRPC API
 * @example
 * const { trpc } = getServerClient();
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const getServerClient = async () => {
  const context = await createContext();
  const caller = createCaller(context);

  return {
    trpc: caller,
  };
};
