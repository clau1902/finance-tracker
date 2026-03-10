import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
  // DATABASE_SSL=false disables SSL for internal Docker networking (set in docker-compose)
  ssl: process.env.DATABASE_SSL === "false"
    ? false
    : process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true }
    : false,
});

export const db = drizzle(pool, { schema });
