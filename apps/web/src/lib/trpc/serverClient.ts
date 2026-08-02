import { createCallerFactory, createTRPCContext } from "./init";
import { appRouter } from "./router";
import { cache } from "react";

const createCaller = createCallerFactory(appRouter);

// Cache the server client per request using React cache
export const getServerClient = cache(async () => {
	const ctx = await createTRPCContext();
	return createCaller(ctx);
});
