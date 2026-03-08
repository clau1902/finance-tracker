import { db } from "./db";
import { categories } from "./schema";
import { eq, and } from "drizzle-orm";

const COLOR_MAP: Record<string, string> = {
  Uncategorized:  "#6aada6",
  Salary:         "#6aada6",
  Freelance:      "#6097b5",
  Investments:    "#5ea882",
  Groceries:      "#c49540",
  Rent:           "#b87272",
  Transport:      "#8b79c0",
  "Dining Out":   "#be7096",
  Entertainment:  "#c07a55",
  Utilities:      "#7b93a8",
  Healthcare:     "#5b90bf",
  Shopping:       "#a06db5",
  Subscriptions:  "#5aa09a",
};

async function run() {
  let updated = 0;
  for (const [name, color] of Object.entries(COLOR_MAP)) {
    const result = await db
      .update(categories)
      .set({ color })
      .where(eq(categories.name, name))
      .returning();
    updated += result.length;
  }
  console.log(`Updated ${updated} category rows.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
