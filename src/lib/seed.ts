import { db } from "./db";
import { users, accounts, categories, transactions, budgets } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Demo user
  const hashed = await bcrypt.hash("demo1234", 12);
  const [user] = await db
    .insert(users)
    .values({ name: "Demo User", email: "demo@example.com", password: hashed })
    .returning();
  console.log(`Created user: ${user.email}`);

  // Categories
  const insertedCategories = await db
    .insert(categories)
    .values([
      { userId: user.id, name: "Salary", type: "income", color: "#6aada6", icon: "briefcase" },
      { userId: user.id, name: "Freelance", type: "income", color: "#6097b5", icon: "laptop" },
      { userId: user.id, name: "Investments", type: "income", color: "#5ea882", icon: "trending-up" },
      { userId: user.id, name: "Groceries", type: "expense", color: "#c49540", icon: "shopping-cart" },
      { userId: user.id, name: "Rent", type: "expense", color: "#b87272", icon: "home" },
      { userId: user.id, name: "Transport", type: "expense", color: "#8b79c0", icon: "car" },
      { userId: user.id, name: "Dining Out", type: "expense", color: "#be7096", icon: "utensils" },
      { userId: user.id, name: "Entertainment", type: "expense", color: "#c07a55", icon: "film" },
      { userId: user.id, name: "Utilities", type: "expense", color: "#7b93a8", icon: "zap" },
      { userId: user.id, name: "Healthcare", type: "expense", color: "#5b90bf", icon: "heart-pulse" },
      { userId: user.id, name: "Shopping", type: "expense", color: "#a06db5", icon: "shopping-bag" },
      { userId: user.id, name: "Subscriptions", type: "expense", color: "#5aa09a", icon: "repeat" },
    ])
    .returning();
  console.log(`Inserted ${insertedCategories.length} categories`);

  // Accounts
  const insertedAccounts = await db
    .insert(accounts)
    .values([
      { userId: user.id, name: "Main Checking", type: "checking", balance: "4250.00", color: "#0d9488" },
      { userId: user.id, name: "Savings Account", type: "savings", balance: "12800.00", color: "#0891b2" },
      { userId: user.id, name: "Credit Card", type: "credit", balance: "-840.00", color: "#dc2626" },
    ])
    .returning();
  console.log(`Inserted ${insertedAccounts.length} accounts`);

  const catMap = Object.fromEntries(insertedCategories.map((c) => [c.name, c.id]));
  const mainAccount = insertedAccounts[0].id;
  const savingsAccount = insertedAccounts[1].id;
  const creditCard = insertedAccounts[2].id;

  const now = new Date();
  const getDate = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  await db.insert(transactions).values([
    { userId: user.id, description: "Monthly Salary", amount: "5500.00", type: "income", categoryId: catMap["Salary"], accountId: mainAccount, date: getDate(2) },
    { userId: user.id, description: "Freelance Project", amount: "1200.00", type: "income", categoryId: catMap["Freelance"], accountId: mainAccount, date: getDate(5) },
    { userId: user.id, description: "Whole Foods Market", amount: "127.40", type: "expense", categoryId: catMap["Groceries"], accountId: creditCard, date: getDate(1) },
    { userId: user.id, description: "Monthly Rent", amount: "1800.00", type: "expense", categoryId: catMap["Rent"], accountId: mainAccount, date: getDate(3) },
    { userId: user.id, description: "Uber", amount: "18.50", type: "expense", categoryId: catMap["Transport"], accountId: creditCard, date: getDate(2) },
    { userId: user.id, description: "Sushi Restaurant", amount: "64.20", type: "expense", categoryId: catMap["Dining Out"], accountId: creditCard, date: getDate(4) },
    { userId: user.id, description: "Netflix", amount: "15.99", type: "expense", categoryId: catMap["Subscriptions"], accountId: creditCard, date: getDate(6) },
    { userId: user.id, description: "Spotify", amount: "9.99", type: "expense", categoryId: catMap["Subscriptions"], accountId: creditCard, date: getDate(6) },
    { userId: user.id, description: "Electric Bill", amount: "82.00", type: "expense", categoryId: catMap["Utilities"], accountId: mainAccount, date: getDate(8) },
    { userId: user.id, description: "Cinema Tickets", amount: "32.00", type: "expense", categoryId: catMap["Entertainment"], accountId: creditCard, date: getDate(7) },
    { userId: user.id, description: "Doctor Visit", amount: "120.00", type: "expense", categoryId: catMap["Healthcare"], accountId: mainAccount, date: getDate(10) },
    { userId: user.id, description: "Amazon Purchase", amount: "89.99", type: "expense", categoryId: catMap["Shopping"], accountId: creditCard, date: getDate(9) },
    { userId: user.id, description: "Dividend Income", amount: "340.00", type: "income", categoryId: catMap["Investments"], accountId: savingsAccount, date: getDate(12) },
    { userId: user.id, description: "Gas Station", amount: "55.00", type: "expense", categoryId: catMap["Transport"], accountId: creditCard, date: getDate(11) },
    { userId: user.id, description: "Grocery Store", amount: "98.30", type: "expense", categoryId: catMap["Groceries"], accountId: creditCard, date: getDate(14) },
    { userId: user.id, description: "Previous Month Salary", amount: "5500.00", type: "income", categoryId: catMap["Salary"], accountId: mainAccount, date: getDate(32) },
    { userId: user.id, description: "Previous Month Rent", amount: "1800.00", type: "expense", categoryId: catMap["Rent"], accountId: mainAccount, date: getDate(33) },
    { userId: user.id, description: "Restaurant", amount: "45.00", type: "expense", categoryId: catMap["Dining Out"], accountId: creditCard, date: getDate(35) },
    { userId: user.id, description: "Freelance Project", amount: "800.00", type: "income", categoryId: catMap["Freelance"], accountId: mainAccount, date: getDate(38) },
    { userId: user.id, description: "Gym Membership", amount: "45.00", type: "expense", categoryId: catMap["Subscriptions"], accountId: creditCard, date: getDate(36) },
  ]);
  console.log("Inserted transactions");

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await db.insert(budgets).values([
    { userId: user.id, categoryId: catMap["Groceries"], amount: "400.00", month, year },
    { userId: user.id, categoryId: catMap["Rent"], amount: "1800.00", month, year },
    { userId: user.id, categoryId: catMap["Transport"], amount: "150.00", month, year },
    { userId: user.id, categoryId: catMap["Dining Out"], amount: "200.00", month, year },
    { userId: user.id, categoryId: catMap["Entertainment"], amount: "100.00", month, year },
    { userId: user.id, categoryId: catMap["Utilities"], amount: "150.00", month, year },
    { userId: user.id, categoryId: catMap["Subscriptions"], amount: "80.00", month, year },
    { userId: user.id, categoryId: catMap["Shopping"], amount: "200.00", month, year },
    { userId: user.id, categoryId: catMap["Healthcare"], amount: "150.00", month, year },
  ]);
  console.log("Inserted budgets");
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
