import { router } from "../init";
import { clientSettingsRouter } from "./client-settings";
import { permissionsRouter } from "./permissions";
import { settingsRouter } from "./settings";

export const appRouter = router({
	settings: settingsRouter,
	clientSettings: clientSettingsRouter,
	permissions: permissionsRouter,
});

export type AppRouter = typeof appRouter;
