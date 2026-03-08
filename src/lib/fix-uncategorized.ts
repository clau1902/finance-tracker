import { db } from "./db";
import { categories } from "./schema";
import { eq } from "drizzle-orm";

async function run() {
  const result = await db
    .update(categories)
    .set({ color: "#6aada6" })
    .where(eq(categories.name, "Uncategorized"))
    .returning();
  console.log(`Updated ${result.length} row(s):`, result.map(r => r.name));
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
