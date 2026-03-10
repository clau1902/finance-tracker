export async function register() {
  // Only run on the Node.js server runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { db } = await import("@/lib/db");
  const path = await import("path");

  const migrationsFolder = path.join(process.cwd(), "drizzle");

  try {
    await migrate(db, { migrationsFolder });
    console.log("[db] Migrations applied successfully");
  } catch (err) {
    console.error("[db] Migration failed:", err);
    throw err;
  }
}
