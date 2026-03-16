/**
 * Runs Drizzle SQL migrations against the production database.
 * Executed by the Docker entrypoint before the Next.js server starts.
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

console.log("Running database migrations…");
await migrate(db, { migrationsFolder: join(__dirname, "../drizzle") });
await pool.end();
console.log("Migrations complete.");
