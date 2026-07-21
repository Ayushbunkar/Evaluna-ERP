export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { seed } = await import("@/lib/db/seed");
      await seed();
    } catch (err) {
      // Do not crash the server if seeding fails (e.g. DB not ready yet)
      console.warn("⚠️ Seed skipped:", (err as Error).message);
    }
  }
}
